import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const betaPassword = process.env.BETA_PASSWORD;
    if (!betaPassword) {
      console.error('[Auth] BETA_PASSWORD env var not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (password !== betaPassword) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

    // Set auth cookie — 30 days
    const response = NextResponse.json({ success: true });
    response.cookies.set('beta_authorized', 'true', {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false, // needs to be readable by client JS for AuthContext
      sameSite: 'lax',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
