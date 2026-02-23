import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Attempt to parse JSON from model output, with repair for truncation.
 */
function parseModelJSON(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in model response');
  }

  let jsonStr = jsonMatch[0];

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Repair truncated JSON
    jsonStr = jsonStr.replace(/,\s*"[^"]*$/, '');
    jsonStr = jsonStr.replace(/,\s*$/, '');

    let braces = 0;
    let brackets = 0;
    let inString = false;
    let escape = false;

    for (const ch of jsonStr) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') braces++;
      if (ch === '}') braces--;
      if (ch === '[') brackets++;
      if (ch === ']') brackets--;
    }

    while (brackets > 0) { jsonStr += ']'; brackets--; }
    while (braces > 0) { jsonStr += '}'; braces--; }

    try {
      return JSON.parse(jsonStr);
    } catch {
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(jsonStr);
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   STAGE 3 — Visual Annotation Placement
   Sends PDF + compliance findings to Claude Vision, gets x,y positions
   ═══════════════════════════════════════════════════════════════════════ */

function buildAnnotationPrompt(reportData: any): string {
  // Extract just the findings for a compact prompt
  const findings: any[] = [];
  for (const sheet of reportData.sheets || []) {
    for (const cat of sheet.categories || []) {
      for (const check of cat.checks || []) {
        if (check.status === 'N/A') continue;
        findings.push({
          id: check.id,
          category: cat.category,
          categoryName: cat.name,
          status: check.status,
          description: check.description,
          finding: check.finding,
          codeReference: check.codeReference,
        });
      }
    }
  }

  return `You are a construction plan annotation specialist. You are given a multi-page construction plan PDF and a list of FBC compliance findings from the Florida Building Code Residential Plan Review Sufficiency Checklist.

Your job: For each finding, look at the actual plan pages and identify the PRECISE location where the relevant building element, note, or detail is drawn. Return x,y coordinates as percentages of each page's dimensions.

## COMPLIANCE FINDINGS TO LOCATE
${JSON.stringify(findings, null, 2)}

## PLACEMENT RULES BY CATEGORY

### Site Plan (SP-xx)
- Place ON the site plan page — SP-01 on existing structures/easements area, SP-02 on the building footprint/setback dimensions

### Flood (FLD-xx)
- Place on the site plan page near flood zone designation or general notes about flood construction

### Foundation (FND-xx)
- Place ON the foundation plan page — FND-01 on footing/slab details, FND-02 on concrete/rebar callouts, FND-03 on elevation change steps, FND-04 on soil/depth notes, FND-05 on termite treatment note

### Floor Plan (FLR-xx)
- FLR-01 (sq footage): on the area calculation note or title block
- FLR-02 (rooms): on a representative room label with dimensions
- FLR-03 (windows/doors): on a window or door symbol with schedule callout
- FLR-04 (safety glazing/egress): on an egress window symbol
- FLR-05 (clear widths): on the narrowest hallway or stair
- FLR-06 (exit door): on the main exit door (not through garage)
- FLR-07 (accessible bath): on the accessible bathroom
- FLR-08 (structural members): on a header/beam callout
- FLR-09 (shearwalls): on a shearwall callout or notation
- FLR-10 (fireplace): on the fireplace if present, otherwise N/A
- FLR-11 (A/C): on the air handler or compressor symbol
- FLR-12 (attic access): on the attic access hatch symbol
- FLR-13 (plumbing): on the water heater or a fixture cluster
- FLR-14 (gas appliances): on a gas appliance if present, otherwise N/A
- FLR-15 (electrical panel): on the panel symbol
- FLR-16 (receptacles): on a representative outlet/switch cluster
- FLR-17 (smoke/CO): on a smoke detector symbol

### Elevations & Details (ELV-xx)
- ELV-01 (elevation views): on the primary elevation drawing
- ELV-02 (wall sections): on the wall section detail
- ELV-03 (gable bracing): on the gable end bracing detail
- ELV-04 (framing plans): on the floor/deck framing plan
- ELV-05 (handrails/guardrails): on the stair/guardrail detail
- ELV-06 (truss layout): on the truss plan or truss detail
- ELV-07 (conventional roof): on the roof framing plan or section
- ELV-08 (roof covering): on the roofing detail/specification
- ELV-09 (garage GWB): on the garage wall section or separation detail
- ELV-10 (garage door): on the garage-to-house door in plan or section
- ELV-11 (garage ducts): on the garage mechanical detail
- ELV-12 (tenant separation): on the party wall section if shown
- ELV-13 (window bucks): on the window installation detail
- ELV-14 (product approvals): on the product approval notes or window schedule
- ELV-15 (mitered glass): on the mitered glass detail if present
- ELV-16 (opening protection): on the shutter/impact protection notes
- ELV-17 (condensate/downspout): on the condensate/downspout detail or note

### General placement rules
- Pick the page where the element is MOST CLEARLY SHOWN
- Place the marker directly ON the element, not next to it
- For notes/schedules, place on the specific text area
- Spread markers apart — avoid stacking multiple markers at the same point
- If you truly cannot find the element on any page, use the page with the most relevant sheet type at x:50, y:50 and set "approximate": true

Return JSON:
{
  "annotations": [
    {
      "page": 1,
      "x": 35.5,
      "y": 42.0,
      "type": "FAIL",
      "label": "Footing Depth",
      "detail": "Footing only 8\\" below grade; FBC-R 403.1 requires minimum 12\\"",
      "category": "foundation",
      "checkId": "FND-04",
      "codeReference": "FBC-R 403.1",
      "approximate": false
    }
  ]
}

IMPORTANT:
- Include ALL findings (PASS, FAIL, VERIFY) — skip only N/A
- Labels: 2-4 words that identify the specific element (e.g. "Footing Depth", "Exit Door Width", "Garage GWB")
- Detail: one sentence with the SPECIFIC measurement or condition found AND the code requirement when FAIL/VERIFY
- Be as precise as possible with x,y — look at the actual plan drawing
- x = percentage from LEFT edge (0-100), y = percentage from TOP edge (0-100)
- Each annotation MUST reference the correct page number where the element appears`;
}

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // Auth check (cookie-based beta auth)
    const authorized = request.cookies.get('beta_authorized')?.value === 'true';
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { blobUrl, report } = await request.json();

    if (!blobUrl || !report) {
      return NextResponse.json(
        { error: 'blobUrl and report data required' },
        { status: 400 }
      );
    }

    // Download PDF from Vercel Blob
    const blobResponse = await fetch(blobUrl);
    if (!blobResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch uploaded file' },
        { status: 400 }
      );
    }

    const bytes = await blobResponse.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    console.log('[Stage 3] Generating visual annotations...');

    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 16384,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            } as any,
            {
              type: 'text',
              text: buildAnnotationPrompt(report),
            },
          ],
        },
      ],
    });

    const response = await stream.finalMessage();

    const textBlock = response.content.find((c) => c.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from annotation model');
    }

    const result = parseModelJSON(textBlock.text);
    console.log(
      '[Stage 3] Annotations complete:',
      (result.annotations || []).length,
      'markers placed'
    );

    return NextResponse.json({
      success: true,
      annotations: result.annotations || [],
    });
  } catch (error) {
    console.error('Annotation pipeline error:', error);
    return NextResponse.json(
      { error: 'Annotation failed', details: String(error) },
      { status: 500 }
    );
  }
}
