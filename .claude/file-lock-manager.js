#!/usr/bin/env node

/**
 * File Lock Manager for AgendaIQ
 * Prevents file conflicts between multiple agents
 */

const fs = require('fs');
const path = require('path');

class FileLockManager {
  constructor() {
    this.lockDir = path.join(process.cwd(), '.claude', 'locks');
    this.agentId = process.env.AGENT_ID || 'claude-main';
    this.lockTimeout = 30000; // 30 seconds timeout for stale locks
    
    // Create lock directory if it doesn't exist
    if (!fs.existsSync(this.lockDir)) {
      fs.mkdirSync(this.lockDir, { recursive: true });
    }
  }

  /**
   * Acquire a lock for a file
   * @param {string} filePath - The file to lock
   * @param {number} maxWait - Maximum time to wait for lock (ms)
   * @returns {boolean} - True if lock acquired, false otherwise
   */
  async acquireLock(filePath, maxWait = 5000) {
    const lockFile = this.getLockFilePath(filePath);
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        // Check if lock exists
        if (fs.existsSync(lockFile)) {
          const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
          
          // Check if lock is stale
          if (Date.now() - lockData.timestamp > this.lockTimeout) {
            console.log(`Removing stale lock for ${filePath}`);
            fs.unlinkSync(lockFile);
          } else {
            // Lock is active, wait
            console.log(`File ${filePath} is locked by ${lockData.agentId}, waiting...`);
            await this.sleep(500);
            continue;
          }
        }
        
        // Try to create lock
        const lockData = {
          agentId: this.agentId,
          filePath: filePath,
          timestamp: Date.now(),
          pid: process.pid
        };
        
        // Use exclusive flag to prevent race conditions
        fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2), { flag: 'wx' });
        console.log(`Lock acquired for ${filePath} by ${this.agentId}`);
        return true;
        
      } catch (error) {
        if (error.code === 'EEXIST') {
          // Another agent just created the lock, wait
          await this.sleep(500);
        } else {
          console.error(`Error acquiring lock for ${filePath}:`, error.message);
          return false;
        }
      }
    }
    
    console.log(`Failed to acquire lock for ${filePath} within ${maxWait}ms`);
    return false;
  }

  /**
   * Release a lock for a file
   * @param {string} filePath - The file to unlock
   */
  releaseLock(filePath) {
    const lockFile = this.getLockFilePath(filePath);
    
    try {
      if (fs.existsSync(lockFile)) {
        const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
        
        // Only release if we own the lock
        if (lockData.agentId === this.agentId) {
          fs.unlinkSync(lockFile);
          console.log(`Lock released for ${filePath} by ${this.agentId}`);
        } else {
          console.log(`Cannot release lock for ${filePath} - owned by ${lockData.agentId}`);
        }
      }
    } catch (error) {
      console.error(`Error releasing lock for ${filePath}:`, error.message);
    }
  }

  /**
   * Check if a file is locked
   * @param {string} filePath - The file to check
   * @returns {Object|null} - Lock info if locked, null otherwise
   */
  isLocked(filePath) {
    const lockFile = this.getLockFilePath(filePath);
    
    try {
      if (fs.existsSync(lockFile)) {
        const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
        
        // Check if lock is stale
        if (Date.now() - lockData.timestamp > this.lockTimeout) {
          fs.unlinkSync(lockFile);
          return null;
        }
        
        return lockData;
      }
    } catch (error) {
      console.error(`Error checking lock for ${filePath}:`, error.message);
    }
    
    return null;
  }

  /**
   * Clean up all stale locks
   */
  cleanupStaleLocks() {
    try {
      const files = fs.readdirSync(this.lockDir);
      let cleaned = 0;
      
      files.forEach(file => {
        const lockFile = path.join(this.lockDir, file);
        try {
          const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
          
          if (Date.now() - lockData.timestamp > this.lockTimeout) {
            fs.unlinkSync(lockFile);
            cleaned++;
            console.log(`Cleaned stale lock: ${file}`);
          }
        } catch (error) {
          // Invalid lock file, remove it
          fs.unlinkSync(lockFile);
          cleaned++;
        }
      });
      
      if (cleaned > 0) {
        console.log(`Cleaned ${cleaned} stale locks`);
      }
    } catch (error) {
      console.error('Error cleaning up stale locks:', error.message);
    }
  }

  /**
   * List all active locks
   */
  listLocks() {
    try {
      const files = fs.readdirSync(this.lockDir);
      const locks = [];
      
      files.forEach(file => {
        const lockFile = path.join(this.lockDir, file);
        try {
          const lockData = JSON.parse(fs.readFileSync(lockFile, 'utf-8'));
          
          if (Date.now() - lockData.timestamp <= this.lockTimeout) {
            locks.push({
              ...lockData,
              age: Math.round((Date.now() - lockData.timestamp) / 1000) + 's'
            });
          }
        } catch (error) {
          // Skip invalid lock files
        }
      });
      
      if (locks.length > 0) {
        console.log('Active locks:');
        locks.forEach(lock => {
          console.log(`  - ${lock.filePath} (${lock.agentId}, age: ${lock.age})`);
        });
      } else {
        console.log('No active locks');
      }
      
      return locks;
    } catch (error) {
      console.error('Error listing locks:', error.message);
      return [];
    }
  }

  /**
   * Get lock file path for a given file
   */
  getLockFilePath(filePath) {
    const normalizedPath = path.relative(process.cwd(), filePath);
    const lockFileName = normalizedPath.replace(/[\/\\]/g, '__') + '.lock';
    return path.join(this.lockDir, lockFileName);
  }

  /**
   * Helper function to sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export for use in other scripts
module.exports = FileLockManager;

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const manager = new FileLockManager();
  
  switch (args[0]) {
    case 'lock':
      if (args[1]) {
        manager.acquireLock(args[1]).then(success => {
          process.exit(success ? 0 : 1);
        });
      } else {
        console.log('Usage: file-lock-manager.js lock <file-path>');
      }
      break;
      
    case 'unlock':
      if (args[1]) {
        manager.releaseLock(args[1]);
      } else {
        console.log('Usage: file-lock-manager.js unlock <file-path>');
      }
      break;
      
    case 'check':
      if (args[1]) {
        const lock = manager.isLocked(args[1]);
        if (lock) {
          console.log(`File is locked by ${lock.agentId}`);
          process.exit(1);
        } else {
          console.log('File is not locked');
          process.exit(0);
        }
      } else {
        console.log('Usage: file-lock-manager.js check <file-path>');
      }
      break;
      
    case 'list':
      manager.listLocks();
      break;
      
    case 'cleanup':
      manager.cleanupStaleLocks();
      break;
      
    default:
      console.log('File Lock Manager for AgendaIQ');
      console.log('');
      console.log('Usage:');
      console.log('  file-lock-manager.js lock <file-path>    - Acquire lock for a file');
      console.log('  file-lock-manager.js unlock <file-path>  - Release lock for a file');
      console.log('  file-lock-manager.js check <file-path>   - Check if file is locked');
      console.log('  file-lock-manager.js list                - List all active locks');
      console.log('  file-lock-manager.js cleanup             - Clean up stale locks');
      console.log('');
      console.log('Environment variables:');
      console.log('  AGENT_ID - Unique identifier for this agent (default: claude-main)');
  }
}