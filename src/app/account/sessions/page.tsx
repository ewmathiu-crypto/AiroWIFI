'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { formatBytes, formatCurrency, formatDateTime } from '@/lib/utils'
import { Wifi, Clock, DollarSign, HardDrive } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Session {
  id: string
  startTime: string
  endTime: string | null
  duration: number | null
  dataUsed: string | null
  status: string
  bytesIn: string | null
  bytesOut: string | null
  charged: number | null
  hotspot: { name: string; ssid: string; }
  package: { name: string; } | null;
}

export default function SessionsPage() {
  const { data: session, status } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
  }, [status])

  useEffect(() => {
    if (session?.user) {
      fetch(`/api/sessions?userId=${(session.user as any).id}`)
        .then(res => res.json())
        .then(data => {
          setSessions(data)
          setLoading(false)
        })
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-white">My Sessions</h1>
          <p className="text-gray-400">View your WiFi connection history</p>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
            <Wifi className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No sessions yet</h3>
            <p className="text-gray-400 mb-6">Connect to a WiFi hotspot to get started</p>
            <Link href="/" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors inline-flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Browse Hotspots
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="w-5 h-5 text-cyan-400" />
                      <h3 className="font-semibold text-white">{session.hotspot.name}</h3>
                      <span className="text-sm text-gray-400">({session.hotspot.ssid})</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {formatDateTime(session.startTime)}
                        {session.endTime && ` → ${formatDateTime(session.endTime)}`}
                      </span>
                      {session.duration && (
                        <span className="flex items-center gap-1">
                          Duration: {Math.floor(session.duration / 60)}m {session.duration % 60}s
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      session.status === 'ACTIVE' 
                        ? 'bg-green-500/20 text-green-400' 
                        : session.status === 'COMPLETED'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {session.status}
                    </div>
                    {session.package?.name && (
                      <p className="text-sm text-cyan-400 mt-2">{session.package.name}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 flex items-center gap-1 mb-1">
                      <HardDrive className="w-4 h-4" />
                      Data Used
                    </p>
                    <p className="text-white font-medium">
                      {formatBytes(Number(session.dataUsed || 0))}
                      <span className="text-gray-500 text-xs ml-1">
                        (↓{formatBytes(Number(session.bytesIn || 0))} ↑{formatBytes(Number(session.bytesOut || 0))})
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Charged</p>
                    <p className="text-white font-medium flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      {session.charged?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
