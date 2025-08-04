#!/bin/bash

# Script to replace react-icons with lucide-react imports
# This will fix the build error

echo "Fixing react-icons imports..."

# Replace common react-icons with lucide-react equivalents
files=$(grep -r "react-icons" src/ --include="*.ts" --include="*.tsx" -l)

for file in $files; do
    echo "Processing: $file"
    
    # Replace import statements
    sed -i '' 's/from "react-icons\/fi"/from "lucide-react"/g' "$file"
    sed -i '' "s/from 'react-icons\/fi'/from 'lucide-react'/g" "$file"
    
    # Replace specific icon names with lucide equivalents
    sed -i '' 's/FiUser/User as FiUser/g' "$file"
    sed -i '' 's/FiLock/Lock as FiLock/g' "$file"
    sed -i '' 's/FiMail/Mail as FiMail/g' "$file"
    sed -i '' 's/FiCheck/Check as FiCheck/g' "$file"
    sed -i '' 's/FiX/X as FiX/g' "$file"
    sed -i '' 's/FiAlertCircle/AlertCircle as FiAlertCircle/g' "$file"
    sed -i '' 's/FiAlertTriangle/AlertTriangle as FiAlertTriangle/g' "$file"
    sed -i '' 's/FiShield/Shield as FiShield/g' "$file"
    sed -i '' 's/FiSettings/Settings as FiSettings/g' "$file"
    sed -i '' 's/FiUsers/Users as FiUsers/g' "$file"
    sed -i '' 's/FiFileText/FileText as FiFileText/g' "$file"
    sed -i '' 's/FiDownload/Download as FiDownload/g' "$file"
    sed -i '' 's/FiUpload/Upload as FiUpload/g' "$file"
    sed -i '' 's/FiEdit/Edit as FiEdit/g' "$file"
    sed -i '' 's/FiEdit3/Edit3 as FiEdit3/g' "$file"
    sed -i '' 's/FiEdit2/Edit2 as FiEdit2/g' "$file"
    sed -i '' 's/FiTrash2/Trash2 as FiTrash2/g' "$file"
    sed -i '' 's/FiRefreshCw/RefreshCw as FiRefreshCw/g' "$file"
    sed -i '' 's/FiDatabase/Database as FiDatabase/g' "$file"
    sed -i '' 's/FiActivity/Activity as FiActivity/g' "$file"
    sed -i '' 's/FiEye/Eye as FiEye/g' "$file"
    sed -i '' 's/FiPlus/Plus as FiPlus/g' "$file"
    sed -i '' 's/FiClock/Clock as FiClock/g' "$file"
    sed -i '' 's/FiSave/Save as FiSave/g' "$file"
    sed -i '' 's/FiTrendingUp/TrendingUp as FiTrendingUp/g' "$file"
    sed -i '' 's/FiUserCheck/UserCheck as FiUserCheck/g' "$file"
    sed -i '' 's/FiUserPlus/UserPlus as FiUserPlus/g' "$file"
    sed -i '' 's/FiCalendar/Calendar as FiCalendar/g' "$file"
    sed -i '' 's/FiBook/Book as FiBook/g' "$file"
    sed -i '' 's/FiHome/Home as FiHome/g' "$file"
    
    # Fix double replacements (this is a quick fix for the sed replacements above)
    sed -i '' 's/User as FiUser as FiUser/User as FiUser/g' "$file"
    sed -i '' 's/Lock as FiLock as FiLock/Lock as FiLock/g' "$file"
    sed -i '' 's/Mail as FiMail as FiMail/Mail as FiMail/g' "$file"
    sed -i '' 's/Check as FiCheck as FiCheck/Check as FiCheck/g' "$file"
    sed -i '' 's/X as FiX as FiX/X as FiX/g' "$file"
    sed -i '' 's/AlertCircle as FiAlertCircle as FiAlertCircle/AlertCircle as FiAlertCircle/g' "$file"
    sed -i '' 's/AlertTriangle as FiAlertTriangle as FiAlertTriangle/AlertTriangle as FiAlertTriangle/g' "$file"
    sed -i '' 's/Shield as FiShield as FiShield/Shield as FiShield/g' "$file"
    sed -i '' 's/Settings as FiSettings as FiSettings/Settings as FiSettings/g' "$file"
    sed -i '' 's/Users as FiUsers as FiUsers/Users as FiUsers/g' "$file"
    sed -i '' 's/FileText as FiFileText as FiFileText/FileText as FiFileText/g' "$file"
    sed -i '' 's/Download as FiDownload as FiDownload/Download as FiDownload/g' "$file"
    sed -i '' 's/Upload as FiUpload as FiUpload/Upload as FiUpload/g' "$file"
    sed -i '' 's/Edit as FiEdit as FiEdit/Edit as FiEdit/g' "$file"
    sed -i '' 's/Edit3 as FiEdit3 as FiEdit3/Edit3 as FiEdit3/g' "$file"
    sed -i '' 's/Edit2 as FiEdit2 as FiEdit2/Edit2 as FiEdit2/g' "$file"
    sed -i '' 's/Trash2 as FiTrash2 as FiTrash2/Trash2 as FiTrash2/g' "$file"
    sed -i '' 's/RefreshCw as FiRefreshCw as FiRefreshCw/RefreshCw as FiRefreshCw/g' "$file"
    sed -i '' 's/Database as FiDatabase as FiDatabase/Database as FiDatabase/g' "$file"
    sed -i '' 's/Activity as FiActivity as FiActivity/Activity as FiActivity/g' "$file"
    sed -i '' 's/Eye as FiEye as FiEye/Eye as FiEye/g' "$file"
    sed -i '' 's/Plus as FiPlus as FiPlus/Plus as FiPlus/g' "$file"
    sed -i '' 's/Clock as FiClock as FiClock/Clock as FiClock/g' "$file"
    sed -i '' 's/Save as FiSave as FiSave/Save as FiSave/g' "$file"
    sed -i '' 's/TrendingUp as FiTrendingUp as FiTrendingUp/TrendingUp as FiTrendingUp/g' "$file"
    sed -i '' 's/UserCheck as FiUserCheck as FiUserCheck/UserCheck as FiUserCheck/g' "$file"
    sed -i '' 's/UserPlus as FiUserPlus as FiUserPlus/UserPlus as FiUserPlus/g' "$file"
    sed -i '' 's/Calendar as FiCalendar as FiCalendar/Calendar as FiCalendar/g' "$file"
    sed -i '' 's/Book as FiBook as FiBook/Book as FiBook/g' "$file"
    sed -i '' 's/Home as FiHome as FiHome/Home as FiHome/g' "$file"
    
done

echo "Done! Fixed react-icons imports in $files"