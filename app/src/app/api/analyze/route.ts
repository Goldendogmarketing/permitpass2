import { NextRequest, NextResponse } from 'next/server';
import { runAnalysisPipeline } from '@/lib/agents/orchestrator';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // ── Auth check (cookie-based beta auth) ──
    const authorized = request.cookies.get('beta_authorized')?.value === 'true';
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Get blob URL and filename from JSON body ──
    const { blobUrl, fileName } = await request.json();

    if (!blobUrl) {
      return NextResponse.json({ error: 'No file URL provided' }, { status: 400 });
    }

    // ── Download PDF from Vercel Blob ──
    const blobResponse = await fetch(blobUrl);
    if (!blobResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch uploaded file' }, { status: 400 });
    }

    const bytes = await blobResponse.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // ── Run multi-agent pipeline ──
    const { report } = await runAnalysisPipeline(base64, fileName || 'plan.pdf');

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Analysis pipeline error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: String(error) },
      { status: 500 }
    );
  }
}
