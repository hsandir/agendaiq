/**
 * Console Transport for Development/Admin Logging
 * Provides formatted console output with colors and structured data
 */

import { LogTransport, LogLevel, BaseLogEntry, DevLogEntry, LogQuery } from '../types';

export class ConsoleTransport implements LogTransport {
  name = 'console';
  level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level
  }

  private getColorForLevel(level: LogLevel): string {
    const colors = {
      [(LogLevel.TRACE)]: '\x1b[90m', // gray
      [(LogLevel.DEBUG)]: '\x1b[36m', // cyan
      [(LogLevel.INFO)]: '\x1b[32m',  // green
      [(LogLevel.WARN)]: '\x1b[33m',  // yellow
      [(LogLevel.ERROR)]: '\x1b[31m', // red
      [(LogLevel.FATAL)]: '\x1b[35m'  // magenta
    };
    return colors[level] || '\x1b[0m';
  }

  private getLevelName(level: LogLevel): string {
    const names = {
      [(LogLevel.TRACE)]: 'TRACE',
      [(LogLevel.DEBUG)]: 'DEBUG',
      [(LogLevel.INFO)]: 'INFO ',
      [(LogLevel.WARN)]: 'WARN ',
      [(LogLevel.ERROR)]: 'ERROR',
      [(LogLevel.FATAL)]: 'FATAL'
    };
    return names[level];
  }

  private formatEntry(entry: BaseLogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const levelColor = this.getColorForLevel(entry.level);
    const levelName = this.getLevelName(entry.level);
    const reset = '\x1b[0m';

    let formatted = `${levelColor}[${timestamp}] ${levelName}${reset} ${entry.message}`;

    // Add context information
    if (entry.context) {
      const contextParts: string[] = [];
      if (entry.context.userId) contextParts.push(`user:${entry.context.userId}`);
      if (entry.context.path) contextParts.push(`path:${entry.context.path}`);
      if (entry.context.method) contextParts.push(`method:${entry.context.method}`);
      if (entry.context.statusCode) contextParts.push(`status:${entry.context.statusCode}`);
      if (entry.context.duration) contextParts.push(`duration:${entry.context.duration}ms`);
      
      if (contextParts.length > 0) {
        formatted += ` \x1b[90m[${contextParts.join(', ')}]\x1b[0m`;
      }
    }

    // Add development-specific information
    if ('category' in entry) {
      const devEntry = entry as DevLogEntry;
      formatted += ` \x1b[90m[${devEntry.category}]\x1b[0m`;
      
      if (devEntry.component) {
        formatted += ` \x1b[90m{${devEntry.component}}\x1b[0m`;
      }
    }

    // Add metadata if present
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      formatted += `\n  \x1b[90mMetadata:\x1b[0m ${JSON.stringify(entry.metadata, null, 2).split('\n').join('\n  ')}`;
    }

    // Add stack trace for errors
    if ('stack' in entry && (entry as DevLogEntry).stack) {
      formatted += `\n  \x1b[90mStack:\x1b[0m\n  ${(entry as DevLogEntry).stack?.split('\n').join('\n  ')}`;
    }

    return formatted;
  }

  async write(entry: BaseLogEntry): Promise<void> {
    if (entry.level < this.level) {
      return
    }

    const formatted = this.formatEntry(entry);
    
    // Use appropriate console method based on level
    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formatted);
        break;
    }
  }

  // Console transport doesn't support querying
  async query(query: LogQuery): Promise<BaseLogEntry[]> {
    console.warn('Console transport does not support querying logs');
    return [];
  }
}