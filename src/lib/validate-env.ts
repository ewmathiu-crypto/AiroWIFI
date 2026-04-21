// Environment validation
const requiredEnv = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'NEXT_PUBLIC_APP_URL'
]

const optionalEnv = [
  'STRIPE_SECRET_KEY',
  'STRIPE_PUBLIC_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'AT_API_KEY',
  'AT_USERNAME',
  'MPESA_SHORTCODE',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS'
]

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

console.log('✅ Environment validation passed')
console.log('Required vars:', requiredEnv.filter(k => process.env[k] !== undefined).length, '/', requiredEnv.length)
console.log('Optional vars:', optionalEnv.filter(k => process.env[k] !== undefined).length, '/', optionalEnv.length)
