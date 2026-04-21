import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/settings - Get all settings
export async function GET() {
  try {
    const settings = await prisma.setting.findMany()
    const settingsObj: Record<string, any> = {}
    settings.forEach(s => {
      try {
        settingsObj[s.key] = JSON.parse(s.value)
      } catch {
        settingsObj[s.key] = s.value
      }
    })
    return NextResponse.json(settingsObj)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST /api/admin/settings - Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value), type: 'json' }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
