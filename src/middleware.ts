import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (await verifySessionToken(token)) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // Everything except the login page itself and Next's own static assets.
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
};
