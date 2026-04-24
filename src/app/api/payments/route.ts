import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/payments - List payments (filter by userId, status, method)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const limit = parseInt(searchParams.get('limit') || '100')

    const where: any = {}
    if (userId) where.userId = userId
    if (status) where.status = status
    if (method) where.method = method

    const payments = await prisma.payment.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        package: { select: { name: true } }
      }
    })

    return NextResponse.json(payments)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST /api/payments - Create payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { packageId, hotspotSsid, paymentMethod, phoneNumber } = body
    
    // Validate required fields
    if (!packageId) {
      return NextResponse.json({ error: 'Package ID is required' }, { status: 400 })
    }
    
    if (!paymentMethod || !['stripe', 'mpesa'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Valid payment method is required (stripe or mpesa)' }, { status: 400 })
    }
    
    // For M-Pesa, phone number is required
    if (paymentMethod === 'mpesa' && !phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required for M-Pesa payments' }, { status: 400 })
    }
    
    // Validate package exists and is active
    const pkg = await prisma.package.findUnique({ where: { id: packageId } })
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }
    
    if (!pkg.isActive) {
      return NextResponse.json({ error: 'Package is not available' }, { status: 400 })
    }
    
    // Validate price is a positive number
    if (typeof pkg.price !== 'number' || pkg.price <= 0) {
      return NextResponse.json({ error: 'Invalid package pricing' }, { status: 400 })
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
        email: paymentMethod === 'stripe' ? 'checkout@wifihub.io' : null,
        // Store hotspot info in metadata for later session creation
        metadata: {
          hotspotSsid: hotspotSsid || null
        }
      }
    })

    let paymentResponse: {
      paymentId: string;
      amount: number;
      stripeSessionId?: string;
      stripeUrl?: string;
      mpesaTransactionId?: string;
    } = { paymentId: payment.id, amount: pkg.price }

    // For Stripe, create checkout session
    if (paymentMethod === 'stripe') {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: pkg.currency.toLowerCase(),
              product_data: {
                name: pkg.name,
                description: pkg.description || 'WiFi Access Package'
              },
              unit_amount: Math.round(pkg.price * 100), // Convert to cents
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/captive/${hotspotSsid || 'wifi'}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/captive/${hotspotSsid || 'wifi'}?canceled=1`,
          metadata: {
            paymentId: payment.id
          }
        })
        
        paymentResponse = { 
          paymentId: payment.id, 
          amount: pkg.price,
          stripeSessionId: session.id,
          stripeUrl: session.url
        }
      } catch (stripeError) {
        console.error('Stripe error:', stripeError)
        // Update payment status to failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        })
        return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 })
      }
    }
    
    // For M-Pesa, initiate STK push
    if (paymentMethod === 'mpesa') {
      try {
        const { initiateMpesaPayment } = require('@/lib/africasTalking')
        const result = await initiateMpesaPayment({
          phoneNumber,
          amount: pkg.price,
          metadata: { 
            paymentId: payment.id,
            hotspotSsid: hotspotSsid || undefined,
            packageId: pkg.id
          }
        })
        
        // Update payment with provider transaction ID
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            providerId: result.transactionId,
            status: 'PENDING' // M-Pesa is still pending until user confirms
          }
        })
        
        paymentResponse = { 
          paymentId: payment.id, 
          amount: pkg.price,
          mpesaTransactionId: result.transactionId
        }
      } catch (mpesaError) {
        console.error('M-Pesa error:', mpesaError)
        // Update payment status to failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' }
        })
        return NextResponse.json({ error: 'Failed to initiate M-Pesa payment' }, { status: 500 })
      }
    }

    return NextResponse.json(paymentResponse)
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
