import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { sendPaymentReceipt } from '@/lib/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil'
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session
      
      const paymentId = session.metadata?.paymentId
      if (paymentId) {
        // Update payment status
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'COMPLETED',
            providerId: session.id,
            provider: 'stripe'
          }
        })

        // Get payment with relations
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId },
          include: { package: true, user: true }
        })

        if (payment && payment.user?.email) {
          // Send receipt email
          await sendPaymentReceipt({
            email: payment.user.email,
            userName: payment.user.name || 'Valued Customer',
            amount: payment.amount,
            packageName: payment.package?.name || 'WiFi Package',
            paymentId: payment.id
          })
        }

        // Create session if needed (for direct session activation)
        if (session.metadata?.packageId && session.metadata?.hotspotSsid) {
          const existingSession = await prisma.session.findFirst({
            where: { 
              userId: session.metadata.userId || 'anonymous',
              status: 'ACTIVE'
            }
          })

          if (!existingSession) {
            const pkg = await prisma.package.findUnique({
              where: { id: session.metadata.packageId }
            })

            if (pkg) {
              await prisma.session.create({
                data: {
                  userId: session.metadata.userId || 'anonymous',
                  hotspotId: (await prisma.hotspot.findUnique({
                    where: { ssid: session.metadata.hotspotSsid }
                  }))?.id || '',
                  packageId: session.metadata.packageId,
                  status: 'ACTIVE',
                  startTime: new Date(),
                  ratePerHour: 0,
                  charged: pkg.price
                }
              })
            }
          }
        }
      }
      break

    case 'payment_intent.payment_failed':
      const failedSession = event.data.object as Stripe.PaymentIntent
      if (failedSession.metadata?.paymentId) {
        await prisma.payment.update({
          where: { id: failedSession.metadata.paymentId },
          data: { status: 'FAILED' }
        })
      }
      break
  }

  return NextResponse.json({ received: true })
}
