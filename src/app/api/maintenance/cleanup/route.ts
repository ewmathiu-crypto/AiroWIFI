import { NextRequest, NextResponse } from 'next/server'

export async function POST() {
  try {
    // Run cleanup tasks
    const result = await import('@/lib/cleanup').then(m => m.runCleanup())
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Cleanup failed' }, 
      { status: 500 }
    )
  }
}
