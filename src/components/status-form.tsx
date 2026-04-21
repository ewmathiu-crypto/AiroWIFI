'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function StatusForm() {
  const searchParams = useSearchParams()
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setSuccess(searchParams.get('success') === 'true')
  }, [searchParams])

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center w-20 h-20 bg-green-500/20 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Payment Successful!</h1>
          <p className="text-lg text-gray-300">
            Your WiFi access has been activated. You can now connect to the internet.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    )
  } else {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center w-20 h-20 bg-yellow-500/20 rounded-full mb-4">
            <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-white">Processing Payment</h1>
          <p className="text-lg text-gray-300">
            We're processing your payment. Please wait a moment...
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }
}