import { requireAuth, AuthPresets } from '@/lib/auth/auth-utils';
import LiveMonitor from '@/components/monitoring/live-monitor';

export default async function MonitoringPage() {
  // Admin yetkisi gerekli
  const user = await requireAuth(AuthPresets.requireAdmin);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Production Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Canlı hata takibi ve sistem durumu - Production ve lokal ortamları izle
        </p>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="bg-yellow-500 rounded-full w-2 h-2 mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                🚀 Canlı Monitoring Sistemi Aktif
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Bu sayfa production sitesinden canlı hata verilerini çeker ve 
                lokal geliştirme sırasında oluşan hataları anında gösterir.
                Deploy etmeden değişikliklerinin etkisini görebilirsin.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Monitor Component */}
      <LiveMonitor />
      
      {/* Instructions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🔍 Nasıl Kullanılır?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Sistem otomatik olarak production hatalarını izler</li>
            <li>• Console error'ları ve JavaScript hatalarını yakalar</li>
            <li>• Her 2 saniyede sistem durumunu kontrol eder</li>
            <li>• Hataları severity seviyesine göre renklendirir</li>
          </ul>
        </div>
        
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-green-800 mb-2">✨ Özellikler</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Production ve lokal hataları aynı ekranda</li>
            <li>• Gerçek zamanlı sistem durumu kontrolü</li>
            <li>• Stack trace ve detaylı hata bilgileri</li>
            <li>• Hata istatistikleri ve özet bilgiler</li>
          </ul>
        </div>
      </div>
    </div>
  );
}