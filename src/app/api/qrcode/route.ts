import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

// GET /api/qrcode?text=... - Generate QR code as PNG
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get('text')

    if (!text) {
      return NextResponse.json({ error: 'Text parameter required' }, { status: 400 })
    }

    const pngBuffer = await QRCode.toBuffer(text, {
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return new NextResponse(pngBuffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 })
  }
}
