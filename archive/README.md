# Archive Folder

This folder contains archived files and directories that are no longer needed for active development but are kept for reference purposes.

## Structure

### backup-files/
Contains all backup files created during development iterations. These are timestamped backup files with pattern `*.backup-*` that were automatically created during major refactoring operations.

### development-scripts/
Contains old development and setup scripts that are no longer actively used:

#### old-admin-scripts/
- Scripts for creating and managing admin users during initial setup phase
- Password reset utilities
- Admin permission fix scripts

#### old-setup-scripts/
- Legacy Prisma field migration scripts
- Organization structure setup scripts
- Database schema update utilities

### old-documentation/
Contains old documentation files and TODO lists that have been completed or are no longer relevant:
- `TODO_DASHBOARD_NOTLAR.md` - Turkish TODO list for dashboard development (completed)

## Important Notes

- **DO NOT DELETE** these files - they contain valuable development history
- Files in this archive should not be imported or referenced by active code
- These files are kept for troubleshooting and historical reference
- If you need to reference any of these files, consider if the functionality should be re-implemented with current patterns

## Archived on

Date: 2025-01-22
Reason: Code quality improvements and cleanup phase
By: Claude AI Assistant

## Files Moved Summary

- **87 backup files** moved from various locations
- **13 development scripts** archived (admin and setup scripts)  
- **1 documentation file** archived (completed TODO list)

The codebase is now cleaner and focuses on active development files only.