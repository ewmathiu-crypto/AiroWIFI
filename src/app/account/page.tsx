'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { CreditCard, Activity, Wifi, Gift } from 'lucide-react'

export default function AccountPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-white">My Account</h1>
          <p className="text-gray-400">Manage your WiFi sessions and payments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Active Sessions" value="0" icon={Wifi} color="bg-cyan-500" />
          <StatCard title="Total Spent" value="$0.00" icon={CreditCard} color="bg-green-500" />
          <StatCard title="Data Used" value="0 GB" icon={Activity} color="bg-purple-500" />
          <StatCard title="Vouchers" value="0" icon={Gift} color="bg-orange-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sessions */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Sessions</h2>
              <Link href="/account/sessions" className="text-sm text-cyan-400 hover:text-cyan-300">
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
              <Link href="/account/payments" className="text-sm text-cyan-400 hover:text-cyan-300">
                View all
              </Link>
            </div>
            <div className="text-gray-400 text-sm text-center py-8">
              No payments found
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function StatCard({ title, value, icon: Icon, color }: { 
  title: string
  value: string
  icon: any
  color: string
}) {
  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}
