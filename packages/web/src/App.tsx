import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LayoutDashboard, Database, Clock, FileText, Settings, Shield } from 'lucide-react';
import BackupManagement from '@/components/BackupManagement';
import ConfigManagement from '@/components/ConfigManagement';
import ScheduleManagement from '@/components/ScheduleManagement';
import LogViewer from '@/components/LogViewer';

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">ClawGuard</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Tabs defaultValue="backups" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="backups" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              备份
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              配置
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              计划
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              日志
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              设置
            </TabsTrigger>
          </TabsList>

          <TabsContent value="backups" className="mt-6">
            <BackupManagement />
          </TabsContent>

          <TabsContent value="config" className="mt-6">
            <ConfigManagement />
          </TabsContent>

          <TabsContent value="schedules" className="mt-6">
            <ScheduleManagement />
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <LogViewer />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="text-center py-8 text-muted-foreground">
              加载中...
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
