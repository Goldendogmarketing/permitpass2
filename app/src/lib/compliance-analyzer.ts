/**
 * FBC Compliance Analyzer using Claude Vision
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Compliance check categories — Florida Building Code Residential Plan Review Sufficiency Checklist
// 5 sections, 42 checks — matches the standard building department review form
export const COMPLIANCE_CATEGORIES = {
  site_plan: {
    name: 'Site Plan',
    code: 'FBC 107.3.5',
    checks: [
      { id: 'SP-01', desc: 'All existing structures, streets, easements, septic tank and well shown', code: 'FBC 107.3.5' },
      { id: 'SP-02', desc: 'New building footprint with all projections, driveways, slabs, equipment pads, setbacks, dimensions, and L.P. tank location/size/setbacks', code: 'FBC 107.3.5 / NFPA 58' },
    ],
  },
  flood: {
    name: 'Flood Resistant Construction',
    code: 'FBC-R 322',
    checks: [
      { id: 'FLD-01', desc: 'Flood resistant construction designed per FBC-R 322 and county Floodplain Management Ordinance', code: 'FBC-R 322 / FBC Table 1612.1' },
    ],
  },
  foundation: {
    name: 'Foundation Plan',
    code: 'FBC-R R403',
    checks: [
      { id: 'FND-01', desc: 'Footings, pads, slabs — sizes and descriptions of all exterior and interior, and vapor barrier shown', code: 'FBC-R 401.2 / R403 / R506' },
      { id: 'FND-02', desc: 'Concrete P.S.I. minimum and reinforcement locations and descriptions noted', code: 'FBC-R 402.2' },
      { id: 'FND-03', desc: 'Slab or footing elevation changes — location and height of all changes shown', code: 'FBC-R 311.3' },
      { id: 'FND-04', desc: 'Undisturbed soil or properly compacted fill supporting all footings/slabs; outside edge footings extending no less than 12" below finished grade', code: 'FBC-R 403.1' },
      { id: 'FND-05', desc: 'Termite soil protection provided by registered termiticides noted', code: 'FBC-R 318' },
    ],
  },
  floor_plan: {
    name: 'Floor Plan, A/C, Plumbing, Gas & Electrical',
    code: 'FBC-R Multiple',
    checks: [
      { id: 'FLR-01', desc: 'Square footage breakdown of all areas by story and by A/C\'d and Non-A/C\'d (living, lanai, porch, garage, storage)', code: 'FBC-Energy Conservation' },
      { id: 'FLR-02', desc: 'Rooms labeled and dimensioned with ceiling heights', code: 'FBC-R 304/305/306/307' },
      { id: 'FLR-03', desc: 'Window and door locations, sizes, descriptions shown; solid core or insulated door noted adjacent non-A/C\'d areas', code: 'FBC 107.2.1 / 107.3.5' },
      { id: 'FLR-04', desc: 'Safety glazing and emergency escape/rescue openings labeled and sized', code: 'FBC-R 308.4 / 310' },
      { id: 'FLR-05', desc: 'Clear width minimum of all halls, stairs, landings and doors indicated', code: 'FBC-R 311' },
      { id: 'FLR-06', desc: 'Exit door minimum 36" width from each residence/unit not exiting through a garage', code: 'FBC-R 311.1 / 311.2' },
      { id: 'FLR-07', desc: 'One full bathroom with minimum 29" clear door openings along accessible path on an accessible level', code: 'FBC-R 320.1.1' },
      { id: 'FLR-08', desc: 'Joists, rafters, headers, beams, lintels, posts and columns all sized with spacing and descriptions; all connections described/labeled/detailed', code: 'FBC-R Ch. 5/6/8/9' },
      { id: 'FLR-09', desc: 'Shearwall lengths and locations noted for all exterior and interior shearwalls with vertical steel and holddown locations; interior bearing wall anchorage noted', code: 'FBC-R Ch. 6' },
      { id: 'FLR-10', desc: 'Fireplace opening, hearth extensions and chimney dimensions with full-height section view from foundation through chimney cap', code: 'FBC-R Ch. 10' },
      { id: 'FLR-11', desc: 'Air conditioning compressor and air handler locations shown', code: 'FBC-R Ch. 13' },
      { id: 'FLR-12', desc: 'Attic and crawl space access shown', code: 'FBC-R 807.1 / 408.4' },
      { id: 'FLR-13', desc: 'Plumbing fixture and water heater locations shown with all spacings dimensioned; tub access locations shown', code: 'FBC-R Ch. 27 / FPC 403.1 / Ch. 28' },
      { id: 'FLR-14', desc: 'BTU\'s and location of all gas appliances (LP or Natural Gas); vent location/sizes for confined spaces; ignition source elevation and bollard/wheel stop for garage water heaters', code: 'FBC Ch. 24' },
      { id: 'FLR-15', desc: 'Electric service panel box location and ampacity shown', code: 'NEC 2014' },
      { id: 'FLR-16', desc: 'Electric receptacles (GFI, WPGFI, AFCI, tamper resistant), switches, lighting fixtures, ceiling fans, exhaust fans, appliances and equipment outlets shown', code: 'NEC 2014' },
      { id: 'FLR-17', desc: 'Smoke alarms and carbon monoxide alarms locations shown', code: 'FBC-R 314 / 315' },
    ],
  },
  elevations_details: {
    name: 'Elevation Views, Section Views, Details & Other Requirements',
    code: 'FBC 107.2.1',
    checks: [
      { id: 'ELV-01', desc: 'Elevation views of all sides with grade-to-roof-peak dimension, roof slope, chimney height above roof within 10\', and attic roof vents', code: 'FBC 107.2.1 / 107.3.5' },
      { id: 'ELV-02', desc: 'Wall section detailed views for each type from foundation through roof showing all structural elements, reinforcement, connections, lumber, sheathing, nailing specs, inspection ports, bearing heights, stucco spec, 8" above grade, insulation and finishes', code: 'FBC 107.2.1 / 107.3.5' },
      { id: 'ELV-03', desc: 'Gable end wall detailed method of horizontal bracing (ceiling diaphragm) for joints/changes of materials, balloon framing or continuous masonry with rebar', code: 'FBC-R Ch. 6' },
      { id: 'ELV-04', desc: 'Framing plans for floors, decks and stairs with framing sizes, spacing, species/grade, sheathing/nailing, tread depth, riser height and headroom', code: 'FBC 107.2.1 / 107.3.5' },
      { id: 'ELV-05', desc: 'Stair handrail (height, picket spacing, connections, graspable section) and guardrail description (height, picket spacing, connections)', code: 'FBC-R 311 / 312' },
      { id: 'ELV-06', desc: 'Truss layout for all trussed roofs with uplift loads >1000 lbs and gravity loads >5000 lbs; hurricane anchor item number/manufacturer for all uplift load ranges', code: 'FBC 107.2.1 / Ch. 8' },
      { id: 'ELV-07', desc: 'Conventional roof framing plan and section view with rafter-to-joist heel joint nailing, collar ties/nailing, continuous ceiling joist tie or ridge beam support, hurricane anchors', code: 'FBC-R Ch. 9' },
      { id: 'ELV-08', desc: 'Roof covering details — types and thickness of materials, fasteners/spacings, flashing, wind resistance requirements, roof slope, ASTM numbers', code: 'FBC-R Ch. 9' },
      { id: 'ELV-09', desc: 'Garage separation for adjacent living areas by min 1/2" GWB; or 5/8" Type-X GWB on ceilings when habitable area above garage (supporting structure with 1/2" GWB)', code: 'FBC-R Table 302.6' },
      { id: 'ELV-10', desc: 'Garage side-swinging door into residence noted as min 1-3/8" solid core wood, honeycomb core steel, or 20-minute fire-rated door; no direct openings to sleeping rooms', code: 'FBC-R 302.5' },
      { id: 'ELV-11', desc: 'Garage duct penetrations — ducts in walls/ceilings separating garage and dwelling constructed of min 26 gauge sheet steel with no openings into garage', code: 'FBC-R 302.5' },
      { id: 'ELV-12', desc: 'Tenant separation walls for townhouse units — full-height section drawings with fire assembly rating numbers from recognized testing agency', code: 'FBC-R 302.2' },
      { id: 'ELV-13', desc: 'Window buck installation detail showing locations, thickness, fastening specifications (type, size, spacing); mullion details with attachment specs', code: 'FBC-R 612.10 / 612.11' },
      { id: 'ELV-14', desc: 'Window and door manufacturer\'s product approvals, testing reports, and installation specs for all types (including garage doors) substantiating wind design and impact resistance compliance', code: 'FBC-R 301.2.1.1 / 301.2.1.2 / 612.1' },
      { id: 'ELV-15', desc: 'Mitered or butt glass engineering and arched window in-fill framing detail, design, specs, and installation details signed/sealed by a Florida Engineer', code: 'FBC-R 612.5 / 612.10' },
      { id: 'ELV-16', desc: 'Opening protection components — manufacturer\'s product approval, testing report, and installation specs for all types (type, size, spacing of fasteners)', code: 'FBC-R 301.2.1.2' },
      { id: 'ELV-17', desc: 'Condensate lines, irrigation spray heads and roof downspouts discharge min 1 foot from building; all eaves less than 6" have rain gutters and downspouts', code: 'FBC-R 318.6' },
    ],
  },
};

export type CheckStatus = 'PASS' | 'FAIL' | 'VERIFY' | 'N/A';

export interface CheckResult {
  id: string;
  description: string;
  codeReference: string;
  status: CheckStatus;
  finding: string;
}

export interface CategoryResult {
  category: string;
  name: string;
  codeReference: string;
  overallStatus: CheckStatus;
  checks: CheckResult[];
}

export interface SheetAnalysis {
  sheetNumber: number;
  sheetType: string;
  projectInfo: {
    address?: string;
    designer?: string;
    date?: string;
  };
  categories: CategoryResult[];
  rawFindings: string[];
}

export interface ComplianceReport {
  projectName: string;
  analyzedAt: string;
  totalSheets: number;
  sheets: SheetAnalysis[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    needsVerification: number;
    notApplicable: number;
  };
  overallStatus: CheckStatus;
}

/**
 * Analyze a single plan sheet image for FBC compliance
 */
