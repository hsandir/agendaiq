#!/bin/bash

echo "Fixing all icon import issues..."

# Find all files that still import from react-icons
grep -r "react-icons" src/ --include="*.ts" --include="*.tsx" -l | while read file; do
    echo "Processing: $file"
    
    # Replace react-icons/fi with lucide-react
    sed -i '' 's/from "react-icons\/fi"/from "lucide-react"/g' "$file"
    sed -i '' "s/from 'react-icons\/fi'/from 'lucide-react'/g" "$file"
    
    # Replace react-icons/ri with lucide-react
    sed -i '' 's/from "react-icons\/ri"/from "lucide-react"/g' "$file"
    sed -i '' "s/from 'react-icons\/ri'/from 'lucide-react'/g" "$file"
    
    # Replace react-icons/md with lucide-react  
    sed -i '' 's/from "react-icons\/md"/from "lucide-react"/g' "$file"
    sed -i '' "s/from 'react-icons\/md'/from 'lucide-react'/g" "$file"
    
    # Replace common icon imports with proper lucide names
    sed -i '' 's/RiDeleteBin6Line/Trash2/g' "$file"
    sed -i '' 's/RiEditLine/Edit/g' "$file"
    sed -i '' 's/RiEyeLine/Eye/g' "$file"
    sed -i '' 's/RiAddLine/Plus/g' "$file"
    sed -i '' 's/FiChevronDown/ChevronDown/g' "$file"
    sed -i '' 's/FiChevronRight/ChevronRight/g' "$file"
    
    # Fix double import aliases (the main problem from previous script)
    sed -i '' 's/User as Users as FiUsers/Users as FiUsers/g' "$file"
    sed -i '' 's/User as UserCheck as FiUserCheck/UserCheck as FiUserCheck/g' "$file"
    sed -i '' 's/Edit as Edit3 as FiEdit3/Edit3 as FiEdit3/g' "$file"
    sed -i '' 's/Edit as Edit2 as FiEdit2/Edit2 as FiEdit2/g' "$file"
    sed -i '' 's/Plus as FiPlus as FiPlus/Plus as FiPlus/g' "$file"
    sed -i '' 's/Book as FiBook as FiBook/Book as FiBook/g' "$file"
    sed -i '' 's/Home as FiHome as FiHome/Home as FiHome/g' "$file"
    sed -i '' 's/Calendar as FiCalendar as FiCalendar/Calendar as FiCalendar/g' "$file"
    sed -i '' 's/FileText as FiFileText as FiFileText/FileText as FiFileText/g' "$file"
    sed -i '' 's/Settings as FiSettings as FiSettings/Settings as FiSettings/g' "$file"
    sed -i '' 's/TrendingUp as FiTrendingUp as FiTrendingUp/TrendingUp as FiTrendingUp/g' "$file"
    
    # Fix usage of icons with double aliases  
    sed -i '' 's/User as Users as FiUsers/Users as FiUsers/g' "$file"
    sed -i '' 's/Edit as Edit3 as FiEdit3/Edit3 as FiEdit3/g' "$file"
    sed -i '' 's/Edit as Edit2 as FiEdit2/Edit2 as FiEdit2/g' "$file"
    sed -i '' 's/User as UserCheck as FiUserCheck/UserCheck as FiUserCheck/g' "$file"
    
    # Fix icon usage in JSX
    sed -i '' 's/<User as Users as FiUsers/<FiUsers/g' "$file"  
    sed -i '' 's/<Edit as Edit3 as FiEdit3/<FiEdit3/g' "$file"
    sed -i '' 's/<Edit as Edit2 as FiEdit2/<FiEdit2/g' "$file"
    sed -i '' 's/<User as UserCheck as FiUserCheck/<FiUserCheck/g' "$file"
    sed -i '' 's/<Plus as FiPlus/<FiPlus/g' "$file"
    sed -i '' 's/<Book as FiBook/<FiBook/g' "$file"
    sed -i '' 's/<Home as FiHome/<FiHome/g' "$file"
    sed -i '' 's/<Calendar as FiCalendar/<FiCalendar/g' "$file"
    sed -i '' 's/<FileText as FiFileText/<FiFileText/g' "$file"
    sed -i '' 's/<Settings as FiSettings/<FiSettings/g' "$file"
    sed -i '' 's/<TrendingUp as FiTrendingUp/<FiTrendingUp/g' "$file"
    sed -i '' 's/<User as FiUser/<FiUser/g' "$file"
    sed -i '' 's/<Lock as FiLock/<FiLock/g' "$file"
    sed -i '' 's/<Mail as FiMail/<FiMail/g' "$file"
    sed -i '' 's/<Check as FiCheck/<FiCheck/g' "$file"
    sed -i '' 's/<X as FiX/<FiX/g' "$file"
    sed -i '' 's/<AlertCircle as FiAlertCircle/<FiAlertCircle/g' "$file"
    sed -i '' 's/<AlertTriangle as FiAlertTriangle/<FiAlertTriangle/g' "$file"
    sed -i '' 's/<Shield as FiShield/<FiShield/g' "$file"
    sed -i '' 's/<Download as FiDownload/<FiDownload/g' "$file"
    sed -i '' 's/<Upload as FiUpload/<FiUpload/g' "$file"
    sed -i '' 's/<Edit as FiEdit/<FiEdit/g' "$file"
    sed -i '' 's/<Trash2 as FiTrash2/<FiTrash2/g' "$file"
    sed -i '' 's/<RefreshCw as FiRefreshCw/<FiRefreshCw/g' "$file"
    sed -i '' 's/<Database as FiDatabase/<FiDatabase/g' "$file"
    sed -i '' 's/<Activity as FiActivity/<FiActivity/g' "$file"
    sed -i '' 's/<Eye as FiEye/<FiEye/g' "$file"
    sed -i '' 's/<Clock as FiClock/<FiClock/g' "$file"
    sed -i '' 's/<Save as FiSave/<FiSave/g' "$file"
    
done

echo "Done fixing icon imports!"