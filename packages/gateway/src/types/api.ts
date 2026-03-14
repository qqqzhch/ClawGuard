export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}

export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
  code?: string;
}

export interface BackupItem {
  id: string;
  name: string;
  level: 'config' | 'system' | 'full';
  timestamp: string;
  size: number;
  encrypted: boolean;
  path: string;
}

export interface ScheduleItem {
  id: string;
  name: string;
  level: 'config' | 'system' | 'full';
  cron: string;
  retainDays: number;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface LogItem {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  command?: string;
  operation?: string;
  backupId?: string;
  scheduleId?: string;
  success: boolean;
  error?: string;
}

export interface ConfigEntry {
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'object';
}
