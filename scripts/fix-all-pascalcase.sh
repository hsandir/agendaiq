#!/bin/bash

echo "Fixing ALL PascalCase relations in TypeScript/TSX files..."

# Find all TS/TSX files and fix them
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  # Create backup
  cp "$file" "$file.bak"
  
  # Apply all fixes
  sed -i '' \
    -e 's/\.User\([^a-zA-Z]\)/\.users\1/g' \
    -e 's/User:/users:/g' \
    -e 's/\.Staff\([^a-zA-Z]\)/\.staff\1/g' \
    -e 's/Staff:/staff:/g' \
    -e 's/\.Role\([^a-zA-Z]\)/\.role\1/g' \
    -e 's/Role:/role:/g' \
    -e 's/\.Department\([^a-zA-Z]\)/\.department\1/g' \
    -e 's/Department:/department:/g' \
    -e 's/\.School\([^a-zA-Z]\)/\.school\1/g' \
    -e 's/School:/school:/g' \
    -e 's/\.District\([^a-zA-Z]\)/\.district\1/g' \
    -e 's/District:/district:/g' \
    -e 's/\.Account\([^a-zA-Z]\)/\.account\1/g' \
    -e 's/Account:/account:/g' \
    -e 's/\.Session\([^a-zA-Z]\)/\.session\1/g' \
    -e 's/Session:/session:/g' \
    -e 's/\.Permission\([^a-zA-Z]\)/\.permission\1/g' \
    -e 's/Permission:/permission:/g' \
    -e 's/\.Permissions\([^a-zA-Z]\)/\.permission\1/g' \
    -e 's/Permissions:/permission:/g' \
    "$file"
  
  # Check if changes were made
  if cmp -s "$file" "$file.bak"; then
    rm "$file.bak"
  else
    echo "Fixed: $file"
    rm "$file.bak"
  fi
done

echo "Fixing types directory..."
find src/types -type f -name "*.ts" | while read -r file; do
  sed -i '' \
    -e 's/\bUser\b/users/g' \
    -e 's/\bStaff\b/staff/g' \
    -e 's/\bRole\b/role/g' \
    -e 's/\bDepartment\b/department/g' \
    -e 's/\bSchool\b/school/g' \
    -e 's/\bDistrict\b/district/g' \
    "$file" 2>/dev/null || true
done

echo "Done! All PascalCase relations have been fixed"