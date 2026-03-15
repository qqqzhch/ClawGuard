import { useState, useEffect } from 'react';
import { api, type LogItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { RefreshCw, AlertCircle, CheckCircle, RefreshCwDot } from 'lucide-react';

export default function LogViewer() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'debug'>('all');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = filter === 'all' ? {} : { level: filter };
      const response = await api.getLogs({ ...params, limit: 100 });
      setLogs(response.data || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const getLevelIcon = (level: LogItem['level']) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <RefreshCwDot className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: LogItem['level']) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warn':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">加载日志中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">操作日志</h2>
        <div className="flex gap-2">
          {(['all', 'error', 'warn', 'info', 'debug'] as const[]).map((level) => (
            <Button
              key={level}
              size="sm"
              variant={filter === level ? 'default' : 'outline'}
              onClick={() => setFilter(level as typeof filter)}
            >
              {level === 'all' && '全部'}
              {level === 'error' && '错误'}
              {level === 'warn' && '警告'}
              {level === 'info' && '信息'}
              {level === 'debug' && '调试'}
            </Button>
          ))}
          <Button onClick={loadLogs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCwDot className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">暂无日志</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>日志列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className="flex gap-3 rounded border p-3 hover:bg-accent/50"
                >
                  <div className="flex-shrink-0 mt-1">{getLevelIcon(log.level)}</div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`font-mono ${getLevelColor(log.level)}`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="text-muted-foreground">{log.timestamp}</span>
                      {log.command && (
                        <span className="font-mono text-primary">{log.command}</span>
                      )}
                    </div>
                    <div className="text-sm">{log.message}</div>
                    {log.error && (
                      <div className="text-sm text-red-500 font-mono">
                        Error: {log.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
