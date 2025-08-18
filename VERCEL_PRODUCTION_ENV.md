# Vercel Production Environment Variables

## 🔴 CRITICALLY MISSING (Add These Immediately!)

```env
# 1. DATABASE CONNECTION (MOST CRITICAL!)
DATABASE_URL="postgresql://postgres:[YOUR-SUPABASE-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[YOUR-SUPABASE-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 2. NEXTAUTH (WITHOUT THIS, LOGIN WON'T WORK!)
NEXTAUTH_URL="https://[your-app].vercel.app"
NEXTAUTH_SECRET="HKhxHzBlwdY5sri0RjxAHDbTFvPP3L4m"

# 3. SUPABASE URL (You have the ANON_KEY but missing URL!)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

## 📋 How to Get These Values from Supabase

### 1. Get Database URLs:
1. Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT]/settings/database
2. Scroll to "Connection string"
3. Copy both:
   - **Connection pooling** → Use for `DATABASE_URL` (with ?pgbouncer=true)
   - **Direct connection** → Use for `DIRECT_URL`

### 2. Get Supabase URLs:
1. Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT]/settings/api
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`
   - **Anon Key** → You already have this ✅

## 🎯 Complete Variable List for Vercel

### Already Have ✅
- NEXT_PUBLIC_SUPABASE_ANON_KEY ✅
- GOOGLE_CLIENT_ID ✅
- GOOGLE_CLIENT_SECRET ✅
- PUSHER_APP_ID ✅
- PUSHER_SECRET ✅
- NEXT_PUBLIC_PUSHER_KEY ✅
- NEXT_PUBLIC_PUSHER_CLUSTER ✅

### MUST ADD 🔴
```
DATABASE_URL = [Supabase connection pooling URL]
DIRECT_URL = [Supabase direct connection URL]
NEXTAUTH_URL = https://[your-vercel-app].vercel.app
NEXTAUTH_SECRET = HKhxHzBlwdY5sri0RjxAHDbTFvPP3L4m
NEXT_PUBLIC_SUPABASE_URL = https://[project-ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY = [service role key]
```

## 🚨 Why Your App Is Failing

Your app is failing because:
1. **No DATABASE_URL** = Can't connect to database = Nothing works
2. **No NEXTAUTH_URL** = Authentication doesn't know where it's running
3. **No NEXTAUTH_SECRET** = Can't sign/verify JWT tokens
4. **No SUPABASE_URL** = Can't initialize Supabase client

## 📝 Step-by-Step Fix

### Step 1: Get Supabase Connection Strings
```bash
# Go to Supabase Dashboard
# Settings → Database → Connection String
# Copy the "Connection pooling" string
```

### Step 2: Add to Vercel
1. Go to: https://vercel.com/[your-team]/[your-project]/settings/environment-variables
2. Click "Add New"
3. Add each variable:

| Key | Value | Environments |
|-----|-------|-------------|
| DATABASE_URL | postgresql://postgres:[password]@db.[ref].supabase.co:6543/postgres?pgbouncer=true | All |
| DIRECT_URL | postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres | All |
| NEXTAUTH_URL | https://your-app.vercel.app | Production |
| NEXTAUTH_SECRET | HKhxHzBlwdY5sri0RjxAHDbTFvPP3L4m | All |
| NEXT_PUBLIC_SUPABASE_URL | https://[ref].supabase.co | All |
| SUPABASE_SERVICE_ROLE_KEY | [your-service-key] | All |

### Step 3: Redeploy
```bash
# After adding variables, redeploy:
vercel --prod

# Or trigger from dashboard
```

## 🧪 Test After Adding

```bash
# Test database connection
curl https://your-app.vercel.app/api/health

# Test auth
curl https://your-app.vercel.app/api/auth/providers

# Should see credentials provider
```

## ⚠️ Common Mistakes to Avoid

1. **Wrong pgbouncer port**: Use 6543 for pooling, 5432 for direct
2. **Missing ?pgbouncer=true**: Add to DATABASE_URL
3. **Wrong NEXTAUTH_URL**: Must match your actual Vercel URL
4. **Spaces in values**: No spaces before/after values

## 💡 Quick Debug

If still not working after adding these:

1. Check Vercel Function Logs:
   ```
   Vercel Dashboard → Functions → View Logs
   ```

2. Look for errors like:
   - "Can't reach database server"
   - "NEXTAUTH_URL mismatch"
   - "Invalid NEXTAUTH_SECRET"

3. Common fixes:
   - Ensure no trailing slashes in URLs
   - Check password special characters are URL-encoded
   - Verify Supabase project is not paused

## 📞 Emergency Connection String

If you can't find your Supabase credentials, use this format:

```env
# Replace [password], [project-ref] with your actual values
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
```

The [project-ref] is the unique identifier in your Supabase URL, like "xyzabc123def".