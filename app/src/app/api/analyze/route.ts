import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { COMPLIANCE_CATEGORIES, type CheckStatus } from '@/lib/compliance-analyzer';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Attempt to parse JSON from model output, with repair for common issues
 * like truncated arrays/objects from hitting max_tokens.
 */
function parseModelJSON(text: string): any {
  // Extract the outermost JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in model response');
  }

  let jsonStr = jsonMatch[0];

  // First try direct parse
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Attempt repair: close any unclosed brackets/braces
    console.log('[JSON Repair] Attempting to fix truncated JSON...');

    // Remove any trailing incomplete string (cut off mid-value)
    jsonStr = jsonStr.replace(/,\s*"[^"]*$/, '');
    jsonStr = jsonStr.replace(/,\s*$/, '');

    // Count open vs close brackets and braces
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

    // Close unclosed structures
    while (brackets > 0) { jsonStr += ']'; brackets--; }
    while (braces > 0) { jsonStr += '}'; braces--; }

    try {
      return JSON.parse(jsonStr);
    } catch (e2) {
      // Last resort: try fixing common trailing issues
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(jsonStr);
      } catch {
        throw new Error(`JSON repair failed: ${(e2 as Error).message}`);
      }
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════
   STAGE 1 — Extract structured data from construction plan PDF
   Uses Claude's native PDF document support (no conversion needed)
   ═══════════════════════════════════════════════════════════════════════ */

