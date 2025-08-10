# 📊 Sentry Konfigürasyon Analiz Raporu - AgendaIQ

## 📋 Yönetici Özeti

Bu rapor, AgendaIQ'nun mevcut Sentry konfigürasyonunu profesyonel standartlarla karşılaştırarak eksiklikleri, avantajları ve iyileştirme alanlarını detaylandırmaktadır.

---

## 1. 🔍 MEVCUT DURUM ANALİZİ

### ✅ Sahip Olduklarımız (Güçlü Yönler)

#### 1.1 Temel Konfigürasyon
- ✅ **Environment ayrımı**: Development/Production ayrımı mevcut
- ✅ **DSN yönetimi**: Environment bazlı DSN kontrolü var
- ✅ **Sensitive data maskeleme**: Temel seviyede (Authorization, Cookie, password, token)
- ✅ **Error filtreleme**: ECONNRESET, ECONNREFUSED gibi network hataları filtreleniyor
- ✅ **Replay entegrasyonu**: Session replay konfigüre edilmiş
- ✅ **Release tracking**: Vercel commit SHA ile release takibi
- ✅ **Domain filtreleme**: allowUrls ile sadece kendi domainimizden hatalar
- ✅ **Sampling strategy**: Production'da %10 trace sampling

#### 1.2 Güvenlik
- ✅ Sensitive field maskeleme (password, token, secret, apiKey)
- ✅ Auth header temizleme
- ✅ Cookie bilgilerini kaldırma
- ✅ Query string parametrelerini temizleme

### ❌ Eksiklerimiz (İyileştirme Alanları)

#### 1.1 Kritik Eksikler
- ❌ **Release naming convention yok**: Standart format eksik (company@app@version+sha)
- ❌ **Sourcemap upload yok**: Production'da stack trace'ler okunamaz
- ❌ **Dynamic sampling yok**: tracesSampler fonksiyonu kullanılmıyor
- ❌ **Crons monitoring yok**: Batch job takibi eksik
- ❌ **Performance monitoring eksik**: Web Vitals (LCP, INP, CLS) takibi yok
- ❌ **Issue Owners tanımlı değil**: Otomatik atama mekanizması yok
- ❌ **Fingerprinting kuralları yok**: Benzer hatalar farklı issue olarak görünebilir

#### 1.2 Orta Seviye Eksikler
- ⚠️ **Tag standardizasyonu eksik**: service, tenant_id, user_id_hash, region, commit tagleri yok
- ⚠️ **Deploy markers yok**: Deploy anı işaretlenmiyor
- ⚠️ **Profiling yok**: profilesSampleRate tanımlı değil
- ⚠️ **Manual span ekleme yok**: Kritik iş akışları için özel span'ler eksik
- ⚠️ **tracePropagationTargets eksik**: Backend ile trace bağlantısı yok
- ⚠️ **denyUrls eksik**: Browser extension gürültüsü filtrelenmiyor

#### 1.3 Operasyonel Eksikler
- ⚠️ **Alert kuralları tanımlı değil**: Crash rate, error spike, performance degradation alertleri yok
- ⚠️ **Dashboard/Panel eksik**: Executive, Triage, Performance panoları yok
- ⚠️ **SLO tanımları yok**: Crash-free users, p95 latency hedefleri belirsiz
- ⚠️ **Runbook entegrasyonu yok**: Hata durumunda ne yapılacağı belirsiz

---

## 2. 📊 DETAYLI KARŞILAŞTIRMA TABLOSU

| Özellik | Mevcut Durum | Önerilen Standard | Gap Analizi | Öncelik |
|---------|--------------|-------------------|-------------|---------|
| **Release Naming** | `VERCEL_GIT_COMMIT_SHA` | `agendaiq@web@1.0.0+abc123` | Format standardı yok | 🔴 Kritik |
| **Sourcemap Upload** | ❌ Yok | CI/CD'de otomatik upload | Stack trace okunamaz | 🔴 Kritik |
| **Environment** | `development/production` | `development/staging/production` | Staging eksik | 🟡 Orta |
| **Trace Sample Rate** | Production: %10 | Dynamic: %10-20 + koşullu | Koşullu sampling yok | 🟡 Orta |
| **Error Sample Rate** | %100 (implicit) | %100 | ✅ Uygun | 🟢 Tamam |
| **Replay on Error** | Production: %100 | %5-10 | Çok yüksek (maliyet) | 🔴 Kritik |
| **Session Replay** | Production: %10 | %0-1 | Yüksek (maliyet) | 🟡 Orta |
| **Performance Monitoring** | ❌ Yok | Web Vitals + Transaction | Performans körü | 🔴 Kritik |
| **Tags** | Temel | service, tenant_id, user_hash | Yetersiz metadata | 🟡 Orta |
| **beforeSend** | Basit maskeleme | Regex tabanlı kapsamlı | PII riski | 🔴 Kritik |
| **ignoreErrors** | Temel liste | Kapsamlı gürültü filtresi | Gürültü fazla | 🟡 Orta |
| **denyUrls** | ❌ Yok | Extension/3rd party filter | False positive fazla | 🟡 Orta |
| **Crons** | ❌ Yok | Sentry Crons entegrasyonu | Batch job takibi yok | 🟡 Orta |
| **Issue Owners** | ❌ Yok | CODEOWNERS entegrasyonu | Manuel triage | 🔴 Kritik |
| **Alerts** | ❌ Yok | Multi-tier alert sistemi | Reaktif yaklaşım | 🔴 Kritik |
| **Dashboards** | ❌ Yok | Executive/Triage/Perf | Görünürlük eksik | 🔴 Kritik |

