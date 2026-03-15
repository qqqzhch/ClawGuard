import fsExtra from 'fs-extra';
import path from 'path';
import { z } from 'zod';

const ScheduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(['config', 'system', 'full']),
  cron: z.string(),
  retainDays: z.number(),
  lastRun: z.number().nullable(),
  nextRun: z.number(),
  enabled: z.boolean(),
});

type Schedule = z.infer<typeof ScheduleSchema>;

interface ScheduleStore {
  add(schedule: Schedule): Promise<void>;
  get(id: string): Promise<Schedule | null>;
  list(): Promise<Schedule[]>;
  update(id: string, updates: Partial<Schedule>): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): Promise<void>;
}

function getDefaultScheduleIndexPath(dataDir: string): string {
  return path.join(dataDir, 'schedule-index.json');
}

function createScheduleStore(dataPath: string): ScheduleStore {
  let schedules: Map<string, Schedule> = new Map();
  let isLoaded = false;

  async function load() {
    if (isLoaded) return;

    try {
      if (await fsExtra.pathExists(dataPath)) {
        const content = await fsExtra.readJson(dataPath);
        schedules = new Map(content.map((s: Schedule) => [s.id, ScheduleSchema.parse(s)]));
      }
    } catch (error) {
      console.error('Failed to load schedule store:', error);
    } finally {
      isLoaded = true;
    }
  }

  async function save() {
    await fsExtra.ensureDir(path.dirname(dataPath));
    const content = Array.from(schedules.values());
    await fsExtra.writeJson(dataPath, content, { spaces: 2 });
  }

  async function add(schedule: Schedule) {
    await load();
    const parsed = ScheduleSchema.parse(schedule);
    schedules.set(parsed.id, parsed);
    await save();
  }

  async function get(id: string): Promise<Schedule | null> {
    await load();
    return schedules.get(id) || null;
  }

  async function list(): Promise<Schedule[]> {
    await load();
    return Array.from(schedules.values());
  }

  async function update(id: string, updates: Partial<Schedule>) {
    await load();
    const existing = schedules.get(id);
    if (!existing) return;

    const updated = ScheduleSchema.parse({
      ...existing,
      ...updates,
      id,
    });

    schedules.set(id, updated);
    await save();
  }

  async function del(id: string) {
    await load();
    schedules.delete(id);
    await save();
  }

  async function clear() {
    await load();
    schedules.clear();
    await save();
  }

  return {
    add,
    get,
    list,
    update,
    delete: del,
    clear,
  };
}

export { createScheduleStore, getDefaultScheduleIndexPath, Schedule };
export type { ScheduleStore };