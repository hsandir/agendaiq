# 🚀 Sentry İyileştirme Çalışma Listesi

## 📅 Sprint 1: Kritik Düzeltmeler (Hafta 1)

### 🔴 P0 - Acil (İlk 2 Gün)

#### 1. Replay Sample Rate Optimizasyonu
```bash
# Task ID: SENTRY-001
# Assignee: Frontend Team
# Time: 1 saat
```
- [ ] `instrumentation-client.ts` dosyasında replay oranlarını düşür
- [ ] Production: replaysOnErrorSampleRate %100 → %10
- [ ] Production: replaysSessionSampleRate %10 → %1
- [ ] Test et ve deploy et

#### 2. Release Naming Convention
```bash
# Task ID: SENTRY-002
# Assignee: DevOps
# Time: 2 saat
```
- [ ] Package.json'a version field ekle
- [ ] Environment variable olarak APP_VERSION tanımla
- [ ] Release format: `agendaiq@web@{version}+{commit_sha}`
- [ ] CI/CD pipeline'da release name'i güncelle

#### 3. Browser Extension Filtreleme
```bash
# Task ID: SENTRY-003
# Assignee: Frontend Team
# Time: 1 saat
```
- [ ] denyUrls listesi ekle (chrome-extension, moz-extension, etc.)
- [ ] ignoreErrors listesini genişlet
- [ ] Test et (özellikle ad blocker'larla)

### 🟡 P1 - Yüksek Öncelik (3-5. Gün)

#### 4. Sourcemap Upload Pipeline
```bash
# Task ID: SENTRY-004
# Assignee: DevOps
# Time: 4 saat
```
- [ ] sentry-cli'yi CI/CD'ye ekle
- [ ] Build sonrası sourcemap upload script'i
- [ ] Sourcemap'leri public'ten gizle
- [ ] Vercel deployment hook'una entegre et

#### 5. Tag Standardizasyonu
```bash
# Task ID: SENTRY-005
# Assignee: Backend Team
# Time: 2 saat
```
- [ ] Global tag set oluştur (service, region, tenant_id)
- [ ] User context hash implementasyonu
- [ ] Staff/School bilgilerini tag olarak ekle
- [ ] Tüm servislerde uygula

#### 6. Dynamic Sampling Implementation
```bash
# Task ID: SENTRY-006
# Assignee: Full Stack
# Time: 3 saat
```
- [ ] tracesSampler fonksiyonu yaz
- [ ] Critical path'leri belirle
- [ ] Health check filtreleme
- [ ] Error-based upsampling

---

## 📅 Sprint 2: Monitoring Geliştirme (Hafta 2-3)

### 🟡 P1 - Performance Monitoring

#### 7. Web Vitals Tracking
```bash
# Task ID: SENTRY-007
# Assignee: Frontend Team
# Time: 4 saat
```
- [ ] BrowserTracing integration ekle
- [ ] LCP, INP, CLS metrics aktivasyonu
- [ ] Custom performance marks ekle
- [ ] Dashboard'da görüntüleme

#### 8. Transaction Tracking
```bash
# Task ID: SENTRY-008
# Assignee: Backend Team
# Time: 3 saat
```
- [ ] Critical API endpoints için manual span
- [ ] Database query tracking
- [ ] External API call tracking
- [ ] Queue/Background job tracking

#### 9. Error Boundary Implementation
```bash
# Task ID: SENTRY-009
# Assignee: Frontend Team
# Time: 3 saat
```
- [ ] Global error boundary ekle
- [ ] Component-level error boundaries
- [ ] Sentry.ErrorBoundary kullan
- [ ] Fallback UI tasarımı

### 🟢 P2 - Alert Sistemi

#### 10. Alert Rules Configuration
```bash
# Task ID: SENTRY-010
# Assignee: DevOps
# Time: 4 saat
```
- [ ] Error rate spike alert
- [ ] New critical issue alert
- [ ] Performance degradation alert
- [ ] Crash rate alert
- [ ] Release regression alert

#### 11. Slack Integration
```bash
# Task ID: SENTRY-011
# Assignee: DevOps
# Time: 2 saat
```
- [ ] Slack workspace bağlantısı
- [ ] Channel mapping (#sev1, #sev2, #triage)
- [ ] Alert formatting
- [ ] Test alerts

#### 12. Dashboard Creation
```bash
# Task ID: SENTRY-012
# Assignee: DevOps + Product
# Time: 6 saat
```
- [ ] Executive Dashboard
- [ ] Error Triage Dashboard
- [ ] Performance Dashboard
- [ ] Release Health Dashboard
- [ ] Custom queries

---

## 📅 Sprint 3: Operasyonel Olgunluk (Hafta 4)

### 🟢 P2 - Advanced Features

#### 13. Crons Monitoring
```bash
# Task ID: SENTRY-013
# Assignee: Backend Team
# Time: 4 saat
```
- [ ] Daily report generation monitoring
- [ ] Backup job monitoring
- [ ] Email queue processing monitoring
- [ ] Data sync job monitoring

#### 14. Issue Owners Setup
```bash
# Task ID: SENTRY-014
# Assignee: DevOps
# Time: 3 saat
```
- [ ] CODEOWNERS file oluştur
- [ ] Sentry'de ownership rules
- [ ] Auto-assignment configuration
- [ ] Team mapping

#### 15. Custom Fingerprinting
```bash
# Task ID: SENTRY-015
# Assignee: Full Stack
# Time: 4 saat
```
- [ ] Similar error grouping rules
- [ ] Database error fingerprinting
- [ ] Network error fingerprinting
- [ ] Business logic error grouping

### 🔵 P3 - Documentation

#### 16. Runbook Creation
```bash
# Task ID: SENTRY-016
# Assignee: All Teams
# Time: 8 saat
```
- [ ] Login flow troubleshooting
- [ ] Payment processing errors
- [ ] Meeting creation failures
- [ ] Database connection issues
- [ ] External API failures

#### 17. Monitoring Playbook
```bash
# Task ID: SENTRY-017
# Assignee: DevOps
# Time: 4 saat
```
- [ ] Alert response procedures
- [ ] Escalation matrix
- [ ] Rollback procedures
- [ ] Communication templates

---

## 📅 Sprint 4: İleri Seviye (Ay 2)

### 🔵 P3 - Advanced Monitoring

#### 18. Distributed Tracing
```bash
# Task ID: SENTRY-018
# Assignee: Full Stack
# Time: 8 saat
```
- [ ] Frontend-Backend trace bağlantısı
- [ ] Microservice trace propagation
- [ ] External service tracing
- [ ] Trace visualization

#### 19. Profiling Activation
```bash
# Task ID: SENTRY-019
# Assignee: Backend Team
# Time: 4 saat
```
- [ ] profilesSampleRate configuration
- [ ] CPU profiling
- [ ] Memory profiling
- [ ] Performance bottleneck analysis

#### 20. A/B Test Error Tracking
```bash
# Task ID: SENTRY-020
# Assignee: Product + Frontend
# Time: 6 saat
```
- [ ] Feature flag integration
- [ ] Experiment tagging
- [ ] Error rate by variant
- [ ] Performance by variant

---

## 📊 Başarı Kriterleri

### Sprint 1 Sonunda
- ✅ Replay maliyeti %80 azalmış
- ✅ Release naming standardı uygulanmış
- ✅ Browser extension gürültüsü %50 azalmış
- ✅ Sourcemap'ler production'da çalışıyor

### Sprint 2 Sonunda
- ✅ Web Vitals tracking aktif
- ✅ Critical path'ler için alertler kurulu
- ✅ 3 ana dashboard hazır
- ✅ Slack entegrasyonu çalışıyor

### Sprint 3 Sonunda
- ✅ Tüm batch job'lar monitör ediliyor
- ✅ Issue'ların %80'i auto-assigned
- ✅ Runbook'lar hazır
- ✅ MTTA < 15 dakika

### Sprint 4 Sonunda
- ✅ Full distributed tracing
- ✅ Profiling ile bottleneck'ler tespit edilmiş
- ✅ A/B test error tracking aktif
- ✅ MTTR < 2 saat

---

## 👥 Takım Sorumlulukları

### Frontend Team
- Client-side configuration
- Web Vitals implementation
- Error boundaries
- UI error tracking

### Backend Team
- Server-side configuration
- Transaction tracking
- Crons monitoring
- Database tracking

### DevOps Team
- CI/CD integration
- Alert configuration
- Dashboard creation
- Monitoring maintenance

### Product Team
- SLO definition
- Priority setting
- Dashboard requirements
- Success metrics

---

## 📈 Tahmin Edilen Efor

| Sprint | Toplam Saat | Kişi | Tahmini Süre |
|--------|------------|------|--------------|
| Sprint 1 | 24 saat | 3 kişi | 1 hafta |
| Sprint 2 | 36 saat | 4 kişi | 2 hafta |
| Sprint 3 | 32 saat | 4 kişi | 1 hafta |
| Sprint 4 | 28 saat | 3 kişi | 2 hafta |
| **TOPLAM** | **120 saat** | **4 kişi** | **6 hafta** |

---

## 🎯 Quick Wins (İlk 24 Saat)

1. **Replay rate düşürme** → Anında %80 maliyet tasarrufu
2. **denyUrls ekleme** → %30-40 gürültü azalması
3. **Release naming** → Deploy tracking başlar
4. **Basic alerts** → Critical issue'ları kaçırmama

---

## 📝 Notlar

- Her task için test senaryoları yazılmalı
- Production deployment'ları feature flag ile kontrollü yapılmalı
- Her sprint sonunda retrospective yapılmalı
- Monitoring metrics haftalık review edilmeli

---

*Son Güncelleme: 2025-01-10*
*Versiyon: 1.0*