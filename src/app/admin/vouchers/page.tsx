import AdminLayout from '@/components/AdminLayout'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { Search, Download, Eye, Trash2, CheckCircle, XCircle, QrCode, Copy } from 'lucide-react'

async function getVouchers(search: string = '', status: string = '') {
  const where: any = {}
  
  if (search) {
    where.OR = [
      { code: { contains: search.toUpperCase() } },
      { notes: { contains: search } }
    ]
  }
  
  if (status === 'active') where.isActive = true
  if (status === 'inactive') where.isActive = false
  if (status === 'expired') where.expiresAt = { lt: new Date() }
  if (status === 'used') where.usedCount = { gt: 0 }

  const vouchers = await prisma.voucher.findMany({
    where,
    take: 200,
    orderBy: { createdAt: 'desc' },
    include: {
      package: true,
      user: { select: { name: true, email: true } }
    }
  })

  return vouchers
}

async function getPackages() {
  return await prisma.package.findMany({
    select: { id: true, name: true }
  })
}

export default async function VouchersPage({
  searchParams
}: {
  searchParams: Promise<{ search?: string; status?: string; package?: string }>
}) {
  const params = await searchParams
  const vouchers = await getVouchers(params.search || '', params.status || '')
  const packages = await getPackages()

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => v.isActive && (!v.expiresAt || v.expiresAt > new Date())).length,
    used: vouchers.filter(v => v.usedCount >= v.maxUses).length,
    expired: vouchers.filter(v => v.expiresAt && v.expiresAt < new Date()).length
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Vouchers</h1>
            <p className="text-gray-400">Manage prepaid WiFi access codes</p>
          </div>
          <Link
            href="/admin/vouchers/generate"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
          >
            <QrCode className="w-5 h-5" />
            Generate Vouchers
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} color="text-blue-400" />
          <StatCard label="Active" value={stats.active} color="text-green-400" />
          <StatCard label="Used" value={stats.used} color="text-yellow-400" />
          <StatCard label="Expired" value={stats.expired} color="text-red-400" />
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <form className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  name="search"
                  defaultValue={params.search || ''}
                  placeholder="Search voucher code..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <select
              name="status"
              defaultValue={params.status || ''}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="used">Used</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              name="package"
              defaultValue={params.package || ''}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Packages</option>
              {packages.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              Filter
            </button>

            <Link
              href="/admin/vouchers"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Clear
            </Link>
          </form>
        </div>

        {/* Vouchers Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="px-2 py-1 bg-gray-900 rounded text-cyan-400 font-mono text-sm">
                        {voucher.code}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {voucher.package.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {voucher.duration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <VoucherStatusBadge voucher={voucher} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                      {formatDateTime(voucher.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/api/qrcode?text=WIFI:S:${voucher.code};T:WPA;P:${voucher.package.name};;`}
                          target="_blank"
                          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                          title="View QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </Link>
                        <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors" title="Copy">
                          <CopyButton text={voucher.code} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {vouchers.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No vouchers found. Generate some vouchers to get started.
            </div>
          )}
        </div>

        {/* Pagination placeholder */}
        {vouchers.length > 0 && (
          <div className="flex items-center justify-between text-sm text-gray-400">
            <p>Showing {vouchers.length} vouchers</p>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50">Previous</button>
              <button className="px-3 py-1 bg-cyan-600 rounded">1</button>
              <button disabled className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function VoucherStatusBadge({ voucher }: { voucher: any }) {
  let status = { label: 'Unknown', color: 'bg-gray-500/20 text-gray-400' }

  if (voucher.usedCount >= voucher.maxUses) {
    status = { label: 'Used', color: 'bg-red-500/20 text-red-400' }
  } else if (voucher.expiresAt && new Date() > voucher.expiresAt) {
    status = { label: 'Expired', color: 'bg-orange-500/20 text-orange-400' }
  } else if (!voucher.isActive) {
    status = { label: 'Inactive', color: 'bg-gray-500/20 text-gray-400' }
  } else {
    status = { label: 'Active', color: 'bg-green-500/20 text-green-400' }
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
      {status.label}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      title="Copy to clipboard"
    >
      <Copy className="w-4 h-4" />
    </button>
  )
}
