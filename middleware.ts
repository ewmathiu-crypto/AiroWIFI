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
    pathname.startsWith('/register') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/hotspots') ||
    pathname.startsWith('/api/packages') ||
    pathname.startsWith('/api/vouchers') ||
    pathname.startsWith('/api/qrcode')
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

  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // CSP for captive portals (allows loading of captive portal assets)
  if (pathname.startsWith('/captive')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
    )
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/api/sessions/:path*',
    '/api/payments/:path*',
    '/api/admin/:path*',
    '/captive/:path*',
    '/login',
    '/register'
  ]
}
