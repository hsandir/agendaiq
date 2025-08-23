#!/bin/bash

# Open Validation Dashboard
# Validation dashboard'ını browser'da açar

DASHBOARD_PATH="/Users/hs/Project/agendaiq/scripts/validation-dashboard.html"

echo "🚀 Opening AgendaIQ Validation Monitor Dashboard..."

# macOS için
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "$DASHBOARD_PATH"
# Linux için
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$DASHBOARD_PATH"
# Windows için (Git Bash/WSL)
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    start "$DASHBOARD_PATH"
else
    echo "❌ Unsupported OS. Please open the following file manually:"
    echo "   $DASHBOARD_PATH"
fi

echo "✅ Dashboard should open in your default browser"
echo "📊 Monitor URL: file://$DASHBOARD_PATH"
