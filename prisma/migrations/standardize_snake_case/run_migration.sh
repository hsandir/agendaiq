#!/bin/bash

# ========================================
# SNAKE_CASE DATABASE MIGRATION SCRIPT
# ========================================
# Bu script database'i güvenli bir şekilde snake_case'e çevirir
# Tarih: 2025-08-23
# ========================================

set -e  # Hata durumunda script'i durdur

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="agendaiq"
BACKUP_DIR="./backups"
MIGRATION_DIR="./prisma/migrations/standardize_snake_case"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SNAKE_CASE DATABASE MIGRATION${NC}"
echo -e "${GREEN}========================================${NC}"

# Function to create backup
backup_database() {
    echo -e "${YELLOW}Step 1: Creating database backup...${NC}"
    mkdir -p $BACKUP_DIR
    
    # Full backup
    pg_dump $DB_NAME > "$BACKUP_DIR/backup_${TIMESTAMP}.sql"
    
    # Schema only backup
    pg_dump $DB_NAME --schema-only > "$BACKUP_DIR/schema_${TIMESTAMP}.sql"
    
    echo -e "${GREEN}✓ Backup created: $BACKUP_DIR/backup_${TIMESTAMP}.sql${NC}"
}

# Function to check current state
check_current_state() {
    echo -e "${YELLOW}Step 2: Checking current database state...${NC}"
    
    # Count PascalCase tables
    PASCAL_TABLES=$(psql $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name ~ '[A-Z]' AND table_name NOT LIKE '_prisma%';")
    
    echo -e "Found ${RED}$PASCAL_TABLES${NC} PascalCase tables"
    
    # Show them
    echo -e "${YELLOW}PascalCase tables to be renamed:${NC}"
    psql $DB_NAME -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name ~ '[A-Z]' AND table_name NOT LIKE '_prisma%';"
}

# Function to run migration
run_migration() {
    echo -e "${YELLOW}Step 3: Running migration...${NC}"
    
    # Rename tables
    echo -e "Renaming tables..."
    psql $DB_NAME < "$MIGRATION_DIR/01_rename_tables.sql"
    
    # Rename columns
    echo -e "Renaming columns..."
    psql $DB_NAME < "$MIGRATION_DIR/02_rename_columns.sql"
    
    echo -e "${GREEN}✓ Migration completed${NC}"
}

# Function to verify migration
verify_migration() {
    echo -e "${YELLOW}Step 4: Verifying migration...${NC}"
    
    psql $DB_NAME < "$MIGRATION_DIR/04_verify.sql"
    
    # Check if any PascalCase remains
    REMAINING=$(psql $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name ~ '[A-Z]' AND table_name NOT LIKE '_prisma%';")
    
    if [ "$REMAINING" -eq 0 ]; then
        echo -e "${GREEN}✓ All tables are now in snake_case!${NC}"
    else
        echo -e "${RED}✗ Warning: $REMAINING tables still have PascalCase${NC}"
    fi
}

# Function to update Prisma
update_prisma() {
    echo -e "${YELLOW}Step 5: Updating Prisma...${NC}"
    
    echo -e "Generating Prisma Client..."
    npx prisma generate
    
    echo -e "${GREEN}✓ Prisma Client updated${NC}"
}

# Function to rollback
rollback() {
    echo -e "${RED}ROLLBACK: Reverting changes...${NC}"
    
    psql $DB_NAME < "$MIGRATION_DIR/03_rollback.sql"
    
    echo -e "${GREEN}✓ Rollback completed${NC}"
}

# Main execution
main() {
    echo -e "${YELLOW}This will modify your database structure!${NC}"
    echo -e "Database: ${RED}$DB_NAME${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo -e "${RED}Migration cancelled.${NC}"
        exit 1
    fi
    
    # Run migration steps
    backup_database
    check_current_state
    
    echo -e "${YELLOW}Ready to run migration. Continue? (yes/no):${NC}"
    read -p "" run_confirm
    
    if [ "$run_confirm" != "yes" ]; then
        echo -e "${RED}Migration cancelled.${NC}"
        exit 1
    fi
    
    run_migration
    verify_migration
    update_prisma
    
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}MIGRATION COMPLETED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}========================================${NC}"
    
    echo -e "${YELLOW}Next steps:${NC}"
    echo -e "1. Test your application thoroughly"
    echo -e "2. If issues found, run: ${RED}./run_migration.sh rollback${NC}"
    echo -e "3. Deploy updated code with new Prisma Client"
}

# Handle command line arguments
if [ "$1" == "rollback" ]; then
    rollback
elif [ "$1" == "verify" ]; then
    verify_migration
elif [ "$1" == "backup" ]; then
    backup_database
else
    main
fi