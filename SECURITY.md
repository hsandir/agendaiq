# 🔐 Security Guidelines for AgendaIQ

## ⚠️ CRITICAL SECURITY RULES

### Environment Variables

**NEVER commit these files to version control:**
- `.env`
- `.env.local`
- `.env.production`
- `.env.production.local`
- `.env.development.local`
- Any file containing real credentials

**ALWAYS use:**
- `.env.example` or `.env.example.secure` as templates
- Environment variable services (Vercel, Heroku, etc.) for production
- Different credentials for development and production

### Sensitive Information

**NEVER expose in code or commits:**
- Database passwords
- API keys
- OAuth secrets
- JWT secrets
- Private keys
- User passwords
- Personal data

### Security Checklist

Before every commit:
- [ ] No `.env` files with real values
- [ ] No hardcoded credentials
- [ ] No console.logs with sensitive data
- [ ] No commented out credentials
- [ ] Check `.gitignore` is working

### If Credentials Are Exposed

If you accidentally commit credentials:

1. **Immediately rotate/change all exposed credentials**
2. **Remove from Git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push to all branches**
4. **Notify team members**
5. **Check for any unauthorized access**

### Environment Setup

1. Copy template:
   ```bash
   cp .env.example.secure .env.local
   ```

2. Fill in your values

3. Verify file is ignored:
   ```bash
   git status --ignored | grep .env
   ```

### Production Security

For production deployments:
- Use environment variable UI in Vercel/hosting platform
- Enable 2FA on all service accounts
- Use least privilege principle
- Rotate secrets regularly
- Monitor for unauthorized access
- Use connection pooling for databases
- Enable rate limiting

### Database Security

- Use connection pooling (PgBouncer)
- Use read replicas when possible
- Implement row-level security
- Regular backups
- Encrypt sensitive data
- Use prepared statements (Prisma does this)

### Authentication Security

- Strong password requirements
- 2FA support
- Session management
- Rate limiting on auth endpoints
- Secure cookie settings
- HTTPS only in production

### API Security

- Rate limiting
- Input validation
- CORS configuration
- API key rotation
- Request signing
- Audit logging

## 🚨 Security Contacts

If you discover a security vulnerability:
1. Do NOT create a public issue
2. Email: security@agendaiq.com (replace with real email)
3. Include details and steps to reproduce
4. Allow 48 hours for response

## 📋 Regular Security Tasks

### Daily
- Monitor error logs
- Check failed login attempts

### Weekly
- Review access logs
- Check for unusual patterns
- Update dependencies

### Monthly
- Rotate API keys
- Review user permissions
- Security audit

### Quarterly
- Full security review
- Penetration testing
- Update security policies

## 🛡️ Security Tools

Recommended tools:
- **Secrets scanning**: GitGuardian, TruffleHog
- **Dependency scanning**: Snyk, Dependabot
- **SAST**: SonarQube, CodeQL
- **Runtime protection**: Sentry, DataDog

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/authentication)
- [Vercel Security Best Practices](https://vercel.com/docs/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

**Remember**: Security is everyone's responsibility. When in doubt, ask for help!