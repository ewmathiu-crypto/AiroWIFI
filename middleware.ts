import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Rate limiting storage
const requestMap = new Map<string, { count: number; timestamp: number }>()

// Clean old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of requestMap.entries()) {
    if (now - data.timestamp > 5 * 60 * 1000) {
      requestMap.delete(ip)
    }
  }
}, 5 * 60 * 1000)

// Helper to get client IP from headers
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }
  return 'unknown'
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)

  // Rate limiting: 60 requests per minute per IP
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 60

  if (!requestMap.has(ip)) {
    requestMap.set(ip, { count: 1, timestamp: now })
  } else {
    const ipData = requestMap.get(ip)!
    if (now - ipData.timestamp > windowMs) {
      // Reset window
      requestMap.set(ip, { count: 1, timestamp: now })
    } else {
      // Increment count
      ipData.count++
      if (ipData.count > maxRequests) {
        return NextResponse.json(
          { error: 'Too many requests, please try again later.' },
          { status: 429 }
        )
      }
      requestMap.set(ip, { ...ipData, timestamp: now })
    }
  }

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
  
  // HSTS for production (HTTPS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // CSP for captive portals - tightened but still functional
  if (pathname.startsWith('/captive')) {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https:; " +
      "style-src 'self' 'unsafe-inline' https:; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' https:; " +
      "connect-src 'self' https: wss:; " +
      "frame-src 'self'; " +
      "object-src 'none'; " +
      "base-uri 'self';"
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
