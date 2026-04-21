# WiFi Hub - Production Deployment Guide

## Prerequisites

- Docker & Docker Compose (for self-hosted)
- OR cloud account (Vercel, Railway, Render, AWS)
- Domain name (SSL required for captive portals)
- PostgreSQL database (for production)
- Stripe account (for payments)
- SMTP email service

## Quick Deploy Options

### Option 1: Vercel (Recommended - Easiest)

1. Push code to GitHub repository
2. Visit https://vercel.com/new
3. Import your GitHub repo
4. Configure environment variables (see below)
5. Deploy

Vercel automatically:
- Sets up Next.js optimization
- Provides SSL certificates
- Handles load balancing
- Global CDN

### Option 2: Railway (All-in-One with DB)

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add PostgreSQL plugin
5. Deploy: `railway up`

Railway provides:
- Managed PostgreSQL
- Auto-scaling
- Built-in logs & monitoring

### Option 3: Docker (Self-Hosted)

```bash
# Clone and build
git clone <your-repo>
cd wifi-hotspot-platform

# Set environment
cp .env.production .env
# Edit .env with your values

# Deploy with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Option 4: Render

1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `bun install && bun run next build`
4. Set start command: `bun run start`
5. Add PostgreSQL instance
6. Configure environment variables
7. Deploy

## Environment Setup

### Essential Variables (Required)

```bash
# Database (PostgreSQL connection string)
DATABASE_URL="postgresql://user:password@host:5432/wifi_hub_db"

# NextAuth
NEXTAUTH_SECRET="minimum-32-character-random-string-use-openssl-rand-base64-32"
NEXTAUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"

# Node environment
NODE_ENV="production"
```

### Payment Integration (Optional but Recommended)

```bash
# Stripe (Card Payments)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLIC_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# M-Pesa (Africa - Optional)
AT_API_KEY="your-africastalking-api-key"
AT_USERNAME="your-username"
MPESA_SHORTCODE="your-shortcode"
```

### Email (Optional but Recommended)

```bash
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Production Security Tips

1. **Generate strong NEXTAUTH_SECRET**:
   ```bash
   openssl rand -base64 32
   ```

2. **Use separate Stripe keys**: Live keys in production, test keys in staging

3. **Restrict database access**: Use private networking, strong passwords, SSL

4. **Enable SSL**: Required for captive portal to work on iOS/Android

5. **Set up monitoring**: Use UptimeRobot, Datadog, or cloud provider monitoring

## Post-Deployment Steps

### 1. Database Migrations

If using Docker/self-hosted:
```bash
# Apply migrations
bun prisma migrate deploy

# Seed initial data (optional)
bun run src/lib/seed.ts
```

On Vercel/Railway/Render, migrations run automatically during build.

### 2. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 3. Test Payment Flow

1. Login as admin: `admin@wifihub.io` / `Admin@2024!`
2. Create a hotspot (if not seeded)
3. Visit hotspot URL: `https://yourdomain.com/captive/WiFiHub-Nairobi`
4. Select package, test Stripe checkout
5. Verify webhook received and session created

### 4. Configure Captive Portal Redirection

Your WiFi router/AP must redirect unauthenticated HTTP requests to:
```
https://yourdomain.com/captive/[SSID]
```

For MikroTik:
```bash
/ip hotspot profile add name=wifihub use-radius=yes
/ip radius add service=hotspot address=YOUR_SERVER_IP secret=YOUR_SECRET
```

### 5. Set Up Monitoring

Create cron job for cleanup (optional):
```bash
# Run hourly cleanup
0 * * * * curl -X POST https://yourdomain.com/api/maintenance/cleanup
```

Or use cloud scheduler (Railway Cron Jobs, Render Cron).

### 6. SSL Certificate

- **Vercel**: Automatic (no action needed)
- **Railway**: Automatic
- **Render**: Automatic
- **Self-hosted**: Use Traefik/Caddy with Let's Encrypt

## Health Checks

