# AgendaIQ Git Workflow Guide

## 🎯 Overview

Bu proje feature branch workflow kullanır. Tüm değişiklikler feature branch'ler üzerinden yapılır ve main branch'e merge edilir. Her pazartesi otomatik backup oluşturulur.

## 📋 Workflow Rules

### ✅ ZORUNLU KURALLAR:
- **Ana kural**: Main branch'e doğrudan commit YAPILMAZ
- **Feature branches**: Tüm değişiklikler feature branch'ler üzerinden
- **GitHub Push**: Tüm feature branch'ler GitHub'a push edilir
- **Weekly Backup**: Her pazartesi otomatik backup branch'i oluşturulur
- **Clean History**: Merge commit'ler ile temiz git history

## 🚀 Quick Start

### 1. Yeni Feature Başlatma
```bash
# Manuel yöntem
git checkout main
git pull origin main
git checkout -b feature/my-new-feature

# Script ile (ÖNERİLEN)
./scripts/git-workflow.sh feature my-new-feature
```

### 2. Değişiklikleri Push Etme
```bash
# Manuel yöntem
git add -A
git commit -m "Your commit message"
git push -u origin feature/my-new-feature

# Script ile (ÖNERİLEN)
./scripts/git-workflow.sh push-feature
```

### 3. Feature'ı Main'e Merge Etme
```bash
# Script ile (ÖNERİLEN)
./scripts/git-workflow.sh merge-feature
```

### 4. Haftalık Backup (Otomatik)
```bash
# Manuel çalıştırma
./scripts/weekly-backup.sh

# Otomatik: Her pazartesi sabah 9:00
# Cron job ile ayarlanır
```

## 🛠️ Git Workflow Script Commands

### Ana Komutlar
```bash
# Yeni feature branch oluştur
./scripts/git-workflow.sh feature <feature-name>

# Mevcut feature branch'i push et
./scripts/git-workflow.sh push-feature

# Feature'ı main'e merge et
./scripts/git-workflow.sh merge-feature

# Haftalık backup oluştur
./scripts/git-workflow.sh weekly-backup
```

### Yardımcı Komutlar
```bash
# Feature branch'leri listele
./scripts/git-workflow.sh list-features

# Backup branch'leri listele
./scripts/git-workflow.sh list-backups

# Mevcut durumu göster
./scripts/git-workflow.sh status
```

## 📝 Naming Conventions

### Feature Branch İsimlendirme:
```
feature/sidebar-navigation-redesign
feature/user-authentication-enhancement
feature/meeting-calendar-integration
feature/system-health-monitoring
feature/database-optimization
```

### Backup Branch İsimlendirme:
```
backup/week-2024-01-15
backup/week-2024-01-22
backup/week-2024-01-29
```

### Commit Message Format:
```
FEATURE: User authentication system implemented
FIX: Sidebar scroll issue resolved
UPDATE: Database schema optimized
REFACTOR: API endpoints restructured
DOCS: Git workflow guide added
```

## 🔄 Complete Workflow Example

### Senaryo: Yeni bir özellik ekleme

1. **Feature Branch Oluştur**
```bash
./scripts/git-workflow.sh feature user-profile-enhancement
```

2. **Değişiklikleri Yap ve Commit Et**
```bash
# Kod değişiklikleri yap...
./scripts/git-workflow.sh push-feature
# Custom commit mesajı: "FEATURE: User profile editing functionality added"
```

3. **Ara Kayıtlar (İsteğe Bağlı)**
```bash
# Daha fazla değişiklik...
./scripts/git-workflow.sh push-feature
# Custom commit mesajı: "FIX: Profile validation errors resolved"
```

4. **Feature Tamamlandığında Main'e Merge**
```bash
./scripts/git-workflow.sh merge-feature
# Feature branch silinsin mi? y
```

5. **Durum Kontrolü**
```bash
./scripts/git-workflow.sh status
```

## 📅 Weekly Backup System

### Otomatik Backup (Pazartesi 09:00)
- Main branch'ten backup branch oluşturulur
- `backup/week-YYYY-MM-DD` formatında
- GitHub'a otomatik push edilir
- Son 8 hafta saklanır, eskiler otomatik silinir

### Manuel Backup
```bash
./scripts/weekly-backup.sh
```

### Backup Logs
```bash
tail -f logs/weekly-backup.log
```

## 🔍 Troubleshooting

### Feature Branch'den Main'e Geçememe
```bash
git status  # Uncommitted changes var mı?
git add -A && git commit -m "WIP: Save current progress"
git checkout main
```

### Merge Conflict
```bash
git status  # Conflict'li dosyaları gör
# Conflict'leri manuel resolve et
git add -A
git commit -m "RESOLVE: Merge conflicts fixed"
```

### Feature Branch Silme
```bash
# Local branch silme
git branch -d feature/branch-name

# Remote branch silme
git push origin --delete feature/branch-name
```

### Backup Branch'e Geri Dönme
```bash
git checkout backup/week-2024-01-15
git checkout -b feature/restore-from-backup
# Gerekli değişiklikleri yap
```

## 📊 Branch Management

### Active Branches Görme
```bash
./scripts/git-workflow.sh list-features
./scripts/git-workflow.sh list-backups
```

### Branch Cleanup
```bash
# Merged branch'leri temizle
git branch --merged main | grep -v main | xargs -n 1 git branch -d
```

## 🎯 Best Practices

### ✅ DO (Yapılacaklar):
- Her özellik için ayrı feature branch kullan
- Düzenli olarak push et (günde en az 1 kez)
- Açıklayıcı commit mesajları yaz
- Merge'den önce main'i feature branch'e merge et
- Feature tamamlandığında branch'i sil

### ❌ DON'T (Yapılmayacaklar):
- Main branch'e doğrudan commit yapma
- Feature branch'leri uzun süre açık tutma
- Generic commit mesajları ("fix", "update", vb.)
- Force push kullanma (özel durumlar hariç)
- Backup branch'leri silme

## 🛡️ Security & Backup

### Data Protection:
- Her pazartesi otomatik backup
- GitHub remote backup
- Local logs (`logs/weekly-backup.log`)
- 8 haftalık backup history

### Recovery:
- Backup branch'lerden restore
- Git reflog ile commit history
- Local backup files

## 📞 Support

### Script Sorunları:
```bash
# Script help
./scripts/git-workflow.sh

# Debug mode
bash -x ./scripts/git-workflow.sh status
```

### Git Sorunları:
```bash
# Git durumu kontrol
git status
git log --oneline -10
git branch -a
```

---

**🎉 Happy Coding!** Bu workflow sayesinde kodunuz güvenli, organize ve takip edilebilir olacak. 