# Vercel Deployment Guide for AgendaIQ

## 🚀 Quick Start

This guide will help you deploy AgendaIQ to Vercel with Supabase as the production database.

## 📋 Prerequisites

1. **Supabase Account** with a project created
2. **Vercel Account** connected to your GitHub
3. **Database Password** from Supabase

## 🔧 Step 1: Get Supabase Database URLs

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Database**
4. Copy these values:
   - **Connection string** (from Connection Pooling tab, Mode: Transaction)
   - **Direct connection string** (for migrations)
   - Your database **password**

Your URLs should look like:
```
DATABASE_URL: postgresql://postgres.[password]:@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL: postgresql://postgres:[password]@db.tvhqasooledcffwogbvd.supabase.co:5432/postgres
```

## 🌐 Step 2: Import Project to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New Project"**
3. Import from GitHub → Select `agendaiq`
4. **IMPORTANT**: Set the production branch to `main`

## 🔐 Step 3: Configure Environment Variables

In Vercel's project settings, add these environment variables:

### Required Variables:
```env
# Database (Supabase)
DATABASE_URL=[Your Supabase pooled connection string]
DIRECT_URL=[Your Supabase direct connection string]

# Supabase Public Keys
NEXT_PUBLIC_SUPABASE_URL=https://tvhqasooledcffwogbvd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2aHFhc29vbGVkY2Zmd29nYnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MDU4NzQsImV4cCI6MjA2Mzk4MTg3NH0.9o9sCyTDPMRIl1Z423SDSbkh_XOzzWrmvPxNxA__0vw

# NextAuth
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=[Generate with: openssl rand -base64 32]

# Optional: Google OAuth
GOOGLE_CLIENT_ID=[Your Google OAuth Client ID]
GOOGLE_CLIENT_SECRET=[Your Google OAuth Client Secret]

# Optional: Pusher (Real-time features)
PUSHER_APP_ID=2032163
PUSHER_SECRET=7940823a5ac4ba5e7e27
NEXT_PUBLIC_PUSHER_KEY=9064eaf1d77fd2b2cdac
NEXT_PUBLIC_PUSHER_CLUSTER=us2
```

### How to Add Variables in Vercel:
1. Go to your project in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with its value
4. Select environments: **Production**, **Preview**, **Development**
5. Click **Save**

## 📦 Step 4: Database Migration

After deployment, you need to run migrations on Supabase:

### Option A: Using Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Link to your project
vercel link

# Run migrations in production
vercel env pull .env.production.local
npx prisma migrate deploy
```

### Option B: Manual Migration
1. Set environment variables locally:
```bash
export DATABASE_URL="your-supabase-pooled-url"
export DIRECT_URL="your-supabase-direct-url"
```

2. Run migrations:
```bash
npx prisma migrate deploy
npx prisma db seed  # Optional: Add initial data
```

## 🔄 Step 5: Deployment Process

### Initial Deployment:
```bash
# 1. Merge feature branch to main
git checkout main
git merge feature/new-pages-development
git push origin main

# 2. Vercel will automatically deploy
```

### Future Updates:
```bash
# Development workflow
git checkout -b feature/new-feature
# Make changes...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# Create PR on GitHub
# After review, merge to main
# Vercel auto-deploys
```

## 🧪 Step 6: Verify Deployment

1. **Check deployment status** in Vercel Dashboard
2. **Visit your app**: `https://your-app-name.vercel.app`
3. **Test health endpoint**: `https://your-app-name.vercel.app/api/health`
4. **Check logs**: Vercel Dashboard → Functions → Logs

## 🏠 Local Development Setup

### Working with Local Database:
```bash
# Use local PostgreSQL
npm run dev  # Automatically uses local DB
```

### Testing with Production Database:
```bash
# Set in .env.local
NODE_ENV=production
DATABASE_URL=[Supabase URL]
DIRECT_URL=[Supabase Direct URL]

npm run dev
```

## 📊 Database Management

### View Data in Supabase:
1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. View and edit your data

### Backup Production Data:
```bash
# Using our backup script
node scripts/backup-database.js
```

## 🚨 Troubleshooting

### Common Issues:

1. **Database Connection Failed**
   - Check DATABASE_URL in Vercel environment variables
   - Ensure password is correct
   - Verify Supabase project is active

2. **Build Failed**
   - Check build logs in Vercel
   - Ensure all environment variables are set
   - Run `npm run build` locally to test

3. **Authentication Not Working**
   - Verify NEXTAUTH_URL matches your domain
   - Check NEXTAUTH_SECRET is set
   - Update Google OAuth redirect URIs

4. **Migrations Failed**
   - Use DIRECT_URL for migrations (not pooled)
   - Check Supabase connection limits
   - Run migrations during low traffic

## 📝 Environment Rules Summary

| Environment | Database | Automatic Detection |
|------------|----------|-------------------|
| Local Development | Local PostgreSQL | `NODE_ENV !== 'production'` |
| Vercel Preview | Supabase | `VERCEL=1` |
| Vercel Production | Supabase | `NODE_ENV=production` |

## 🎯 Best Practices

1. **Never commit** `.env.local` or `.env.production.local`
2. **Always test** migrations locally first
3. **Use connection pooling** for production (pgbouncer)
4. **Monitor** database connections in Supabase Dashboard
5. **Set up alerts** for database usage

## 📞 Support

- **Supabase Issues**: [Supabase Support](https://supabase.com/support)
- **Vercel Issues**: [Vercel Support](https://vercel.com/support)
- **Application Issues**: Check `/DEPLOYMENT.md` for detailed troubleshooting

## ✅ Deployment Checklist

- [ ] Supabase project created
- [ ] Database password saved
- [ ] Vercel project imported from GitHub
- [ ] All environment variables set in Vercel
- [ ] Database migrated to Supabase
- [ ] Health check endpoint working
- [ ] Authentication tested
- [ ] First user created

Your application is now ready for production! 🎉