import { createScheduleStore, getDefaultScheduleIndexPath, type Schedule } from './store.js';
import { createMetadataStore, getDefaultMetadataIndexPath as getDefaultMetadataIndexPathForBackup } from '../metadata-store/index.js';
import { backup, deleteBackup as deleteBackupFile, listBackups } from '../backup/index.js';
import * as cron from 'node-cron';
import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

// 活跃的定时任务映射
const activeSchedules = new Map<string, cron.ScheduledTask>();

export async function enableSchedule({
  name,
  level,
  cron: cronExpression,
  retainDays,
  backupDir,
}: {
  name: string;
  level: 'config' | 'system' | 'full';
  cron: string;
  retainDays: number;
  backupDir: string;
}) {
  const scheduleId = `schedule-${Date.now()}`;

  // 计算下次运行时间（基于 cron 表达式）
  const nextRun = calculateNextRun(cronExpression);

  const scheduleData: Schedule = {
    id: scheduleId,
    name,
    level,
    cron: cronExpression,
    retainDays,
    enabled: true,
    lastRun: null,
    nextRun,
  };

  const store = createScheduleStore(getDefaultScheduleIndexPath(backupDir));
  await store.add(scheduleData);

  // 立即启动定时任务
  if (scheduleData.enabled) {
    startSchedule(scheduleData, backupDir);
  }

  return scheduleData;
}

export async function disableSchedule(id: string, { backupDir }: { backupDir: string }) {
  // 停止该任务
  stopSchedule(id);

  const store = createScheduleStore(getDefaultScheduleIndexPath(backupDir));
  await store.update(id, { enabled: false, nextRun: null });

  const schedule = await store.get(id);
  if (!schedule) {
    throw new Error(`Schedule not found: ${id}`);
  }
  return schedule;
}

export async function listSchedules({ backupDir }: { backupDir: string }) {
  const store = createScheduleStore(getDefaultScheduleIndexPath(backupDir));
  return await store.list();
}

export async function setRetainDays(
  id: string,
  retainDays: number,
  { backupDir }: { backupDir: string }
) {
  const store = createScheduleStore(getDefaultScheduleIndexPath(backupDir));
  await store.update(id, { retainDays });

  const schedule = await store.get(id);
  if (!schedule) {
    throw new Error(`Schedule not found: ${id}`);
  }
  return schedule;
}

export async function deleteOldBackups(retainDays: number, { backupDir }: { backupDir: string }) {
  const cutoffTime = Date.now() - (retainDays * 24 * 60 * 60 * 1000);
  const metadataStore = createMetadataStore(getDefaultMetadataIndexPathForBackup(backupDir));
  const allBackups = await metadataStore.list();

  let deletedCount = 0;

  for (const backup of allBackups) {
    if (backup.timestamp < cutoffTime) {
      // 删除备份文件
      const backupPath = path.join(backupDir, `${backup.id}.tar.gz`);
      const backupJsonPath = path.join(backupDir, `${backup.id}.json`);

      try {
        if (await fsExtra.pathExists(backupPath)) {
          await fs.unlink(backupPath);
        }
        if (await fsExtra.pathExists(backupJsonPath)) {
          await fs.unlink(backupJsonPath);
        }

        // 从元数据存储中删除
        await metadataStore.delete(backup.id);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete backup ${backup.id}:`, error);
      }
    }
  }

  return deletedCount;
}

export function shutdownAllSchedules() {
  // 停止所有活跃的定时任务
  for (const [scheduleId, task] of activeSchedules) {
    task.stop();
    activeSchedules.delete(scheduleId);
  }
}

export async function startAllSchedules(backupDir: string) {
  // 停止现有的任务
  shutdownAllSchedules();

  // 获取所有启用的计划并启动
  const store = createScheduleStore(getDefaultScheduleIndexPath(backupDir));
  const schedules = await store.list();

  for (const schedule of schedules) {
    if (schedule.enabled) {
      startSchedule(schedule, backupDir);
    }
  }

  return schedules.filter(s => s.enabled).length;
}

/**
 * 启动单个定时任务
 */
function startSchedule(schedule: Schedule, backupDir: string) {
  // 验证 cron 表达式
  if (!cron.validate(schedule.cron)) {
    console.error(`Invalid cron expression: ${schedule.cron}`);
    return;
  }

  // 创建定时任务
  const task = cron.schedule(schedule.cron, async () => {
    try {
      console.log(`Running scheduled backup: ${schedule.name} (${schedule.id})`);

      // 执行备份
      const result = await backup({
        level: schedule.level,
        name: `${schedule.name} - Scheduled`,
        output: backupDir,
      });

      // 更新最后运行时间和下次运行时间
      const scheduleStore = createScheduleStore(getDefaultScheduleIndexPath(backupDir));
      await scheduleStore.update(schedule.id, {
        lastRun: Date.now(),
        nextRun: calculateNextRun(schedule.cron),
      });

      console.log(`Scheduled backup completed: ${schedule.id}, file: ${result.filePath}`);

      // 检查是否需要清理旧备份
      if (schedule.retainDays > 0) {
        const deletedCount = await deleteOldBackups(schedule.retainDays, { backupDir });
        if (deletedCount > 0) {
          console.log(`Deleted ${deletedCount} old backups`);
        }
      }
    } catch (error) {
      console.error(`Scheduled backup failed: ${schedule.id}`, error);
    }
  }, {
    scheduled: true,
    timezone: 'local',
  });

  activeSchedules.set(schedule.id, task);
  task.start();
}

/**
 * 停止单个定时任务
 */
function stopSchedule(scheduleId: string) {
  const task = activeSchedules.get(scheduleId);
  if (task) {
    task.stop();
    activeSchedules.delete(scheduleId);
  }
}

/**
 * 计算下次运行时间
 */
function calculateNextRun(cronExpression: string): number {
  try {
    // 使用 node-cron 的 CronTime 来计算下次运行时间
    const cronTime = new cron.CronTime(cronExpression);
    const next = cronTime.sendTo(new Date());
    if (next) {
      return next.getTime();
    }
    // 如果计算失败，默认 1 小时后
    return Date.now() + 60 * 60 * 1000;
  } catch {
    // 默认 1 小时后
    return Date.now() + 60 * 60 * 1000;
  }
}

/**
 * 检查任务是否正在运行
 */
export function isScheduleRunning(scheduleId: string): boolean {
  return activeSchedules.has(scheduleId);
}

/**
 * 获取运行中的任务数量
 */
export function getRunningScheduleCount(): number {
  return activeSchedules.size;
}

/**
 * 获取所有运行中的任务 ID
 */
export function getRunningScheduleIds(): string[] {
  return Array.from(activeSchedules.keys());
}
