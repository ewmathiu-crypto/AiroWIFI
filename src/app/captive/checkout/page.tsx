import { Suspense } from 'react'
import CheckoutForm from '@/components/checkout-form'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="text-white text-xl animate-pulse">Loading...</div>
    </div>}>
      <CheckoutForm />
    </Suspense>
  )
}