#!/bin/bash

echo "Fixing production session issue by adding NEXTAUTH_URL..."

# Add NEXTAUTH_URL to Vercel production environment
echo "Adding NEXTAUTH_URL to Vercel production environment..."
vercel env add NEXTAUTH_URL production <<< "https://www.agendaiq.app"

echo "Environment variable added. Redeploying production..."

# Trigger a new deployment to apply the environment variable
vercel --prod

echo "Done! Production should now properly handle sessions."
echo ""
echo "The issue was that NEXTAUTH_URL was not set in production."
echo "NextAuth requires this to properly handle sessions and cookies."
echo "It's now set to: https://www.agendaiq.app"