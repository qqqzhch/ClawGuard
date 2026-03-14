import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createScheduleStore, getDefaultScheduleIndexPath } from '../store.js';
import fsExtra from 'fs-extra';
import path from 'path';
import os from 'os';

describe('Schedule Store', () => {
  const testDir = path.join(os.tmpdir(), 'clawguard-test-schedule-store');
  const schedulePath = getDefaultScheduleIndexPath(testDir);

  beforeEach(async () => {
    await fsExtra.ensureDir(testDir);
    await fsExtra.remove(schedulePath);
  });

  afterEach(async () => {
    await fsExtra.remove(testDir);
  });

  it('should create new schedule store', () => {
    const store = createScheduleStore(schedulePath);
    expect(store).toBeDefined();
  });

  it('should add and retrieve schedule', async () => {
    const store = createScheduleStore(schedulePath);
    const schedule = {
      id: 'test-id',
      name: 'Daily Backup',
      cron: '0 0 * * *',
      lastRun: null,
      nextRun: Date.now() + 86400000,
      enabled: true,
    };

    await store.add(schedule);
    const retrieved = await store.get('test-id');

    expect(retrieved).toEqual(schedule);
  });

  it('should list all schedules', async () => {
    const store = createScheduleStore(schedulePath);
    const schedule1 = {
      id: 'id-1',
      name: 'Daily Backup',
      cron: '0 0 * * *',
      lastRun: null,
      nextRun: Date.now() + 86400000,
      enabled: true,
    };
    const schedule2 = {
      id: 'id-2',
      name: 'Hourly Backup',
      cron: '0 * * * *',
      lastRun: null,
      nextRun: Date.now() + 3600000,
      enabled: false,
    };

    await store.add(schedule1);
    await store.add(schedule2);
    const list = await store.list();

    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('id-1');
    expect(list[1].id).toBe('id-2');
  });

  it('should update schedule', async () => {
    const store = createScheduleStore(schedulePath);
    const schedule = {
      id: 'test-id',
      name: 'Daily Backup',
      cron: '0 0 * * *',
      lastRun: null,
      nextRun: Date.now() + 86400000,
      enabled: true,
    };

    await store.add(schedule);
    await store.update('test-id', { enabled: false });
    const updated = await store.get('test-id');

    expect(updated?.enabled).toBe(false);
    expect(updated?.name).toBe('Daily Backup');
  });

  it('should delete schedule', async () => {
    const store = createScheduleStore(schedulePath);
    const schedule = {
      id: 'test-id',
      name: 'Daily Backup',
      cron: '0 0 * * *',
      lastRun: null,
      nextRun: Date.now() + 86400000,
      enabled: true,
    };

    await store.add(schedule);
    await store.delete('test-id');
    const deleted = await store.get('test-id');

    expect(deleted).toBeNull();
  });

  it('should clear all schedules', async () => {
    const store = createScheduleStore(schedulePath);
    const schedule = {
      id: 'test-id',
      name: 'Daily Backup',
      cron: '0 0 * * *',
      lastRun: null,
      nextRun: Date.now() + 86400000,
      enabled: true,
    };

    await store.add(schedule);
    await store.clear();
    const list = await store.list();

    expect(list).toHaveLength(0);
  });
});