export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  command?: string;
  backupId?: string;
  scheduleId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  success?: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  command?: string;
  operation?: string;
  backupId?: string;
  scheduleId?: string;
  duration?: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface LogQueryOptions {
  level?: LogLevel;
  command?: string;
  backupId?: string;
  scheduleId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  successRate: number;
}
