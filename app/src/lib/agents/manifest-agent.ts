/**
 * MANIFEST AGENT — Scans PDF pages, classifies each page type,
 * and builds a spatial index of what elements appear where.
 * Does NOT extract measurements — only identifies what's present.
 */

import type { PageManifest } from './types';
import { callClaudeWithPdf } from './utils';

const MANIFEST_PROMPT = `You are a construction plan sheet classifier. Scan every page of this PDF and identify what type of sheet each page is and what elements appear on it.

For each page, determine:

1. **pageTypes**: One or more from this list:
   site_plan, foundation, floor_plan, elevation, roof_framing,
   electrical, plumbing, mechanical, structural_details, wall_sections,
   window_details, door_schedule, general_notes, cover_sheet, unknown

2. **sheetLabel**: The sheet number if visible (e.g., "A1", "S1", "E1")

3. **sheetTitle**: The title block description (e.g., "Floor Plan", "Foundation Plan")

4. **elements**: What building elements/information appear on this page. Examples:
   - site_plan pages: setbacks, footprint, easements, flood_zone, lp_tank, utilities, streets, existing_structures
   - foundation pages: footings, slabs, rebar, elevation_changes, termite_notes, anchor_bolts, vapor_barrier
   - floor_plan pages: rooms, windows, doors, electrical_panel, smoke_alarms, co_alarms, plumbing_fixtures, water_heater, ac_equipment, structural_members, shearwalls, attic_access, gas_appliances, exhaust_fans
   - elevation pages: wall_sections, roof_details, garage_separation, product_approvals, opening_protection, guardrails, handrails, stairs, gable_bracing, roof_covering, window_details, truss_layout
   - electrical pages: panel, outlets, switches, lighting, gfci, afci, smoke_alarms
   - structural pages: headers, beams, connections, shearwalls, holddowns

5. **hasSchedules**: true if the page contains any schedule table (window, door, finish, fixture)

6. **hasNotes**: true if general notes or code references appear

7. **confidence**: 0.0 to 1.0 how certain you are

Also extract basic project info if visible (address, designer, date, code edition).

Return JSON:
{
  "totalPages": 5,
  "projectInfo": {
    "address": "123 Main St, City FL 32601",
    "designer": "ABC Engineering",
    "date": "2024-01-15",
    "codeEdition": "2023 FBC Residential 8th Ed"
  },
  "pages": [
    {
      "pageNumber": 1,
      "pageTypes": ["floor_plan", "electrical"],
      "sheetLabel": "A1",
      "sheetTitle": "Floor Plan & Electrical",
      "elements": ["rooms", "windows", "doors", "outlets", "switches", "panel", "smoke_alarms"],
      "hasSchedules": true,
      "hasNotes": true,
      "confidence": 0.95
    }
  ]
}

IMPORTANT:
- Include EVERY page, even cover sheets or note-only pages.
- A page can have multiple types (floor plan that also shows electrical).
- List all elements visible — be thorough.
- Do NOT extract measurements or values — just identify WHAT is shown.
- Return valid JSON only.`;

export async function runManifestAgent(pdfBase64: string): Promise<PageManifest> {
  const { parsed } = await callClaudeWithPdf({
    pdfBase64,
    prompt: MANIFEST_PROMPT,
    maxTokens: 8192,
  });

  // Validate basic structure
  const manifest = parsed as PageManifest;
  if (!manifest.pages || !Array.isArray(manifest.pages)) {
    throw new Error('Manifest agent returned invalid structure: missing pages array');
  }

  return manifest;
}
