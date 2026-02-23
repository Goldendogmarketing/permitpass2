import { NextRequest, NextResponse } from 'next/server';
import { runAnalysisPipeline } from '@/lib/agents/orchestrator';

// Vercel serverless: 5 min timeout, 50MB body
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // ── Auth check (cookie-based beta auth) ──
    const authorized = request.cookies.get('beta_authorized')?.value === 'true';
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── File validation ──
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

    // ── Convert to base64 ──
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // ── Run multi-agent pipeline ──
    const { report } = await runAnalysisPipeline(base64, file.name);

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Analysis pipeline error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: String(error) },
      { status: 500 }
    );
  }
}
