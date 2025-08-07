# File Management & Archive Protocol - AgendaIQ

## 📋 File Deletion & Archive Protocol

AgendaIQ follows a "never delete, always archive" approach to maintain project history and ensure nothing important is lost.

### 🗂️ Archive Structure

```
archive/
├── old-documentation/           # Outdated documentation
│   ├── completed-tasks/         # Completed project documentation
│   ├── deprecated-features/     # Old feature documentation
│   └── historical/             # Historical project files
├── replaced-components/         # Old component versions
├── unused-assets/              # Unused images, fonts, etc.
├── old-configs/                # Previous configuration files
└── migration-records/          # Files from major migrations
```

### 🔄 File Archive Process

#### 1. Before Archiving
- [ ] Ensure file is truly no longer needed
- [ ] Check for any dependencies or references
- [ ] Document reason for archiving
- [ ] Create backup if critical

#### 2. Archive Steps
```bash
# Create date-stamped archive folder
mkdir -p archive/[category]/$(date +%Y-%m-%d)

# Move file to archive with reason
mv [file_path] archive/[category]/$(date +%Y-%m-%d)/
echo "Archived: [file_path] - Reason: [reason]" >> archive/ARCHIVE_LOG.md
```

#### 3. Update References
- [ ] Update import statements
- [ ] Remove from configuration files
- [ ] Update documentation links
- [ ] Test application still works

### 📝 Current Archive Categories

#### 1. **completed-tasks/**
- Completed project documentation files
- Finished feature specifications
- Resolved issue reports
- Achievement records

#### 2. **deprecated-features/**
- Old component implementations
- Replaced functionality documentation
- Legacy API endpoints
- Outdated user guides

#### 3. **historical/**
- Original project setup files
- Previous architecture documents
- Old meeting notes and decisions
- Legacy configuration files

#### 4. **replaced-components/**
- Previous component versions
- Old UI implementations
- Replaced utility functions
- Former styling approaches

#### 5. **unused-assets/**
- Unused images and graphics
- Old fonts and styling assets
- Replaced icons
- Previous branding materials

### 🗃️ Files to Archive Now

Based on analysis of current MD files, these should be archived:

#### Completed Documentation
```
FIXES_SUMMARY.md → archive/completed-tasks/
COMPATIBILITY_FIXES.md → archive/completed-tasks/
CLEANUP_SUMMARY.md → archive/completed-tasks/
AUDIT_SYSTEM_SUMMARY.md → archive/completed-tasks/
MIGRATION_REPORT.md → archive/completed-tasks/
```

#### Outdated/Replaced Files
```
AUTO_PUSH_README.md → archive/old-documentation/
DIAGNOSTIC_REPORT.md → archive/completed-tasks/
CENTRALIZED_THEME_SYSTEM.md → archive/old-documentation/ (replaced by THEME_SYSTEM_RULES.md)
```

#### Historical Documentation
```
TODO_ROADMAP.md → archive/old-documentation/historical/
GIT_WORKFLOW_GUIDE.md → archive/old-documentation/
```

### 🔍 File Review Checklist

Before archiving any file, ensure:

- [ ] **Not referenced in code**: No imports or includes
- [ ] **Not in documentation**: No links in active docs
- [ ] **Not in configuration**: Not referenced in config files
- [ ] **Purpose fulfilled**: Task completed or feature replaced
- [ ] **Dependencies checked**: No other files depend on it
- [ ] **Historical value**: Worth keeping for reference

### 📊 Archive Log Format

Each archived file should be logged with:

```markdown
## [Date] - Archive Entry

**File**: `path/to/file.md`
**Reason**: Brief explanation of why archived
**Category**: Which archive folder
**References**: Any files that referenced this
**Replacement**: What replaced this file (if applicable)
**Safe to delete**: Yes/No (after X months/years)
```

### 🔄 Regular Maintenance

#### Monthly Review
- Review archive folders for organization
- Update archive log with any missing entries
- Check if any archived files can be safely removed
- Ensure archive structure is maintained

#### Quarterly Cleanup
- Review files in root directory for archiving
- Check for duplicate or similar documentation
- Consolidate related archived files
- Update this protocol if needed

### 🚨 Never Archive These Files

**Critical files that should NEVER be archived:**

- `README.md` (main project readme)
- `CLAUDE.md` (AI assistant rules)
- `package.json` / `package-lock.json`
- `tsconfig.json` / `next.config.js`
- `.env` files
- Database migration files
- Active configuration files
- Current API documentation

### 📱 Mobile & Performance Considerations

When archiving files:
- Remove any references from mobile-specific code
- Check if files were used for performance optimizations
- Update service worker cache lists if needed
- Verify build process still works

### 🛠️ Implementation Commands

#### Archive Current Completed Files
```bash
# Create archive structure
mkdir -p archive/completed-tasks/$(date +%Y-%m-%d)
mkdir -p archive/old-documentation/$(date +%Y-%m-%d)

# Move completed documentation
mv FIXES_SUMMARY.md archive/completed-tasks/$(date +%Y-%m-%d)/
mv COMPATIBILITY_FIXES.md archive/completed-tasks/$(date +%Y-%m-%d)/
mv CLEANUP_SUMMARY.md archive/completed-tasks/$(date +%Y-%m-%d)/
mv AUDIT_SYSTEM_SUMMARY.md archive/completed-tasks/$(date +%Y-%m-%d)/
mv MIGRATION_REPORT.md archive/completed-tasks/$(date +%Y-%m-%d)/
mv DIAGNOSTIC_REPORT.md archive/completed-tasks/$(date +%Y-%m-%d)/

# Move outdated documentation
mv AUTO_PUSH_README.md archive/old-documentation/$(date +%Y-%m-%d)/
mv CENTRALIZED_THEME_SYSTEM.md archive/old-documentation/$(date +%Y-%m-%d)/
mv TODO_ROADMAP.md archive/old-documentation/$(date +%Y-%m-%d)/
mv GIT_WORKFLOW_GUIDE.md archive/old-documentation/$(date +%Y-%m-%d)/

# Update archive log
echo "## $(date +%Y-%m-%d) - Major Documentation Cleanup" >> archive/ARCHIVE_LOG.md
echo "" >> archive/ARCHIVE_LOG.md
echo "Archived completed project documentation and replaced outdated files." >> archive/ARCHIVE_LOG.md
echo "" >> archive/ARCHIVE_LOG.md
```

This protocol ensures we maintain project history while keeping the active workspace clean and organized.