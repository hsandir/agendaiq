#!/bin/bash

echo "Fixing all PascalCase relation names to match snake_case database schema..."

# Find all TypeScript/TSX files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  # Create a temporary file for changes
  temp_file="${file}.tmp"
  
  # Apply all relation fixes
  sed -E \
    -e 's/([^a-zA-Z])User([^a-zA-Z])/\1users\2/g' \
    -e 's/([^a-zA-Z])Staff([^a-zA-Z])/\1staff\2/g' \
    -e 's/([^a-zA-Z])Role([^a-zA-Z])/\1role\2/g' \
    -e 's/([^a-zA-Z])Department([^a-zA-Z])/\1department\2/g' \
    -e 's/([^a-zA-Z])School([^a-zA-Z])/\1school\2/g' \
    -e 's/([^a-zA-Z])District([^a-zA-Z])/\1district\2/g' \
    -e 's/([^a-zA-Z])Permission([^a-zA-Z])/\1permission\2/g' \
    -e 's/User: true/users: true/g' \
    -e 's/Staff: true/staff: true/g' \
    -e 's/Role: true/role: true/g' \
    -e 's/Department: true/department: true/g' \
    -e 's/School: true/school: true/g' \
    -e 's/District: true/district: true/g' \
    -e 's/Permission: true/permission: true/g' \
    -e 's/Staff: \{/staff: \{/g' \
    -e 's/Role: \{/role: \{/g' \
    -e 's/Department: \{/department: \{/g' \
    -e 's/School: \{/school: \{/g' \
    -e 's/District: \{/district: \{/g' \
    -e 's/Permission: \{/permission: \{/g' \
    -e 's/\.User\./\.users\./g' \
    -e 's/\.Staff\./\.staff\./g' \
    -e 's/\.Role\./\.role\./g' \
    -e 's/\.Department\./\.department\./g' \
    -e 's/\.School\./\.school\./g' \
    -e 's/\.District\./\.district\./g' \
    -e 's/\.Permission\./\.permission\./g' \
    "$file" > "$temp_file"
  
  # Check if changes were made
  if ! cmp -s "$file" "$temp_file"; then
    mv "$temp_file" "$file"
    echo "Updated: $file"
  else
    rm "$temp_file"
  fi
done

echo "Done! All relation names have been fixed to match database schema"