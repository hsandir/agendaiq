// Database Configuration based on Environment
// Automatically selects the correct database based on NODE_ENV

export function getDatabaseUrl(): string {
  // Production (Vercel) - Use Supabase
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    console.log('Using Supabase database (Production)');
    return process.env.DATABASE_URL || '';
  }
  
  // Development (Local) - Use local PostgreSQL
  console.log('Using local PostgreSQL database (Development)');
  return process.env.DATABASE_URL || 'postgresql://hs:yeni@localhost:5432/agendaiq';
}

export function getDirectUrl(): string {
  // Production - Supabase direct connection for migrations
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return process.env.DIRECT_URL || process.env.DATABASE_URL || '';
  }
  
  // Development - Same as regular URL for local
  return process.env.DATABASE_URL || 'postgresql://hs:yeni@localhost:5432/agendaiq';
}

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isVercel = !!process.env.VERCEL;

// Database type detection
export const isSupabase = isProduction || isVercel;
export const isLocalDb = !isSupabase;

// Log current environment
if (typeof window === 'undefined') {
  console.log('=== Database Configuration ===');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Is Vercel:', isVercel);
  console.log('Database Type:', isSupabase ? 'Supabase' : 'Local PostgreSQL');
  console.log('=============================');
}