export async function analyzeSheet(
  imagePath: string,
  sheetNumber: number
): Promise<SheetAnalysis> {
  // Read image and convert to base64
  const imageBuffer = await fs.readFile(imagePath);
  const base64Image = imageBuffer.toString('base64');

  // Determine media type
  const mediaType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  // Build the analysis prompt
  const prompt = buildAnalysisPrompt();

  // Call Claude Vision API
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  // Extract text response
  const textContent = response.content.find((c) => c.type === 'text');
  const responseText = textContent?.text || '';

  // Parse the response
  return parseAnalysisResponse(responseText, sheetNumber);
}

/**
 * Build the analysis prompt for Claude
 */
function buildAnalysisPrompt(): string {
  return `You are an expert Florida Building Code (FBC) 8th Edition (2023) compliance reviewer.

Analyze this construction plan sheet and check for compliance with FBC requirements.

FIRST, identify:
1. Sheet type (floor plan, elevation, electrical, foundation, roof framing, structural details, etc.)
2. Project info (address, designer, date if visible)

THEN, check each applicable category:

${Object.entries(COMPLIANCE_CATEGORIES)
  .map(([key, cat]) => {
    return `## ${cat.name} (${cat.code})
${cat.checks.map((c) => `- ${c.desc} [${c.code}]`).join('\n')}`;
  })
  .join('\n\n')}

For EACH check, respond with:
- PASS: Requirement is clearly met on this sheet
- FAIL: Requirement is clearly NOT met (explain why)
- VERIFY: Cannot determine from this sheet (needs other sheets or field verification)
- N/A: This check doesn't apply to this sheet type

Respond in this JSON format:
{
  "sheetType": "floor plan",
  "projectInfo": {
    "address": "123 Main St",
    "designer": "ABC Engineering",
    "date": "2024-01-15"
  },
  "categories": [
    {
      "category": "egress",
      "overallStatus": "PASS",
      "checks": [
        {
          "id": "egress-area",
          "status": "PASS",
          "finding": "Bedroom windows shown as 2-3050 egress type, meets 5.7 sq ft requirement"
        }
      ]
    }
  ],
  "rawFindings": [
    "Overall building dimensions: 67' x 36'",
    "Living area: 1,500 SF"
  ]
}`;
}

