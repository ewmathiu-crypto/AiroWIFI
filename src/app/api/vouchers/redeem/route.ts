import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/vouchers/redeem - Redeem a voucher code
export async function POST(request: NextRequest) {
  try {
    const { voucherCode } = await request.json()

    if (!voucherCode) {
      return NextResponse.json({ error: 'Voucher code required' }, { status: 400 })
    }

    // Find voucher
    const voucher = await prisma.voucher.findUnique({
      where: { code: voucherCode.toUpperCase() },
      include: { package: true }
    })

    if (!voucher) {
      return NextResponse.json({ error: 'Invalid voucher code' }, { status: 404 })
    }

    if (!voucher.isActive) {
      return NextResponse.json({ error: 'Voucher is not active' }, { status: 400 })
    }

    if (voucher.expiresAt && new Date() > voucher.expiresAt) {
      return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 })
    }

    if (voucher.usedCount >= voucher.maxUses) {
      return NextResponse.json({ error: 'Voucher has already been used' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      voucher: {
        code: voucher.code,
        duration: voucher.duration,
        dataLimit: voucher.dataLimit,
        package: voucher.package
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to redeem voucher' }, { status: 500 })
  }
}
