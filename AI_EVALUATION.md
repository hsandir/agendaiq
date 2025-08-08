# AI Integration Evaluation for Meeting Intelligence System

## Ücretsiz AI Seçenekleri

### 1. **Ollama (Local LLM) - ÖNERİLEN**
**Maliyet:** Tamamen ücretsiz
**Kurulum:**
```bash
# macOS için
brew install ollama
ollama pull llama2
ollama pull mistral
```

**Avantajlar:**
- ✅ Tamamen ücretsiz ve local
- ✅ Veri gizliliği tam kontrol
- ✅ İnternet bağımlılığı yok
- ✅ Özelleştirilebilir modeller

**Dezavantajlar:**
- ❌ RAM gereksinimi (8GB+ önerilen)
- ❌ Türkçe desteği sınırlı (fine-tuning gerekebilir)
- ❌ GPT-4'e göre daha düşük kalite

**Kullanım Alanları:**
- Meeting özetleme (basit)
- Action item çıkarma
- Keyword analizi

### 2. **Hugging Face Inference API**
**Maliyet:** Ayda 1000 request ücretsiz
**Kurulum:**
```typescript
npm install @huggingface/inference
```

**Avantajlar:**
- ✅ Ücretsiz tier mevcut
- ✅ Çok sayıda model seçeneği
- ✅ Türkçe modeller var (TURNA, BERTurk)

**Dezavantajlar:**
- ❌ Rate limit var
- ❌ Yavaş olabilir
- ❌ Model kalitesi değişken

### 3. **Google Gemini Nano (On-Device)**
**Maliyet:** Ücretsiz (Chrome 126+)
**Kurulum:** Chrome API kullanımı

**Avantajlar:**
- ✅ Tamamen ücretsiz
- ✅ Browser içinde çalışır
- ✅ Veri gizliliği

**Dezavantajlar:**
- ❌ Sadece Chrome'da
- ❌ Sınırlı yetenekler
- ❌ Henüz beta

### 4. **Open Source Transformer Models**
**Seçenekler:**
- BERT-base-turkish
- XLM-RoBERTa
- mT5 (multilingual T5)

**Kurulum:**
```typescript
npm install @tensorflow/tfjs @tensorflow-models/universal-sentence-encoder
```

**Avantajlar:**
- ✅ Tamamen ücretsiz
- ✅ Client-side çalışabilir
- ✅ Özelleştirilebilir

**Dezavantajlar:**
- ❌ Sınırlı yetenekler (sadece classification/embedding)
- ❌ Training gerekebilir

## Hibrit Yaklaşım (ÖNERİLEN)

### Mimari:
```
1. Basit İşlemler → TensorFlow.js (Browser)
   - Sentiment analizi
   - Keyword extraction
   - Text classification

2. Orta Seviye → Ollama (Local)
   - Meeting özetleme
   - Action item çıkarma
   - Basit sorular

3. Kritik/Karmaşık → Manual veya Delayed Processing
   - Kullanıcı onayı ile
   - Batch processing
```

## Implementasyon Planı

### Faz 1: TensorFlow.js ile Başlangıç
```typescript
// src/lib/ai/tensorflow-service.ts
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';

export class TensorFlowAIService {
  private model: any;
  
  async initialize() {
    this.model = await use.load();
  }
  
  async extractKeywords(text: string): Promise<string[]> {
    // TF-IDF based keyword extraction
    // Tamamen ücretsiz, client-side
  }
  
  async analyzeSentiment(text: string): Promise<number> {
    // -1 (negative) to 1 (positive)
    // Pre-trained model kullanımı
  }
}
```

### Faz 2: Ollama Entegrasyonu
```typescript
// src/lib/ai/ollama-service.ts
export class OllamaService {
  private baseUrl = 'http://localhost:11434';
  
  async summarizeMeeting(content: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      body: JSON.stringify({
        model: 'mistral',
        prompt: `Summarize this meeting in bullet points:\n${content}`,
        stream: false
      })
    });
    
    const data = await response.json();
    return data.response;
  }
  
  async extractActionItems(content: string): Promise<string[]> {
    // Mistral veya Llama2 ile action item çıkarma
  }
}
```

### Faz 3: Hugging Face Free Tier (Backup)
```typescript
// src/lib/ai/huggingface-service.ts
import { HfInference } from '@huggingface/inference';

export class HuggingFaceService {
  private hf = new HfInference('YOUR_FREE_API_KEY');
  
  async translateToTurkish(text: string): Promise<string> {
    // Helsinki-NLP/opus-mt-en-tr modeli
    const result = await this.hf.translation({
      model: 'Helsinki-NLP/opus-mt-en-tr',
      inputs: text
    });
    return result.translation_text;
  }
}
```

## Maliyet Karşılaştırması

| Servis | Aylık Maliyet | Meeting Başına | Veri Gizliliği |
|--------|--------------|----------------|----------------|
| Ollama | $0 | $0 | ✅ Tam kontrol |
| TensorFlow.js | $0 | $0 | ✅ Client-side |
| Hugging Face | $0 (1000 req) | $0 | ⚠️ Cloud |
| OpenAI GPT-3.5 | ~$20 | ~$0.02 | ❌ Cloud |
| OpenAI GPT-4 | ~$100+ | ~$0.10 | ❌ Cloud |

## Başlangıç Önerisi

1. **Hemen Başla:**
   - TensorFlow.js ile keyword extraction
   - Basit pattern matching ile action item tespiti
   - Rule-based özetleme

2. **Sonraki Adım:**
   - Ollama kurulumu
   - Mistral model ile özetleme
   - Fine-tuning için veri toplama

3. **Gelecek:**
   - Kendi modelinizi train edin
   - Türkçe özel model geliştirme
   - Hybrid yaklaşım optimizasyonu

## Örnek Ücretsiz Implementation

```typescript
// src/lib/ai/free-ai-service.ts
export class FreeAIService {
  // Pattern-based action item extraction
  extractActionItems(text: string): string[] {
    const patterns = [
      /(?:yapılacak|yapılması gereken|tamamlanacak):\s*(.+)/gi,
      /(?:görev|task):\s*(.+)/gi,
      /(?:\d+\.)\s*(.+(?:yapılacak|edilecek|olunacak))/gi
    ];
    
    const items: string[] = [];
    patterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        items.push(match[1].trim());
      }
    });
    
    return items;
  }
  
  // Simple extractive summarization
  summarizeMeeting(text: string): string {
    const sentences = text.split(/[.!?]+/);
    const scores = sentences.map(sent => ({
      text: sent,
      score: this.calculateImportance(sent)
    }));
    
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(s => s.text)
      .join('. ');
  }
  
  private calculateImportance(sentence: string): number {
    const keywords = ['karar', 'önemli', 'kritik', 'yapılacak', 'deadline'];
    return keywords.filter(kw => 
      sentence.toLowerCase().includes(kw)
    ).length;
  }
}
```

## Sonuç

**En İyi Ücretsiz Çözüm:**
1. TensorFlow.js + Pattern Matching (Hemen)
2. Ollama kurulumu (1 hafta içinde)
3. Fine-tuned local model (1 ay içinde)

Bu yaklaşım ile hiç ücret ödemeden, veri gizliliğini koruyarak, yeterli kalitede AI özellikleri sunabilirsiniz.