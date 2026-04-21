import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/packages/[id] - Get single package
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const pkg = await prisma.package.findUnique({ where: { id } })
    
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json(pkg)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch package' }, { status: 500 })
  }
}

// PATCH /api/packages/[id] - Update package
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const pkg = await prisma.package.update({
      where: { id },
      data: body
    })

    return NextResponse.json(pkg)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update package' }, { status: 500 })
  }
}

// DELETE /api/packages/[id] - Delete package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.package.delete({ where: { id } })
    return NextResponse.json({ message: 'Package deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete package' }, { status: 500 })
  }
}
