import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Public paths
  if (
    pathname.startsWith('/captive') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/hotspots') ||
    pathname.startsWith('/api/packages') ||
    pathname.startsWith('/api/vouchers/validate')
  ) {
    return NextResponse.next()
  }

  // Protected paths - require authentication
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/api/sessions') ||
    pathname.startsWith('/api/payments')
  ) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Admin check for admin routes
    if (pathname.startsWith('/admin') && (token as any).role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/account', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Admin routes
    '/admin/:path*',
    // Account routes
    '/account/:path*',
    // API routes
    '/api/sessions/:path*',
    '/api/payments/:path*',
    '/api/admin/:path*'
  ]
}
