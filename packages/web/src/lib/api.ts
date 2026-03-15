const API_BASE = '/api';

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

class ApiError extends Error {
  constructor(
    response: ApiResponse,
    status?: number
  ) {
    super(response.error || 'Unknown error');
    this.name = 'ApiError';
    this.response = response;
    this.status = status;
  }

  response: ApiResponse;
  status?: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json() as ApiResponse<T>;
  if (!data.success) {
    throw new ApiError(data, response.status);
  }
  return data.data as T;
}

export const api = {
  // Backups
  async getBackups(): Promise<PaginatedResponse<BackupItem>> {
    const response = await fetch(`${API_BASE}/backups`);
    return handleResponse(response);
  },

  async getBackup(id: string): Promise<BackupItem> {
    const response = await fetch(`${API_BASE}/backups/${id}`);
    return handleResponse(response);
  },

  async deleteBackup(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/backups/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Config
  async getConfig(): Promise<ConfigEntry[]> {
    const response = await fetch(`${API_BASE}/config`);
    return handleResponse(response);
  },

  async updateConfig(key: string, value: unknown): Promise<void> {
    const response = await fetch(`${API_BASE}/config/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
    return handleResponse(response);
  },

  // Schedules
  async getSchedules(): Promise<PaginatedResponse<ScheduleItem>> {
    const response = await fetch(`${API_BASE}/schedules`);
    return handleResponse(response);
  },

  async createSchedule(schedule: Omit<ScheduleItem, 'id' | 'lastRun' | 'nextRun'>): Promise<ScheduleItem> {
    const response = await fetch(`${API_BASE}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    return handleResponse(response);
  },

  async updateSchedule(id: string, schedule: Partial<ScheduleItem>): Promise<ScheduleItem> {
    const response = await fetch(`${API_BASE}/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    return handleResponse(response);
  },

  async deleteSchedule(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/schedules/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Logs
  async getLogs(params?: { level?: string; limit?: number }): Promise<PaginatedResponse<LogItem>> {
    const url = new URL(`${API_BASE}/logs`);
    if (params?.level) url.searchParams.set('level', params.level);
    if (params?.limit) url.searchParams.set('limit', params.limit.toString());
    const response = await fetch(url.toString());
    return handleResponse(response);
  },

  async getLogStats(): Promise<{ total: number; byLevel: Record<string, number> }> {
    const response = await fetch(`${API_BASE}/logs/stats`);
    return handleResponse(response);
  },

  // Restore
  async restoreBackup(id: string, options?: { dryRun?: boolean }): Promise<{ filesRestored: number; duration: number }> {
    const response = await fetch(`${API_BASE}/restores/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options || {}),
    });
    return handleResponse(response);
  },
};

export { ApiError };
