-- ========================================
-- SNAKE_CASE STANDARDIZATION - PHASE 2: RENAME COLUMNS
-- ========================================
-- Bu script camelCase kolonları snake_case'e çevirir
-- Tarih: 2025-08-23
-- ========================================

-- Önce mevcut durumu logla
DO $$
BEGIN
    RAISE NOTICE 'Starting column rename migration...';
END $$;

-- 1. Account (şimdi account) tablosu kolonları
ALTER TABLE account RENAME COLUMN "providerAccountId" TO provider_account_id;
ALTER TABLE account RENAME COLUMN "userId" TO user_id;

-- 2. Session (şimdi session) tablosu kolonları
ALTER TABLE session RENAME COLUMN "sessionToken" TO session_token;
ALTER TABLE session RENAME COLUMN "userId" TO user_id;

-- 3. Users tablosu kolonları (zaten snake_case tablo ismi)
ALTER TABLE users RENAME COLUMN "emailVerified" TO email_verified;
ALTER TABLE users RENAME COLUMN "hashedPassword" TO hashed_password;

-- 4. VerificationToken (şimdi verification_token) tablosu kolonları
-- Not: Bu tablonun kolonları zaten snake_case olabilir, kontrol edilmeli

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Column rename migration completed successfully!';
END $$;