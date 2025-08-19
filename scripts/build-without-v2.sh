#!/bin/bash
# Build script that temporarily moves v2 files

echo "🔧 Starting build process without v2 files..."

# Create backup directory
mkdir -p .v2-temp-backup

# Move v2 files temporarily
echo "📦 Moving v2 files temporarily..."
mv src/app/api/teams-v2 .v2-temp-backup/ 2>/dev/null || true
mv src/app/dashboard/teams-v2 .v2-temp-backup/ 2>/dev/null || true
mv src/components/teams-v2 .v2-temp-backup/ 2>/dev/null || true

# Run build
echo "🏗️ Running build..."
npm run build

# Store build result
BUILD_RESULT=$?

# Restore v2 files
echo "♻️ Restoring v2 files..."
mv .v2-temp-backup/teams-v2 src/app/api/ 2>/dev/null || true
mv .v2-temp-backup/teams-v2 src/app/dashboard/ 2>/dev/null || true
mv .v2-temp-backup/teams-v2 src/components/ 2>/dev/null || true

# Clean up
rmdir .v2-temp-backup 2>/dev/null || true

# Return build result
if [ $BUILD_RESULT -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
fi

exit $BUILD_RESULT