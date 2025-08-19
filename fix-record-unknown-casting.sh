#!/bin/bash

# Fix TypeScript anti-pattern: Remove unnecessary Record<string, unknown> casting for request.json()

echo "Fixing unnecessary Record<string, unknown> casting in API routes..."

# Find all files with the problematic pattern
files=$(grep -l "await request.json()) as Record<string, unknown>" src/app/api/**/*.ts 2>/dev/null)

count=0
for file in $files; do
    # Replace the pattern
    sed -i '' 's/(await request\.json()) as Record<string, unknown>/await request.json()/g' "$file"
    echo "✅ Fixed: $file"
    ((count++))
done

echo ""
echo "Total files fixed: $count"

# Also fix patterns where it's on separate lines
echo ""
echo "Checking for multi-line patterns..."

# Fix pattern: const data = await request.json() as Record<string, unknown>
files2=$(grep -l "await request.json() as Record<string, unknown>" src/app/api/**/*.ts 2>/dev/null)

count2=0
for file in $files2; do
    sed -i '' 's/await request\.json() as Record<string, unknown>/await request.json()/g' "$file"
    echo "✅ Fixed multi-line pattern in: $file"
    ((count2++))
done

echo "Multi-line patterns fixed: $count2"

echo ""
echo "🎯 Total fixes: $((count + count2))"