#!/bin/bash

echo "Fixing syntax errors in import statements..."

# Find all TypeScript/React files and fix double aliases
find src/ -name "*.tsx" -o -name "*.ts" | while read file; do
    echo "Processing: $file"
    
    # Fix the double alias pattern that's causing syntax errors
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
    
    # Fix any remaining 'as X as Y' patterns
    sed -i '' 's/ as \([A-Za-z0-9]*\) as \([A-Za-z0-9]*\)/ as \2/g' "$file"
    
    # Fix JSX usage that still has the old pattern
    sed -i '' 's/<User as Users as FiUsers/<FiUsers/g' "$file"
    sed -i '' 's/<Edit as Edit3 as FiEdit3/<FiEdit3/g' "$file"  
    sed -i '' 's/<Edit as Edit2 as FiEdit2/<FiEdit2/g' "$file"
    sed -i '' 's/<User as UserCheck as FiUserCheck/<FiUserCheck/g' "$file"
    sed -i '' 's/<Calendar as FiCalendar/<FiCalendar/g' "$file"
    sed -i '' 's/<FileText as FiFileText/<FiFileText/g' "$file"
    sed -i '' 's/<Settings as FiSettings/<FiSettings/g' "$file"
    sed -i '' 's/<TrendingUp as FiTrendingUp/<FiTrendingUp/g' "$file"
    
done

echo "Syntax fixes complete!"