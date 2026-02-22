import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/analyze', '/checkout'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthorized = request.cookies.get('beta_authorized')?.value === 'true';

  if (isProtected && !isAuthorized) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && isAuthorized) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/analyze';
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/analyze/:path*', '/checkout/:path*', '/login'],
};
