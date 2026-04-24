'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CreditCard, Smartphone, CheckCircle } from 'lucide-react'

export default function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'mpesa'>('stripe')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('')
  const [hotspot, setHotspot] = useState<any>(null)
  const [pkg, setPkg] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const ssid = searchParams.get('hotspot') || ''
    const packageId = searchParams.get('package') || ''

    // Reset data when params change
    setHotspot(null)
    setPkg(null)
    setIsLoadingData(true)

    // Fetch hotspot and package details
    const fetchData = async () => {
      try {
        if (ssid) {
          const hotspotRes = await fetch(`/api/hotspots?ssid=${ssid}`)
          if (hotspotRes.ok) {
            const hotspotData = await hotspotRes.json()
            setHotspot(Array.isArray(hotspotData) && hotspotData.length > 0 
              ? hotspotData[0] 
              : hotspotData)
          }
        }
        
        if (packageId) {
          const packageRes = await fetch(`/api/packages/${packageId}`)
          if (packageRes.ok) {
            const packageData = await packageRes.json()
            setPkg(packageData)
          }
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: searchParams.get('package'),
          hotspotSsid: searchParams.get('hotspot'),
          paymentMethod,
          phoneNumber: paymentMethod === 'mpesa' ? phoneNumber : undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        router.push('/captive/status?success=true')
      } else {
        setMessage(data.error || 'Payment failed')
      }
    } catch (err) {
      setMessage('Network error')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    )
  }

  // Show error if hotspot or package not found
  if (!hotspot || !pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold">Error Loading Page</h1>
          <p className="text-sm">Please check the hotspot and package parameters.</p>
          <Link href="/" className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <header className="py-6 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-2xl font-bold">WiFi Hub</h1>
            <p className="text-sm opacity-80">Secure Checkout</p>
          </div>
          <Link href={`/?hotspot=${searchParams.get('hotspot')}`} className="text-gray-300 hover:text-white transition-colors text-sm">
            ← Cancel
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Complete Your Purchase</h2>

          {/* Order Summary */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
            <h3 className="text-white font-semibold mb-4">Order Summary</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">{pkg.name}</span>
              <span className="text-white font-medium">${pkg.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Duration</span>
              <span className="text-white">{pkg.duration} mins</span>
            </div>
            {pkg.dataLimit && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300">Data Limit</span>
                <span className="text-white">{(pkg.dataLimit / 1024 / 1024 / 1024).toFixed(1)} GB</span>
              </div>
            )}
            <div className="border-t border-gray-700 pt-4 mt-4 flex justify-between items-center">
              <span className="text-white font-bold">Total</span>
              <span className="text-2xl font-bold text-cyan-400">${pkg.price.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-8">
            <h3 className="text-white font-semibold mb-4">Payment Method</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className={`w-5 h-5 ${paymentMethod === 'stripe' ? 'text-blue-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${paymentMethod === 'stripe' ? 'text-white' : 'text-gray-400'}`}>
                    Credit Card
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Visa, Mastercard</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('mpesa')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === 'mpesa'
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className={`w-5 h-5 ${paymentMethod === 'mpesa' ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className={`font-medium ${paymentMethod === 'mpesa' ? 'text-white' : 'text-gray-400'}`}>
                    M-Pesa
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Mobile Money</p>
              </button>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {paymentMethod === 'mpesa' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  You&apos;ll receive an STK push to complete payment
                </p>
              </div>
            )}

            {paymentMethod === 'stripe' && (
              <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
                <div className="text-center text-gray-300 mb-4">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-blue-400" />
                  <p>Stripe Checkout will open in a new window</p>
                  <p className="text-sm">Accepting Visa, Mastercard, Apple Pay</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Secure 256-bit SSL encryption</span>
                </div>
              </div>
            )}

            {message && (
              <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                {message}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? 'Processing...' : `Pay $${pkg.price.toFixed(2)}`}
              </button>
              <Link
                href={`/?hotspot=${searchParams.get('hotspot')}`}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>

          <p className="mt-6 text-xs text-gray-400 text-center">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </main>
    </div>
  )
}