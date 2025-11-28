import { Notification, BrowserWindow, app } from 'electron';
import path from 'path';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  urgency?: 'normal' | 'critical' | 'low';
  actions?: Array<{
    type: string;
    text: string;
  }>;
  tag?: string;
  timeout?: number;
}

export interface CampaignNotification {
  type: 'campaign_started' | 'campaign_completed' | 'campaign_failed' | 'milestone_reached';
  campaignId: number;
  campaignName: string;
  progress?: number;
  totalContacts?: number;
  sentCount?: number;
  deliveredCount?: number;
  failedCount?: number;
}

class NotificationService {
  private mainWindow: BrowserWindow | null = null;
  private notificationQueue: Map<string, NodeJS.Timeout> = new Map();
  private isEnabled: boolean = true;
  private notificationHistory: Array<{
    id: string;
    title: string;
    body: string;
    timestamp: Date;
    type: string;
    read: boolean;
  }> = [];

  constructor() {
    this.setupNotificationHandlers();
  }

  public setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  private setupNotificationHandlers(): void {
    // Request notification permissions
    if (Notification.isSupported()) {
      // Note: Electron doesn't support requestPermission in the same way as web
      console.log('Notifications are supported');
    }

    // Note: Electron handles notification events differently
    // These are handled at the notification level instead
  }

