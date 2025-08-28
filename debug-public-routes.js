// Debug script to test public route functions
import { isPublicRoute, isPublicApiRoute } from './src/lib/auth/public-routes.ts';

console.log('=== TESTING PUBLIC ROUTE FUNCTIONS ===');

// Test public routes
console.log('Testing isPublicRoute:');
console.log('/auth/signin:', isPublicRoute('/auth/signin'));
console.log('/health:', isPublicRoute('/health'));
console.log('/dashboard:', isPublicRoute('/dashboard'));

// Test public API routes
console.log('\nTesting isPublicApiRoute:');
console.log('/api/health:', isPublicApiRoute('/api/health'));
console.log('/api/auth/signin:', isPublicApiRoute('/api/auth/signin'));
console.log('/api/setup/check:', isPublicApiRoute('/api/setup/check'));
console.log('/api/users:', isPublicApiRoute('/api/users'));

console.log('=== END TEST ===');