- Health endpoint: `GET /api/health`
- Returns: JSON with uptime, DB status
- Use for monitoring/load balancer checks

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
rm -rf .next node_modules
bun install
bun run next build
```

### Database Connection Errors

Check:
- `DATABASE_URL` is correct
- Database is running and accessible
- For PostgreSQL: SSL mode may need `?sslmode=require` or `?sslmode=disable`

### Stripe Webhook Not Working

1. Verify webhook URL is publicly accessible
2. Check `STRIPE_WEBHOOK_SECRET` matches
3. View webhook logs in Stripe Dashboard
4. Ensure endpoint returns 200 status

### Captive Portal Not Loading

Common causes:
- No SSL certificate (HTTPS required by iOS/Android)
- Router config incorrect
- Port 80/443 not open
- CSP headers blocking resources

### Sessions Not Expiring

Run cleanup manually:
```bash
curl -X POST https://yourdomain.com/api/maintenance/cleanup
```

Check logs for errors.

### Email Not Sending

Verify SMTP settings. Test with:
```bash
bun run -e "require('nodemailer').createTransport({host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, auth: {user: process.env.SMTP_USER, pass: process.env.SMTP_PASS}}).sendMail({from: process.env.SMTP_USER, to: 'test@example.com', subject: 'Test', text: 'Test'})"
```

## Scaling Considerations

### Horizontal Scaling

- **Stateless**: App is stateless (sessions stored in DB)
- Add more instances → scale horizontally
- Use load balancer (cloud provider handles this)

### Database Scaling

- Use connection pooling (PgBouncer)
- Add read replicas for analytics queries
- Consider index on `Session(startTime, status)` for performance

### Caching (Optional)

- Cache package list: `GET /api/packages` (rarely changes)
- Use Redis for rate limiting (instead of in-memory Map)
- CDN cache static captive portal assets

## Backups

### PostgreSQL Backup

```bash
# Daily backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20260421.sql
```

### Automated Backups

Use cloud provider:
- **Supabase**: Automatic daily backups
- **Neon**: Point-in-time recovery
- **Railway**: Daily backups retained 7 days

## Updates & Maintenance

### Deploying Updates

1. Commit and push to main branch
2. Cloud provider auto-deploys (or manual trigger)
3. Zero downtime with Next.js incremental builds

### Database Migrations

```bash
# Review migration
bun prisma migrate dev --name add_feature

# Apply in production
bun prisma migrate deploy

# Reset (be careful - deletes data)
bun prisma migrate reset
```

### Monitoring Logs

**Vercel**: `vercel logs <deployment>`
**Railway**: `railway logs`
**Render**: Dashboard → Logs
**Self-hosted**: `docker-compose logs -f app`

### Alerting

Set up alerts for:
- HTTP 5xx errors (Sentry, LogRocket)
- High response times (>2s)
- Error rate > 1%
- Memory/CPU usage > 80%

## Security Checklist

- [x) HTTPS enforced (SSL)
- [x) Helmet.js-style security headers
- [x) Rate limiting (60 req/min)
- [x] Database credentials in env vars (not code)
- [x] NextAuth session encryption
- [x] Password hashing (bcrypt)
- [x] CSRF protection
- [x) SQL injection prevention (Prisma)
- [ ] Input validation on all endpoints (could be enhanced)
- [ ] Audit logging (login history table ready)
- [ ] Rate limiting per user (not just IP)

## Cost Estimates

### Vercel (Hobby - Free tier)
- Bandwidth: 100GB/month free
- Build minutes: 6,000/month free
- Suitable for: <10,000 users

### Railway ($5/month starter)
- $5 credit/month
- $0.000013/GB RAM-hour
- $0.000006/CPU-hour
- ~$20-50/month for moderate traffic

### Render (Starter - $7/month)
- 1 instance: 0.5 GB RAM, 1 vCPU
- Free SSL, bandwidth $0.02/GB

### Self-Hosted (VPS)
- DigitalOcean: $6-24/month
- AWS Lightsail: $5-50/month
- Requires sysadmin knowledge

## Support & Resources

- Documentation: `/README.md`
- Database schema: `prisma/schema.prisma`
- API reference: See memory bank context
- Issues: Create GitHub issue with logs

## Emergency Procedures

### Rollback Deployment

**Vercel**: Redeploy previous commit
**Railway**: `railway rollback`
**Render**: Redeploy previous build

### Restore Database Backup

```bash
# Drop and recreate
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql $DATABASE_URL < backup.sql
bun prisma migrate deploy
```

### Disable Site Temporarily

Add to `src/app/page.tsx`:
```tsx
export default function Home() {
  return <div>Maintenance in progress</div>
}
```

## Production Checklist

Before going live:

- [ ] PostgreSQL database created
- [ ] All environment variables set
- [ ] Stripe webhook configured & tested
- [ ] Email SMTP tested
- [ ] SSL certificate active (HTTPS)
- [ ] Router/AP captive portal config tested
- [ ] Payment flow end-to-end tested
- [ ] Voucher redemption tested
- [ ] Monitoring/health checks configured
- [ ] Daily backups scheduled
- [ ] Error logging (Sentry) integrated
- [ ] Domain DNS propagated
- [ ] Admin password changed from default

---

**Ready to deploy!** 🚀

Having issues? Check logs in your cloud dashboard or run `bun dev` locally to test.