  public async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.isEnabled || !Notification.isSupported()) {
      return;
    }

    // Check for duplicate notifications with same tag
    if (options.tag && this.notificationQueue.has(options.tag)) {
      clearTimeout(this.notificationQueue.get(options.tag)!);
    }

    const notification = new Notification({
      title: options.title,
      body: options.body,
      icon: options.icon || this.getDefaultIcon(),
      silent: options.silent || false,
      urgency: options.urgency || 'normal',
      timeoutType: options.timeout ? 'default' : 'never',
      actions: options.actions?.map(action => ({
        type: 'button' as const,
        text: action.text
      })) || []
    });

    // Add to history
    const notificationId = this.generateNotificationId();
    this.addToHistory(notificationId, options);

    // Setup event handlers
    notification.on('click', () => {
      this.handleNotificationClick(notification);
      this.markAsRead(notificationId);
    });

    notification.on('close', () => {
      this.markAsRead(notificationId);
    });

    if (options.actions) {
      notification.on('action', (event, actionIndex) => {
        const action = options.actions![actionIndex];
        this.handleNotificationAction(action, notification);
      });
    }

    // Show notification
    notification.show();

    // Auto-dismiss if timeout specified
    if (options.timeout) {
      const timeoutId = setTimeout(() => {
        notification.close();
        this.notificationQueue.delete(options.tag || 'default');
      }, options.timeout);

      if (options.tag) {
        this.notificationQueue.set(options.tag, timeoutId);
      }
    }
  }

  public async showCampaignNotification(data: CampaignNotification): Promise<void> {
    const options = this.buildCampaignNotificationOptions(data);
    await this.showNotification(options);
  }

  private buildCampaignNotificationOptions(data: CampaignNotification): NotificationOptions {
    const baseOptions: NotificationOptions = {
      title: 'Kyvro Campaign',
      body: '', // Required field
      tag: `campaign_${data.campaignId}`,
      urgency: 'normal'
    };

    switch (data.type) {
      case 'campaign_started':
        return {
          ...baseOptions,
          title: 'Campaign Started',
          body: `Campaign "${data.campaignName}" has started sending to ${data.totalContacts} contacts.`,
          urgency: 'normal'
        };

      case 'campaign_completed':
        return {
          ...baseOptions,
          title: 'Campaign Completed',
          body: `Campaign "${data.campaignName}" completed! Sent: ${data.sentCount}, Delivered: ${data.deliveredCount}, Failed: ${data.failedCount}.`,
          urgency: 'normal'
        };

      case 'campaign_failed':
        return {
          ...baseOptions,
          title: 'Campaign Failed',
          body: `Campaign "${data.campaignName}" encountered errors. Please check the campaign details.`,
          urgency: 'critical',
          actions: [
            { type: 'view', text: 'View Campaign' },
            { type: 'retry', text: 'Retry' }
          ]
        };

      case 'milestone_reached':
        return {
          ...baseOptions,
          title: 'Campaign Milestone',
          body: `Campaign "${data.campaignName}" reached ${data.progress}% completion! ${data.sentCount}/${data.totalContacts} messages sent.`,
          urgency: 'low'
        };

      default:
        return baseOptions;
    }
  }

  private handleNotificationClick(notification: any): void {
    // Bring main window to front
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
    }

    // Send event to renderer process
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('notification-clicked', {
        title: notification.title,
        body: notification.body,
        tag: notification.tag || 'unknown'
      });
    }
  }

  private handleNotificationReply(reply: string, notification: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('notification-reply', {
        reply,
        title: notification.title,
        body: notification.body,
        tag: notification.tag || 'unknown'
      });
    }
  }

  private handleNotificationAction(action: { type: string; text: string }, notification: any): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('notification-action', {
        action,
        title: notification.title,
        body: notification.body,
        tag: notification.tag || 'unknown'
      });
    }
  }

  private getDefaultIcon(): string {
    // Return path to default app icon
    return path.join(__dirname, '../../assets/icon.png');
  }

  private generateNotificationId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private addToHistory(id: string, options: NotificationOptions): void {
    this.notificationHistory.unshift({
      id,
      title: options.title,
      body: options.body,
      timestamp: new Date(),
      type: 'system',
      read: false
    });

    // Keep only last 100 notifications
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }
  }

  private markAsRead(id: string): void {
    const notification = this.notificationHistory.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  public getNotificationHistory(): typeof this.notificationHistory {
    return this.notificationHistory;
  }

  public markAllAsRead(): void {
    this.notificationHistory.forEach(n => n.read = true);
  }

  public clearHistory(): void {
    this.notificationHistory = [];
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public isNotificationEnabled(): boolean {
    return this.isEnabled && Notification.isSupported();
  }

  // System notifications
  public async showSystemNotification(type: 'info' | 'success' | 'warning' | 'error', title: string, message: string): Promise<void> {
    const urgencyMap = {
      info: 'low',
      success: 'normal',
      warning: 'normal',
      error: 'critical'
    };

    await this.showNotification({
      title,
      body: message,
      urgency: urgencyMap[type] as any,
      tag: `system_${type}`,
      timeout: type === 'error' ? undefined : 5000
    });
  }

  // Progress notifications
  public async showProgressNotification(title: string, progress: number, total: number): Promise<void> {
    const percentage = Math.round((progress / total) * 100);
    
    await this.showNotification({
      title,
      body: `Progress: ${progress}/${total} (${percentage}%)`,
      tag: 'progress',
      urgency: 'low',
      silent: true
    });
  }

  // Message notifications
  public async showMessageNotification(from: string, message: string, campaignName?: string): Promise<void> {
    await this.showNotification({
      title: `Message from ${from}`,
      body: message,
      tag: `message_${from}`,
      actions: campaignName ? [
        { type: 'reply', text: 'Reply' },
        { type: 'view_campaign', text: 'View Campaign' }
      ] : [
        { type: 'reply', text: 'Reply' }
      ]
    });
  }

  // Error notifications
  public async showErrorNotification(error: Error, context?: string): Promise<void> {
    await this.showNotification({
      title: 'Error Occurred',
      body: context ? `${context}: ${error.message}` : error.message,
      urgency: 'critical',
      tag: 'error',
      actions: [
        { type: 'details', text: 'View Details' },
        { type: 'report', text: 'Report Issue' }
      ]
    });
  }

  // Update notifications
  public async showUpdateNotification(version: string, releaseNotes?: string): Promise<void> {
    await this.showNotification({
      title: 'Update Available',
      body: `Version ${version} is now available!${releaseNotes ? `\n\n${releaseNotes}` : ''}`,
      urgency: 'normal',
      tag: 'update',
      actions: [
        { type: 'download', text: 'Download Update' },
        { type: 'later', text: 'Later' }
      ]
    });
  }

  // Cleanup
  public cleanup(): void {
    // Clear all pending timeouts
    this.notificationQueue.forEach(timeout => clearTimeout(timeout));
    this.notificationQueue.clear();
  }
}

export default NotificationService;
