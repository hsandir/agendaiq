#!/bin/bash

# CLAUDE STARTUP SCRIPT
# Auto-reads all documentation when Claude starts a new session

echo "🚀 CLAUDE SESSION INITIALIZATION"
echo "================================"

# Read critical rule files first
echo "📋 Reading Master Rules..."
if [ -f ".claude/MASTER_RULES.md" ]; then
    echo "✓ .claude/MASTER_RULES.md found"
else
    echo "❌ MASTER_RULES.md not found!"
fi

# Read all .md files in project root
echo "📄 Documentation files in project root:"
for file in *.md; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    fi
done

# Read all .md files in .claude directory
echo "📄 Claude-specific documentation:"
for file in .claude/*.md; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    fi
done

# Show current git status
echo "🔍 Current Git Status:"
git branch --show-current 2>/dev/null || echo "Not in git repository"

# Check if app is running
if lsof -i:3000 >/dev/null 2>&1; then
    echo "🟢 App is running on port 3000"
else
    echo "🔴 App is not running on port 3000"
fi

echo "================================"
echo "✅ Session initialization complete"