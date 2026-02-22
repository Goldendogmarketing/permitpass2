/**
 * REPORT ASSEMBLER — Merges all sub-agent results into the
 * ComplianceReport shape the frontend expects (zero frontend changes).
 */

import type { SubAgentResult, PageManifest } from './types';
import type { CheckStatus, CategoryResult } from '@/lib/compliance-analyzer';

export interface ComplianceReportData {
  projectName: string;
  analyzedAt: string;
  totalSheets: number;
  sheets: {
    sheetNumber: number;
    sheetType: string;
    categories: CategoryResult[];
  }[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    needsVerification: number;
    notApplicable: number;
  };
  overallStatus: CheckStatus;
}

export function assembleReport(
  subAgentResults: SubAgentResult[],
  manifest: PageManifest,
  filename: string
): ComplianceReportData {
  // Collect all categories from all sub-agents
  const allCategories: CategoryResult[] = [];
  for (const result of subAgentResults) {
    allCategories.push(...result.categories);
  }

  // Merge categories that share the same key
  // (elev_structural and elev_protection both produce "elevations_details")
  const mergedCategories = mergeCategories(allCategories);

  // Build the single-sheet structure the frontend iterates
  const sheet = {
    sheetNumber: 1,
    sheetType: 'Full Plan Set',
    categories: mergedCategories,
  };

  // Count totals
  let totalChecks = 0;
  let passed = 0;
  let failed = 0;
  let needsVerification = 0;
  let notApplicable = 0;

  for (const cat of mergedCategories) {
    for (const check of cat.checks) {
      totalChecks++;
      switch (check.status) {
        case 'PASS': passed++; break;
        case 'FAIL': failed++; break;
        case 'VERIFY': needsVerification++; break;
        case 'N/A': notApplicable++; break;
      }
    }
  }

  let overallStatus: CheckStatus = 'PASS';
  if (failed > 0) overallStatus = 'FAIL';
  else if (needsVerification > 0) overallStatus = 'VERIFY';

  return {
    projectName: manifest.projectInfo?.address || filename.replace('.pdf', ''),
    analyzedAt: new Date().toISOString(),
    totalSheets: manifest.totalPages,
    sheets: [sheet],
    summary: { totalChecks, passed, failed, needsVerification, notApplicable },
    overallStatus,
  };
}

/**
 * Merge categories with the same key (dedup checks from split agents).
 * Returns in stable order matching COMPLIANCE_CATEGORIES.
 */
function mergeCategories(categories: CategoryResult[]): CategoryResult[] {
  const merged = new Map<string, CategoryResult>();

  for (const cat of categories) {
    if (merged.has(cat.category)) {
      const existing = merged.get(cat.category)!;
      existing.checks.push(...cat.checks);
      existing.overallStatus = deriveStatus(existing.checks);
    } else {
      merged.set(cat.category, { ...cat, checks: [...cat.checks] });
    }
  }

  // Stable order matching the 5 COMPLIANCE_CATEGORIES sections
  const order = ['site_plan', 'flood', 'foundation', 'floor_plan', 'elevations_details'];
  return order
    .filter((key) => merged.has(key))
    .map((key) => merged.get(key)!);
}

function deriveStatus(checks: { status: CheckStatus }[]): CheckStatus {
  if (checks.some((c) => c.status === 'FAIL')) return 'FAIL';
  if (checks.some((c) => c.status === 'VERIFY')) return 'VERIFY';
  if (checks.every((c) => c.status === 'N/A')) return 'N/A';
  return 'PASS';
}
