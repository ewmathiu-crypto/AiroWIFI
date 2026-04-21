# WiFi Hub - Modern Hotspot Management Platform

A full-featured WiFi hotspot business platform with admin dashboard, customer captive portal, payment processing, voucher management, and global hotspot network support.

## Features

### For Admins
- **Dashboard** - Real-time stats on users, sessions, revenue, hotspots
- **Hotspot Management** - Add, edit, manage WiFi access points globally
- **Package Management** - Create time-based or data-based pricing plans
- **Voucher Generation** - Bulk generate prepaid access codes with QR codes
- **Payment Tracking** - View all transactions (Stripe, M-Pesa)
- **Analytics** - Monitor usage patterns, revenue, hotspot performance

### For Customers
- **Captive Portal** - Beautiful landing page when connecting to WiFi
- **Package Selection** - Choose hourly, daily, weekly, monthly, or data plans
- **Voucher Redemption** - Enter prepaid codes for instant access
- **Secure Payments** - Stripe (cards) and M-Pesa (mobile money)
- **Session Management** - View active sessions, usage, history
- **Account Portal** - Manage profile, view receipts

### Technical
- **Next.js 16** with App Router and Server Components
- **TypeScript** for type safety
- **Tailwind CSS 4** for modern UI
- **Prisma ORM** with SQLite (dev) / PostgreSQL (prod)
- **NextAuth.js** for authentication
- **Stripe** for card payments
- **Africa's Talking** for M-Pesa integration
- **QR Code** generation for vouchers
- **Real-time** session tracking

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) installed
- SQLite (dev) or PostgreSQL (prod)

### Installation

```bash
# Clone / navigate to project
cd wifi-hotspot-platform

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Initialize database
bun prisma db push
bun prisma generate

# Seed sample data
bun db:seed

# Run development server
bun dev
```

Visit: http://localhost:3000

### Sample Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@wifihub.io | Admin@2024! |
| Customer | customer@test.com | Customer@2024! |

## Project Structure

```
src/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # NextAuth
│   │   ├── hotspots/          # Hotspot CRUD
│   │   ├── sessions/          # Session management
│   │   ├── payments/          # Payment processing
│   │   ├── packages/          # Package catalog
│   │   ├── vouchers/          # Voucher operations
│   │   ├── admin/             # Admin-only endpoints
│   │   └── qrcode/            # QR generation
│   ├── admin/                 # Admin dashboard pages
│   │   ├── page.tsx           # Dashboard home
│   │   ├── hotspots/          # Hotspot management
│   │   └── ...
│   ├── captive/               # Customer-facing captive portal
│   │   ├── [ssid]/page.tsx    # SSID-specific landing
│   │   ├── voucher/           # Voucher redemption
│   │   └── checkout/          # Payment checkout
│   ├── account/               # Customer account
│   ├── login/                 # Admin login
│   └── layout.tsx             # Root layout with SessionProvider
├── components/
│   └── AdminLayout.tsx        # Admin sidebar layout
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── auth.ts                # NextAuth configuration
│   ├── utils.ts               # Utility functions
│   └── seed.ts                # Database seeder
└── types/
    └── index.ts               # TypeScript types
```

## Database Models

```prisma
User          - Customers and admins
Hotspot       - WiFi access points with location & pricing
Session       - Active/completed user sessions
Package       - Pricing plans (duration, data, price)
Payment       - Transaction records
Voucher       - Prepaid access codes
LoginHistory  - Security audit log
Analytics     - Daily/weekly metrics
Setting       - Global configuration
```

## API Reference

### Hotspots

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hotspots` | List all hotspots |
| POST | `/api/hotspots` | Create hotspot (admin) |
| GET | `/api/hotspots/[id]` | Get single hotspot |
| PATCH | `/api/hotspots/[id]` | Update hotspot |
| DELETE | `/api/hotspots/[id]` | Delete hotspot |
| GET | `/api/hotspots/[id]/sessions` | Get hotspot sessions |

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | List sessions (filters: userId, hotspotId) |
| POST | `/api/sessions` | Start new session |
| PATCH | `/api/sessions/[id]/update-usage` | Update data usage |
| POST | `/api/sessions/[id]/end` | End session |
| GET | `/api/sessions/[id]` | Get session details |

### Packages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/packages` | List active packages |
| GET | `/api/packages/[id]` | Get package details |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Create payment (returns Stripe URL or M-Pesa trigger) |
| GET | `/api/payments/[id]` | Get payment status |

### Vouchers

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/vouchers/redeem` | Redeem voucher code |
| POST | `/api/admin/vouchers/generate` | Generate batch (admin) |
| GET | `/api/qrcode?text=...` | Generate QR code PNG |

## Payment Integration

### Stripe Setup
1. Create Stripe account, get API keys
2. Set `STRIPE_PUBLIC_KEY` and `STRIPE_SECRET_KEY`
3. Configure webhook endpoint: `/api/payments/webhook`
4. Set webhook secret in `STRIPE_WEBHOOK_SECRET`

### M-Pesa Setup (Africa)
1. Register for Africa's Talking account
2. Get API key, username, shortcode
3. Set env vars: `AT_API_KEY`, `AT_USERNAME`, `MPESA_SHORTCODE`
4. Configure callback URL in AT dashboard

## Production Deployment

### Database
Use PostgreSQL for production:

```bash
# Install PostgreSQL
brew install postgresql  # macOS
# or use managed service (Supabase, Neon, etc.)

# Update .env
DATABASE_URL="postgresql://user:pass@host:5432/wifi_hub"

# Push schema
bun prisma db push
```

### Environment
Set production environment variables:
- `NEXTAUTH_URL` - Public URL
- `DATABASE_URL` - PostgreSQL connection
- Payment API keys (live keys)
- SMS gateway credentials

### Build & Deploy
```bash
bun build
bun start
```

Deploy to:
- Vercel (recommended for Next.js)
- Railway, Render, AWS, DigitalOcean

## Captive Portal Integration

To integrate with actual hotspot hardware:

1. **Router Integration**: Configure your WiFi router/AP to redirect HTTP requests to your captive portal
2. **RADIUS Server**: For enterprise, integrate with FreeRADIUS or CoovaChilli
3. **Session Validation**: Hotspot device should call `/api/sessions/validate` to check active subscriptions
4. **Logout**: Hotspot should notify `/api/sessions/[id]/end` on disconnect

### Common Router Configs

**MikroTik:**
```bash
/ip hotspot profile add name=wifihub use-radius=yes
/ip radius add service=hotspot address=YOUR_SERVER_IP secret=YOUR_SECRET
```

**Ubiquiti UniFi:**
- Set "Portal" in Guest Controls to your server URL
- Enable "Voucher" authentication

**CoovaChilli:**
```bash
# /etc/chilli/defaults
HS_UAMURL=http://YOUR_SERVER/captive
HS_RADIUS=your-radius-server:1812
```

## Localization

Add new locales in `src/locales/` and update `middleware.ts` for i18n routing. Currently supports English (default). Ready for Swahili, French, Spanish, etc.

## Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create feature branch
3. Add tests for new features
4. Run `bun lint` and `bun typecheck`
5. Submit PR with clear description

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/your-repo/issues
- Email: support@wifihub.io

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
