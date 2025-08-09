/**
 * File Transport for Logging
 * Writes logs to structured files with rotation and compression
 */

import { LogTransport, LogLevel, BaseLogEntry, DevLogEntry, AuditLogEntry, LogQuery } from '../types';
import fs from 'fs/promises';
import path from 'path';

export class FileTransport implements LogTransport {
  name = 'file';
  level: LogLevel;
  private baseDir: string;
  private maxFileSize: number;
  private maxFiles: number;

  constructor(
    level: LogLevel = LogLevel.INFO,
    baseDir: string = './logs',
    maxFileSize: number = 10 * 1024 * 1024, // 10MB
    maxFiles: number = 10
  ) {
    this.level = level;
    this.baseDir = baseDir;
    this.maxFileSize = maxFileSize;
    this.maxFiles = maxFiles;
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
      await fs.mkdir(path.join(this.baseDir, 'dev'), { recursive: true });
      await fs.mkdir(path.join(this.baseDir, 'audit'), { recursive: true });
    } catch (error) {
      console.error('Failed to create log directories:', error);
    }
  }

  private getLogFileName(type: 'dev' | 'audit', date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.baseDir, type, `${dateStr}.log`);
  }

  private formatLogEntry(entry: BaseLogEntry): string {
    const baseData = {
      id: entry.id,
      timestamp: entry.timestamp,
      level: LogLevel[entry.level],
      message: entry.message,
      context: entry.context,
      metadata: entry.metadata
    };

    if ('category' in entry) {
      const devEntry = entry as DevLogEntry;
      return JSON.stringify({
        ...baseData,
        category: devEntry.category,
        component: devEntry.component,
        function: devEntry.function,
        file: devEntry.file,
        line: devEntry.line,
        stack: devEntry.stack,
        performance: devEntry.performance,
        environment: devEntry.environment
      });
    } else {
      const auditEntry = entry as AuditLogEntry;
      return JSON.stringify({
        ...baseData,
        category: auditEntry.category,
        actor: auditEntry.actor,
        target: auditEntry.target,
        action: auditEntry.action,
        result: auditEntry.result,
        riskLevel: auditEntry.riskLevel,
        compliance: auditEntry.compliance,
        location: auditEntry.location
      });
    }
  }

  private async rotateLogFile(filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size >= this.maxFileSize) {
        // Create backup with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${filePath}.${timestamp}`;
        await fs.rename(filePath, backupPath);

        // Clean up old backups
        const dir = path.dirname(filePath);
        const files = await fs.readdir(dir);
        const logFiles = files
          .filter(f => f.startsWith(path.basename(filePath)))
          .map(f => ({
            name: f,
            path: path.join(dir, f),
            stat: null as any
          }));

        // Get file stats
        for (const file of logFiles) {
          try {
            file.stat = await fs.stat(file.path);
          } catch (error) {
            // Skip files we can't stat
          }
        }

        // Sort by creation time and remove oldest files
        logFiles
          .filter(f => f.stat)
          .sort((a, b) => b.stat.birthtimeMs - a.stat.birthtimeMs)
          .slice(this.maxFiles)
          .forEach(async (file) => {
            try {
              await fs.unlink(file.path);
            } catch (error) {
              console.error(`Failed to delete old log file ${file.path}:`, error);
            }
          });
      }
    } catch (error) {
      // File doesn't exist yet, which is fine
    }
  }

  async write(entry: BaseLogEntry): Promise<void> {
    if (entry.level < this.level) {
      return;
    }

    try {
      const isDev = 'category' in entry && typeof (entry as any).category === 'string' && 
                   ['system', 'database', 'api', 'auth', 'performance', 'error', 'network', 'cache', 'external', 'build'].includes((entry as any).category);
      
      const logType = isDev ? 'dev' : 'audit';
      const fileName = this.getLogFileName(logType);
      
      // Rotate file if necessary
      await this.rotateLogFile(fileName);
      
      // Write log entry
      const logLine = this.formatLogEntry(entry) + '\n';
      await fs.appendFile(fileName, logLine, 'utf8');
    } catch (error) {
      console.error('Failed to write log to file:', error);
    }
  }

  async query(query: LogQuery): Promise<BaseLogEntry[]> {
    const results: BaseLogEntry[] = [];
    
    try {
      // Determine which files to read based on date range
      const startDate = query.startDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = query.endDate || new Date();
      
      const filesToRead: string[] = [];
      
      // Generate list of potential log files
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        filesToRead.push(this.getLogFileName('dev', d));
        filesToRead.push(this.getLogFileName('audit', d));
      }

      // Read and parse log files
      for (const filePath of filesToRead) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const entry = JSON.parse(line);
              
              // Apply filters
              if (query.level && !query.level.includes(LogLevel[entry.level as keyof typeof LogLevel])) {
                continue;
              }
              
              if (query.category && !query.category.includes(entry.category)) {
                continue;
              }
              
              if (query.userId && entry.context?.userId !== query.userId) {
                continue;
              }
              
              if (query.search && !entry.message.toLowerCase().includes(query.search.toLowerCase())) {
                continue;
              }
              
              results.push({
                ...entry,
                level: LogLevel[entry.level as keyof typeof LogLevel]
              });
            } catch (parseError) {
              // Skip invalid JSON lines
            }
          }
        } catch (fileError) {
          // File might not exist, continue with next file
        }
      }

      // Sort results
      results.sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return query.orderDirection === 'asc' ? aTime - bTime : bTime - aTime;
      });

      // Apply pagination
      const start = query.offset || 0;
      const end = start + (query.limit || 100);
      return results.slice(start, end);
    } catch (error) {
      console.error('Failed to query logs from files:', error);
      return [];
    }
  }
}