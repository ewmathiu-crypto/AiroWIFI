import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/packages - List all packages (admin: all, public: active only)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where = includeInactive ? {} : { isActive: true }
    
    const packages = await prisma.package.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    })
    return NextResponse.json(packages)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
  }
}

// POST /api/packages - Create package (admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, duration, dataLimit, price, isActive, isFeatured, sortOrder } = body

    const pkg = await prisma.package.create({
      data: {
        name,
        description,
        duration: parseInt(duration),
        dataLimit: dataLimit ? BigInt(dataLimit) : null,
        price: parseFloat(price),
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        sortOrder: sortOrder || 0
      }
    })

    return NextResponse.json(pkg, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 })
  }
}
