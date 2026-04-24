import { Suspense } from 'react'
import StatusForm from '@/components/status-form'

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-full mb-4">
          <div className="w-5 h-5 text-yellow-400 animate-spin" />
        </div>
        <h1 className="text-3xl font-bold text-white">Processing Payment</h1>
        <p className="text-lg text-gray-300">
          We&apos;re processing your payment. Please wait a moment...
        </p>
      </div>
    </div>}>
      <StatusForm />
    </Suspense>
  )
}