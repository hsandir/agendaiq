/// <reference types="node" />
import { dbPool, getPooledPrismaClient } from './db-pool-manager';

/**
 * Enhanced Prisma Client with Connection Pool Management
 * 
 * Zero Degradation Protocol: Maintains existing API while adding pool management
 * - Backward compatible with existing prisma usage
 * - Adds connection pool management and retry logic
 * - Enhanced monitoring and health checks
 */

// Main export for backward compatibility
export const prisma = getPooledPrismaClient();

// Enhanced database operations with connection pool management
export const db = {
  // Get the raw client (same as prisma export)
  client: prisma,
  
  // Execute with automatic retry logic
  executeWithRetry: dbPool.executeWithRetry.bind(dbPool),
  
  // Get pool metrics
  getMetrics: dbPool.getMetrics.bind(dbPool),
  
  // Health check
  healthCheck: dbPool.healthCheck.bind(dbPool),
  
  // Graceful shutdown
  shutdown: dbPool.gracefulShutdown.bind(dbPool)
}; 