/**
 * TASK DECOMPOSER — Pure logic (no AI call).
 * Maps each sub-agent group to the relevant pages from the manifest.
 */

import type { PageManifest, EnrichedCategory, SubAgentTask, PageType } from './types';

/** Which page types are relevant to each sub-agent group */
const PAGE_TYPE_MAPPING: Record<string, PageType[]> = {
  site_flood: ['site_plan', 'general_notes', 'cover_sheet'],
  foundation: ['foundation', 'structural_details', 'general_notes'],
  floor_plan: ['floor_plan', 'electrical', 'plumbing', 'mechanical', 'door_schedule', 'general_notes'],
  elev_structural: ['elevation', 'roof_framing', 'structural_details', 'wall_sections', 'general_notes'],
  elev_protection: ['elevation', 'wall_sections', 'window_details', 'door_schedule', 'general_notes'],
};

/** Which COMPLIANCE_CATEGORIES keys each sub-agent covers */
const CATEGORY_MAPPING: Record<string, string[]> = {
  site_flood: ['site_plan', 'flood'],
  foundation: ['foundation'],
  floor_plan: ['floor_plan'],
  elev_structural: ['elevations_details'],
  elev_protection: ['elevations_details'],
};

/** Check ID split for the two elevation sub-agents */
const ELEV_STRUCTURAL_IDS = [
  'ELV-01', 'ELV-02', 'ELV-03', 'ELV-04',
  'ELV-05', 'ELV-06', 'ELV-07', 'ELV-08',
];
const ELEV_PROTECTION_IDS = [
  'ELV-09', 'ELV-10', 'ELV-11', 'ELV-12',
  'ELV-13', 'ELV-14', 'ELV-15', 'ELV-16', 'ELV-17',
];

export function decomposeIntoTasks(
  manifest: PageManifest,
  enrichedCategories: EnrichedCategory[]
): SubAgentTask[] {
  const tasks: SubAgentTask[] = [];

  for (const [agentId, categoryKeys] of Object.entries(CATEGORY_MAPPING)) {
    // Collect checks for this agent
    let checks = enrichedCategories
      .filter((ec) => categoryKeys.includes(ec.categoryKey))
      .flatMap((ec) => ec.checks);

    // For split elevation agents, filter to the correct check IDs
    if (agentId === 'elev_structural') {
      checks = checks.filter((c) => ELEV_STRUCTURAL_IDS.includes(c.id));
    } else if (agentId === 'elev_protection') {
      checks = checks.filter((c) => ELEV_PROTECTION_IDS.includes(c.id));
    }

    // Find relevant pages from the manifest
    const targetPageTypes = PAGE_TYPE_MAPPING[agentId] || [];
    const relevantPages = manifest.pages
      .filter((p) => p.pageTypes.some((pt) => targetPageTypes.includes(pt)))
      .map((p) => p.pageNumber)
      .sort((a, b) => a - b);

    // Deduplicate
    const uniquePages = [...new Set(relevantPages)];

    // Fallback: if no relevant pages found, use all pages
    const fallbackPages = uniquePages.length === 0
      ? manifest.pages.map((p) => p.pageNumber)
      : [];

    tasks.push({
      agentId,
      categoryKeys,
      checks,
      relevantPages: uniquePages,
      fallbackPages,
    });
  }

  return tasks;
}
