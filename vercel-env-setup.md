# Vercel Environment Variables Setup

## 🔴 CRITICAL - Must Have (Without these, app won't work)

```env
# Database Connection (USE YOUR ACTUAL DATABASE URL!)
DATABASE_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/database"

# NextAuth (CRITICAL FOR LOGIN)
NEXTAUTH_URL="https://your-app.vercel.app"  # Change to your Vercel URL
NEXTAUTH_SECRET="HKhxHzBlwdY5sri0RjxAHDbTFvPP3L4m"
```

## 🟡 OPTIONAL - Remove if not using

### Supabase (DELETE if not using Supabase as database)
```env
NEXT_PUBLIC_SUPABASE_URL=""  # DELETE or leave empty
NEXT_PUBLIC_SUPABASE_ANON_KEY=""  # DELETE or leave empty
```

### Google OAuth (DELETE if not using Google login)
```env
GOOGLE_CLIENT_ID=""  # DELETE or leave empty
GOOGLE_CLIENT_SECRET=""  # DELETE or leave empty
```

### Pusher (DELETE if not using real-time features)
```env
PUSHER_APP_ID=""  # DELETE or leave empty
PUSHER_SECRET=""  # DELETE or leave empty
NEXT_PUBLIC_PUSHER_KEY=""  # DELETE or leave empty
NEXT_PUBLIC_PUSHER_CLUSTER=""  # DELETE or leave empty
```

## 🛠️ How to Fix in Vercel

1. Go to: https://vercel.com/[your-team]/[your-project]/settings/environment-variables

2. **ADD these CRITICAL variables:**
   ```
   DATABASE_URL = [Your PostgreSQL connection string]
   DIRECT_URL = [Your PostgreSQL direct connection]
   NEXTAUTH_URL = https://[your-app].vercel.app
   NEXTAUTH_SECRET = HKhxHzBlwdY5sri0RjxAHDbTFvPP3L4m
   ```

3. **DELETE or EMPTY these if not using:**
   - All Supabase variables (if using different database)
   - All Google OAuth variables (if not using Google login)
   - All Pusher variables (if not using real-time)

## 📊 Database Options

### Option 1: Neon (Recommended for Vercel)
1. Create account at: https://neon.tech
2. Create new database
3. Copy connection string
4. Use format: `postgresql://user:pass@host/database?sslmode=require`

### Option 2: Supabase
1. Keep existing Supabase variables
2. Make sure connection string is in DATABASE_URL
3. Format: `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`

### Option 3: Railway
1. Create PostgreSQL on Railway
2. Copy connection string
3. Add to Vercel

## 🎯 Quick Test After Setup

```bash
# Test your deployment
curl https://your-app.vercel.app/api/auth/providers

# Should return:
{
  "credentials": {
    "id": "credentials",
    "name": "credentials",
    "type": "credentials",
    "signinUrl": "/api/auth/signin/credentials",
    "callbackUrl": "/api/auth/callback/credentials"
  }
}
```

## ⚠️ Common Errors and Solutions

### Error: "CREDENTIALS_SIGNIN"
- **Cause**: Missing NEXTAUTH_SECRET or NEXTAUTH_URL
- **Fix**: Add both variables with correct values

### Error: "Database connection failed"
- **Cause**: Missing or wrong DATABASE_URL
- **Fix**: Add correct PostgreSQL connection string

### Error: "Pusher connection failed"
- **Cause**: Wrong or missing Pusher credentials
- **Fix**: Either configure Pusher correctly or remove all Pusher code

### Error: "Google OAuth error"
- **Cause**: Invalid Google OAuth credentials
- **Fix**: Either configure Google OAuth or remove the provider

## 🚀 Minimal Working Configuration

For a basic working deployment, you only need:

```env
DATABASE_URL="your-postgresql-url"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="HKhxHzBlwdY5sri0RjxAHDbTFvPP3L4m"
```

Everything else is optional!