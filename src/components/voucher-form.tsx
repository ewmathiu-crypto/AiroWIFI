'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Gift, CheckCircle, AlertCircle } from 'lucide-react'

export default function VoucherForm() {
  const [voucherCode, setVoucherCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/vouchers/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherCode })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'Voucher redeemed successfully! Redirecting...' })
        setTimeout(() => {
          window.location.href = '/captive/status'
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || 'Invalid voucher' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-2xl font-bold">WiFi Hub</h1>
            <p className="text-sm opacity-80">Voucher Redemption</p>
          </div>
          <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm">
            ← Back to packages
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 pb-12">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/30 border border-purple-500/50 mb-4">
              <Gift className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Redeem Voucher</h2>
            <p className="text-gray-300">Enter your voucher code to activate your WiFi access</p>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-500/20 border border-green-500/50 text-green-200' 
                : 'bg-red-500/20 border border-red-500/50 text-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voucher Code
              </label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase tracking-widest text-center text-lg"
                placeholder="WIFI-XXXXX-XXXXX"
                required
              />
               <p className="text-xs text-gray-400 mt-2 text-center">
                 Typically starts with &quot;WIFI-&quot; followed by 8-12 characters
               </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Redeeming...' : 'Redeem Voucher'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <h3 className="text-white font-semibold mb-3 text-center">Don't have a voucher?</h3>
            <Link
              href="/"
              className="block w-full py-3 px-4 text-center bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Purchase a Package
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}