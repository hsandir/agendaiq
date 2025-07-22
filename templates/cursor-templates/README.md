# AgendaIQ Cursor Templates

Bu template'ler, Cursor AI'a yeni dosyalar oluştururken standart auth yapısını kullanmasını sağlar.

## Template'lerin Kullanımı

### 1. Server Component Template (`server-page-template.tsx`)

**Ne zaman kullanılır:**
- Dashboard sayfaları
- Settings sayfaları  
- Server-side rendering gereken sayfalar

**Cursor'a nasıl söylersiniz:**
```
"Yeni bir server component sayfa oluştur. server-page-template.tsx'teki yapıyı kullan."
```

**Değiştirilmesi gerekenler:**
- `PAGE_NAME` → Actual function name
- `PAGE_TITLE` → Sayfa başlığı
- `PAGE_DESCRIPTION` → Sayfa açıklaması
- Auth preset'i gereksinime göre değiştir
- İsteğe bağlı admin check'i aç/kapat

### 2. Client Component Template (`client-page-template.tsx`)

**Ne zaman kullanılır:**
- Interactive sayfalar
- Form'lu sayfalar
- Real-time data gereken sayfalar

**Cursor'a nasıl söylersiniz:**
```
"Yeni bir client component sayfa oluştur. client-page-template.tsx'teki yapıyı kullan."
```

**Değiştirilmesi gerekenler:**
- `PAGE_NAME` → Actual function name
- `PAGE_TITLE` → Sayfa başlığı
- `PAGE_DESCRIPTION` → Sayfa açıklaması
- Admin check'i gereksinime göre aç/kapat

### 3. API Route Template (`api-route-template.ts`)

**Ne zaman kullanılır:**
- Tüm API endpoint'leri
- Database operations
- Authentication gereken API'lar

**Cursor'a nasıl söylersiniz:**
```
"Yeni bir API route oluştur. api-route-template.ts'teki yapıyı kullan."
```

**Değiştirilmesi gerekenler:**
- `MODEL_NAME` → Prisma model adı
- `REQUIRED_FIELD` → Zorunlu alan adı
- Auth requirements'ı gereksinime göre ayarla
- Gereksiz HTTP method'ları sil

## Auth Presets Rehberi

### Server Components (requireAuth)
```typescript
AuthPresets.requireAuth      // Basic authentication
AuthPresets.requireStaff     // Staff role required
AuthPresets.requireAdmin     // Administrator only
AuthPresets.requireLeadership // Leadership roles only
```

### API Routes (withAuth)
```typescript
{ requireAuth: true }        // Basic authentication
{ requireStaff: true }       // Staff role required  
{ requireAdminRole: true }   // Administrator only
{ requireLeadership: true }  // Leadership roles only
```

## Önemli Kurallar

### ❌ YAPMAYIN:
- Variable name conflicts (`const user` iki kez kullanma)
- Auth check'siz sayfa oluşturma
- Mock data kullanma
- Custom CSS dosyaları oluşturma

### ✅ YAPN:
- Her zaman template'leri kullanın
- Auth check'leri mutlaka ekleyin
- Real-time data çekin
- Tailwind CSS kullanın
- Error handling ekleyin

## Variable Naming Conventions

```typescript
// Server Components
const user = await requireAuth(...);           // Auth user
const userDetails = await prisma.user.find...; // Prisma fetched user

// Client Components  
const { data: session } = useSession();        // Session user
const userData = await fetch(...);             // API fetched user

// API Routes
const user = authResult.user!;                 // Auth user
const userProfile = await prisma.user.find...; // Prisma fetched user
```

## Cursor Kullanım Örnekleri

### Yeni Sayfa Oluşturma
```
"templates/cursor-templates/server-page-template.tsx'i kullanarak 
/dashboard/settings/backup adresinde yeni bir backup management sayfası oluştur. 
Sadece admin'ler erişebilsin."
```

### Yeni API Oluşturma
```
"templates/cursor-templates/api-route-template.ts'i kullanarak 
/api/backup adresinde backup management API'sı oluştur. 
GET ve POST method'ları olsun, sadece admin erişebilsin."
```

### Client Component Oluşturma
```
"templates/cursor-templates/client-page-template.tsx'i kullanarak 
/dashboard/real-time-chat adresinde chat sayfası oluştur. 
Real-time mesajlaşma için WebSocket kullan."
```

Bu template'leri kullanarak tüm dosyalarda tutarlı auth yapısı sağlayın! 