#!/bin/bash

# Claude Pre-Change Hook
# This runs automatically before Claude makes any changes

echo "🔍 Running System Validation..."

# Check if validation checklist exists
if [ -f "SYSTEM_VALIDATION_CHECKLIST.md" ]; then
    echo "✅ Validation checklist found"
    
    # Run validation script
    if [ -f "scripts/validate-system.js" ]; then
        node scripts/validate-system.js
        
        if [ $? -ne 0 ]; then
            echo "❌ Validation failed! Please fix issues before proceeding."
            exit 1
        fi
    fi
else
    echo "⚠️ Warning: SYSTEM_VALIDATION_CHECKLIST.md not found"
fi

# Check for common mistakes
echo "🔍 Checking for common mistakes..."

# Check for userId misuse
if grep -r "organizer_id: userId" src/ 2>/dev/null; then
    echo "❌ Error: Found 'organizer_id: userId' - should be 'staffId'"
    exit 1
fi

# Check for mock data in non-test files
if grep -r "mockData\|82\.5%" src/ --exclude-dir=__tests__ 2>/dev/null; then
    echo "⚠️ Warning: Possible mock data found"
fi

echo "✅ Pre-change validation complete"