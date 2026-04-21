import AdminLayout from '@/components/AdminLayout'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock, Filter } from 'lucide-react'

async function getPayments(limit: number = 100) {
  const payments = await prisma.payment.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      package: { select: { name: true } }
    }
  })

  return payments
}

export default async function PaymentsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; method?: string }>
}) {
  const params = await searchParams
  const payments = await getPayments()

  const filtered = payments.filter(p => {
    if (params.status && p.status !== params.status) return false
    if (params.method && p.method !== params.method) return false
    return true
  })

  const stats = {
    total: payments.length,
    completed: payments.filter(p => p.status === 'COMPLETED').length,
    pending: payments.filter(p => p.status === 'PENDING').length,
    failed: payments.filter(p => p.status === 'FAILED').length,
    revenue: payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Payments</h1>
            <p className="text-gray-400">Transaction history and revenue tracking</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Revenue" value={formatCurrency(stats.revenue)} icon={DollarSign} color="text-green-400" />
          <StatCard label="Transactions" value={stats.total.toString()} icon={CreditCard} color="text-blue-400" />
          <StatCard label="Completed" value={stats.completed.toString()} icon={CheckCircle} color="text-green-400" />
          <StatCard label="Pending" value={stats.pending.toString()} icon={Clock} color="text-yellow-400" />
          <StatCard label="Failed" value={stats.failed.toString()} icon={XCircle} color="text-red-400" />
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <form className="flex flex-wrap gap-3">
            <select
              name="status"
              defaultValue={params.status || ''}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            <select
              name="method"
              defaultValue={params.method || ''}
              className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">All Methods</option>
              <option value="STRIPE">Stripe</option>
              <option value="MPESA">M-Pesa</option>
              <option value="VOUCHER">Voucher</option>
              <option value="MANUAL">Manual</option>
            </select>
          </form>
        </div>

        {/* Payments Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Package</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filtered.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs text-gray-400 font-mono">
                        {payment.id.slice(0, 8)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {payment.user?.name || 'Guest'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {payment.package?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                        {payment.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                      {formatDateTime(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">No payments found</div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

function StatCard({ label, value, icon: Icon, color }: { 
  label: string
  value: string
  icon: any
  color: string
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: 'bg-green-500/20 text-green-300',
    PENDING: 'bg-yellow-500/20 text-yellow-300',
    FAILED: 'bg-red-500/20 text-red-300',
    REFUNDED: 'bg-purple-500/20 text-purple-300'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-500/20 text-gray-300'}`}>
      {status}
    </span>
  )
}
