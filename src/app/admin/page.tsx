import { prisma } from '@/lib/prisma'
import { formatBytes, formatCurrency } from '@/lib/utils'
import {
  Users,
  Wifi,
  CreditCard,
  Activity,
  TrendingUp,
  DollarSign,
  Globe,
  Settings as SettingsIcon
} from 'lucide-react'

async function getStats() {
  const [
    totalUsers,
    totalHotspots,
    activeSessions,
    todayRevenue,
    recentSessions,
    topHotspots
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.hotspot.count({ where: { isActive: true } }),
    prisma.session.count({ where: { status: 'ACTIVE' } }),
    prisma.payment.aggregate({
      where: { 
        status: 'COMPLETED',
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      },
      _sum: { amount: true }
    }),
    prisma.session.findMany({
      take: 5,
      orderBy: { startTime: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        hotspot: { select: { name: true } },
        package: true
      }
    }),
    prisma.hotspot.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        city: true,
        _count: { select: { sessions: true } }
      }
    })
  ])

  return {
    totalUsers,
    totalHotspots,
    activeSessions,
    todayRevenue: Number(todayRevenue._sum.amount || 0),
    recentSessions,
    topHotspots
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalUsers.toLocaleString(),
      change: '+12%',
      positive: true,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Hotspots',
      value: stats.totalHotspots.toLocaleString(),
      change: '+3',
      positive: true,
      icon: Wifi,
      color: 'bg-cyan-500'
    },
    {
      title: 'Active Sessions',
      value: stats.activeSessions.toLocaleString(),
      change: '+8%',
      positive: true,
      icon: Activity,
      color: 'bg-green-500'
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      change: '+24%',
      positive: true,
      icon: DollarSign,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Welcome to WiFi Hub administration</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-semibold ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Sessions</h2>
          <div className="space-y-3">
            {stats.recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <Users className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{session.user?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-400">{session.hotspot?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">
                    {session.package?.name || 'Pay-as-you-go'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {session.dataUsed ? formatBytes(Number(session.dataUsed)) : '0 B'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Hotspots */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Top Performing Hotspots</h2>
          <div className="space-y-3">
            {stats.topHotspots.map((hotspot, idx) => (
              <div key={hotspot.id} className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold">{idx + 1}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{hotspot.name}</p>
                    <p className="text-sm text-gray-400">{hotspot.city}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{hotspot._count.sessions} sessions</p>
                  <p className="text-sm text-gray-400">Total</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/admin/hotspots/new"
            className="flex flex-col items-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Wifi className="w-6 h-6 text-cyan-400" />
            <span className="text-sm text-gray-300">Add Hotspot</span>
          </a>
          <a
            href="/admin/vouchers"
            className="flex flex-col items-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <CreditCard className="w-6 h-6 text-purple-400" />
            <span className="text-sm text-gray-300">Generate Voucher</span>
          </a>
          <a
            href="/admin/analytics"
            className="flex flex-col items-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <TrendingUp className="w-6 h-6 text-green-400" />
            <span className="text-sm text-gray-300">View Reports</span>
          </a>
          <a
            href="/admin/settings"
            className="flex flex-col items-center gap-2 p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <SettingsIcon className="w-6 h-6 text-yellow-400" />
            <span className="text-sm text-gray-300">Configure API</span>
          </a>
        </div>
      </div>
    </div>
  )
}
