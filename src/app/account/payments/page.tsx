'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CreditCard, DollarSign, CheckCircle, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  method: string
  createdAt: string
  package: { name: string } | null
}

export default function PaymentsPage() {
  const { data: session, status } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login')
    }
  }, [status])

  useEffect(() => {
    if (session?.user) {
      fetch(`/api/payments?userId=${(session.user as any).id}`)
        .then(res => res.json())
        .then(data => {
          setPayments(data)
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
          <h1 className="text-2xl font-bold text-white">Payment History</h1>
          <p className="text-gray-400">Your transaction records</p>
        </div>

        {payments.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
            <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No payments yet</h3>
            <p className="text-gray-400 mb-6">Purchase a WiFi package to get started</p>
            <Link href="/" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors inline-flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              View Packages
            </Link>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                        {formatDateTime(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white">
                        {payment.package?.name || 'Session'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                          {payment.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentStatusBadge status={payment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: any }> = {
    COMPLETED: { bg: 'bg-green-500/20', text: 'text-green-400', icon: CheckCircle },
    PENDING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: null },
    FAILED: { bg: 'bg-red-500/20', text: 'text-red-400', icon: XCircle }
  }

  const cfg = config[status] || { bg: 'bg-gray-500/20', text: 'text-gray-400', icon: null }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {status}
    </span>
  )
}