---

## 3. 🎯 ÖNERİLEN İYİLEŞTİRMELER

### 3.1 Acil Aksiyonlar (1. Hafta)

#### A. Release & Sourcemap Düzeltmesi
```typescript
// sentry.config.js
release: `agendaiq@web@${process.env.NEXT_PUBLIC_APP_VERSION}+${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7)}`

// CI/CD Pipeline eklemesi
sentry-cli releases new $RELEASE_NAME
sentry-cli releases files $RELEASE_NAME upload-sourcemaps ./build
sentry-cli releases finalize $RELEASE_NAME
sentry-cli releases deploys $RELEASE_NAME new -e production
```

#### B. Replay Sample Rate Optimizasyonu
```typescript
replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,  // %100'den %10'a
replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0, // %10'dan %1'e
```

#### C. Tag Standardizasyonu
```typescript
Sentry.setTags({
  service: 'web',
  region: process.env.VERCEL_REGION || 'us-east-1',
  deployment_id: process.env.VERCEL_DEPLOYMENT_ID,
  commit: process.env.VERCEL_GIT_COMMIT_SHA
});

// User context (hash'li)
Sentry.setUser({
  id: hashUserId(user.id),
  username: user.username, // email değil
  tenant_id: user.staff?.school_id
});
```

### 3.2 Kısa Vadeli İyileştirmeler (2-3. Hafta)

#### A. Dynamic Sampling Implementation
```typescript
tracesSampler: (samplingContext) => {
  // Health check'leri örnekleme
  if (samplingContext.request?.url?.includes('/api/health')) {
    return 0;
  }
  
  // Hatalı işlemleri %100 örnekle
  if (samplingContext.error) {
    return 1.0;
  }
  
  // Kritik endpointler için yüksek örnekleme
  const criticalPaths = ['/api/auth', '/api/meetings', '/api/staff'];
  if (criticalPaths.some(path => samplingContext.request?.url?.includes(path))) {
    return 0.5;
  }
  
  // Default sampling
  return process.env.NODE_ENV === 'production' ? 0.1 : 0.3;
}
```

#### B. Performance Monitoring Ekleme
```typescript
// Web Vitals tracking
Sentry.init({
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'agendaiq.com', /^\//],
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ],
});
```

#### C. Gelişmiş Error Filtreleme
```typescript
denyUrls: [
  // Browser extensions
  /extensions\//i,
  /^chrome:\/\//i,
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  
  // 3rd party scripts
  /graph\.facebook\.com/i,
  /connect\.facebook\.net/i,
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /google\.com\/recaptcha/i,
  /gstatic\.com/i,
  /doubleclick\.net/i,
  
  // Common crawlers
  /127\.0\.0\.1:4001\/isrunning/i,
  /localhost:4001\/isrunning/i,
],

ignoreErrors: [
  // Network errors
  'NetworkError',
  'Failed to fetch',
  'Load failed',
  
  // Browser quirks
  'ResizeObserver loop limit exceeded',
  'ResizeObserver loop completed with undelivered notifications',
  'Non-Error promise rejection captured',
  
  // React/Next.js specific
  'ChunkLoadError',
  'Loading chunk',
  'Hydration failed',
  
  // Safari quirks
  'AbortError',
  'NotAllowedError',
  
  // Chrome specific
  'The play() request was interrupted',
  'The operation was aborted',
]
```

### 3.3 Orta Vadeli İyileştirmeler (1. Ay)

