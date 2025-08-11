# Security Environment Variables - Rotation Required

## Critical Secrets to Rotate

### 1. NEXTAUTH_SECRET
**Current Status**: Using example value or weak secret
**Action Required**: Generate new secret using:
```bash
openssl rand -base64 32
```
**Update Location**: `.env.local` and production environment (Vercel)

### 2. DATABASE_URL & DIRECT_URL
**Current Status**: Contains database credentials
**Action Required**: 
- Rotate database passwords in Supabase/PostgreSQL
- Update connection strings
- Ensure passwords are strong (min 16 chars, mixed case, numbers, symbols)

### 3. PUSHER Credentials
**Current Status**: May be using development keys in production
**Action Required**:
- Regenerate all Pusher keys in Pusher dashboard
- Update: PUSHER_APP_ID, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_KEY

### 4. SENTRY_DSN
**Current Status**: Public DSN exposed
**Action Required**:
- Regenerate DSN in Sentry project settings
- Update both SENTRY_DSN and NEXT_PUBLIC_SENTRY_DSN

### 5. Google OAuth (Currently Disabled)
**Status**: Commented out for security
**Before Re-enabling**:
- Add PrismaAdapter to auth-options.ts
- Generate new OAuth credentials in Google Cloud Console
- Properly configure redirect URIs

## Security Best Practices

1. **Never commit .env files to git**
   - Ensure .env, .env.local are in .gitignore
   - Use .env.example for documentation only

2. **Use different secrets per environment**
   - Development: Separate credentials
   - Staging: Separate credentials  
   - Production: Unique, strong credentials

3. **Rotate secrets regularly**
   - Every 90 days for production
   - Immediately if any exposure suspected

4. **Access Control**
   - Limit who can access production environment variables
   - Use audit logs to track access

5. **Monitoring**
   - Set up alerts for failed authentication attempts
   - Monitor for unusual database queries
   - Track API rate limit violations

## Verification Checklist

- [ ] NEXTAUTH_SECRET rotated and is 32+ characters
- [ ] Database passwords rotated and updated
- [ ] Pusher keys regenerated
- [ ] Sentry DSN regenerated
- [ ] All production environment variables updated in Vercel
- [ ] Old secrets revoked/disabled
- [ ] Team notified of rotation
- [ ] Applications redeployed with new secrets
- [ ] Functionality tested after rotation

## Rotation Schedule

| Secret | Last Rotation | Next Rotation |
|--------|--------------|---------------|
| NEXTAUTH_SECRET | [Date] | [Date + 90 days] |
| Database Password | [Date] | [Date + 90 days] |
| Pusher Keys | [Date] | [Date + 90 days] |
| Sentry DSN | [Date] | [Date + 180 days] |

## Emergency Response

If any secret is compromised:
1. Immediately rotate the affected secret
2. Review audit logs for unauthorized access
3. Check for any data breaches
4. Notify the security team
5. Document the incident

---
Generated: 2025-08-09
Next Review: 2025-09-09