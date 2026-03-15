import { useState, useEffect } from 'react';
import { api, type ConfigEntry } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { RefreshCw } from 'lucide-react';

export default function ConfigManagement() {
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const response = await api.getConfig();
      setConfigs(response.data || []);
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">加载配置中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">配置管理</h2>
        <Button onClick={loadConfigs} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {configs.map((config) => (
          <Card key={config.key} className="cursor-pointer hover:bg-accent/50">
            <CardHeader>
              <CardTitle>{config.key}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-muted-foreground overflow-auto max-h-32">
                {JSON.stringify(config.value, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
