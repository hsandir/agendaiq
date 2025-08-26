import { PrismaClient } from '@prisma/client';

interface ConnectionPoolConfig {
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  queryTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface PoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  failedConnections: number;
  queryCount: number;
  avgQueryTime: number;
}

class DatabasePoolManager {
  private static instance: DatabasePoolManager;
  private prismaClient: PrismaClient;
  private config: ConnectionPoolConfig;
  private metrics: PoolMetrics;
  private isInitialized: boolean = false;

  private constructor() {
    this.config = this.getPoolConfig();
    this.metrics = {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      failedConnections: 0,
      queryCount: 0,
      avgQueryTime: 0
    };
    this.prismaClient = this.createPrismaClient();
  }

  public static getInstance(): DatabasePoolManager {
    if (!DatabasePoolManager.instance) {
      DatabasePoolManager.instance = new DatabasePoolManager();
    }
    return DatabasePoolManager.instance;
  }

  private getPoolConfig(): ConnectionPoolConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      maxConnections: isProduction ? 20 : 5,
      connectionTimeout: 10000,
      idleTimeout: 300000, // 5 minutes
      queryTimeout: isProduction ? 30000 : 10000,
      retryAttempts: 3,
      retryDelay: 1000
    };
  }

  private createPrismaClient(): PrismaClient {
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error'] 
        : ['error'],
      errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });

    // Connection event monitoring
    client.$on('query', (e) => {
      this.metrics.queryCount++;
      this.metrics.avgQueryTime = (this.metrics.avgQueryTime + e.duration) / 2;
    });

    return client;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.prismaClient.$connect();
      this.isInitialized = true;
      this.metrics.totalConnections = 1;
      console.log('🔗 Database pool initialized successfully');
    } catch (error) {
      this.metrics.failedConnections++;
      console.error('❌ Database pool initialization failed:', error);
      throw error;
    }
  }

  public getClient(): PrismaClient {
    if (!this.isInitialized) {
      throw new Error('Database pool not initialized. Call initialize() first.');
    }
    return this.prismaClient;
  }

  public async executeWithRetry<T>(
    operation: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        this.metrics.activeConnections++;
        const result = await operation(this.prismaClient);
        this.metrics.activeConnections--;
        return result;
      } catch (error) {
        this.metrics.activeConnections--;
        lastError = error as Error;
        
        if (attempt === this.config.retryAttempts) {
          this.metrics.failedConnections++;
          break;
        }

        console.warn(`Database operation attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    throw lastError;
  }

  public getMetrics(): PoolMetrics {
    return { ...this.metrics };
  }

  public async healthCheck(): Promise<{ healthy: boolean; latency: number; error?: string }> {
    try {
      const startTime = Date.now();
      await this.prismaClient.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      
      return {
        healthy: true,
        latency
      };
    } catch (error) {
      return {
        healthy: false,
        latency: -1,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public async gracefulShutdown(): Promise<void> {
    try {
      await this.prismaClient.$disconnect();
      this.isInitialized = false;
      this.metrics.totalConnections = 0;
      console.log('🔌 Database pool disconnected gracefully');
    } catch (error) {
      console.error('❌ Error during database pool shutdown:', error);
    }
  }
}

// Export singleton instance
export const dbPool = DatabasePoolManager.getInstance();

// Export client getter for backward compatibility
export const getPooledPrismaClient = (): PrismaClient => {
  // For build time compatibility - don't initialize during build
  if (process.env.NODE_ENV === 'development' || typeof window === 'undefined') {
    try {
      return dbPool.getClient();
    } catch (error) {
      // If pool not initialized, return raw client for build compatibility
      if (error instanceof Error && error.message.includes('not initialized')) {
        console.warn('⚠️  Database pool not initialized, using raw Prisma client');
        return dbPool['prismaClient']; // Access private member for fallback
      }
      throw error;
    }
  }
  return dbPool.getClient();
};

// Initialize pool on module load (server-side only, not during build)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  dbPool.initialize().catch(console.error);
}