const EXTRACTION_PROMPT = `You are an expert architectural plan reader specializing in Florida residential construction. Your job is to extract EVERY measurable specification and detail from this construction plan PDF. Be EXHAUSTIVE — read every label, dimension, note, schedule, and callout on every page.

CRITICAL: Do NOT skip or summarize. Extract every individual item. If a page has 15 windows, list all 15 with their sizes and locations. If there are general notes, transcribe them. The compliance analysis depends on having COMPLETE data.

For EACH page/sheet in this PDF, extract everything you can find, organized as follows:

## GENERAL (every page)
- Sheet type (site plan, foundation plan, floor plan, elevation, electrical, structural, detail, etc.)
- Sheet number/label
- Project address, designer/architect, date, scale
- Applicable code edition and occupancy classification
- General notes, design notes, code references listed on the sheet

## SITE PLAN DATA
- All existing structures, streets, easements, septic tank, well locations
- Building footprint with ALL projections, overhangs, porches, decks, lanais
- Driveways, slabs, equipment pads (A/C, pool equipment), walkways
- ALL setback dimensions (front, sides, rear) with measurements
- L.P. tank location, size, and setbacks from structures
- Flood zone designation, base flood elevation, finish floor elevation
- Lot dimensions, legal description if shown
- Utility locations (water, sewer, electric)

## FOUNDATION DATA
- Foundation type (slab-on-grade, stem wall, monolithic, etc.)
- Every footing: width, depth, reinforcement (bar size, spacing, placement)
- Every pad and slab: thickness, reinforcement, vapor barrier
- Concrete PSI for footings, slabs, pads (note each separately)
- ALL slab or footing elevation changes with locations and step heights
- Soil bearing capacity, compaction requirements
- Footing depth below finished grade
- Termite protection method and product
- Anchor bolt size, spacing, embedment depth
- Post tension specs if applicable

## FLOOR PLAN DATA
- Total square footage and breakdown by story
- A/C'd vs Non-A/C'd area breakdown (living, lanai, porch, garage, storage — each separately)
- Every room: name, length, width, area, ceiling height
- Every window: room, mark/type, size (W x H), sill height, egress marking, safety glazing marking, manufacturer
- Every door: location, mark/type, size (W x H), type (hollow core, solid core, insulated, fire-rated, self-closing), swing direction
- Clear widths of ALL halls, stairs, landings, and doorways
- Exit door locations and widths (note which do/don't exit through garage)
- Accessible bathroom: door width, clear floor space, fixture clearances
- ALL structural members: joists (size, spacing, span, species/grade), rafters, headers (location, size, span), beams (size, span, bearing), lintels, posts, columns — with connections described
- ALL shearwalls: location, length, sheathing type/thickness, nailing pattern, holddown types, vertical steel
- Interior bearing walls with anchorage details
- Fireplace: opening dimensions, hearth extension, chimney dimensions, clearances
- A/C compressor location, air handler location, condensate line routing
- Attic access location and size, crawl space access location and size
- Every plumbing fixture location, water heater location/type/capacity, tub access panel location, fixture spacings
- Gas appliances: each appliance BTU rating, type (LP/Natural), vent sizes, confined space ventilation, ignition source height in garage, bollard/wheel stop details
- Electrical service panel: location, ampacity, number of circuits
- Every receptacle/outlet type (standard, GFI, WPGFI, AFCI, tamper resistant, dedicated), switches, light fixtures, ceiling fans, exhaust fans, appliance outlets
- Smoke alarm locations (each room/area), CO alarm locations (each floor/area)
- Any schedules (window schedule, door schedule, fixture schedule, finish schedule)

## ELEVATION & DETAIL DATA
- Elevation views: which sides drawn, grade-to-plate height, plate-to-roof-peak, overall grade-to-peak dimension, roof slope(s), chimney height above roof peak, ridge vent/soffit vent/gable vent locations
- Wall sections: every wall type from foundation through roof — sill plate, studs (size, spacing), sheathing (type, thickness), nailing pattern (edge, field), WRB, cladding/stucco spec, interior finish, insulation type/R-value, bearing height, inspection port locations, minimum 8" above grade for wood framing
- Gable end bracing: method (ceiling diaphragm, 2x4 lateral bracing, balloon framing, continuous masonry), connection details
- Floor/deck framing: member sizes, spacing, species/grade, sheathing type/thickness/nailing, blocking
- Stair details: tread depth, riser height, total rise, headroom clearance, width, nosing, landing dimensions
- Handrail details: height (measured from nosing), graspable diameter, picket/baluster spacing, connection method, returns
- Guardrail details: height, picket spacing, connection method, locations
- Truss layout: truss spacing, uplift loads at each bearing, gravity loads, hurricane anchor manufacturer/model for each load range, strap schedule
- Conventional roof framing: rafter size/spacing, ridge board/beam size, collar tie size/spacing/nailing, ceiling joist size/spacing, rafter-to-joist heel joint nailing, hurricane anchor details
- Roof covering: material type, thickness, underlayment, fastener type/size/spacing, drip edge, flashing details, wind resistance class, ASTM numbers, roof slope
- Garage separation walls: GWB type/thickness (1/2" vs 5/8" Type-X), extent (walls, ceiling, supporting structure)
- Garage door to residence: door specification (1-3/8" solid core, honeycomb steel, 20-min fire-rated), self-closing hardware, no direct openings to sleeping rooms
- Garage duct penetrations: duct material gauge, whether any openings exist into garage
- Tenant/townhouse separation: wall section details, fire assembly rating number, testing agency
- Window buck/installation: frame material, thickness, fastener type/size/spacing at jambs/head/sill, mullion details
- Product approvals: FL product approval numbers, NOA numbers, TAS reports for windows/doors/garage doors/shutters
- Mitered/butt glass corners: engineer-sealed details if present
- Arched window in-fill framing: design and connection details if present
- Opening protection: shutter/impact type, product approval number, fastener schedule
- Condensate line discharge distance from building, irrigation head setback, downspout discharge distance, gutter requirements for eaves <6"

Return a JSON object with one entry per page. Use descriptive field names. Include every item you find — do not consolidate or summarize:
{
  "pages": [
    {
      "pageNumber": 1,
      "sheetType": "floor plan",
      "sheetLabel": "A1",
      "projectInfo": {
        "address": "123 Main St, Gainesville FL 32601",
        "designer": "ABC Engineering",
        "date": "2024-01-15",
        "scale": "1/4\\" = 1'-0\\"",
        "codeEdition": "2023 FBC Residential 8th Ed",
        "occupancy": "R-3"
      },
      "generalNotes": ["Note 1 text...", "Note 2 text..."],
      "sitePlan": {
        "existingStructures": ["existing shed 10'x12' at NE corner"],
        "buildingFootprint": "67'-4\\" x 42'-8\\"",
        "setbacks": { "front": "25'", "left": "7.5'", "right": "7.5'", "rear": "20'" },
        "floodZone": "X",
        "lpTank": null
      },
      "foundation": {
        "type": "monolithic slab-on-grade",
        "slabThickness": "4\\"",
        "vaporBarrier": "6 mil poly",
        "footings": [
          { "location": "perimeter", "width": "16\\"", "depth": "18\\"", "reinforcing": "2-#5 continuous" }
        ],
        "concretePSI": { "footings": "3000", "slab": "3000" },
        "elevationChanges": [{ "location": "garage to living", "stepHeight": "4\\"" }],
        "soilBearing": "1500 psf",
        "footingDepthBelowGrade": "12\\"",
        "termiteProtection": "soil treatment by licensed applicator per FBC-R 318"
      },
      "floorPlan": {
        "squareFootage": { "totalUnderRoof": 2450, "acLiving": 1850, "garage": 440, "lanai": 160 },
        "rooms": [
          { "name": "Master Bedroom", "dimensions": "14'-6\\" x 13'-0\\"", "ceilingHeight": "9'-0\\"" }
        ],
        "windows": [
          { "mark": "W1", "room": "Master Bedroom", "size": "6'-0\\" x 4'-0\\"", "type": "single hung", "sillHeight": "24\\"", "egress": true, "safetyGlazing": true }
        ],
        "doors": [
          { "mark": "D1", "location": "Front Entry", "size": "3'-0\\" x 6'-8\\"", "type": "insulated", "swing": "in" },
          { "mark": "D5", "location": "Garage to House", "size": "3'-0\\" x 6'-8\\"", "type": "20-min fire-rated, self-closing", "swing": "in" }
        ],
        "clearWidths": { "hallway": "42\\"", "masterBathDoor": "32\\"", "frontDoor": "36\\"" },
        "exitDoors": [{ "location": "Front", "width": "36\\"", "throughGarage": false }],
        "accessibleBathroom": { "doorWidth": "32\\"", "location": "Hall Bath" },
        "structuralMembers": {
          "headers": [{ "location": "garage door", "size": "2-2x12 LVL", "span": "16'-0\\"" }],
          "beams": [{ "location": "great room", "size": "5-1/4\\" x 11-7/8\\" LVL", "span": "18'-0\\"" }]
        },
        "shearwalls": [
          { "location": "south exterior", "length": "12'-0\\"", "sheathing": "7/16\\" OSB", "nailing": "8d @ 4\\"/12\\"", "holddown": "HDU2" }
        ],
        "fireplace": null,
        "acEquipment": { "compressor": "west side exterior", "airHandler": "garage" },
        "atticAccess": { "location": "master closet ceiling", "size": "22\\" x 30\\"" },
        "plumbing": {
          "waterHeater": { "location": "garage", "type": "50 gal electric" },
          "fixtures": ["master bath: tub/shower, toilet, dual vanity", "hall bath: tub/shower, toilet, vanity", "kitchen sink", "laundry"]
        },
        "gasAppliances": null,
        "electrical": {
          "panel": { "location": "garage east wall", "ampacity": "200A" },
          "smokeAlarms": ["master bedroom", "bedroom 2", "bedroom 3", "hallway outside bedrooms", "great room"],
          "coAlarms": ["hallway outside bedrooms"]
        }
      },
      "elevationDetails": {
        "elevationViews": ["front/south", "rear/north", "left/east", "right/west"],
        "gradeToRoofPeak": "22'-6\\"",
        "roofSlope": "5:12",
        "wallSections": [
          { "type": "exterior", "studs": "2x6 @ 16\\" o.c.", "sheathing": "7/16\\" OSB", "nailing": "8d @ 6\\"/12\\"", "insulation": "R-19 batt", "exterior": "stucco on lath", "interior": "1/2\\" GWB" }
        ],
        "roofCovering": { "material": "asphalt shingles", "windRating": "ASTM D3161 Class F", "underlayment": "30# felt", "fasteners": "6 nails per shingle" },
        "garageSeparation": { "walls": "1/2\\" GWB", "ceiling": "5/8\\" Type-X GWB (habitable above)" },
        "garageDoorToResidence": { "spec": "1-3/8\\" solid core wood, self-closing" },
        "productApprovals": [{ "item": "windows", "flNumber": "FL12345" }],
        "openingProtection": { "type": "accordion shutters", "flNumber": "FL67890" }
      },
      "notes": ["General note 1...", "Structural note 2..."]
    }
  ]
}

IMPORTANT:
- Extract ONLY what is visible/readable on the plans — do not guess or assume values.
- If a value is not shown, omit that field. Do not include null or empty arrays.
- Be precise with measurements — always include units (inches with \", feet with ', PSI, etc.).
- Create a SEPARATE entry for EACH page/sheet — do not merge pages.
- Read ALL text on every page including title blocks, general notes, schedules, legends, and callouts.
- For schedules (window, door, finish), extract every row.
- Include manufacturer names, product numbers, and FL approval numbers when visible.`;

