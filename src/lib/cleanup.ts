import { prisma } from '@/lib/prisma'

/**
 * Cleanup job for expired/inactive sessions
 * Run this periodically (every 5-15 minutes) via cron or scheduled task
 */
export async function cleanupSessions() {
  console.log('🧹 Starting session cleanup...')
  
  const now = new Date()
  let cleaned = 0

  // Mark sessions as expired if endTime is in the past and status is still ACTIVE
  const expired = await prisma.session.updateMany({
    where: {
      status: 'ACTIVE',
      endTime: { lt: now }
    },
    data: { status: 'COMPLETED' }
  })
  
  cleaned += expired.count

  // Terminate sessions that have been ACTIVE for too long (safety net)
  const maxSessionHours = 24
  const cutoff = new Date(now.getTime() - maxSessionHours * 60 * 60 * 1000)
  
  const stale = await prisma.session.updateMany({
    where: {
      status: 'ACTIVE',
      startTime: { lt: cutoff }
    },
    data: { 
      status: 'TERMINATED',
      endTime: now
    }
  })
  
  cleaned += stale.count

  console.log(`✅ Cleaned ${cleaned} stale sessions`)
  return { expired: expired.count, stale: stale.count, total: cleaned }
}

/**
 * Clean up old analytics data (keep last 90 days)
 */
export async function cleanupAnalytics() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  
  const result = await prisma.analytics.deleteMany({
    where: { date: { lt: cutoff } }
  })
  
  console.log(`✅ Cleaned ${result.count} old analytics records`)
  return result.count
}

/**
 * Archive completed sessions older than 30 days to history table (if needed)
 */
export async function archiveOldSessions() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  
  // For now, just log
  const oldSessions = await prisma.session.count({
    where: {
      status: 'COMPLETED',
      endTime: { lt: cutoff }
    }
  })
  
  console.log(`📦 ${oldSessions} sessions older than 30 days (consider archiving)`)
  return oldSessions
}

// Run all cleanup tasks
export async function runCleanup() {
  try {
    const results = await Promise.all([
      cleanupSessions(),
      cleanupAnalytics(),
      archiveOldSessions()
    ])
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      results
    }
  } catch (error) {
    console.error('Cleanup failed:', error)
    return {
      success: false,
      error: (error as Error).message
    }
  }
}
