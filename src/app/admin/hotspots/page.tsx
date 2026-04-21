import AdminLayout from '@/components/AdminLayout'
import { prisma } from '@/lib/prisma'
import { formatBytes, formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Edit, Trash2, Wifi, User, Clock, DollarSign } from 'lucide-react'

async function getHotspots() {
  const hotspots = await prisma.hotspot.findMany({
    include: {
      _count: { select: { sessions: true } }
    },
    orderBy: { isActive: 'desc' }
  })

  return hotspots
}

export default async function HotspotsPage() {
  const hotspots = await getHotspots()

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Hotspots</h1>
            <p className="text-gray-400">Manage your WiFi hotspot locations</p>
          </div>
          <Link
            href="/admin/hotspots/new"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Hotspot
          </Link>
        </div>

        {/* Hotspots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotspots.map((hotspot) => (
            <div key={hotspot.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-cyan-500/50 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                    <Wifi className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{hotspot.name}</h3>
                    <p className="text-sm text-gray-400">SSID: {hotspot.ssid}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${hotspot.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {hotspot.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-300 mb-4">
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  {hotspot.location}, {hotspot.city}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  {hotspot._count.sessions} total sessions
                </p>
                <p className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  {formatCurrency(hotspot.pricePerHour)}/hr
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/admin/hotspots/${hotspot.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Link>
                <Link
                  href={`/captive?hotspot=${hotspot.ssid}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                >
                  <Wifi className="w-4 h-4" />
                  Preview
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
