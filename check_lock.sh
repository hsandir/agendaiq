#!/bin/bash

# FileLocal Agent - Kilit Durumu Kontrol Et
# Kullanım: ./check_lock.sh [src/example.ts] (opsiyonel)

if [ $# -eq 0 ]; then
    # Tüm kilitleri listele
    echo "📋 Aktif Kilitler:"
    echo "=================="
    
    if grep -q "LOCKED" FILELOCK_AGENT.md; then
        grep "LOCKED" FILELOCK_AGENT.md | while IFS= read -r line; do
            echo "🔒 $line"
        done
        echo ""
        echo "📊 Toplam kilit: $(grep -c "LOCKED" FILELOCK_AGENT.md)"
    else
        echo "✅ Hiç kilit yok - tüm dosyalar müsait!"
    fi
    
elif [ $# -eq 1 ]; then
    # Belirli dosyayı kontrol et
    FILE_PATH=$1
    
    if grep -q "${FILE_PATH}.*LOCKED" FILELOCK_AGENT.md; then
        echo "🔒 Dosya kilitli: ${FILE_PATH}"
        echo "📋 Kilit detayı:"
        grep "${FILE_PATH}.*LOCKED" FILELOCK_AGENT.md
        echo ""
        echo "⏳ Lütfen bekleyin veya başka dosya seçin"
        exit 1
    else
        echo "✅ Dosya müsait: ${FILE_PATH}"
        echo "💡 Kilitleme için:"
        echo "   ./lock_file.sh ${FILE_PATH} [CLAUDE_ID]"
        exit 0
    fi
else
    echo "❌ Kullanım:"
    echo "   ./check_lock.sh                 # Tüm kilitleri listele"
    echo "   ./check_lock.sh src/example.ts  # Belirli dosyayı kontrol et"
    exit 1
fi