/**
 * Parse Claude's response into structured analysis
 */
function parseAnalysisResponse(response: string, sheetNumber: number): SheetAnalysis {
  // Try to extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Map parsed data to our structure
      const categories: CategoryResult[] = (parsed.categories || []).map((cat: any) => ({
        category: cat.category,
        name: COMPLIANCE_CATEGORIES[cat.category as keyof typeof COMPLIANCE_CATEGORIES]?.name || cat.category,
        codeReference: COMPLIANCE_CATEGORIES[cat.category as keyof typeof COMPLIANCE_CATEGORIES]?.code || '',
        overallStatus: cat.overallStatus || 'VERIFY',
        checks: (cat.checks || []).map((check: any) => {
          const catDef = COMPLIANCE_CATEGORIES[cat.category as keyof typeof COMPLIANCE_CATEGORIES];
          const checkDef = catDef?.checks.find((c) => c.id === check.id);
          return {
            id: check.id,
            description: checkDef?.desc || check.id,
            codeReference: checkDef?.code || '',
            status: check.status || 'VERIFY',
            finding: check.finding || '',
          };
        }),
      }));

      return {
        sheetNumber,
        sheetType: parsed.sheetType || 'Unknown',
        projectInfo: parsed.projectInfo || {},
        categories,
        rawFindings: parsed.rawFindings || [],
      };
    } catch (e) {
      console.error('Failed to parse analysis response:', e);
    }
  }

  // Fallback if parsing fails
  return {
    sheetNumber,
    sheetType: 'Unknown',
    projectInfo: {},
    categories: [],
    rawFindings: [response],
  };
}

/**
 * Generate a full compliance report from multiple sheet analyses
 */
export function generateReport(
  projectName: string,
  sheets: SheetAnalysis[]
): ComplianceReport {
  let totalChecks = 0;
  let passed = 0;
  let failed = 0;
  let needsVerification = 0;
  let notApplicable = 0;

  // Count results across all sheets
  sheets.forEach((sheet) => {
    sheet.categories.forEach((cat) => {
      cat.checks.forEach((check) => {
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
      });
    });
  });

  // Determine overall status
  let overallStatus: CheckStatus = 'PASS';
  if (failed > 0) {
    overallStatus = 'FAIL';
  } else if (needsVerification > 0) {
    overallStatus = 'VERIFY';
  }

  return {
    projectName,
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
