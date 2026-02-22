/**
 * SUB-AGENT RUNNER — Generic runner for targeted compliance sub-agents.
 * Each sub-agent gets a subset of pages and a focused set of checks.
 */

import type { SubAgentTask, SubAgentResult } from './types';
import type { CategoryResult, CheckResult, CheckStatus } from '@/lib/compliance-analyzer';
import { COMPLIANCE_CATEGORIES } from '@/lib/compliance-analyzer';
import { extractPages } from './pdf-page-extractor';
import { callClaudeWithPdf } from './utils';
import { getSubAgentPrompt } from './sub-agent-prompts';

export async function runSubAgent(
  task: SubAgentTask,
  fullPdfBase64: string
): Promise<SubAgentResult> {
  try {
    // Extract only the relevant pages into a smaller PDF
    const pageNumbers = task.relevantPages.length > 0
      ? task.relevantPages
      : task.fallbackPages;

    let subPdfBase64: string;
    try {
      subPdfBase64 = await extractPages(fullPdfBase64, pageNumbers);
    } catch (extractError) {
      // If page extraction fails, fall back to full PDF
      console.warn(`[Sub-Agent ${task.agentId}] Page extraction failed, using full PDF:`, extractError);
      subPdfBase64 = fullPdfBase64;
    }

    const prompt = getSubAgentPrompt(task);

    const { parsed, usage } = await callClaudeWithPdf({
      pdfBase64: subPdfBase64,
      prompt,
      maxTokens: 8192,
    });

    const categories = normalizeResponse(parsed, task);

    return {
      agentId: task.agentId,
      categories,
      tokensUsed: {
        input: usage.input_tokens,
        output: usage.output_tokens,
      },
    };
  } catch (error) {
    console.error(`[Sub-Agent ${task.agentId}] Error:`, error);
    return {
      agentId: task.agentId,
      categories: buildErrorCategories(task),
      error: String(error),
    };
  }
}

/**
 * Normalize Claude's response into CategoryResult[] shape.
 */
function normalizeResponse(parsed: any, task: SubAgentTask): CategoryResult[] {
  const rawCategories = parsed.categories || [];

  return rawCategories.map((cat: any) => {
    const catDef = COMPLIANCE_CATEGORIES[cat.category as keyof typeof COMPLIANCE_CATEGORIES];
    return {
      category: cat.category,
      name: catDef?.name || cat.name || cat.category,
      codeReference: catDef?.code || cat.codeReference || '',
      overallStatus: (cat.overallStatus || deriveOverallStatus(cat.checks || [])) as CheckStatus,
      checks: (cat.checks || []).map((check: any) => {
        const checkDef = catDef?.checks.find((c) => c.id === check.id);
        return {
          id: check.id,
          description: checkDef?.desc || check.description || check.id,
          codeReference: checkDef?.code || check.codeReference || '',
          status: (check.status || 'VERIFY') as CheckStatus,
          finding: check.finding || '',
        } as CheckResult;
      }),
    } as CategoryResult;
  });
}

function deriveOverallStatus(checks: any[]): CheckStatus {
  if (checks.some((c: any) => c.status === 'FAIL')) return 'FAIL';
  if (checks.some((c: any) => c.status === 'VERIFY')) return 'VERIFY';
  if (checks.every((c: any) => c.status === 'N/A')) return 'N/A';
  return 'PASS';
}

/**
 * When a sub-agent fails entirely, return VERIFY for all its checks.
 */
function buildErrorCategories(task: SubAgentTask): CategoryResult[] {
  const grouped = new Map<string, CheckResult[]>();

  for (const check of task.checks) {
    // Find which category this check belongs to
    const catKey = Object.entries(COMPLIANCE_CATEGORIES).find(([, cat]) =>
      cat.checks.some((c) => c.id === check.id)
    )?.[0] || task.categoryKeys[0];

    if (!grouped.has(catKey)) grouped.set(catKey, []);
    grouped.get(catKey)!.push({
      id: check.id,
      description: check.desc,
      codeReference: check.code,
      status: 'VERIFY' as CheckStatus,
      finding: 'Sub-agent analysis failed — manual verification required.',
    });
  }

  return Array.from(grouped.entries()).map(([catKey, checks]) => {
    const catDef = COMPLIANCE_CATEGORIES[catKey as keyof typeof COMPLIANCE_CATEGORIES];
    return {
      category: catKey,
      name: catDef?.name || catKey,
      codeReference: catDef?.code || '',
      overallStatus: 'VERIFY' as CheckStatus,
      checks,
    };
  });
}
