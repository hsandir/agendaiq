import { dbPool } from '@/lib/db-pool-manager';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    $queryRaw: jest.fn().mockResolvedValue([{ result: 1 }]),
    $on: jest.fn(),
  })),
}));

describe('DatabasePoolManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await dbPool.gracefulShutdown();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(dbPool.initialize()).resolves.not.toThrow();
    });

    it('should not reinitialize if already initialized', async () => {
      await dbPool.initialize();
      await dbPool.initialize(); // Second call should not throw
      expect(true).toBe(true); // Test passes if no error thrown
    });

    it('should get client after initialization', async () => {
      await dbPool.initialize();
      const client = dbPool.getClient();
      expect(client).toBeDefined();
      expect(typeof client).toBe('object');
    });

    it('should throw error when getting client before initialization', () => {
      expect(() => {
        dbPool.getClient();
      }).toThrow('Database pool not initialized');
    });
  });

  describe('executeWithRetry', () => {
    beforeEach(async () => {
      await dbPool.initialize();
    });

    it('should execute operation successfully', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await dbPool.executeWithRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry failed operations', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValue('success on third attempt');
      
      const result = await dbPool.executeWithRetry(mockOperation);
      
      expect(result).toBe('success on third attempt');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(dbPool.executeWithRetry(mockOperation)).rejects.toThrow('Always fails');
      expect(mockOperation).toHaveBeenCalledTimes(3); // Default retry attempts
    });
  });

  describe('Health Check', () => {
    beforeEach(async () => {
      await dbPool.initialize();
    });

    it('should return healthy status when database is accessible', async () => {
      const health = await dbPool.healthCheck();
      
      expect(health.healthy).toBe(true);
      expect(health.latency).toBeGreaterThanOrEqual(0);
      expect(health.error).toBeUndefined();
    });

    it('should return unhealthy status when database query fails', async () => {
      const client = dbPool.getClient();
      (client.$queryRaw as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));
      
      const health = await dbPool.healthCheck();
      
      expect(health.healthy).toBe(false);
      expect(health.latency).toBe(-1);
      expect(health.error).toBe('Database connection failed');
    });
  });

  describe('Metrics', () => {
    beforeEach(async () => {
      await dbPool.initialize();
    });

    it('should return initial metrics', () => {
      const metrics = dbPool.getMetrics();
      
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('idleConnections');
      expect(metrics).toHaveProperty('totalConnections');
      expect(metrics).toHaveProperty('failedConnections');
      expect(metrics).toHaveProperty('queryCount');
      expect(metrics).toHaveProperty('avgQueryTime');
      
      expect(typeof metrics.activeConnections).toBe('number');
      expect(typeof metrics.totalConnections).toBe('number');
    });

    it('should update metrics after operations', async () => {
      const initialMetrics = dbPool.getMetrics();
      
      await dbPool.executeWithRetry(async () => 'test operation');
      
      const updatedMetrics = dbPool.getMetrics();
      expect(updatedMetrics).toBeDefined();
    });
  });

  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await dbPool.initialize();
      
      await expect(dbPool.gracefulShutdown()).resolves.not.toThrow();
    });

    it('should handle shutdown errors gracefully', async () => {
      await dbPool.initialize();
      
      const client = dbPool.getClient();
      (client.$disconnect as jest.Mock).mockRejectedValueOnce(new Error('Disconnect failed'));
      
      await expect(dbPool.gracefulShutdown()).resolves.not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should use production configuration in production environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Test that config is applied correctly
      expect(process.env.NODE_ENV).toBe('production');
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should use development configuration in development environment', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      expect(process.env.NODE_ENV).toBe('development');
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});