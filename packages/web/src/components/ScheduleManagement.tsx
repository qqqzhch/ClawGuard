import { useState, useEffect } from 'react';
import { api, type ScheduleItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RefreshCw, Plus, Clock, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<ScheduleItem>>({
    name: '',
    level: 'config',
    cron: '0 0 * * *',
    retainDays: 7,
    enabled: true,
  });

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.getSchedules();
      setSchedules(response.data || []);
    } catch (error) {
      console.error('Failed to load schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.createSchedule(newSchedule as Omit<ScheduleItem, 'id' | 'lastRun' | 'nextRun'>);
      await loadSchedules();
      setShowCreateDialog(false);
      setNewSchedule({
        name: '',
        level: 'config',
        cron: '0 0 * * *',
        retainDays: 7,
        enabled: true,
      });
    } catch (error) {
      alert('创建计划失败');
    }
  };

  const handleToggle = async (schedule: ScheduleItem) => {
    try {
      await api.updateSchedule(schedule.id, { enabled: !schedule.enabled });
      await loadSchedules();
    } catch (error) {
      alert('更新计划失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此计划吗？')) return;
    try {
      await api.deleteSchedule(id);
      await loadSchedules();
    } catch (error) {
      alert('删除计划失败');
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">加载计划中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">定时备份计划</h2>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                新建计划
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建定时计划</DialogTitle>
                <DialogDescription>配置自动备份的定时任务</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">计划名称</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={newSchedule.name}
                    onChange={(e) => setNewSchedule({ ...newSchedule, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">备份级别</label>
                  <select
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={newSchedule.level}
                    onChange={(e) => setNewSchedule({ ...newSchedule, level: e.target.value as ScheduleItem['level'] })}
                  >
                    <option value="config">配置文件</option>
                    <option value="system">配置 + 系统文件</option>
                    <option value="full">完整工作区</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Cron 表达式</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={newSchedule.cron}
                    onChange={(e) => setNewSchedule({ ...newSchedule, cron: e.target.value })}
                    placeholder="0 0 * * * (每天零点)"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">保留天数</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-md border px-3 py-2"
                    value={newSchedule.retainDays}
                    onChange={(e) => setNewSchedule({ ...newSchedule, retainDays: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>取消</Button>
                <Button onClick={handleCreate}>创建</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={loadSchedules} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">暂无定时计划</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {schedule.name}
                  {schedule.enabled ? (
                    <ToggleRight className="h-5 w-5 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                  )}
                </CardTitle>
                <CardDescription>{schedule.cron}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">备份级别</span>
                    <span>
                      {schedule.level === 'config' && '配置文件'}
                      {schedule.level === 'system' && '配置 + 系统'}
                      {schedule.level === 'full' && '完整工作区'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">保留天数</span>
                    <span>{schedule.retainDays} 天</span>
                  </div>
                  {schedule.lastRun && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">上次运行</span>
                      <span>{schedule.lastRun}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="flex gap-2 p-6 pt-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleToggle(schedule)}
                >
                  {schedule.enabled ? '禁用' : '启用'}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(schedule.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
