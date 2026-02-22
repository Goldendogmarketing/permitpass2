/**
 * CORRECTION PARSER — Enriches the 42 FBC compliance checks
 * with specific pass/fail criteria, common failures, and county context.
 * Text-only call (no PDF needed).
 */

import { COMPLIANCE_CATEGORIES } from '@/lib/compliance-analyzer';
import type { EnrichedCategory } from './types';
import { callClaudeTextOnly } from './utils';

function buildCorrectionPrompt(county?: string): string {
  const categoriesText = Object.entries(COMPLIANCE_CATEGORIES)
    .map(([key, cat]) => {
      const checks = cat.checks
        .map((c) => `  - [${c.id}] ${c.desc} (${c.code})`)
        .join('\n');
      return `### ${key}: ${cat.name} (${cat.code})\n${checks}`;
    })
    .join('\n\n');

  return `You are a Florida Building Code expert specializing in residential plan review for permitting.

Below are the 42 FBC compliance checks used for residential plan review sufficiency. For each check, provide:

1. **specificCriteria**: 2-5 concrete, measurable pass/fail criteria a plan reviewer should verify. Be specific with dimensions, values, and FBC section numbers.

2. **commonFailures**: 1-3 things that commonly cause this check to fail in submitted plans.

${county ? `3. **countyContext**: Any specific requirements for ${county} County, Florida (wind speed, exposure category, flood zones, local amendments, HVHZ status).` : ''}

## CHECKS TO ENRICH
${categoriesText}

Return JSON:
{
  "categories": [
    {
      "categoryKey": "site_plan",
      "name": "Site Plan",
      "code": "FBC 107.3.5",
      "checks": [
        {
          "id": "SP-01",
          "desc": "All existing structures, streets, easements, septic tank and well shown",
          "code": "FBC 107.3.5",
          "specificCriteria": [
            "Site plan must show all existing structures on the lot with dimensions",
            "Streets and right-of-way boundaries must be labeled",
            "All easements shown with dimensions and type (utility, drainage)",
            "Septic tank and well locations shown with 75' min setback per DOH 64E-6"
          ],
          "commonFailures": [
            "Missing easement dimensions or types",
            "Septic-to-well setback not shown when both exist on lot"
          ]${county ? `,
          "countyContext": "${county} County specific note..."` : ''}
        }
      ]
    }
  ]
}

IMPORTANT:
- Include ALL 42 checks grouped under their original category keys.
- specificCriteria must be concrete and measurable — not vague.
- Reference specific FBC section numbers where applicable.
- Return valid JSON only.`;
}

export async function runCorrectionParser(county?: string): Promise<EnrichedCategory[]> {
  const { parsed } = await callClaudeTextOnly({
    prompt: buildCorrectionPrompt(county),
    maxTokens: 12288,
  });

  const categories = parsed.categories as EnrichedCategory[];
  if (!categories || !Array.isArray(categories)) {
    throw new Error('Correction parser returned invalid structure: missing categories array');
  }

  return categories;
}

/**
 * Fallback if correction parser fails — use raw COMPLIANCE_CATEGORIES without enrichment.
 */
export function buildFallbackEnrichedCategories(): EnrichedCategory[] {
  return Object.entries(COMPLIANCE_CATEGORIES).map(([key, cat]) => ({
    categoryKey: key,
    name: cat.name,
    code: cat.code,
    checks: cat.checks.map((c) => ({
      id: c.id,
      desc: c.desc,
      code: c.code,
    })),
  }));
}
