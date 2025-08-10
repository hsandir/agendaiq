# 🔒 SECURITY RULES - CRITICAL

**THIS DOCUMENT ESTABLISHES MANDATORY SECURITY RULES FOR THE AGENDAIQ PROJECT**

## ⛔ ABSOLUTE RULES - NEVER VIOLATE

### 1. SENSITIVE FILE HANDLING

**NEVER commit to Git or include in deployment:**
- Any file containing passwords, API keys, or secrets
- Files with names containing: CREDENTIALS, PASSWORDS, SECRETS, PRIVATE, SENSITIVE
- Database connection strings with actual passwords
- OAuth client secrets
- JWT secrets or tokens
- Supabase credentials or connection URLs with passwords
- Any `.env` files with real values

### 2. FILE NAMING CONVENTIONS FOR SENSITIVE DATA

If creating files with sensitive information, ALWAYS use these patterns:
- `*_CREDENTIALS.md` - For credential storage
- `*_PASSWORDS.md` - For password documentation  
- `*_SECRETS.md` - For secret keys
- `*_PRIVATE.md` - For private information
- `*_SENSITIVE.md` - For any sensitive data

These patterns are automatically ignored by `.gitignore`

### 3. GITIGNORE ENFORCEMENT

The following are PERMANENTLY excluded from version control:
```
# Sensitive documentation
SUPABASE_CREDENTIALS_BACKUP.md
SUPABASE_VERIFIED_URLS.md
*_CREDENTIALS.md
*_PASSWORDS.md
*_SECRETS.md
*_PRIVATE.md
*_SENSITIVE.md

# Sensitive directories
credentials/
secrets/
private/

# Environment files
.env
.env.local
.env.production
.env.production.local
```

### 4. DEPLOYMENT SECURITY

**Before ANY deployment:**
1. Run `git status` to verify no sensitive files are staged
2. Check that all sensitive files are in `.gitignore`
3. Never hardcode credentials in source code
4. Use environment variables for all secrets
5. Verify build output doesn't contain sensitive data

### 5. DOCUMENTATION RULES

When documenting sensitive information:
- ✅ USE placeholders: `[PASSWORD]`, `[API_KEY]`, `[SECRET]`
- ✅ USE example values that are clearly fake
- ❌ NEVER include actual passwords or keys
- ❌ NEVER screenshot sensitive information

### 6. CODE REVIEW CHECKLIST

Before committing ANY code:
- [ ] No passwords in code
- [ ] No API keys in code
- [ ] No hardcoded URLs with credentials
- [ ] No console.log of sensitive data
- [ ] No sensitive data in comments
- [ ] All secrets use environment variables

### 7. EMERGENCY PROCEDURES

If sensitive data is accidentally committed:
1. **IMMEDIATELY** remove from repository
2. **ROTATE** all exposed credentials
3. **REVOKE** exposed API keys
4. **CHANGE** all passwords
5. **AUDIT** access logs
6. **USE** `git filter-branch` or BFG Repo-Cleaner to remove from history

### 8. ENVIRONMENT VARIABLE SECURITY

- Production secrets ONLY in Vercel dashboard
- Local secrets ONLY in `.env.local` (never commit)
- Use different secrets for dev/staging/production
- Rotate secrets regularly
- Never log environment variables

### 9. DATABASE SECURITY

- Never expose direct database URLs publicly
- Use connection pooling for production
- Implement row-level security (RLS) in Supabase
- Regular backups with encrypted storage
- Monitor for unusual access patterns

### 10. AUDIT REQUIREMENTS

Regular security audits:
- Weekly: Check for exposed secrets in codebase
- Monthly: Rotate API keys and passwords
- Quarterly: Full security audit
- Immediately: After any security incident

## 🚨 VIOLATION CONSEQUENCES

Violating these security rules can result in:
- Data breaches
- Unauthorized access
- Financial losses
- Legal liability
- Reputation damage

## ✅ COMPLIANCE CONFIRMATION

By working on this project, you confirm:
1. Understanding all security rules
2. Commitment to following these rules
3. Immediate reporting of security issues
4. Regular security training updates

---

**LAST UPDATED:** 2025-08-08
**STATUS:** ACTIVE AND ENFORCED
**PRIORITY:** CRITICAL

⚠️ **THIS DOCUMENT IS PUBLIC - DO NOT ADD SENSITIVE INFORMATION HERE**