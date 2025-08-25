#!/bin/bash

# AgendaIQ Git Workflow Management Script
# Feature branch workflow + weekly backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create feature branch
create_feature_branch() {
    local feature_name=$1
    
    if [ -z "$feature_name" ]; then
        log_error "Feature name required"
        echo "Usage: $0 feature <feature-name>"
        echo "Example: $0 feature user-management-enhancement"
        exit 1
    fi
    
    log_info "Creating feature branch: feature/$feature_name"
    
    # Ensure we're on main and it's up to date
    git checkout main
    git pull origin main
    
    # Create and switch to feature branch
    git checkout -b "feature/$feature_name"
    
    log_success "Feature branch 'feature/$feature_name' created and checked out"
    log_info "You can now make your changes and commit them to this branch"
    log_info "When ready, use: $0 push-feature"
}

# Function to push feature branch
push_feature() {
    local current_branch=$(git branch --show-current)
    
    if [[ ! $current_branch == feature/* ]]; then
        log_error "Not on a feature branch. Current branch: $current_branch"
        exit 1
    fi
    
    log_info "Pushing feature branch: $current_branch"
    
    # Add all changes
    git add -A
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        log_warning "No changes to commit"
        exit 0
    fi
    
    # Commit with timestamp
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local commit_message="WIP: Progress on $current_branch - $timestamp"
    
    echo "Commit message (press Enter for default or type custom):"
    echo "Default: $commit_message"
    read -r custom_message
    
    if [ -n "$custom_message" ]; then
        commit_message="$custom_message"
    fi
    
    git commit -m "$commit_message"
    git push -u origin "$current_branch"
    
    log_success "Feature branch pushed to GitHub"
}

# Function to merge feature to main
merge_feature() {
    local current_branch=$(git branch --show-current)
    
    if [[ ! $current_branch == feature/* ]]; then
        log_error "Not on a feature branch. Current branch: $current_branch"
        exit 1
    fi
    
    log_info "Merging $current_branch to main"
    
    # Ensure feature branch is pushed
    git push origin "$current_branch"
    
    # Switch to main and update
    git checkout main
    git pull origin main
    
    # Merge feature branch
    git merge "$current_branch" --no-ff -m "Merge $current_branch into main"
    
    # Push to main
    git push origin main
    
    # Optionally delete feature branch
    echo "Delete feature branch $current_branch? (y/N)"
    read -r delete_branch
    
    if [[ $delete_branch =~ ^[Yy]$ ]]; then
        git branch -d "$current_branch"
        git push origin --delete "$current_branch"
        log_success "Feature branch deleted locally and remotely"
    fi
    
    log_success "Feature merged to main successfully"
}

# Function to create weekly backup
create_weekly_backup() {
    local date=$(date '+%Y-%m-%d')
    local backup_branch="backup/week-$date"
    
    log_info "Creating weekly backup: $backup_branch"
    
    # Ensure we're on main and it's up to date
    git checkout main
    git pull origin main
    
    # Create backup branch
    git checkout -b "$backup_branch"
    git push -u origin "$backup_branch"
    
    # Switch back to main
    git checkout main
    
    log_success "Weekly backup created: $backup_branch"
    log_info "Backup branch pushed to GitHub for long-term storage"
}

# Function to list feature branches
list_features() {
    log_info "Active feature branches:"
    git branch | grep "feature/" || log_warning "No feature branches found"
    
    log_info "\nRemote feature branches:"
    git branch -r | grep "origin/feature/" || log_warning "No remote feature branches found"
}

# Function to list backups
list_backups() {
    log_info "Available backup branches:"
    git branch -r | grep "origin/backup/" || log_warning "No backup branches found"
}

# Function to show status
show_status() {
    local current_branch=$(git branch --show-current)
    
    log_info "Current branch: $current_branch"
    log_info "Git status:"
    git status --short
    
    if [[ $current_branch == feature/* ]]; then
        log_info "\nYou're on a feature branch. Available commands:"
        echo "  $0 push-feature    - Push current changes"
        echo "  $0 merge-feature   - Merge to main"
    fi
}

# Main script logic
case "$1" in
    "feature")
        create_feature_branch "$2"
        ;;
    "push-feature")
        push_feature
        ;;
    "merge-feature")
        merge_feature
        ;;
    "weekly-backup")
        create_weekly_backup
        ;;
    "list-features")
        list_features
        ;;
    "list-backups")
        list_backups
        ;;
    "status")
        show_status
        ;;
    *)
        echo "AgendaIQ Git Workflow Management"
        echo ""
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  feature <name>     Create new feature branch"
        echo "  push-feature       Push current feature branch"
        echo "  merge-feature      Merge feature branch to main"
        echo "  weekly-backup      Create weekly backup branch"
        echo "  list-features      List all feature branches"
        echo "  list-backups       List all backup branches"
        echo "  status             Show current git status"
        echo ""
        echo "Examples:"
        echo "  $0 feature user-profile-enhancement"
        echo "  $0 push-feature"
        echo "  $0 merge-feature"
        echo "  $0 weekly-backup"
        echo ""
        echo "Workflow:"
        echo "  1. Create feature branch: $0 feature <name>"
        echo "  2. Make changes and commit regularly: $0 push-feature"
        echo "  3. When complete: $0 merge-feature"
        echo "  4. Weekly backup (Mondays): $0 weekly-backup"
        ;;
esac 