async function extractPlanData(pdfBase64: string): Promise<unknown> {
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 32768,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          } as any,
          {
            type: 'text',
            text: EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const response = await stream.finalMessage();

  const textBlock = response.content.find((c) => c.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from extraction model');
  }

  return parseModelJSON(textBlock.text);
}

/* ═══════════════════════════════════════════════════════════════════════
   STAGE 2 — Reason about FBC compliance using extracted data
   Text-only call — cheaper and faster than vision
   ═══════════════════════════════════════════════════════════════════════ */

function buildCompliancePrompt(extractedData: unknown): string {
  const categoriesText = Object.entries(COMPLIANCE_CATEGORIES)
    .map(([key, cat]) => {
      const checks = cat.checks
        .map((c) => `  - [${c.id}] ${c.desc} (${c.code})`)
        .join('\n');
      return `### ${cat.name} (${cat.code})\n${checks}`;
    })
    .join('\n\n');

  return `You are an expert Florida Building Code (FBC) 8th Edition (2023) compliance reviewer.

Below is structured data extracted from residential construction plans. Analyze this data against FBC requirements and determine compliance for each check.

## EXTRACTED PLAN DATA
${JSON.stringify(extractedData, null, 2)}

## FBC COMPLIANCE CHECKS TO PERFORM
${categoriesText}

## INSTRUCTIONS
For each check listed above, determine:
- **PASS**: The extracted data clearly shows the requirement is met
- **FAIL**: The extracted data clearly shows the requirement is NOT met (explain what's wrong and what the code requires)
- **VERIFY**: Not enough information in the plans to determine compliance (needs field verification or additional sheets)
- **N/A**: This check doesn't apply to the plans provided (e.g., no garage, no gas appliances, no townhouse units)

Group checks by the sheet/page they are most relevant to. If a plan has multiple pages, assign checks to the most relevant page. If only one page exists, put all checks under that sheet.

Respond in this exact JSON format:
{
  "projectInfo": {
    "address": "...",
    "designer": "...",
    "date": "..."
  },
  "sheets": [
    {
      "sheetNumber": 1,
      "sheetType": "Floor Plan",
      "categories": [
        {
          "category": "site_plan",
          "name": "Site Plan",
          "codeReference": "FBC 107.3.5",
          "overallStatus": "PASS",
          "checks": [
            {
              "id": "SP-01",
              "description": "All existing structures, streets, easements, septic tank and well shown",
              "codeReference": "FBC 107.3.5",
              "status": "PASS",
              "finding": "Site plan shows existing driveway, easement along north boundary, and well location"
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANT:
- Include ALL categories listed above for each sheet. Use the exact category keys: site_plan, flood, foundation, floor_plan, elevations_details.
- Provide specific findings referencing actual measurements from the extracted plan data.
- When a check FAILS, state both the FBC requirement AND the actual value found.
- Base your judgment ONLY on the extracted data — do not assume information not present.
- For the overallStatus of each category: FAIL if any check fails, VERIFY if any needs verification (and none fail), PASS if all pass, N/A if all are N/A.
- Keep findings CONCISE — one short sentence max per finding.
- Consolidate all checks into a SINGLE sheet entry (do not repeat categories across multiple sheets).`;
}

