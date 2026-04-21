import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/sessions - List all sessions (admin) or user's sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const hotspotId = searchParams.get('hotspotId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (userId) where.userId = userId
    if (hotspotId) where.hotspotId = hotspotId

    const sessions = await prisma.session.findMany({
      where,
      take: limit,
      orderBy: { startTime: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        hotspot: { select: { name: true, ssid: true } },
        package: true,
        voucher: true
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, hotspotId, packageId, voucherCode, macAddress, deviceName, ipAddress, userAgent } = body

    // Validate hotspot exists
    const hotspot = await prisma.hotspot.findUnique({
      where: { id: hotspotId }
    })

    if (!hotspot || !hotspot.isActive) {
      return NextResponse.json({ error: 'Hotspot not available' }, { status: 404 })
    }

    // Check if user already has active session on this hotspot
    const existingSession = await prisma.session.findFirst({
      where: {
        userId,
        hotspotId,
        status: 'ACTIVE'
      }
    })

    if (existingSession) {
      return NextResponse.json({ 
        error: 'Active session already exists',
        session: existingSession
      }, { status: 400 })
    }

    // Determine rate and duration
    let duration = 0
    let ratePerHour = hotspot.pricePerHour
    let dataLimit: bigint | null = null

    if (voucherCode) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: voucherCode },
        include: { package: true }
      })

      if (!voucher || !voucher.isActive || voucher.usedCount >= voucher.maxUses) {
        return NextResponse.json({ error: 'Invalid or used voucher' }, { status: 400 })
      }

      duration = voucher.duration * 60 // convert minutes to seconds
      dataLimit = voucher.dataLimit
      ratePerHour = 0 // free

      // Mark voucher as used
      await prisma.voucher.update({
        where: { id: voucher.id },
        data: { usedCount: { increment: 1 } }
      })
    } else if (packageId) {
      const pkg = await prisma.package.findUnique({
        where: { id: packageId }
      })

      if (!pkg || !pkg.isActive) {
        return NextResponse.json({ error: 'Package not available' }, { status: 404 })
      }

      duration = pkg.duration * 60 // convert minutes to seconds
      dataLimit = pkg.dataLimit
      ratePerHour = hotspot.pricePerHour
    } else {
      // Pay-as-you-go
      duration = 60 * 60 // default 1 hour
      dataLimit = null
    }

    // Create session
    const session = await prisma.session.create({
      data: {
        userId,
        hotspotId,
        packageId: packageId || null,
        voucherCode: voucherCode || null,
        macAddress,
        deviceName,
        ipAddress,
        userAgent,
        status: 'ACTIVE',
        startTime: new Date(),
        ratePerHour,
        charged: 0
      },
      include: {
        hotspot: true,
        package: true
      }
    })

    return NextResponse.json({
      success: true,
      session,
      duration: duration,
      dataLimit: dataLimit
    }, { status: 201 })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
