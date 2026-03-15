import { useState, useEffect } from 'react';
import { api, type BackupItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatFileSize, formatDate } from '@/lib/utils';
import { Trash2, RefreshCw, Play, Shield, Database } from 'lucide-react';

export default function BackupManagement() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await api.getBackups();
      setBackups(response.data || []);
    } catch (error) {
      console.error('Failed to load backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此备份吗？')) return;
    try {
      await api.deleteBackup(id);
      await loadBackups();
    } catch (error) {
      alert('删除备份失败');
    }
  };

  const handleRestore = async (id: string, dryRun = false) => {
    try {
      setRestoring(id);
      const result = await api.restoreBackup(id, { dryRun });
      if (dryRun) {
        alert(`预演恢复：预计恢复 ${result.filesRestored} 个文件`);
      } else {
        alert(`恢复完成：${result.filesRestored} 个文件，耗时 ${result.duration}ms`);
        await loadBackups();
      }
    } catch (error) {
      alert('恢复备份失败');
    } finally {
      setRestoring(null);
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">加载备份列表中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">备份管理</h2>
        <Button onClick={loadBackups} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {backups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">暂无备份</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {backups.map((backup) => (
            <Card key={backup.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      {backup.name}
                    </CardTitle>
                    <CardDescription>
                      {backup.level === 'config' && '配置文件'}
                      {backup.level === 'system' && '配置 + 系统文件'}
                      {backup.level === 'full' && '完整工作区'}
                    </CardDescription>
                  </div>
                  {backup.encrypted && (
                    <Shield className="h-5 w-5 text-primary" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">创建时间</span>
                    <span>{formatDate(backup.timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">文件大小</span>
                    <span>{formatFileSize(backup.size)}</span>
                  </div>
                </div>
              </CardContent>
              <div className="flex gap-2 p-6 pt-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRestore(backup.id, true)}
                >
                  <Play className="h-4 w-4" />
                  预演
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRestore(backup.id)}
                  disabled={restoring === backup.id}
                >
                  <Play className="h-4 w-4" />
                  {restoring === backup.id ? '恢复中...' : '恢复'}
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>确认删除</DialogTitle>
                      <DialogDescription>
                        确定要删除备份 "{backup.name}" 吗？此操作无法撤销。
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {}}>取消</Button>
                      <Button variant="destructive" onClick={() => handleDelete(backup.id)}>
                        删除
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
