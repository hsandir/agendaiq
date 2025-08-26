import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    test: 'Middleware Token Debug',
    middleware_analysis: {} as any
  };

  try {
    console.log('🔍 MIDDLEWARE TOKEN DEBUG');
    
    // Test 1: Raw cookies
    const cookies = request.cookies.toString();
    results.middleware_analysis.cookies = {
      raw_cookies: cookies,
      has_session_token: cookies.includes('next-auth.session-token'),
      has_csrf_token: cookies.includes('next-auth.csrf-token'),
      cookie_count: request.cookies.getAll().length
    };

    // Test 2: NextAuth secret
    results.middleware_analysis.nextauth_config = {
      secret_exists: !!process.env.NEXTAUTH_SECRET,
      secret_length: process.env.NEXTAUTH_SECRET?.length,
      nextauth_url: process.env.NEXTAUTH_URL
    };

    // Test 3: getToken attempt
    try {
      console.log('🔐 Attempting getToken...');
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production'
      });

      results.middleware_analysis.token_result = {
        token_exists: !!token,
        token_data: token ? {
          email: token.email,
          id: token.id,
          name: token.name,
          exp: token.exp,
          iat: token.iat
        } : null
      };

      console.log('🎯 Token result:', !!token, token?.email);

    } catch (tokenError: any) {
      results.middleware_analysis.token_result = {
        error: tokenError.message,
        token_exists: false
      };
      console.error('❌ getToken error:', tokenError);
    }

    // Test 4: Manual JWT decode attempt
    const sessionCookie = request.cookies.get('__Secure-next-auth.session-token')?.value;
    results.middleware_analysis.session_cookie = {
      exists: !!sessionCookie,
      length: sessionCookie?.length,
      starts_with: sessionCookie?.substring(0, 10)
    };

  } catch (error: any) {
    results.middleware_analysis.error = error.message;
  }

  console.log('🔍 MIDDLEWARE DEBUG RESULTS:', JSON.stringify(results, null, 2));
  return NextResponse.json(results);
}