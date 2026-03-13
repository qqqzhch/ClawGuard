export interface ScheduleOptions {
  cron: string;
  retainDays: number;
  enabled: boolean;
}

export interface ScheduleTask {
  id: string;
  name: string;
  cron: string;
  lastRun: number | null;
  nextRun: number;
  enabled: boolean;
}