#### A. Alert Sistemi Kurulumu
```yaml
# Önerilen Alert Kuralları

1. Yeni Kritik Hatalar
   - Koşul: level:error, 10dk'da >10 unique user veya >50 event
   - Aksiyon: Slack #sev2-degradation
   
2. Error Rate Spike
   - Koşul: failure_rate() > %1, 15dk pencere
   - Aksiyon: Slack #sev2-degradation + PagerDuty

3. Performance Degradation
   - Koşul: p95(transaction.duration) > 800ms for /api/meetings
   - Aksiyon: Slack #performance-alerts

4. Crash Rate Alert
   - Koşul: crash_free_users < %99
   - Aksiyon: Slack #sev1-outage + PagerDuty + Email

5. Release Regression
   - Koşul: Resolved issue tekrar açıldı
   - Aksiyon: Slack #dev-triage + Auto-assign
```

#### B. Dashboard Yapılandırması
```yaml
# Executive Dashboard
- Crash-free users & sessions (trend)
- Error rate by service
- p95/p99 latency (kritik akışlar)
- Release health & adoption
- Top 5 issues by user impact

# Error Triage Dashboard
- New/Reopened/Regression issues
- Unhandled exceptions
- Errors by release comparison
- User impact heatmap
- Stack trace quick access

# Performance Dashboard
- Transaction latency (p50/p95/p99)
- Database query performance
- API dependency health
- Web Vitals (LCP/INP/CLS)
- Slow endpoints list
```

#### C. Crons Monitoring
```typescript
// Batch job monitoring
import * as Sentry from '@sentry/nextjs';

// Job başlangıcı
const checkInId = Sentry.captureCheckIn({
  monitorSlug: 'daily-report-generation',
  status: 'in_progress'
});

try {
  await generateDailyReports();
  
  // Başarılı tamamlanma
  Sentry.captureCheckIn({
    checkInId,
    monitorSlug: 'daily-report-generation',
    status: 'ok'
  });
} catch (error) {
  // Hata durumu
  Sentry.captureCheckIn({
    checkInId,
    monitorSlug: 'daily-report-generation',
    status: 'error'
  });
  throw error;
}
```

---

## 4. 📈 MALİYET OPTİMİZASYONU

### Mevcut Tahmini Maliyet (Aylık)
- **Errors**: Sınırsız (plan dahilinde)
- **Transactions**: ~500K transaction × %10 sampling = 50K
- **Replays**: ~10K session × %100 error × %10 session = 11K
- **Tahmini**: ~$200-300/ay

### Optimize Edilmiş Maliyet
- **Errors**: Sınırsız (değişmez)
- **Transactions**: Dynamic sampling ile ~30K
- **Replays**: %10 error × %1 session = ~1K
- **Tahmini**: ~$100-150/ay (%50 tasarruf)

---

## 5. 🚀 UYGULAMA YOL HARİTASI

### Faz 1: Temel Düzeltmeler (1. Hafta)
- [ ] Release naming convention
- [ ] Replay sample rate düşürme
- [ ] Basic tag ekleme
- [ ] denyUrls konfigürasyonu

### Faz 2: Monitoring Geliştirme (2-3. Hafta)
- [ ] Sourcemap upload pipeline
- [ ] Dynamic sampling
- [ ] Performance monitoring
- [ ] Web Vitals tracking

### Faz 3: Operasyonel Olgunluk (1. Ay)
- [ ] Alert kuralları
- [ ] Dashboard oluşturma
- [ ] Issue Owners entegrasyonu
- [ ] Crons monitoring

### Faz 4: İleri Seviye (2. Ay)
- [ ] Custom fingerprinting
- [ ] Distributed tracing
- [ ] Profiling aktivasyonu
- [ ] A/B test error tracking

---

## 6. 🎯 BAŞARI METRİKLERİ (KPI)

### Hedef SLO'lar
| Metrik | Mevcut | 1. Ay Hedefi | 3. Ay Hedefi |
|--------|--------|--------------|--------------|
| **Crash-free users** | Ölçülmüyor | >%99.0 | >%99.5 |
| **Crash-free sessions** | Ölçülmüyor | >%98.5 | >%99.0 |
| **MTTA (Mean Time to Acknowledge)** | Ölçülmüyor | <30 dk | <10 dk |
| **MTTR (Mean Time to Resolve)** | Ölçülmüyor | <4 saat | <2 saat |
| **Error rate** | Ölçülmüyor | <%0.5 | <%0.2 |
| **p95 latency** | Ölçülmüyor | <1000ms | <500ms |
| **p99 latency** | Ölçülmüyor | <2000ms | <1500ms |

### Operasyonel Metrikler
- **Issue noise reduction**: %50 azalma (ignoreErrors/denyUrls ile)
- **Auto-assigned issues**: %80 (Issue Owners ile)
- **Sourcemap coverage**: %100 (production builds)
- **Alert accuracy**: %90 (false positive <10%)

---

## 7. 🔒 GÜVENLİK VE UYUMLULUK