async function analyzeCompliance(extractedData: unknown): Promise<any> {
  const prompt = buildCompliancePrompt(extractedData);

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 16384,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const response = await stream.finalMessage();

  const textBlock = response.content.find((c) => c.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from compliance model');
  }

  return parseModelJSON(textBlock.text);
}

/* ═══════════════════════════════════════════════════════════════════════
   BUILD FINAL REPORT — Format for ComplianceReport component
   ═══════════════════════════════════════════════════════════════════════ */

function buildReport(complianceResult: any, filename: string) {
  const sheets = complianceResult.sheets || [];

  let totalChecks = 0;
  let passed = 0;
  let failed = 0;
  let needsVerification = 0;
  let notApplicable = 0;

  for (const sheet of sheets) {
    for (const cat of sheet.categories || []) {
      for (const check of cat.checks || []) {
        totalChecks++;
        switch (check.status) {
          case 'PASS':
            passed++;
            break;
          case 'FAIL':
            failed++;
            break;
          case 'VERIFY':
            needsVerification++;
            break;
          case 'N/A':
            notApplicable++;
            break;
        }
      }
    }
  }

  let overallStatus: CheckStatus = 'PASS';
  if (failed > 0) overallStatus = 'FAIL';
  else if (needsVerification > 0) overallStatus = 'VERIFY';

  return {
    projectName:
      complianceResult.projectInfo?.address || filename.replace('.pdf', ''),
    analyzedAt: new Date().toISOString(),
    totalSheets: sheets.length,
    sheets,
    summary: {
      totalChecks,
      passed,
      failed,
      needsVerification,
      notApplicable,
    },
    overallStatus,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   API HANDLER
   ═══════════════════════════════════════════════════════════════════════ */

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usage check
    const { data: profile } = await supabase
      .from('profiles')
      .select('analyses_used, plan_tier')
      .eq('id', user.id)
      .single() as { data: { analyses_used: number; plan_tier: string } | null };

    if (profile && profile.analyses_used >= 1 && profile.plan_tier === 'free') {
      return NextResponse.json(
        { error: 'Free analysis limit reached. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Convert PDF to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Stage 1: Extract structured plan data from PDF
    console.log('[Stage 1] Extracting plan data with Claude Sonnet 4.5...');
    const extraction = await extractPlanData(base64);
    console.log(
      '[Stage 1] Extraction complete:',
      JSON.stringify(extraction).slice(0, 300)
    );

    // Stage 2: Analyze extracted data for FBC compliance
    console.log('[Stage 2] Running FBC compliance analysis...');
    const compliance = await analyzeCompliance(extraction);
    console.log('[Stage 2] Compliance analysis complete');

    // Build the final report in ComplianceReportData shape
    const report = buildReport(compliance, file.name);

    // Increment usage counter
    await (supabase.rpc as any)('increment_analyses', { user_id: user.id });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Analysis pipeline error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: String(error) },
      { status: 500 }
    );
  }
}
