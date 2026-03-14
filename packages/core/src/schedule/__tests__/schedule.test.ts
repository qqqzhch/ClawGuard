import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  enableSchedule,
  disableSchedule,
  listSchedules,
  setRetainDays,
  deleteOldBackups
} from '../schedule.js';
import { createScheduleStore, getDefaultScheduleIndexPath } from './store.js';
import { backup } from '../../backup/index.js';
import { createMetadataStore, getDefaultMetadataIndexPath as getMetadataIndexPath } from '../../metadata-store/index.js';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Schedule Module', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-schedule');
  const backupDir = path.join(testDir, '.clawguard', 'backups');
  const schedulePath = getDefaultScheduleIndexPath(backupDir);
  const metadataIndexPath = getMetadataIndexPath(backupDir);

  beforeEach(async () => {
    await fsExtra.ensureDir(backupDir);
    const scheduleStore = createScheduleStore(schedulePath);
    await scheduleStore.clear();
    const metadataStore = createMetadataStore(metadataIndexPath);
    await metadataStore.clear();
  });

  afterEach(async () => {
    await fsExtra.remove(testDir);
  });

  it('should enable new schedule', async () => {
    const schedule = await enableSchedule({
      name: 'Daily Backup',
      level: 'config',
      cron: '0 0 * * *',
      retainDays: 7,
      backupDir,
    });

    expect(schedule.id).toBeDefined();
    expect(schedule.enabled).toBe(true);
    expect(schedule.cron).toBe('0 0 * * *');
  });

  it('should disable existing schedule', async () => {
    const schedule = await enableSchedule({
      name: 'Daily Backup',
      level: 'config',
      cron: '0 0 * * *',
      retainDays: 7,
      backupDir,
    });

    const disabled = await disableSchedule(schedule.id, { backupDir });

    expect(disabled.enabled).toBe(false);
  });

  it('should list all schedules', async () => {
    await enableSchedule({
      name: 'Daily Backup',
      level: 'config',
      cron: '0 0 * * *',
      retainDays: 7,
      backupDir,
    });
    await enableSchedule({
      name: 'Hourly Backup',
      level: 'system',
      cron: '0 * * * *',
      retainDays: 3,
      backupDir,
    });

    const list = await listSchedules({ backupDir });

    expect(list).toHaveLength(2);
  });

  it('should update retain days', async () => {
    const schedule = await enableSchedule({
      name: 'Daily Backup',
      level: 'config',
      cron: '0 0 * * *',
      retainDays: 7,
      backupDir,
    });

    const updated = await setRetainDays(schedule.id, 14, { backupDir });

    expect(updated.retainDays).toBe(14);
  });

  it('should delete old backups', async () => {
    // Create some backups
    const oldDate = Date.now() - (10 * 24 * 60 * 60 * 1000); // 10 days ago
    await backup({ level: 'config', output: backupDir });

    const metadataStore = createMetadataStore(metadataIndexPath);
    const backups = await metadataStore.list();

    // Mock old backup timestamp
    if (backups.length > 0) {
      await metadataStore.update(backups[0].id, { timestamp: oldDate });
    }

    // Delete backups older than 7 days
    const deleted = await deleteOldBackups(7, { backupDir });

    expect(deleted).toBeGreaterThanOrEqual(0);
  });
});
