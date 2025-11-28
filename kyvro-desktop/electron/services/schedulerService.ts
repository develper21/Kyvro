import { app, BrowserWindow } from 'electron';

export interface ScheduledTask {
  id: string;
  name: string;
  type: 'campaign' | 'backup' | 'cleanup' | 'reminder';
  scheduledTime: Date;
  data: any;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval?: number; // for recurring tasks
  };
  enabled: boolean;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
}

export interface CampaignSchedule {
  campaignId: number;
  campaignName: string;
  scheduledTime: Date;
  contacts: Array<{
    id: number;
    name: string;
    phone: string;
  }>;
  template: {
    name: string;
    language: string;
    components: any[];
  };
  settings: {
    batchSize: number;
    delayBetweenBatches: number;
    retryFailed: boolean;
  };
}

class SchedulerService {
  private tasks: Map<string, ScheduledTask> = new Map();
  private runningTimers: Map<string, NodeJS.Timeout> = new Map();
  private mainWindow: BrowserWindow | null = null;
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startScheduler();
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private startScheduler(): void {
    this.isRunning = true;
    
    // Check for due tasks every minute
    this.checkInterval = setInterval(() => {
      this.checkAndExecuteTasks();
    }, 60 * 1000); // Check every minute

    console.log('Scheduler service started');
  }

  public stopScheduler(): void {
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Clear all running timers
    this.runningTimers.forEach(timer => clearTimeout(timer));
    this.runningTimers.clear();

    console.log('Scheduler service stopped');
  }

  private async checkAndExecuteTasks(): Promise<void> {
    if (!this.isRunning) return;

    const now = new Date();
    const dueTasks: ScheduledTask[] = [];

    // Find tasks that are due
    for (const [id, task] of this.tasks) {
      if (!task.enabled) continue;

      if (task.nextRun && task.nextRun <= now) {
        dueTasks.push(task);
      } else if (task.scheduledTime <= now && !task.lastRun) {
        dueTasks.push(task);
      }
    }

    // Execute due tasks
    for (const task of dueTasks) {
      await this.executeTask(task);
    }
  }

