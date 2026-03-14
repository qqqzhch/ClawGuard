import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { enableSchedule, disableSchedule, listSchedules, setRetainDays } from '../../../../core/src/schedule/index.js';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Schedule CLI Commands', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-schedule-cli');
  const backupDir = path.join(testDir, '.clawguard', 'backups');

  beforeEach(async () => {
    await fsExtra.ensureDir(backupDir);
  });

  afterEach(async () => {
    await fsExtra.remove(testDir);
  });

  it('should enable schedule', async () => {
    const schedule = await enableSchedule({
      name: 'Daily Backup',
      level: 'config',
      cron: '0 0 * * *',
      retainDays: 7,
      backupDir,
    });

    expect(schedule.id).toBeDefined();
    expect(schedule.enabled).toBe(true);
  });

  it('should list schedules', async () => {
    await enableSchedule({
      name: 'Daily Backup',
      level: 'config',
      cron: '0 0 * * *',
      retainDays: 7,
      backupDir,
    });

    const list = await listSchedules({ backupDir });

    expect(list).toHaveLength(1);
    expect(list[0].name).toBe('Daily Backup');
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
});