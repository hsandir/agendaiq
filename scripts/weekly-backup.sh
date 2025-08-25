#!/bin/bash

# AgendaIQ Weekly Backup Script
# Runs automatically every Monday to create backup branches

set -e

# Project directory
PROJECT_DIR="/Users/hs/Project/agendaiq"

# Log file
LOG_FILE="$PROJECT_DIR/logs/weekly-backup.log"

# Ensure log directory exists
mkdir -p "$PROJECT_DIR/logs"

# Log function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Weekly Backup Started ==="

# Change to project directory
cd "$PROJECT_DIR"

# Check if it's Monday (1 = Monday in date format)
if [ "$(date '+%u')" != "1" ]; then
    log "WARNING: Not Monday, but running backup anyway"
fi

# Generate backup name with timestamp
BACKUP_DATE=$(date '+%Y-%m-%d')
BACKUP_BRANCH="backup/week-$BACKUP_DATE"

log "Creating weekly backup: $BACKUP_BRANCH"

# Ensure we're on main and it's up to date
log "Switching to main branch"
git checkout main 2>&1 | tee -a "$LOG_FILE"

log "Pulling latest changes"
git pull origin main 2>&1 | tee -a "$LOG_FILE"

# Create backup branch
log "Creating backup branch: $BACKUP_BRANCH"
git checkout -b "$BACKUP_BRANCH" 2>&1 | tee -a "$LOG_FILE"

# Push backup to remote
log "Pushing backup to GitHub"
git push -u origin "$BACKUP_BRANCH" 2>&1 | tee -a "$LOG_FILE"

# Switch back to main
log "Switching back to main branch"
git checkout main 2>&1 | tee -a "$LOG_FILE"

# Clean up old backup branches (keep last 20 weeks)
log "Cleaning up old backup branches"
OLD_BACKUPS=$(git branch -r | grep "origin/backup/week-" | sort | head -n -20)
if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read -r branch; do
        branch_name=$(echo "$branch" | sed 's|origin/||')
        log "Deleting old backup branch: $branch_name"
        git push origin --delete "$branch_name" 2>&1 | tee -a "$LOG_FILE" || true
    done
else
    log "No old backup branches to clean up"
fi

# Create summary report
CURRENT_WEEK=$(date '+%Y-W%U')
BACKUP_SIZE=$(du -sh . | cut -f1)

log "=== Backup Summary ==="
log "Week: $CURRENT_WEEK"
log "Backup Branch: $BACKUP_BRANCH"
log "Project Size: $BACKUP_SIZE"
log "Total Commits on Main: $(git rev-list --count main)"
log "Latest Commit: $(git log -1 --pretty=format:'%h - %s (%an, %ar)')"

# List all backup branches
log "=== Available Backup Branches ==="
git branch -r | grep "origin/backup/" | tee -a "$LOG_FILE" || log "No backup branches found"

log "=== Weekly Backup Completed Successfully ==="

# Optional: Send notification (if needed later)
# You can add email notification here if required

exit 0 