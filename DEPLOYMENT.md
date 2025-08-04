# AgendaIQ Production Deployment Guide

## 🚀 Quick Start

AgendaIQ is production-ready! This guide will help you deploy the system to production environments.

## 📋 Pre-Deployment Checklist

### ✅ System Requirements
- **Node.js**: 18.x or higher
- **Database**: PostgreSQL 12+ (recommended) or MySQL 8+
- **Memory**: Minimum 2GB RAM, 4GB+ recommended
- **Storage**: 10GB+ available disk space
- **SSL Certificate**: Required for HTTPS

### ✅ Environment Variables
Create a `.env.production` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/agendaiq_prod"

# Authentication
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-super-secret-key-here-minimum-32-characters"

# Google OAuth (for authentication)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Service (for notifications)
RESEND_API_KEY="your-resend-api-key"

# Optional: Additional services
SENTRY_DSN="your-sentry-dsn-for-error-tracking"
```

## 🔧 Environment Setup

### 1. Database Setup

**PostgreSQL (Recommended)**
```sql
-- Create database
CREATE DATABASE agendaiq_prod;
CREATE USER agendaiq_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE agendaiq_prod TO agendaiq_user;
```

**MySQL Alternative**
```sql
CREATE DATABASE agendaiq_prod;
CREATE USER 'agendaiq_user'@'%' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON agendaiq_prod.* TO 'agendaiq_user'@'%';
FLUSH PRIVILEGES;
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Add `https://yourdomain.com/api/auth/callback/google` to authorized redirect URIs

### 3. Email Service Setup

1. Sign up for [Resend](https://resend.com/)
2. Get your API key
3. Verify your domain for email sending

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/agendaiq)

1. **Connect Repository**
   ```bash
   git clone https://github.com/yourusername/agendaiq.git
   cd agendaiq
   npm install -g vercel
   vercel
   ```

2. **Configure Environment Variables**
   - Go to your Vercel dashboard
   - Add all required environment variables
   - Deploy

3. **Database Setup**
   ```bash
   # Run database migrations
   npx prisma db push
   npx prisma generate
   ```

### Option 2: Docker Deployment

1. **Build Docker Image**
   ```bash
   docker build -t agendaiq .
   ```

2. **Run with Docker Compose**
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=${DATABASE_URL}
         - NEXTAUTH_URL=${NEXTAUTH_URL}
         - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
       depends_on:
         - db
     
     db:
       image: postgres:15
       environment:
         POSTGRES_DB: agendaiq_prod
         POSTGRES_USER: agendaiq_user
         POSTGRES_PASSWORD: ${DB_PASSWORD}
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

3. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Option 3: Traditional Server

1. **Server Setup** (Ubuntu/Debian)
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2 for process management
   npm install -g pm2
   
   # Install PostgreSQL
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Application Setup**
   ```bash
   # Clone and build
   git clone https://github.com/yourusername/agendaiq.git
   cd agendaiq
   npm ci
   npm run build
   
   # Setup database
   npx prisma db push
   npx prisma generate
   
   # Start with PM2
   pm2 start npm --name "agendaiq" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**
   ```nginx
   # /etc/nginx/sites-available/agendaiq
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /path/to/your/certificate.pem;
       ssl_certificate_key /path/to/your/private.key;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 🔒 Security Configuration

### 1. SSL/TLS Certificate
- Use Let's Encrypt for free SSL certificates
- Configure automatic renewal

### 2. Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP (for redirects)
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. Environment Security
- Never commit `.env` files to version control
- Use strong, unique passwords
- Regularly rotate API keys and secrets
- Enable two-factor authentication for all accounts

## 📊 Monitoring & Maintenance

### 1. Health Checks
The system includes built-in health monitoring:
- **System Health**: `/dashboard/system/health`
- **Server Metrics**: `/dashboard/system/server`
- **API Health**: `/api/system/health-check`

### 2. Log Monitoring
```bash
# PM2 logs
pm2 logs agendaiq

# System logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 3. Database Backups
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/agendaiq"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
pg_dump agendaiq_prod > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### 4. Performance Monitoring
The system includes:
- **Structured logging** with performance metrics
- **Memory usage monitoring**
- **Slow query detection**
- **API response time tracking**

## 🚨 Emergency Procedures

### 1. Quick Rollback
```bash
# Revert to previous version
git checkout [previous-commit-hash]
npm run build
pm2 restart agendaiq
```

### 2. Database Issues
```bash
# Check database connections
npx prisma db pull
npx prisma studio

# Reset database (CAUTION!)
npx prisma db reset
```

### 3. Service Recovery
```bash
# Restart services
pm2 restart agendaiq
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

## 📈 Performance Optimization

### 1. Next.js Optimizations
The system includes:
- ✅ Image optimization with WebP/AVIF support
- ✅ Bundle optimization for icons and packages
- ✅ Compression enabled
- ✅ Security headers configured

### 2. Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX idx_meetings_created_at ON meetings(created_at);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_staff_role_id ON staff(role_id);
```

### 3. Caching Strategy
- **Static assets**: CDN caching
- **Database queries**: Connection pooling
- **API responses**: HTTP caching headers

## 🧪 Testing Production

### 1. Smoke Tests
After deployment, verify:
- [ ] Homepage loads correctly
- [ ] Authentication works (Google OAuth)
- [ ] Meeting creation functions
- [ ] Admin panels accessible
- [ ] System monitoring pages work

### 2. Load Testing
```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery quick --count 10 --num 25 https://yourdomain.com
```

## 📚 Additional Resources

### Feature Overview
- **Production Monitoring**: Essential metrics and alerts for production
- **Development Tools**: Hidden in production, visible only in development
- **Authentication**: Role-based access with Turkish education hierarchy
- **Meeting Management**: Complete CRUD operations for meetings
- **System Health**: Real-time monitoring and diagnostics

### Architecture
- **Frontend**: Next.js 14 with App Router
- **Backend**: API routes with NextAuth
- **Database**: Prisma ORM with PostgreSQL/MySQL
- **Authentication**: NextAuth with Google OAuth
- **Styling**: Tailwind CSS with responsive design

### Support
- **Documentation**: Check `/docs` folder
- **Issues**: Report on GitHub
- **Monitoring**: Built-in system health dashboard

## 🎯 Production Checklist

Before going live:
- [ ] All environment variables configured
- [ ] Database migrated and seeded
- [ ] SSL certificate installed
- [ ] DNS configured
- [ ] Monitoring enabled
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Performance testing completed
- [ ] Emergency procedures tested

## 🚀 Go Live!

Once everything is configured:
1. Test all functionality thoroughly
2. Monitor system performance
3. Set up alerts for critical issues
4. Document any custom configurations
5. Train users on the system

**Your AgendaIQ system is now production-ready!** 🎉

For support and updates, visit the [GitHub repository](https://github.com/yourusername/agendaiq).