'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { CreditCard, Activity, Wifi, Gift, Receipt, History, User, Settings } from 'lucide-react'

export default function AccountPage() {
  const { data: session, status } = useSession()

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  if (status === 'loading') {
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
        {/* Header */}
        <div className="border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-white">My Account</h1>
          <p className="text-gray-400">Welcome, {(session?.user as any)?.name || 'User'}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/account/sessions" className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-cyan-500/20 rounded-lg">
                <Wifi className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Active Sessions</h3>
            <p className="text-2xl font-bold text-white">1</p>
          </Link>

          <Link href="/account/payments" className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <Receipt className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Total Spent</h3>
            <p className="text-2xl font-bold text-white">$0.00</p>
          </Link>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Data Used</h3>
            <p className="text-2xl font-bold text-white">0 GB</p>
          </div>

          <Link href="/account/vouchers" className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-yellow-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Gift className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Vouchers</h3>
            <p className="text-2xl font-bold text-white">0</p>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Sessions */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
              <Link href="/account/sessions" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <History className="w-4 h-4" />
                View all
              </Link>
            </div>
            <div className="text-gray-400 text-sm text-center py-8">
              No recent sessions found
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Payment History</h2>
              <Link href="/account/payments" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <Receipt className="w-4 h-4" />
                View all
              </Link>
            </div>
            <div className="text-gray-400 text-sm text-center py-8">
              No payments found
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/account/profile"
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300 hover:text-white flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5" />
              Edit Profile
            </Link>
            <Link
              href="/account/vouchers"
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300 hover:text-white flex items-center justify-center gap-2"
            >
              <Gift className="w-5 h-5" />
              My Vouchers
            </Link>
            <button
              onClick={() => {}}
              className="p-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