  private async executeTask(task: ScheduledTask): Promise<void> {
    console.log(`Executing scheduled task: ${task.name} (${task.id})`);

    try {
      switch (task.type) {
        case 'campaign':
          await this.executeCampaignTask(task);
          break;
        case 'backup':
          await this.executeBackupTask(task);
          break;
        case 'cleanup':
          await this.executeCleanupTask(task);
          break;
        case 'reminder':
          await this.executeReminderTask(task);
          break;
      }

      // Update last run time
      task.lastRun = new Date();

      // Calculate next run time for recurring tasks
      if (task.recurring) {
        task.nextRun = this.calculateNextRunTime(task);
      } else {
        // Disable one-time tasks after execution
        task.enabled = false;
      }

      // Notify renderer process
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('task-executed', {
          taskId: task.id,
          taskName: task.name,
          taskType: task.type,
          executedAt: new Date()
        });
      }

    } catch (error: any) {
      console.error(`Error executing task ${task.name}:`, error);
      
      // Notify renderer process about error
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('task-error', {
          taskId: task.id,
          taskName: task.name,
          taskType: task.type,
          error: error.message,
          timestamp: new Date()
        });
      }
    }
  }

  private async executeCampaignTask(task: ScheduledTask): Promise<void> {
    const campaignData = task.data as CampaignSchedule;
    
    // Send campaign start notification
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('campaign-scheduled-start', {
        campaignId: campaignData.campaignId,
        campaignName: campaignData.campaignName,
        totalContacts: campaignData.contacts.length
      });
    }

    // Simulate campaign execution (in real implementation, this would use WhatsApp API)
    const batchSize = campaignData.settings.batchSize || 50;
    const delay = campaignData.settings.delayBetweenBatches || 1000;

    for (let i = 0; i < campaignData.contacts.length; i += batchSize) {
      const batch = campaignData.contacts.slice(i, i + batchSize);
      
      // Process batch
      for (const contact of batch) {
        // Send message (simulated)
        console.log(`Sending message to ${contact.name} (${contact.phone})`);
        
        // Notify about message sent
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send('message-sent', {
            campaignId: campaignData.campaignId,
            contactId: contact.id,
            contactName: contact.name,
            phone: contact.phone,
            timestamp: new Date()
          });
        }
      }

      // Delay between batches
      if (i + batchSize < campaignData.contacts.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // Notify campaign completion
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('campaign-scheduled-complete', {
        campaignId: campaignData.campaignId,
        campaignName: campaignData.campaignName,
        totalContacts: campaignData.contacts.length,
        completedAt: new Date()
      });
    }
  }

  private async executeBackupTask(task: ScheduledTask): Promise<void> {
    console.log('Executing backup task');
    
    // In real implementation, this would create a backup
    // For now, just send notification
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('backup-executed', {
        taskId: task.id,
        timestamp: new Date()
      });
    }
  }

  private async executeCleanupTask(task: ScheduledTask): Promise<void> {
    console.log('Executing cleanup task');
    
    // In real implementation, this would clean up old files, logs, etc.
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('cleanup-executed', {
        taskId: task.id,
        timestamp: new Date()
      });
    }
  }

  private async executeReminderTask(task: ScheduledTask): Promise<void> {
    console.log('Executing reminder task:', task.data.message);
    
    // Send reminder notification
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('reminder-triggered', {
        taskId: task.id,
        reminder: task.data,
        timestamp: new Date()
      });
    }
  }

  private calculateNextRunTime(task: ScheduledTask): Date {
    if (!task.recurring) {
      return task.scheduledTime;
    }

    const now = new Date();
    const { type, interval = 1 } = task.recurring;

    switch (type) {
      case 'daily':
        return new Date(now.getTime() + (24 * 60 * 60 * 1000 * interval));
      
      case 'weekly':
        return new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000 * interval));
      
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + interval);
        return nextMonth;
      
      default:
        return new Date(now.getTime() + (24 * 60 * 60 * 1000));
    }
  }

  // Task management methods
  public createTask(task: Omit<ScheduledTask, 'id' | 'createdAt'>): string {
    const id = this.generateTaskId();
    const newTask: ScheduledTask = {
      ...task,
      id,
      createdAt: new Date(),
      nextRun: task.scheduledTime
    };

    this.tasks.set(id, newTask);
    
    console.log(`Created scheduled task: ${task.name} (${id})`);
    
    return id;
  }

  public updateTask(id: string, updates: Partial<ScheduledTask>): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    Object.assign(task, updates);
    
    // Recalculate next run time if schedule changed
    if (updates.scheduledTime || updates.recurring) {
      task.nextRun = this.calculateNextRunTime(task);
    }

    console.log(`Updated scheduled task: ${task.name} (${id})`);
    return true;
  }

  public deleteTask(id: string): boolean {
    const deleted = this.tasks.delete(id);
    if (deleted) {
      // Clear any running timer for this task
      const timer = this.runningTimers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.runningTimers.delete(id);
      }
      console.log(`Deleted scheduled task: ${id}`);
    }
    return deleted;
  }

  public getTask(id: string): ScheduledTask | undefined {
    return this.tasks.get(id);
  }

  public getAllTasks(): ScheduledTask[] {
    return Array.from(this.tasks.values());
  }

  public getTasksByType(type: ScheduledTask['type']): ScheduledTask[] {
    return this.getAllTasks().filter(task => task.type === type);
  }

  public enableTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    task.enabled = true;
    task.nextRun = this.calculateNextRunTime(task);
    console.log(`Enabled scheduled task: ${task.name} (${id})`);
    return true;
  }

  public disableTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;

    task.enabled = false;
    task.nextRun = undefined;
    console.log(`Disabled scheduled task: ${task.name} (${id})`);
    return true;
  }

  // Campaign scheduling methods
  public scheduleCampaign(campaignData: CampaignSchedule, scheduledTime: Date): string {
    return this.createTask({
      name: `Campaign: ${campaignData.campaignName}`,
      type: 'campaign',
      scheduledTime,
      data: campaignData,
      enabled: true
    });
  }

  public scheduleRecurringCampaign(campaignData: CampaignSchedule, recurring: ScheduledTask['recurring'], firstRun: Date): string {
    return this.createTask({
      name: `Recurring Campaign: ${campaignData.campaignName}`,
      type: 'campaign',
      scheduledTime: firstRun,
      recurring,
      data: campaignData,
      enabled: true
    });
  }

  // Utility methods
  private generateTaskId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public getUpcomingTasks(limit: number = 10): ScheduledTask[] {
    return this.getAllTasks()
      .filter(task => task.enabled && task.nextRun)
      .sort((a, b) => (a.nextRun?.getTime() || 0) - (b.nextRun?.getTime() || 0))
      .slice(0, limit);
  }

  public getOverdueTasks(): ScheduledTask[] {
    const now = new Date();
    return this.getAllTasks()
      .filter(task => task.enabled && task.nextRun && task.nextRun < now && !task.lastRun);
  }

  public getTaskStatistics(): {
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<string, number>;
  } {
    const tasks = this.getAllTasks();
    const byType: Record<string, number> = {};

    tasks.forEach(task => {
      byType[task.type] = (byType[task.type] || 0) + 1;
    });

    return {
      total: tasks.length,
      enabled: tasks.filter(t => t.enabled).length,
      disabled: tasks.filter(t => !t.enabled).length,
      byType
    };
  }

  // Cleanup
  public cleanup(): void {
    this.stopScheduler();
    this.tasks.clear();
    console.log('Scheduler service cleaned up');
  }
}

export default SchedulerService;
