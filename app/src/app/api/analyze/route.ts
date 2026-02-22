import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAnalysisPipeline } from '@/lib/agents/orchestrator';

export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Usage check ──
    const { data: profile } = await supabase
      .from('profiles')
      .select('analyses_used, plan_tier')
      .eq('id', user.id)
      .single() as { data: { analyses_used: number; plan_tier: string } | null };

    if (profile && profile.analyses_used >= 1 && profile.plan_tier === 'free') {
      return NextResponse.json(
        { error: 'Free analysis limit reached. Please upgrade your plan.' },
        { status: 403 }
      );
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

    // ── Increment usage ──
    await (supabase.rpc as any)('increment_analyses', { user_id: user.id });

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Analysis pipeline error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: String(error) },
      { status: 500 }
    );
  }
}
