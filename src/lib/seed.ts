import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@2024!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wifihub.io' },
    update: {},
    create: {
      email: 'admin@wifihub.io',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
      emailVerified: new Date()
    }
  })
  console.log('✅ Admin user created:', admin.email)

  // Create sample customer
  const customerPassword = await bcrypt.hash('Customer@2024!', 12)
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      password: customerPassword,
      name: 'John Doe',
      role: 'CUSTOMER',
      phone: '+254712345678',
      emailVerified: new Date()
    }
  })
  console.log('✅ Customer user created:', customer.email)

  // Create sample hotpots
  const hotspots = [
    {
      name: 'Nairobi Central Hub',
      ssid: 'WiFiHub-Nairobi',
      password: 'wifihub@2024',
      location: 'Nairobi CBD',
      address: 'Moi Avenue, Nairobi',
      city: 'Nairobi',
      country: 'KE',
      coordinates: '-1.2921,36.8219',
      pricePerHour: 0.5,
      pricePerDay: 5.0,
      pricePerMonth: 50.0,
      maxConnections: 100,
      isActive: true
    },
    {
      name: 'Mombasa Beach Front',
      ssid: 'WiFiHub-Mombasa',
      password: 'beachwifi@2024',
      location: 'Nyali',
      address: 'Nyali Beach Road',
      city: 'Mombasa',
      country: 'KE',
      coordinates: '-4.0435,39.6682',
      pricePerHour: 0.6,
      pricePerDay: 6.0,
      pricePerMonth: 55.0,
      maxConnections: 80,
      isActive: true
    },
    {
      name: 'Kisumu Lakeside',
      ssid: 'WiFiHub-Kisumu',
      password: 'lakewifi@2024',
      location: 'Kisumu City',
      address: 'Oginga Odinga Street',
      city: 'Kisumu',
      country: 'KE',
      coordinates: '-0.0917,34.7681',
      pricePerHour: 0.4,
      pricePerDay: 4.0,
      pricePerMonth: 40.0,
      maxConnections: 60,
      isActive: true
    }
  ]

  for (const hotspot of hotspots) {
    const existing = await prisma.hotspot.findUnique({
      where: { ssid: hotspot.ssid }
    })

    if (!existing) {
      await prisma.hotspot.create({
        data: hotspot
      })
      console.log('✅ Hotspot created:', hotspot.name, '| SSID:', hotspot.ssid)
    }
  }

  // Create WiFi packages
  const packages = [
    { name: '1 Hour Pass', description: 'Unlimited access for 1 hour', duration: 60, price: 0.50, isFeatured: true, sortOrder: 1 },
    { name: '3 Hour Pass', description: 'Unlimited access for 3 hours', duration: 180, price: 1.20, isFeatured: false, sortOrder: 2 },
    { name: 'Daily Pass', description: 'Unlimited access for 24 hours', duration: 1440, price: 5.00, isFeatured: true, sortOrder: 3 },
    { name: 'Weekly Pass', description: 'Unlimited access for 7 days', duration: 10080, price: 25.00, isFeatured: true, sortOrder: 4 },
    { name: 'Monthly Pass', description: 'Unlimited access for 30 days', duration: 43200, price: 50.00, isFeatured: true, sortOrder: 5 },
    { name: '1GB Data Pack', description: '1GB of data, valid 7 days', duration: 10080, dataLimit: 1073741824, price: 3.00, isActive: true, sortOrder: 6 },
    { name: '5GB Data Pack', description: '5GB of data, valid 30 days', duration: 43200, dataLimit: 5368709120, price: 12.00, isActive: true, sortOrder: 7 },
    { name: 'Unlimited Monthly', description: 'Unlimited data for 30 days', duration: 43200, price: 80.00, isActive: true, isFeatured: true, sortOrder: 8 }
  ]

  for (const pkg of packages) {
    const existing = await prisma.package.findFirst({
      where: { name: pkg.name }
    })

    if (!existing) {
      await prisma.package.create({
        data: pkg
      })
      console.log('✅ Package created:', pkg.name)
    }
  }

  // Create sample vouchers
  const voucherPackages = await prisma.package.findMany({
    where: { isActive: true },
    take: 3
  })

  for (const pkg of voucherPackages) {
    const voucherCode = `WIFI-${uuidv4().slice(0, 8).toUpperCase()}`
    await prisma.voucher.create({
      data: {
        code: voucherCode,
        packageId: pkg.id,
        duration: pkg.duration,
        dataLimit: pkg.dataLimit,
        maxUses: 1,
        isActive: true
      }
    })
    console.log('✅ Voucher created:', voucherCode, 'for', pkg.name)
  }

  // Create sample session
  const activeHotspot = await prisma.hotspot.findFirst()
  if (activeHotspot && customer) {
    const activeSession = await prisma.session.create({
      data: {
        userId: customer.id,
        hotspotId: activeHotspot.id,
        status: 'ACTIVE',
        bytesIn: 12582912, // 12 MB
        bytesOut: 6291456, // 6 MB
        ipAddress: '192.168.1.100',
        macAddress: '00:1A:2B:3C:4D:5E',
        deviceName: 'iPhone 14 Pro',
        duration: 3600,
        charged: 0.50
      }
    })
    console.log('✅ Sample session created:', activeSession.id)
  }

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
