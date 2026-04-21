'use client'

import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Edit, Trash2, Clock, HardDrive, DollarSign, Star, CheckCircle, XCircle } from 'lucide-react'

export default function PackagesPage() {
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPkg, setEditingPkg] = useState<any>(null)

  const fetchPackages = async () => {
    const res = await fetch('/api/packages')
    const data = await res.json()
    setPackages(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      duration: parseInt(formData.get('duration') as string),
      dataLimit: formData.get('dataLimit') ? BigInt(formData.get('dataLimit') as string) : null,
      price: parseFloat(formData.get('price') as string),
      isActive: formData.get('isActive') === 'on',
      isFeatured: formData.get('isFeatured') === 'on'
    }

    const url = editingPkg ? `/api/packages/${editingPkg.id}` : '/api/packages'
    const method = editingPkg ? 'PATCH' : 'POST'

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    setShowModal(false)
    setEditingPkg(null)
    fetchPackages()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package?')) return
    await fetch(`/api/packages/${id}`, { method: 'DELETE' })
    fetchPackages()
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Packages</h1>
            <p className="text-gray-400">Manage WiFi pricing plans</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Package
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-cyan-500/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{pkg.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{pkg.description}</p>
                  </div>
                  <div className="flex gap-1">
                    {pkg.isFeatured && (
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    )}
                    {pkg.isActive ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Duration
                    </span>
                    <span className="text-white font-medium">{pkg.duration} min</span>
                  </div>
                  {pkg.dataLimit && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center gap-2">
                        <HardDrive className="w-4 h-4" />
                        Data
                      </span>
                      <span className="text-white font-medium">
                        {(Number(pkg.dataLimit) / 1024 / 1024 / 1024).toFixed(1)} GB
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Price
                    </span>
                    <span className="text-white font-bold text-lg">${pkg.price.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingPkg(pkg); setShowModal(true) }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <PackageModal
            pkg={editingPkg}
            onClose={() => { setShowModal(false); setEditingPkg(null) }}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </AdminLayout>
  )
}

function PackageModal({ pkg, onClose, onSubmit }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">
          {pkg ? 'Edit Package' : 'Create Package'}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
            <input
              name="name"
              required
              defaultValue={pkg?.name}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              rows={2}
              defaultValue={pkg?.description || ''}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration (min) *</label>
              <input
                name="duration"
                type="number"
                required
                defaultValue={pkg?.duration || 60}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data Limit (GB, optional)</label>
              <input
                name="dataLimit"
                type="number"
                step="0.1"
                placeholder="Unlimited"
                defaultValue={pkg?.dataLimit ? Number(pkg.dataLimit) / 1024 / 1024 / 1024 : ''}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Price (USD) *</label>
            <input
              name="price"
              type="number"
              step="0.01"
              required
              defaultValue={pkg?.price || 0}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                name="isActive"
                type="checkbox"
                defaultChecked={pkg?.isActive ?? true}
                className="w-4 h-4 rounded"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-gray-300">
              <input
                name="isFeatured"
                type="checkbox"
                defaultChecked={pkg?.isFeatured || false}
                className="w-4 h-4 rounded"
              />
              Featured
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition-colors"
            >
              {pkg ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
