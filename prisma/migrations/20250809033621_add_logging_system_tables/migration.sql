-- CreateEnum
CREATE TYPE "public"."LogLevel" AS ENUM ('TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL');

-- CreateEnum
CREATE TYPE "public"."DevLogCategory" AS ENUM ('system', 'database', 'api', 'auth', 'performance', 'error', 'network', 'cache', 'external', 'build');

-- CreateEnum
CREATE TYPE "public"."AuditLogCategory" AS ENUM ('user_action', 'login_attempt', 'permission_check', 'data_access', 'data_modification', 'admin_action', 'security_violation', 'compliance', 'export', 'import');

-- CreateEnum
CREATE TYPE "public"."AuditLogResult" AS ENUM ('success', 'failure', 'blocked');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateTable
CREATE TABLE "public"."dev_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "level" "public"."LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "category" "public"."DevLogCategory" NOT NULL,
    "component" TEXT,
    "function" TEXT,
    "file" TEXT,
    "line" INTEGER,
    "stack" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "context" TEXT,
    "metadata" TEXT,
    "performance" TEXT,
    "user_id" INTEGER,
    "staff_id" INTEGER,
    "session_id" TEXT,
    "user_agent" TEXT,
    "ip" TEXT,
    "path" TEXT,
    "method" TEXT,
    "status_code" INTEGER,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "level" "public"."LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "category" "public"."AuditLogCategory" NOT NULL,
    "action" TEXT NOT NULL,
    "result" "public"."AuditLogResult" NOT NULL,
    "risk_level" "public"."RiskLevel" NOT NULL,
    "actor" TEXT NOT NULL,
    "target" TEXT,
    "context" TEXT,
    "metadata" TEXT,
    "compliance" TEXT,
    "location" TEXT,
    "user_id" INTEGER NOT NULL,
    "staff_id" INTEGER,
    "user_agent" TEXT,
    "ip" TEXT,
    "path" TEXT,
    "method" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dev_logs_timestamp_idx" ON "public"."dev_logs"("timestamp");

-- CreateIndex
CREATE INDEX "dev_logs_level_idx" ON "public"."dev_logs"("level");

-- CreateIndex
CREATE INDEX "dev_logs_category_idx" ON "public"."dev_logs"("category");

-- CreateIndex
CREATE INDEX "dev_logs_user_id_idx" ON "public"."dev_logs"("user_id");

-- CreateIndex
CREATE INDEX "dev_logs_component_idx" ON "public"."dev_logs"("component");

-- CreateIndex
CREATE INDEX "dev_logs_environment_idx" ON "public"."dev_logs"("environment");

-- CreateIndex
CREATE INDEX "dev_logs_status_code_idx" ON "public"."dev_logs"("status_code");

-- CreateIndex
CREATE INDEX "security_logs_timestamp_idx" ON "public"."security_logs"("timestamp");

-- CreateIndex
CREATE INDEX "security_logs_level_idx" ON "public"."security_logs"("level");

-- CreateIndex
CREATE INDEX "security_logs_category_idx" ON "public"."security_logs"("category");

-- CreateIndex
CREATE INDEX "security_logs_user_id_idx" ON "public"."security_logs"("user_id");

-- CreateIndex
CREATE INDEX "security_logs_risk_level_idx" ON "public"."security_logs"("risk_level");

-- CreateIndex
CREATE INDEX "security_logs_result_idx" ON "public"."security_logs"("result");

-- CreateIndex
CREATE INDEX "security_logs_action_idx" ON "public"."security_logs"("action");

-- AddForeignKey
ALTER TABLE "public"."dev_logs" ADD CONSTRAINT "dev_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."dev_logs" ADD CONSTRAINT "dev_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."security_logs" ADD CONSTRAINT "security_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."security_logs" ADD CONSTRAINT "security_logs_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
