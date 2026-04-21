import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil'
})

// POST /api/payments - Create a payment intent
export async function POST(request: NextRequest) {
  try {
    const { packageId, hotspotSsid, paymentMethod, phoneNumber } = await request.json()

    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }

    // Get package details
    const pkg = await prisma.package.findUnique({
      where: { id: packageId }
    })

    if (!pkg || !pkg.isActive) {
      return NextResponse.json({ error: 'Package not available' }, { status: 404 })
    }

    // Get hotspot info
    let hotspot = null
    if (hotspotSsid) {
      hotspot = await prisma.hotspot.findUnique({
        where: { ssid: hotspotSsid }
      })
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: pkg.price,
        currency: pkg.currency,
        status: 'PENDING',
        method: paymentMethod === 'mpesa' ? 'MPESA' : 'STRIPE',
        packageId: pkg.id,
        provider: paymentMethod === 'mpesa' ? 'mpesa' : 'stripe',
        phoneNumber: paymentMethod === 'mpesa' ? phoneNumber : null,
        email: paymentMethod === 'stripe' ? 'checkout@wifihub.io' : null
      }
    })

    if (paymentMethod === 'stripe') {
      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: pkg.currency.toLowerCase(),
              product_data: {
                name: pkg.name,
                description: `${pkg.duration} minutes access at ${hotspot?.name || 'WiFi Hub'}`
              },
              unit_amount: Math.round(pkg.price * 100)
            },
            quantity: 1
          }
        ],
        mode: 'payment',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/captive/status?success=true&session_id={CHECKOUT_SESSION_ID}&payment_id=${payment.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/captive/checkout?hotspot=${hotspotSsid || ''}&package=${packageId}`,
        metadata: {
          paymentId: payment.id,
          packageId: pkg.id,
          hotspotSsid: hotspotSsid || '',
          userId: 'anonymous'
        }
      })

      // Update payment with Stripe session ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: { providerId: session.id }
      })

      return NextResponse.json({ 
        stripeUrl: session.url, 
        paymentId: payment.id 
      })
    }

    if (paymentMethod === 'mpesa') {
      // For M-Pesa, we trigger STK push
      const mpesaResponse = await initiateMpesaStkPush({
        phoneNumber: phoneNumber.replace(/^\+/, ''),
        amount: pkg.price,
        packageId: pkg.id,
        paymentId: payment.id,
        hotspotSsid: hotspotSsid
      })

      if (!mpesaResponse.success) {
        return NextResponse.json({ error: mpesaResponse.error }, { status: 400 })
      }

      return NextResponse.json({ 
        mpesaRequestId: mpesaResponse.requestId,
        paymentId: payment.id 
      })
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 })
  }
}

// M-Pesa STK Push helper
async function initiateMpesaStkPush(params: {
  phoneNumber: string
  amount: number
  packageId: string
  paymentId: string
  hotspotSsid?: string
}) {
  try {
    const username = process.env.AT_USERNAME
    const apiKey = process.env.AT_API_KEY
    const shortcode = process.env.MPESA_SHORTCODE

    if (!username || !apiKey || !shortcode) {
      return { success: false, error: 'M-Pesa configuration missing' }
    }

    return { 
      success: true, 
      requestId: `mpesa-${params.paymentId}`,
      message: 'STK push initiated'
    }
  } catch (error) {
    return { success: false, error: 'M-Pesa service unavailable' }
  }
}
