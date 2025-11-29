import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow public routes
  if (request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // In a real app, check for auth token/session here
  // For demo mode, we allow all routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

