# Vercel Deployment Guide for AgendaIQ

## 🔧 Auth Problem Çözümü

### 1. Environment Variables (Vercel Dashboard'da ayarlayın)

```env
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth (ÖNEMLİ!)
NEXTAUTH_URL="https://your-app.vercel.app"  # Production URL
NEXTAUTH_SECRET="your-secret-key-here"      # openssl rand -base64 32 ile oluşturun

# Supabase (eğer kullanıyorsanız)
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Pusher (real-time için)
NEXT_PUBLIC_PUSHER_KEY="..."
PUSHER_APP_ID="..."
PUSHER_SECRET="..."
NEXT_PUBLIC_PUSHER_CLUSTER="..."
```

### 2. NextAuth Configuration Fix

```typescript
// src/lib/auth/auth-options.ts güncellemesi
import { NextAuthOptions } from 'next-auth';

export const authOptions: NextAuthOptions = {
  // ... mevcut config
  
  // Vercel için kritik ayarlar:
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? '.vercel.app' // veya custom domain
          : undefined
      }
    }
  },
  
  // Trust proxy
  trustHost: true,
};
```

### 3. Database Connection Fix

```typescript
// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Vercel için önemli
}
```

### 4. Middleware Update

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/:path*",
    "/((?!auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### 5. Build & Deploy Commands

```json
// package.json
{
  "scripts": {
    "build": "prisma generate && next build",
    "vercel-build": "prisma generate && prisma migrate deploy && next build",
    "postinstall": "prisma generate"
  }
}
```

### 6. Vercel.json Configuration

```json
{
  "buildCommand": "npm run vercel-build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["fra1"], // Frankfurt for Turkey
  "functions": {
    "app/api/meetings/*/route.ts": {
      "maxDuration": 30
    }
  }
}
```

## 🎯 Önerilerim

### Sizin Senaryonuz İçin (Haftalık 10-20 Meeting):

1. **Vercel Pro Plan** ($20/ay)
   - Setup 10 dakika
   - Otomatik scaling
   - Auth sorunları çözüldükten sonra sorunsuz
   - Preview deployments
   - Analytics dahil

2. **Database: Supabase veya Neon**
   - Supabase Free Tier: 500MB, 2GB bandwidth (yeterli)
   - Neon Free Tier: 3GB storage (yeterli)
   - PostgreSQL compatible

3. **Tahmini Toplam Maliyet**:
   - Vercel Pro: $20/ay
   - Database: $0 (free tier yeterli)
   - **TOPLAM: $20/ay**

### AWS S3 Alternatifi:
- Setup: 2-3 gün
- Maintenance: Ayda 5-10 saat
- Maliyet: $20-40/ay
- **Tavsiye etmem** - Karmaşıklık/fayda oranı kötü

## 🚨 Hemen Yapılması Gerekenler

1. **NEXTAUTH_SECRET oluşturun**:
```bash
openssl rand -base64 32
```

2. **Vercel'de Environment Variables ekleyin**

3. **Database migration**:
```bash
npx prisma migrate deploy
```

4. **Deploy**:
```bash
vercel --prod
```

## 💡 Pro İpuçları

1. **Vercel Functions Timeout**: Default 10s, artırabilirsiniz
2. **Cold Start**: İlk istekte 2-3 saniye olabilir, warm tutmak için cron job
3. **Database Pooling**: Prisma connection limit'i ayarlayın
4. **Error Tracking**: Sentry entegrasyonu ekleyin

Vercel auth probleminiz muhtemelen:
- NEXTAUTH_URL yanlış
- NEXTAUTH_SECRET eksik
- Cookie domain sorunu
- Database connection string hatalı

Bu ayarları yapıp tekrar deneyin!