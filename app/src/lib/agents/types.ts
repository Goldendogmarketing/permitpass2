/**
 * Multi-Agent FBC Compliance Analyzer — Type Definitions
 */

import type { CheckStatus, CategoryResult } from '@/lib/compliance-analyzer';

// ─── Manifest Agent ──────────────────────────────────────────────────

export type PageType =
  | 'site_plan'
  | 'foundation'
  | 'floor_plan'
  | 'elevation'
  | 'roof_framing'
  | 'electrical'
  | 'plumbing'
  | 'mechanical'
  | 'structural_details'
  | 'wall_sections'
  | 'window_details'
  | 'door_schedule'
  | 'general_notes'
  | 'cover_sheet'
  | 'unknown';

export interface PageManifestEntry {
  pageNumber: number;
  pageTypes: PageType[];
  sheetLabel: string | null;
  sheetTitle: string | null;
  elements: string[];
  hasSchedules: boolean;
  hasNotes: boolean;
  confidence: number;
}

export interface PageManifest {
  totalPages: number;
  projectInfo: {
    address?: string;
    designer?: string;
    date?: string;
    codeEdition?: string;
  };
  pages: PageManifestEntry[];
}

// ─── Correction Parser ───────────────────────────────────────────────

export interface EnrichedCheck {
  id: string;
  desc: string;
  code: string;
  countyContext?: string;
  specificCriteria?: string[];
  commonFailures?: string[];
}

export interface EnrichedCategory {
  categoryKey: string;
  name: string;
  code: string;
  checks: EnrichedCheck[];
}

// ─── Task Decomposer ────────────────────────────────────────────────

export interface SubAgentTask {
  agentId: string;
  categoryKeys: string[];
  checks: EnrichedCheck[];
  relevantPages: number[];
  fallbackPages: number[];
}

// ─── Sub-Agent ──────────────────────────────────────────────────────

export interface SubAgentResult {
  agentId: string;
  categories: CategoryResult[];
  error?: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

// ─── Pipeline Context ───────────────────────────────────────────────

export interface PipelineContext {
  pdfBase64: string;
  filename: string;
  manifest: PageManifest | null;
  enrichedCategories: EnrichedCategory[] | null;
  tasks: SubAgentTask[] | null;
  subAgentResults: SubAgentResult[];
  errors: string[];
  timing: {
    manifestMs: number;
    correctionParserMs: number;
    taskDecomposerMs: number;
    subAgentsMs: number;
    totalMs: number;
  };
}
