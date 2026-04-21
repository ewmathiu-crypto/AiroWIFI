import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/hotspots/[id]/sessions - Get hotspot sessions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessions = await prisma.session.findMany({
      where: { hotspotId: id },
      orderBy: { startTime: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true, email: true } },
        package: true
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
