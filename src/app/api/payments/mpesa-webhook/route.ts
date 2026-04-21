import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPaymentReceipt } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Africa's Talking sends data as form-urlencoded
    const formData = await request.formData()
    const data: Record<string, string> = {}
    formData.forEach((value, key) => {
      data[key] = String(value)
    })
    
    // Log the incoming data for debugging
    console.log('M-Pesa webhook received:', JSON.stringify(data, null, 2))
    
    // Extract relevant fields from Africa's Talking callback
    const transactionId = data.transactionId || ''
    const status = data.status || ''
    const amountStr = data.amount || '0'
    const phoneNumber = data.phoneNumber || ''
    const metadataStr = data.metadata || '{}'
    
    // Validate required fields
    if (!transactionId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      )
    }
    
    // Parse metadata if it's a string
    let parsedMetadata: Record<string, any> = {}
    try {
      parsedMetadata = JSON.parse(metadataStr)
    } catch (e) {
      console.warn('Failed to parse metadata:', metadataStr)
    }
    
    // Find the payment by providerId (transactionId from AT)
    let payment = await prisma.payment.findFirst({
      where: {
        providerId: transactionId,
        provider: 'mpesa'
      },
      include: {
        user: true,
        package: true
      }
    })
    
    // If not found by providerId, try to find by phone number and amount
    if (!payment && phoneNumber && amountStr) {
      const amount = parseFloat(amountStr)
      if (!isNaN(amount)) {
        payment = await prisma.payment.findFirst({
          where: {
            provider: 'mpesa',
            phoneNumber,
            amount,
            status: 'PENDING'
          },
          include: {
            user: true,
            package: true
          }
        })
      }
    }
    
    if (!payment) {
      console.warn('No matching payment found for M-Pesa transaction:', {
        transactionId,
        phoneNumber,
        amount: amountStr ? parseFloat(amountStr) : undefined
      })
      // Still return success to AT to prevent retries
      return NextResponse.json({ result: 'Accepted' })
    }
    
    // Update payment based on status
    const isSuccessful = status.toLowerCase() === 'completed' || 
                        status.toLowerCase() === 'success' ||
                        status.toLowerCase() === 'paid'
    
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isSuccessful ? 'COMPLETED' : 'FAILED',
        providerId: transactionId,
        provider: 'mpesa',
        // Update metadata with AT response
        metadata: {
          ...(payment.metadata as Record<string, any> || {}),
          africastalking: {
            status,
            transactionId,
            receivedAt: new Date().toISOString(),
            rawData: data
          }
        }
      }
    })
    
    // If successful, send receipt and optionally create session
    if (isSuccessful && payment.user) {
      // Send receipt email
      await sendPaymentReceipt({
        email: payment.user.email,
        userName: payment.user.name || 'Valued Customer',
        amount: payment.amount,
        packageName: payment.package?.name || 'WiFi Package',
        paymentId: payment.id
      })
      
      // Create session if hotspot info is in metadata AND we have a userId
      if (parsedMetadata.hotspotSsid && parsedMetadata.packageId && payment.userId) {
        const existingSession = await prisma.session.findFirst({
          where: { 
            userId: payment.userId,
            status: 'ACTIVE'
          }
        })
        
        if (!existingSession) {
          const hotspot = await prisma.hotspot.findUnique({
            where: { ssid: parsedMetadata.hotspotSsid }
          })
          
          if (hotspot) {
            await prisma.session.create({
              data: {
                userId: payment.userId,
                hotspotId: hotspot.id,
                packageId: parsedMetadata.packageId,
                voucherCode: payment.voucherCode,
                status: 'ACTIVE',
                startTime: new Date(),
                ratePerHour: 0,
                charged: payment.amount
              }
            })
          }
        }
      }
    }
    
    return NextResponse.json({ result: 'Success' })
  } catch (error: any) {
    console.error('M-Pesa webhook error:', error)
    // Return 200 to prevent AT from retrying (unless it's a validation error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}

// Africa's Talking might also send GET requests for verification
export async function GET(request: NextRequest) {
  // Simple verification endpoint
  return NextResponse.json({ status: 'M-Pesa webhook endpoint is active' })
}