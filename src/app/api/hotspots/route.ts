import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/hotspots - List all hotspots
export async function GET() {
  try {
    const hotspots = await prisma.hotspot.findMany({
      orderBy: { isActive: 'desc' }
    })
    return NextResponse.json(hotspots)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch hotspots' }, { status: 500 })
  }
}

// POST /api/hotspots - Create new hotspot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, ssid, password, location, address, city, country, coordinates, pricePerHour, pricePerDay, pricePerMonth, maxConnections, bandwidthLimit, notes } = body

    const hotspot = await prisma.hotspot.create({
      data: {
        name,
        ssid,
        password,
        location,
        address,
        city,
        country: country || 'KE',
        coordinates,
        pricePerHour: pricePerHour || 0.5,
        pricePerDay: pricePerDay || 5.0,
        pricePerMonth: pricePerMonth || 50.0,
        maxConnections: maxConnections || 50,
        bandwidthLimit,
        notes
      }
    })

    return NextResponse.json(hotspot, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create hotspot' }, { status: 500 })
  }
}
