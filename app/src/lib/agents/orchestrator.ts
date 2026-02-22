/**
 * ORCHESTRATOR — Master coordinator for the multi-agent FBC compliance pipeline.
 *
 * Pipeline phases:
 *   1. Manifest Agent + Correction Parser (parallel)
 *   2. Task Decomposer (deterministic, instant)
 *   3. Targeted Sub-Agents — 5 in parallel (site_flood, foundation, floor_plan, elev_structural, elev_protection)
 *   4. Report Assembly
 */

import type { PipelineContext, SubAgentResult } from './types';
import type { ComplianceReportData } from './report-assembler';
import { runManifestAgent } from './manifest-agent';
import { runCorrectionParser, buildFallbackEnrichedCategories } from './correction-parser';
import { decomposeIntoTasks } from './task-decomposer';
import { runSubAgent } from './sub-agent';
import { assembleReport } from './report-assembler';

export async function runAnalysisPipeline(
  pdfBase64: string,
  filename: string,
  county?: string
): Promise<{ report: ComplianceReportData; context: PipelineContext }> {
  const startTime = Date.now();

  const context: PipelineContext = {
    pdfBase64,
    filename,
    manifest: null,
    enrichedCategories: null,
    tasks: null,
    subAgentResults: [],
    errors: [],
    timing: {
      manifestMs: 0,
      correctionParserMs: 0,
      taskDecomposerMs: 0,
      subAgentsMs: 0,
      totalMs: 0,
    },
  };

  // ── PHASE 1: Manifest Agent + Correction Parser (parallel) ─────────
  console.log('[Orchestrator] Phase 1: Manifest Agent + Correction Parser in parallel...');
  const phase1Start = Date.now();

  const [manifestResult, correctionResult] = await Promise.allSettled([
    runManifestAgent(pdfBase64),
    runCorrectionParser(county),
  ]);

  // Manifest is critical — cannot continue without it
  if (manifestResult.status === 'fulfilled') {
    context.manifest = manifestResult.value;
    context.timing.manifestMs = Date.now() - phase1Start;
    console.log(`[Orchestrator] Manifest complete: ${context.manifest.totalPages} pages, ${context.manifest.pages.length} classified`);
    for (const page of context.manifest.pages) {
      console.log(`  Page ${page.pageNumber}: [${page.pageTypes.join(', ')}] — ${page.elements.length} elements`);
    }
  } else {
    const err = `Manifest agent failed: ${manifestResult.reason}`;
    context.errors.push(err);
    console.error(`[Orchestrator] ${err}`);
    throw new Error(err);
  }

  // Correction parser is non-critical — fall back to raw checks
  if (correctionResult.status === 'fulfilled') {
    context.enrichedCategories = correctionResult.value;
    context.timing.correctionParserMs = Date.now() - phase1Start;
    const totalChecks = context.enrichedCategories.reduce((sum, cat) => sum + cat.checks.length, 0);
    console.log(`[Orchestrator] Correction parser complete: ${context.enrichedCategories.length} categories, ${totalChecks} enriched checks`);
  } else {
    const err = `Correction parser failed: ${correctionResult.reason}`;
    context.errors.push(err);
    console.warn(`[Orchestrator] ${err} — falling back to base checks`);
    context.enrichedCategories = buildFallbackEnrichedCategories();
  }

  // ── PHASE 2: Task Decomposition (deterministic, instant) ───────────
  console.log('[Orchestrator] Phase 2: Decomposing tasks...');
  const decomposeStart = Date.now();
  context.tasks = decomposeIntoTasks(context.manifest, context.enrichedCategories);
  context.timing.taskDecomposerMs = Date.now() - decomposeStart;

  for (const task of context.tasks) {
    const pages = task.relevantPages.length > 0
      ? `pages [${task.relevantPages.join(',')}]`
      : `fallback all pages [${task.fallbackPages.join(',')}]`;
    console.log(`  [Task] ${task.agentId}: ${task.checks.length} checks → ${pages}`);
  }

  // ── PHASE 3: Targeted Sub-Agents (parallel) ───────────────────────
  console.log('[Orchestrator] Phase 3: Running 5 sub-agents in parallel...');
  const subAgentStart = Date.now();

  const subAgentPromises = context.tasks.map((task) =>
    runSubAgent(task, pdfBase64)
  );
  const subAgentSettled = await Promise.allSettled(subAgentPromises);

  context.subAgentResults = subAgentSettled.map((result, i) => {
    if (result.status === 'fulfilled') {
      const r = result.value;
      const checkCount = r.categories.flatMap((c) => c.checks).length;
      console.log(`  [Sub-Agent ${r.agentId}] Complete: ${checkCount} checks evaluated${r.error ? ' (with errors)' : ''}`);
      if (r.error) {
        context.errors.push(`Sub-agent ${r.agentId} partial error: ${r.error}`);
      }
      return r;
    } else {
      const agentId = context.tasks![i].agentId;
      const err = `Sub-agent ${agentId} failed: ${result.reason}`;
      context.errors.push(err);
      console.error(`  [Sub-Agent ${agentId}] FAILED: ${result.reason}`);
      return {
        agentId,
        categories: [],
        error: err,
      } as SubAgentResult;
    }
  });

  context.timing.subAgentsMs = Date.now() - subAgentStart;

  // ── PHASE 4: Assemble Report ──────────────────────────────────────
  console.log('[Orchestrator] Phase 4: Assembling final report...');
  const report = assembleReport(context.subAgentResults, context.manifest, filename);

  context.timing.totalMs = Date.now() - startTime;

  console.log(`[Orchestrator] Pipeline complete in ${context.timing.totalMs}ms`);
  console.log(`  Phase 1 — Manifest:    ${context.timing.manifestMs}ms`);
  console.log(`  Phase 1 — Correction:  ${context.timing.correctionParserMs}ms`);
  console.log(`  Phase 2 — Decompose:   ${context.timing.taskDecomposerMs}ms`);
  console.log(`  Phase 3 — Sub-agents:  ${context.timing.subAgentsMs}ms`);
  console.log(`  Summary: ${report.summary.totalChecks} checks — ${report.summary.passed} PASS, ${report.summary.failed} FAIL, ${report.summary.needsVerification} VERIFY, ${report.summary.notApplicable} N/A`);
  console.log(`  Overall: ${report.overallStatus}`);
  if (context.errors.length > 0) {
    console.warn(`  Errors: ${context.errors.length} — ${context.errors.join('; ')}`);
  }

  return { report, context };
}
