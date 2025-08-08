# AgendaIQ Deployment Guide

## Production Deployment Setup

This guide covers the complete deployment process for AgendaIQ, including CI/CD pipelines, monitoring, and automated deployment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [CI/CD Pipeline](#cicd-pipeline)
3. [Deployment Options](#deployment-options)
4. [Monitoring Setup](#monitoring-setup)
5. [Security Checklist](#security-checklist)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools
- Node.js 20.x
- npm 10.x
- PostgreSQL 15+
- Git
- Docker (for monitoring stack)

### Environment Variables
Create a `.env.production` file with:

```env
DATABASE_URL=postgresql://user:password@host:5432/agendaiq
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Continuous Integration (`ci.yml`)
Automatically runs on every push and pull request:

- **Code Quality**: Linting, type checking, formatting
- **Tests**: Unit tests with coverage reporting
- **Build**: Production build verification
- **Security**: Vulnerability scanning with Trivy
- **Performance**: Lighthouse CI checks

#### 2. Deployment (`deploy.yml`)
Triggered on main branch pushes:

- **Pre-deployment checks**: Validates secrets and configuration
- **Build**: Creates optimized production build
- **Database migrations**: Runs Prisma migrations
- **Deploy**: Transfers files to production server
- **Verification**: Health checks and smoke tests
- **Rollback**: Automatic rollback on failure

### Running CI/CD Locally

```bash
# Run all quality checks
npm run lint
npm run type-check
npm run format:check

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build
```

## Deployment Options

### Option 1: Vercel (Recommended for Quick Setup)

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Deploy**:
```bash
# Production deployment
npm run deploy:vercel

# Preview deployment
npm run deploy:preview
```

3. **Configure Environment Variables**:
- Go to Vercel Dashboard → Settings → Environment Variables
- Add all required variables from `.env.production`

### Option 2: Traditional Server (VPS/Dedicated)

1. **Setup Server**:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib
```

2. **Configure GitHub Secrets**:
```
DEPLOY_HOST=your-server-ip
DEPLOY_USER=deploy-user
DEPLOY_KEY=ssh-private-key
DEPLOY_PATH=/var/www/agendaiq
DATABASE_URL=production-database-url
```

3. **Deploy**:
Push to main branch to trigger automatic deployment.

### Option 3: Docker Container

1. **Build Docker Image**:
```bash
docker build -t agendaiq:latest .
```

2. **Run Container**:
```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  --name agendaiq \
  agendaiq:latest
```

## Monitoring Setup

### 1. Deploy Monitoring Stack

```bash
cd monitoring
docker-compose up -d
```

### 2. Access Dashboards

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **AlertManager**: http://localhost:9093

### 3. Configure Alerts

Edit `monitoring/alertmanager.yml`:

```yaml
route:
  receiver: 'email-notifications'

receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'admin@yourdomain.com'
        from: 'alerts@yourdomain.com'
```

### 4. Health Check Endpoint

Monitor application health:

```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": "healthy (5ms)",
    "memory": "healthy (45MB used)"
  }
}
```

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] Database backups configured
- [ ] SSL/TLS certificates installed
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection enabled

### Post-Deployment

- [ ] Remove debug logs
- [ ] Disable source maps in production
- [ ] Configure firewall rules
- [ ] Setup intrusion detection
- [ ] Enable audit logging
- [ ] Configure backup rotation
- [ ] Test disaster recovery

## Performance Optimization

### Build Optimizations

```javascript
// next.config.js additions
module.exports = {
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  reactStrictMode: true,
}
```

### Database Optimizations

```sql
-- Add indexes for common queries
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_action_items_status ON meeting_action_items(status);
CREATE INDEX idx_staff_user_id ON staff(user_id);
```

### Caching Strategy

- Static assets: 1 year cache
- API responses: No cache (real-time data)
- Images: 30 days cache
- CSS/JS: Versioned URLs with long cache

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U username -d database_name -h localhost
```

#### 2. Build Failures
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build
```

#### 3. Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

#### 4. Port Already in Use
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Rollback Procedure

1. **Automatic Rollback** (via GitHub Actions):
   - Triggered on health check failure
   - Restores previous backup

2. **Manual Rollback**:
```bash
# SSH to server
ssh user@server

# Navigate to app directory
cd /var/www/agendaiq

# Restore backup
tar -xzf backup-YYYYMMDD-HHMMSS.tar.gz

# Restart application
pm2 restart agendaiq
```

## Maintenance

### Regular Tasks

- **Daily**: Check health endpoint, review error logs
- **Weekly**: Review performance metrics, update dependencies
- **Monthly**: Security patches, database optimization
- **Quarterly**: Disaster recovery test, security audit

### Backup Strategy

```bash
# Database backup (daily)
pg_dump agendaiq > backup-$(date +%Y%m%d).sql

# Application backup (before deployment)
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz .next public

# Keep last 30 days of backups
find ./backups -name "*.sql" -mtime +30 -delete
```

## Support

For deployment issues:
1. Check logs: `pm2 logs agendaiq`
2. Review monitoring dashboards
3. Check GitHub Actions logs
4. Contact DevOps team

## Conclusion

This deployment setup provides:
- ✅ Automated CI/CD pipeline
- ✅ Multiple deployment options
- ✅ Comprehensive monitoring
- ✅ Automatic rollback on failure
- ✅ Security best practices
- ✅ Performance optimization
- ✅ Disaster recovery

The system is now production-ready with professional-grade deployment automation.