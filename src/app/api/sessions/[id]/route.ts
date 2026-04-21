import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/sessions/[id]/update-usage - Update session data usage
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { bytesIn, bytesOut } = await request.json()

    const session = await prisma.session.update({
      where: { id },
      data: {
        bytesIn: { increment: BigInt(bytesIn) },
        bytesOut: { increment: BigInt(bytesOut) },
        dataUsed: { increment: BigInt(bytesIn + bytesOut) }
      }
    })

    return NextResponse.json(session)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}

// POST /api/sessions/[id]/end - End a session
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { duration, dataUsed } = await request.json()

    // Calculate charge
    const session = await prisma.session.findUnique({
      where: { id },
      include: { hotspot: true, package: true }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    let charged = 0
    if (session.package) {
      charged = session.package.price
    } else if (session.voucherCode) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: session.voucherCode }
      })
      if (voucher?.purchasedBy) {
        charged = 0 // Voucher already paid
      }
    } else {
      charged = (duration / 3600) * (session.ratePerHour || session.hotspot.pricePerHour)
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        duration,
        dataUsed: BigInt(dataUsed),
        charged
      }
    })

    // Create payment record if needed
    if (charged > 0) {
      await prisma.payment.create({
        data: {
          amount: charged,
          method: 'MANUAL',
          status: 'COMPLETED',
          sessionId: id,
          userId: session.userId,
          provider: 'system'
        }
      })
    }

    return NextResponse.json(updatedSession)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 })
  }
}

// GET /api/sessions/[id] - Get session details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        hotspot: true,
        package: true,
        voucher: true
      }
    })

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}
