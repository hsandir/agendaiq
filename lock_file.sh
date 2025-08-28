#!/bin/bash

# FileLocal Agent - Dosya Kilitle
# Kullanım: ./lock_file.sh src/example.ts CLAUDE_1

if [ $# -ne 2 ]; then
    echo "❌ Kullanım: ./lock_file.sh [dosya_yolu] [claude_id]"
    echo "   Örnek: ./lock_file.sh src/example.ts CLAUDE_1"
    exit 1
fi

FILE_PATH=$1
CLAUDE_ID=$2
TIMESTAMP=$(date '+%H:%M:%S')

# Önce kilit kontrolü yap
if grep -q "${FILE_PATH}.*LOCKED" FILELOCK_AGENT.md; then
    echo "🔒 HATA: Dosya zaten kilitli!"
    echo "📋 Mevcut kilit:"
    grep "${FILE_PATH}.*LOCKED" FILELOCK_AGENT.md
    exit 1
fi

# Kilidi al
echo "[${TIMESTAMP}] [${CLAUDE_ID}] [LOCK] ${FILE_PATH} [LOCKED]" >> FILELOCK_AGENT.md

echo "✅ Kilit alındı: ${FILE_PATH}"
echo "🏷️  Claude ID: ${CLAUDE_ID}"
echo "⏰ Zaman: ${TIMESTAMP}"
echo ""
echo "💡 İşin bitince şunu çalıştır:"
echo "   ./unlock_file.sh ${FILE_PATH}"