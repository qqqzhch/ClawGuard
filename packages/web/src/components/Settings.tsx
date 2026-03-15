import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Key, Database, Globe, Info } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">系统设置</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              安全设置
            </CardTitle>
            <CardDescription>管理加密密钥和安全选项</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Key className="mr-2 h-4 w-4" />
                设置/重置加密密钥
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              存储设置
            </CardTitle>
            <CardDescription>配置备份存储路径和保留策略</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">默认备份目录</label>
                <div className="mt-1 text-sm text-muted-foreground font-mono">
                  .clawguard/backups
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">默认保留天数</label>
                <div className="mt-1 text-sm text-muted-foreground">
                  7 天
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              API 服务
            </CardTitle>
            <CardDescription>Gateway API 连接状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">API 地址</label>
                <div className="mt-1 text-sm text-muted-foreground font-mono">
                  http://localhost:3000
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">连接正常</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              关于
            </CardTitle>
            <CardDescription>ClawGuard 版本信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">版本</span>
                <span>1.0.0 (MVP)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Node.js</span>
                <span>≥18.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">包管理</span>
                <span>pnpm</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
