import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/hotspots/[id] - Get single hotspot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const hotspot = await prisma.hotspot.findUnique({ where: { id } })

    if (!hotspot) {
      return NextResponse.json({ error: 'Hotspot not found' }, { status: 404 })
    }

    return NextResponse.json(hotspot)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch hotspot' }, { status: 500 })
  }
}

// PATCH /api/hotspots/[id] - Update hotspot
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const hotspot = await prisma.hotspot.update({
      where: { id },
      data: body
    })

    return NextResponse.json(hotspot)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update hotspot' }, { status: 500 })
  }
}

// DELETE /api/hotspots/[id] - Delete hotspot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.hotspot.delete({ where: { id } })
    return NextResponse.json({ message: 'Hotspot deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete hotspot' }, { status: 500 })
  }
}
