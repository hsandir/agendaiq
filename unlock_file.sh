#!/bin/bash

# FileLocal Agent - Dosya Kilidi Serbest Bırak
# Kullanım: ./unlock_file.sh src/example.ts

if [ $# -ne 1 ]; then
    echo "❌ Kullanım: ./unlock_file.sh [dosya_yolu]"
    echo "   Örnek: ./unlock_file.sh src/example.ts"
    exit 1
fi

FILE_PATH=$1

# Kilit var mı kontrol et
if ! grep -q "${FILE_PATH}.*LOCKED" FILELOCK_AGENT.md; then
    echo "⚠️  Uyarı: Dosyada zaten kilit yok!"
    echo "📄 Dosya: ${FILE_PATH}"
    exit 0
fi

# Kilitli satırı göster
echo "🔍 Serbest bırakılacak kilit:"
grep "${FILE_PATH}.*LOCKED" FILELOCK_AGENT.md

# Kilidi serbest bırak
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "/${FILE_PATH//\//\\/}.*LOCKED/d" FILELOCK_AGENT.md
else
    # Linux
    sed -i "/${FILE_PATH//\//\\/}.*LOCKED/d" FILELOCK_AGENT.md
fi

echo "🔓 Kilit serbest bırakıldı: ${FILE_PATH}"
echo "✅ Dosya artık diğer Claude'lar için müsait"