### Veri Gizliliği Gereksinimleri
```typescript
// Geliştirilmiş PII maskeleme
beforeSend(event, hint) {
  // Email maskeleme
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  
  // Telefon maskeleme
  const phoneRegex = /(\+?[0-9]{1,3}[-.\s]?\(?[0-9]{1,3}\)?[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{4})/gi;
  
  // TC Kimlik No maskeleme
  const tcRegex = /\b[1-9][0-9]{10}\b/g;
  
  // IBAN maskeleme
  const ibanRegex = /[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}/gi;
  
  // Recursive maskeleme fonksiyonu
  const maskSensitiveData = (obj) => {
    // Implementation...
  };
  
  return maskSensitiveData(event);
}
```

### GDPR/KVKK Uyumluluğu
- User ID hash'leme zorunlu
- Email adresi asla plain text gönderilmemeli
- IP adresi maskeleme opsiyonu
- Data retention 30 gün
- User consent tracking

---

## 8. 📋 POLİTİKA ÖNERİSİ

### AgendaIQ Sentry Monitoring Policy v1.0

#### A. Genel İlkeler
1. **Tüm production hatalar Sentry'de loglanmalı**
2. **PII/sensitive data asla Sentry'ye gönderilmemeli**
3. **Her release sourcemap ile deploy edilmeli**
4. **Critical path'ler için SLO'lar tanımlı olmalı**

#### B. Development Standartları
```yaml
Environment: development
DSN: Ayrı development DSN kullan
Sampling:
  - Errors: %100
  - Traces: %30
  - Replays: %0
Debug: true (lokal development)
Alerts: Kapalı
```

#### C. Production Standartları
```yaml
Environment: production
DSN: Production DSN
Sampling:
  - Errors: %100
  - Traces: %10-20 (dynamic)
  - Replays: %5 on error, %0.5 session
Debug: false
Alerts: Multi-tier (SEV1/SEV2/SEV3)
Monitoring: 7/24
```

#### D. Incident Response
```yaml
SEV1 (Outage):
  - Tanım: Crash rate >%5 veya core feature down
  - Response: 5dk içinde acknowledge
  - Escalation: Immediate PagerDuty
  - Resolution: <1 saat

SEV2 (Degradation):
  - Tanım: Error rate >%1 veya p95 >2x baseline
  - Response: 15dk içinde acknowledge
  - Escalation: Slack + Email
  - Resolution: <4 saat

SEV3 (Issue):
  - Tanım: Yeni error veya minor performance degradation
  - Response: 1 saat içinde triage
  - Escalation: Slack only
  - Resolution: <24 saat
```

#### E. Rollback Kriterleri
- Crash-free users <%99
- Error rate >%2
- p95 latency >2x previous release
- Critical feature failure

#### F. Sorumluluklar
```yaml
Development Team:
  - Sourcemap upload
  - Error handling
  - Performance optimization
  - Issue resolution

DevOps Team:
  - Alert configuration
  - Dashboard maintenance
  - Release monitoring
  - Incident coordination

Product Team:
  - SLO definition
  - Priority setting
  - User impact assessment
  - Release decisions
```

---

## 9. 🎓 EĞİTİM VE DÖKÜMANTASYON

### Gerekli Eğitimler
1. **Sentry Basics** (Tüm developers)
2. **Error Triage Process** (On-call team)
3. **Dashboard Interpretation** (Management)
4. **Alert Response** (DevOps)

### Dokümantasyon Gereksinimleri
- Runbook for each critical path
- Alert response playbook
- Dashboard kullanım kılavuzu
- Troubleshooting guide

---

## 10. 📊 SONUÇ VE ÖNERİLER

### Güçlü Yönlerimiz
- Temel Sentry entegrasyonu çalışıyor
- Security-conscious yaklaşım var
- Environment separation mevcut

### Kritik Eksiklerimiz
1. **Sourcemap yokluğu** debugging'i imkansız kılıyor
2. **Alert sistemi yokluğu** reaktif kalmamıza neden oluyor
3. **Performance monitoring eksikliği** kullanıcı deneyimini körleştiriyor
4. **Yüksek replay sampling** gereksiz maliyet yaratıyor

### Öncelikli Aksiyonlar
1. **Hafta 1**: Replay rate düşürme + Release naming
2. **Hafta 2**: Sourcemap upload + Dynamic sampling
3. **Hafta 3**: Alert kuralları + Basic dashboards
4. **Ay 1**: Full monitoring suite aktivasyonu

### ROI Beklentisi
- **MTTA/MTTR**: %50 iyileşme
- **User-reported bugs**: %70 azalma
- **Debugging time**: %60 azalma
- **Monitoring cost**: %40 azalma
- **Customer satisfaction**: +15 NPS puan

---

*Rapor Tarihi: 2025-01-10*
*Hazırlayan: AgendaIQ DevOps Team*
*Versiyon: 1.0*