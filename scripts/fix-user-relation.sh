#!/bin/bash

# Fix User relation to users in all TypeScript/JavaScript files
echo "Fixing User relation references to match database schema..."

# List of files that need to be updated
files=(
  "src/app/api/meetings/[id]/agenda-items/[itemId]/comments/route.ts"
  "src/app/api/meetings/[id]/agenda-items/[itemId]/attachments/route.ts"
  "src/app/api/meetings/[id]/agenda-items/[itemId]/route.ts"
  "src/app/api/meetings/[id]/agenda-items/route.ts"
  "src/__tests__/fixtures/factory.ts"
  "src/app/dashboard/meetings/[id]/live/page.tsx"
  "src/app/dashboard/meetings/[id]/agenda/[itemId]/page.tsx"
  "src/app/dashboard/meetings/[id]/agenda/page.tsx"
  "src/app/dashboard/meetings/[id]/edit/page.tsx"
  "src/app/dashboard/settings/permissions/page.tsx"
  "src/app/api/admin/roles/[id]/route.ts"
  "src/app/api/admin/assign-role/route.ts"
  "src/lib/meeting-intelligence/action-items.ts"
  "src/app/dashboard/settings/role-hierarchy/roles/page.tsx"
  "src/app/dashboard/settings/meeting-templates/page.tsx"
  "src/app/dashboard/page.tsx"
  "src/app/api/meetings/history/route.ts"
  "src/app/api/meetings/[id]/route.ts"
  "src/app/api/meetings/[id]/notes/route.ts"
  "src/app/api/meeting-templates/route.ts"
  "src/app/api/meeting-templates/[id]/route.ts"
  "src/app/api/meeting-intelligence/analytics/route.ts"
  "src/app/api/admin/roles/route.ts"
  "src/__tests__/unit/api/meetings-crud.test.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    # Replace User: true with users: true in include statements
    sed -i '' 's/User: true/users: true/g' "$file"
    # Replace references like staff.User with staff.users
    sed -i '' 's/\.User\([^a-zA-Z]\)/\.users\1/g' "$file"
  fi
done

echo "Done! Fixed User -> users relation references"