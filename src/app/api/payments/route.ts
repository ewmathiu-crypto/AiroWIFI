import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/payments - List payments (filter by userId, status, method)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status
    if (method) where.method = method

    const payments = await prisma.payment.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        package: { select: { name: true } }
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST /api/payments - Create payment (already defined)
export async function POST(request: NextRequest) {
  // Existing POST logic can stay here or be extracted
  const { packageId, hotspotSsid, paymentMethod, phoneNumber } = await request.json()
  
  if (!packageId) {
    return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
  }

  const pkg = await prisma.package.findUnique({ where: { id: packageId } })
  if (!pkg || !pkg.isActive) {
    return NextResponse.json({ error: 'Package not available' }, { status: 404 })
  }

  const payment = await prisma.payment.create({
    data: {
      amount: pkg.price,
      currency: pkg.currency,
      status: 'PENDING',
      method: paymentMethod === 'mpesa' ? 'MPESA' : 'STRIPE',
      packageId: pkg.id,
      provider: paymentMethod === 'mpesa' ? 'mpesa' : 'stripe',
      phoneNumber: paymentMethod === 'mpesa' ? phoneNumber : null,
      email: paymentMethod === 'stripe' ? 'checkout@wifihub.io' : null
    }
  })

  // Simplified response for brevity
  return NextResponse.json({ paymentId: payment.id, amount: pkg.price })
}
