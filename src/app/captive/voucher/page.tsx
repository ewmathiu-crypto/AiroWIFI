import { Suspense } from 'react'
import VoucherForm from '@/components/voucher-form'

export default function VoucherPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="text-white text-xl animate-pulse">Loading...</div>
    </div>}>
      <VoucherForm />
    </Suspense>
  )
}