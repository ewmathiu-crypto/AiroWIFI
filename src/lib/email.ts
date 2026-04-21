import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Email not configured - skipping send')
    return { success: true, skipped: true }
  }

  try {
    const result = await transporter.sendMail({
      from: `WiFi Hub <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: text || subject,
      html
    })

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function sendPaymentReceipt({
  email,
  userName,
  amount,
  packageName,
  voucherCode,
  paymentId
}: {
  email: string
  userName: string
  amount: number
  packageName: string
  voucherCode?: string
  paymentId: string
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #2a2a2a; border-radius: 12px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #06b6d4; }
        .content { margin-bottom: 30px; }
        .details { background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { color: #9ca3af; }
        .value { font-weight: bold; }
        .voucher { background: #06b6d4; color: #000; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; letter-spacing: 3px; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; color: #9ca3af; font-size: 14px; }
        .btn { display: inline-block; background: #06b6d4; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">WiFi Hub</div>
          <p>Payment Receipt</p>
        </div>

        <div class="content">
          <p>Hi ${userName},</p>
          <p>Thank you for your purchase! Your WiFi access has been activated.</p>

          <div class="details">
            <div class="detail-row">
              <span class="label">Package</span>
              <span class="value">${packageName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount Paid</span>
              <span class="value">$${amount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payment ID</span>
              <span class="value" style="font-size: 12px;">${paymentId.slice(0, 12)}...</span>
            </div>
          </div>

          ${voucherCode ? `
            <p>Your voucher code:</p>
            <div class="voucher">${voucherCode}</div>
            <p><small>Present this code at the hotspot to connect</small></p>
          ` : ''}

          <p style="margin-top: 30px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account" class="btn">View My Account</a>
          </p>
        </div>

        <div class="footer">
          <p>© 2024 WiFi Hub. All rights reserved.</p>
          <p>Need help? Contact support@wifihub.io</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return sendEmail({ to: email, subject: `WiFi Hub - Payment Receipt ($${amount.toFixed(2)})`, html, text: `Thank you for your purchase of ${packageName}` })
}

export async function sendVoucherEmail({
  email,
  userName,
  voucherCode,
  packageName,
  expiresAt
}: {
  email: string
  userName: string
  voucherCode: string
  packageName: string
  expiresAt?: Date
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #2a2a2a; border-radius: 12px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #06b6d4; }
        .content { margin-bottom: 30px; }
        .voucher { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #fff; padding: 30px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; word-break: break-all; }
        .details { background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { color: #9ca3af; }
        .value { font-weight: bold; }
        .footer { text-align: center; color: #9ca3af; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">WiFi Hub</div>
          <p>Your WiFi Voucher</p>
        </div>

        <div class="content">
          <p>Hi ${userName},</p>
          <p>Here is your WiFi access voucher. Keep this code safe!</p>

          <div class="voucher">${voucherCode}</div>

          <div class="details">
            <div class="detail-row">
              <span class="label">Package</span>
              <span class="value">${packageName}</span>
            </div>
            ${expiresAt ? `
              <div class="detail-row">
                <span class="label">Expires</span>
                <span class="value">${expiresAt.toLocaleDateString()}</span>
              </div>
            ` : ''}
          </div>

          <p><strong>How to use:</strong></p>
          <ol style="margin: 15px 0; padding-left: 20px;">
            <li>Connect to the WiFi hotspot</li>
            <li>Open your browser</li>
            <li>Enter the voucher code when prompted</li>
          </ol>
        </div>

        <div class="footer">
          <p>© 2024 WiFi Hub. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  return sendEmail({ to: email, subject: `Your WiFi Hub Voucher: ${voucherCode}`, html })
}
