#!/bin/bash

# Fix JSX alias usage patterns - using actual aliased names instead of "ComponentName as Alias"

echo "Fixing JSX alias usage patterns..."

# Function to fix a file
fix_jsx_aliases() {
  local file="$1"
  echo "Processing: $file"
  
  # Fix common JSX alias patterns
  sed -i '' 's/<Shield as FiShield/<FiShield/g' "$file"
  sed -i '' 's/<Lock as FiLock/<FiLock/g' "$file"
  sed -i '' 's/<Mail as FiMail/<FiMail/g' "$file"
  sed -i '' 's/<AlertCircle as FiAlertCircle/<FiAlertCircle/g' "$file"
  sed -i '' 's/<Users as FiUsers/<FiUsers/g' "$file"
  sed -i '' 's/<User as FiUser/<FiUser/g' "$file"
  sed -i '' 's/<UserCheck as FiUserCheck/<FiUserCheck/g' "$file"
  sed -i '' 's/<Download as FiDownload/<FiDownload/g' "$file"
  sed -i '' 's/<Eye as FiEye/<FiEye/g' "$file"
  sed -i '' 's/<Save as FiSave/<FiSave/g' "$file"
  sed -i '' 's/<Check as FiCheck/<FiCheck/g' "$file"
  sed -i '' 's/<X as FiX/<FiX/g' "$file"
  sed -i '' 's/<RefreshCw as FiRefreshCw/<FiRefreshCw/g' "$file"
  sed -i '' 's/<Edit as FiEdit/<FiEdit/g' "$file"
  sed -i '' 's/<Trash2 as FiTrash2/<FiTrash2/g' "$file"
  sed -i '' 's/<FileText as FiFileText/<FiFileText/g' "$file"
  sed -i '' 's/<Upload as FiUpload/<FiUpload/g' "$file"
  sed -i '' 's/<Settings as FiSettings/<FiSettings/g' "$file"
  sed -i '' 's/<Calendar as FiCalendar/<FiCalendar/g' "$file"
  sed -i '' 's/<Plus as FiPlus/<FiPlus/g' "$file"
  sed -i '' 's/<Activity as FiActivity/<FiActivity/g' "$file"
  sed -i '' 's/<Database as FiDatabase/<FiDatabase/g' "$file"
  sed -i '' 's/<Server as FiServer/<FiServer/g' "$file"
  sed -i '' 's/<Monitor as FiMonitor/<FiMonitor/g' "$file"
  sed -i '' 's/<Package as FiPackage/<FiPackage/g' "$file"
  sed -i '' 's/<Archive as FiArchive/<FiArchive/g' "$file"
  sed -i '' 's/<AlertTriangle as FiAlertTriangle/<FiAlertTriangle/g' "$file"
  sed -i '' 's/<Search as FiSearch/<FiSearch/g' "$file"
  sed -i '' 's/<Home as FiHome/<FiHome/g' "$file"
  sed -i '' 's/<TrendingUp as FiTrendingUp/<FiTrendingUp/g' "$file"
  sed -i '' 's/<Key as FiKey/<FiKey/g' "$file"
  sed -i '' 's/<HardDrive as FiHardDrive/<FiHardDrive/g' "$file"
  sed -i '' 's/<Menu as FiMenu/<FiMenu/g' "$file"
  sed -i '' 's/<HelpCircle as FiHelpCircle/<FiHelpCircle/g' "$file"
  sed -i '' 's/<Bell as FiBell/<FiBell/g' "$file"
  sed -i '' 's/<Clock as FiClock/<FiClock/g' "$file"
  
  echo "Fixed JSX aliases in: $file"
}

# Find all TypeScript and TSX files
find src -name "*.tsx" -o -name "*.ts" | while read -r file; do
  if [[ -f "$file" ]]; then
    fix_jsx_aliases "$file"
  fi
done

echo "JSX alias fix completed!"