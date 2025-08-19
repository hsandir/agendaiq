#!/bin/bash

# Manual check script - run when needed instead of continuously
# This avoids performance issues from continuous file watching

echo "🔍 Running Manual Code Checks..."
echo "================================"

# Run ESLint check
echo ""
echo "📝 ESLint Check:"
npx eslint src --max-warnings 0 --format compact 2>&1 | head -20
ESLINT_EXIT=$?

# Run TypeScript check  
echo ""
echo "📘 TypeScript Check:"
npx tsc --noEmit 2>&1 | head -20
TSC_EXIT=$?

# Summary
echo ""
echo "================================"
echo "📊 Summary:"

if [ $ESLINT_EXIT -eq 0 ]; then
  echo "✅ ESLint: No errors"
else
  echo "❌ ESLint: Has errors (run 'npm run lint' for details)"
fi

if [ $TSC_EXIT -eq 0 ]; then
  echo "✅ TypeScript: No errors"
else
  echo "❌ TypeScript: Has errors (run 'npx tsc --noEmit' for details)"
fi

echo ""
echo "💡 Tip: Run this script periodically instead of continuous watching"
echo "        to avoid performance issues."