import { prisma } from '@/lib/prisma'
import { formatCurrency, formatBytes } from '@/lib/utils'
import Link from 'next/link'

interface Props {
  params: Promise<{ ssid: string }>
}

async function getHotspot(ssid: string) {
  const hotspot = await prisma.hotspot.findUnique({
    where: { ssid },
    include: {
      sessions: true,
      _count: { select: { sessions: true } }
    }
  })
  return hotspot
}

async function getPackages() {
  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' }
  })
  return packages
}

export default async function CaptivePortal({ params }: Props) {
  const { ssid } = await params
  const hotspot = await getHotspot(ssid)
  const packages = await getPackages()

  if (!hotspot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Network Not Found</h1>
          <p className="text-xl mb-8">This WiFi hotspot does not exist or has been deactivated.</p>
          <Link href="/" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const isConnected = true // Client-side check would go here

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-2xl font-bold">WiFi Hub</h1>
            <p className="text-sm opacity-80">High-speed Internet Access</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white text-sm">Connected to {hotspot.ssid}</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 pb-12">
        {/* Hotspot Info Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-green-300 text-sm font-medium">
                  ✓ Connected
                </div>
                <span className="text-white font-semibold text-lg">{hotspot.name}</span>
              </div>
              <p className="text-gray-300">
                {hotspot.location}, {hotspot.city}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm mb-1">Speed</p>
              <div className="flex items-center gap-1 text-white">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-bold">Up to 100 Mbps</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mb-8">
          <div className="flex border-b border-white/20">
            <button className="px-6 py-3 text-white border-b-2 border-cyan-400 font-medium">
              Internet Access
            </button>
            <Link href="/captive/voucher" className="px-6 py-3 text-gray-300 hover:text-white transition-colors">
              Use Voucher
            </Link>
            <Link href="/captive/status" className="px-6 py-3 text-gray-300 hover:text-white transition-colors">
              My Session
            </Link>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-gray-800/80 backdrop-blur rounded-xl p-6 border transition-all hover:scale-105 cursor-pointer ${
                pkg.isFeatured
                  ? 'border-cyan-500/50 ring-2 ring-cyan-500/30'
                  : 'border-gray-600 hover:border-cyan-500/30'
              }`}
            >
              {pkg.isFeatured && (
                <div className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full">
                  POPULAR
                </div>
              )}

              <h3 className="text-lg font-bold text-white mb-2">{pkg.name}</h3>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-white">{formatCurrency(pkg.price)}</span>
                {pkg.duration >= 1440 && (
                  <span className="text-gray-400">/ {pkg.duration >= 1440 ? 'mo' : 'pk'}</span>
                )}
              </div>

              <ul className="space-y-2 text-sm text-gray-300 mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {pkg.duration >= 60 ? `${pkg.duration / 60} hour${pkg.duration >= 120 ? 's' : ''}` : `${pkg.duration} min`} access
                </li>
                {pkg.dataLimit ? (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                     {formatBytes(Number(pkg.dataLimit))} data
                  </li>
                ) : (
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Unlimited data
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  High-speed connection
                </li>
              </ul>

              <Link
                href={`/captive/checkout?hotspot=${hotspot.ssid}&package=${pkg.id}`}
                className={`block w-full py-3 px-4 text-center rounded-lg font-semibold transition-all ${
                  pkg.isFeatured
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
              >
                Get Access
              </Link>
            </div>
          ))}
        </div>

        {/* Alternative Option */}
        <div className="mt-12 p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl border border-purple-500/30">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Have a voucher code?</h3>
              <p className="text-gray-300 mb-4 md:mb-0">
                Already purchased access? Redeem your voucher now.
              </p>
            </div>
            <Link
              href="/captive/voucher"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              Redeem Voucher
            </Link>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm mb-3">Secure payments via</p>
          <div className="flex items-center justify-center gap-4 text-white/50">
            <div className="px-3 py-1 bg-white/10 rounded text-sm">Stripe</div>
            <div className="px-3 py-1 bg-white/10 rounded text-sm">M-Pesa</div>
            <div className="px-3 py-1 bg-white/10 rounded text-sm">Visa</div>
            <div className="px-3 py-1 bg-white/10 rounded text-sm">Mastercard</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-gray-400 text-sm border-t border-white/10">
        <p>© 2024 WiFi Hub. All rights reserved.</p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <span>•</span>
          <Link href="/support" className="hover:text-white transition-colors">Support</Link>
        </div>
      </footer>
    </div>
  )
}
