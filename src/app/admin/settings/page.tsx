'use client'

import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Save, Key, Mail, CreditCard, Smartphone, Globe } from 'lucide-react'

export default function SettingsPage() {
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('api')

  const handleSave = async () => {
    await fetch('/api/admin/settings', { method: 'POST' })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Configure platform integrations</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'api', label: 'API Keys', icon: Key },
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'sms', label: 'SMS/USSD', icon: Smartphone },
            { id: 'general', label: 'General', icon: Globe }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-cyan-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          {activeTab === 'api' && <ApiKeysSettings />}
          {activeTab === 'email' && <EmailSettings />}
          {activeTab === 'payments' && <PaymentSettings />}
          {activeTab === 'sms' && <SmsSettings />}
          {activeTab === 'general' && <GeneralSettings />}
        </div>

        {saved && (
          <div className="fixed bottom-4 right-4 px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg">
            Settings saved successfully!
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function ApiKeysSettings() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">API Configuration</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Stripe Secret Key</label>
        <input
          type="password"
          placeholder="sk_live_..."
          defaultValue={process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <p className="text-xs text-gray-400 mt-1">Found in Stripe Dashboard → Developers → API Keys</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Stripe Public Key</label>
        <input
          type="text"
          placeholder="pk_live_..."
          defaultValue={process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Stripe Webhook Secret</label>
        <input
          type="password"
          placeholder="whsec_..."
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <p className="text-xs text-gray-400 mt-1">
          <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
            Configure webhook endpoint: {typeof window !== 'undefined' ? window.location.origin : ''}/api/payments/webhook
          </a>
        </p>
      </div>
    </div>
  )
}

function EmailSettings() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Email (SMTP)</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Host</label>
        <input
          type="text"
          placeholder="smtp.gmail.com"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Port</label>
          <input
            type="number"
            placeholder="587"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Secure (TLS)</label>
          <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Username</label>
        <input
          type="email"
          placeholder="your-email@gmail.com"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">SMTP Password / App Password</label>
        <input
          type="password"
          placeholder="Your app password"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <p className="text-xs text-gray-400 mt-1">For Gmail, use an App Password (2FA required)</p>
      </div>

      <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm">
        Send Test Email
      </button>
    </div>
  )
}

function PaymentSettings() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Payment Providers</h3>
      
      <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-white">Stripe</span>
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
        </div>
        <p className="text-sm text-gray-400">Accept credit/debit cards globally</p>
      </div>

      <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone className="w-5 h-5 text-green-400" />
          <span className="font-medium text-white">M-Pesa (Africa&apos;s Talking)</span>
          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">Pending Setup</span>
        </div>
        <p className="text-sm text-gray-400">Mobile money for Kenya, Tanzania, Uganda</p>
        <div className="mt-3 space-y-2">
          <input
            type="text"
            placeholder="AT Username"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="AT API Key"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
          />
          <input
            type="text"
            placeholder="M-Pesa Shortcode"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  )
}

function SmsSettings() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">SMS & USSD</h3>
      
      <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone className="w-5 h-5 text-green-400" />
           <span className="font-medium text-white">Africa&apos;s Talking</span>
        </div>
        <p className="text-sm text-gray-400">Send SMS and handle USSD for M-Pesa</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
        <input
          type="password"
          placeholder="your-api-key"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
        <input
          type="text"
          placeholder="your-username"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Default Sender ID</label>
        <input
          type="text"
          placeholder="WiFiHub"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          maxLength={11}
        />
      </div>
    </div>
  )
}

function GeneralSettings() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">General Configuration</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Platform Name</label>
        <input
          type="text"
          defaultValue="WiFi Hub"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Support Email</label>
        <input
          type="email"
          defaultValue="support@wifihub.io"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Default Currency</label>
        <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
          <option value="USD">USD ($)</option>
          <option value="KES">KES (KSh)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-gray-300">
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
          <span>Enable new user registration</span>
        </label>
      </div>

      <div>
        <label className="flex items-center gap-2 text-gray-300">
          <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
          <span>Send email receipts</span>
        </label>
      </div>
    </div>
  )
}
