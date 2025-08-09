import { NextResponse } from 'next/server';

interface ProductionError {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Production site'dan hataları çek
export async function GET() {
  try {
    const errors: ProductionError[] = [];

    // Vercel production logs'u çek
    try {
      const vercelResponse = await fetch('https://agendaiq.vercel.app/api/error-capture', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (vercelResponse.ok) {
        const data = await vercelResponse.json();
        if (data.recentErrors) {
          data.recentErrors.forEach((error: any) => {
            errors.push({
              id: `prod-${Date.now()}-${Math.random()}`,
              timestamp: error.timestamp,
              message: error.message,
              url: error.url || 'https://agendaiq.vercel.app',
              userAgent: 'Production Server',
              severity: 'high'
            });
          });
        }
      }
    } catch (err) {
      // Production erişilemiyorsa, bunu da hata olarak kaydet
      errors.push({
        id: `conn-error-${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: 'Production site erişilemez durumda',
        url: 'https://agendaiq.vercel.app',
        userAgent: 'Monitoring System',
        severity: 'critical'
      });
    }

    // Sentry hatalarını simüle et (gerçek Sentry entegrasyonu için)
    const sentryErrors = await fetchSentryErrors();
    errors.push(...sentryErrors);

    return NextResponse.json({
      success: true,
      errors: errors.slice(0, 20), // Son 20 hata
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Production error fetch failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch production errors',
      errors: [],
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Sentry integration (placeholder)
async function fetchSentryErrors(): Promise<ProductionError[]> {
  // Gerçek Sentry API entegrasyonu buraya gelecek
  // Şimdilik boş döndürüyoruz
  return [];
}

// Manual error reporting endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Bu endpoint production'dan manuel hata raporları alacak
    console.log('Manual error report:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Error report received'
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process error report'
    }, { status: 500 });
  }
}