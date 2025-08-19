#!/bin/bash

# ESLint Auto-Fix Script
# Simple, fast, effective - runs ESLint's built-in autofix

echo "🔧 ESLint Auto-Fix Agent"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check current errors
echo "📊 Checking current ESLint status..."
BEFORE_COUNT=$(npx eslint src --format compact 2>/dev/null | grep -c "Warning\|Error" || echo "0")
echo "Found $BEFORE_COUNT issues"
echo ""

# Step 2: Run ESLint autofix
echo "🚀 Running ESLint auto-fix..."
npx eslint src --fix --ext .ts,.tsx 2>/dev/null

# Step 3: Check remaining errors
echo ""
echo "📊 Checking remaining issues..."
AFTER_COUNT=$(npx eslint src --format compact 2>/dev/null | grep -c "Warning\|Error" || echo "0")

# Step 4: Report results
echo ""
echo "================================"
echo "📈 RESULTS"
echo "================================"
echo -e "${YELLOW}Before:${NC} $BEFORE_COUNT issues"
echo -e "${GREEN}After:${NC}  $AFTER_COUNT issues"
echo -e "${GREEN}Fixed:${NC}  $((BEFORE_COUNT - AFTER_COUNT)) issues"
echo ""

if [ "$AFTER_COUNT" -eq "0" ]; then
    echo -e "${GREEN}✅ All ESLint issues resolved!${NC}"
else
    echo -e "${YELLOW}⚠️  $AFTER_COUNT issues remaining that need manual fixes${NC}"
    echo ""
    echo "To see remaining issues, run:"
    echo "  npm run lint"
fi

echo ""
echo "💡 Tip: Always review changes with 'git diff' before committing!"