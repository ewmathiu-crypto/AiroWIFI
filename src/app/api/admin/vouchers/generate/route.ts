import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

// POST /api/admin/vouchers/generate - Generate batch of vouchers
export async function POST(request: NextRequest) {
  try {
    const { packageId, quantity, expiresAt, note } = await request.json()

    if (!packageId || !quantity) {
      return NextResponse.json({ error: 'Package ID and quantity are required' }, { status: 400 })
    }

    // Validate package
    const pkg = await prisma.package.findUnique({
      where: { id: packageId }
    })

    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    const vouchers = []
    for (let i = 0; i < quantity; i++) {
      const code = `WIFI-${uuidv4().slice(0, 8).toUpperCase()}`
      
      const voucher = await prisma.voucher.create({
        data: {
          code,
          packageId,
          duration: pkg.duration,
          dataLimit: pkg.dataLimit,
          isActive: true,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          notes: note || null
        }
      })

      vouchers.push(voucher)
    }

    return NextResponse.json({ 
      success: true, 
      vouchers,
      count: vouchers.length
    }, { status: 201 })
  } catch (error) {
    console.error('Voucher generation error:', error)
    return NextResponse.json({ error: 'Failed to generate vouchers' }, { status: 500 })
  }
}
