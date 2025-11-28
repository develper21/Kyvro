interface QueueItem {
  id: string;
  data: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  delay: number;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}

interface QueueOptions {
  maxConcurrency?: number;
  rateLimitPerSecond?: number;
  defaultMaxAttempts?: number;
  defaultDelay?: number;
  retryDelay?: number;
}

export class SmartQueue {
  private queue: QueueItem[] = [];
  private running: Set<string> = new Set();
  private processing = false;
  private options: Required<QueueOptions>;
  private lastProcessTimes: number[] = [];

  constructor(options: QueueOptions = {}) {
    this.options = {
      maxConcurrency: options.maxConcurrency || 5,
      rateLimitPerSecond: options.rateLimitPerSecond || 50,
      defaultMaxAttempts: options.defaultMaxAttempts || 3,
      defaultDelay: options.defaultDelay || 0,
      retryDelay: options.retryDelay || 1000
    };
  }

  /**
   * Add an item to the queue
   */
  async add<T>(
    executeFn: () => Promise<T>,
    priority: number = 0,
    options: {
      maxAttempts?: number;
      delay?: number;
    } = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const item: QueueItem = {
        id: this.generateId(),
        data: null,
        priority,
        attempts: 0,
        maxAttempts: options.maxAttempts || this.options.defaultMaxAttempts,
        delay: options.delay || this.options.defaultDelay,
        execute: executeFn,
        resolve,
        reject
      };

      this.queue.push(item);
      this.sortQueue();
      this.process();
    });
  }

  /**
   * Add multiple items to the queue
   */
  async addBatch<T>(
    executeFunctions: Array<() => Promise<T>>,
    priority: number = 0,
    options: {
      maxAttempts?: number;
      delay?: number;
    } = {}
  ): Promise<T[]> {
    const promises = executeFunctions.map(fn => this.add(fn, priority, options));
    return Promise.all(promises);
  }

  /**
   * Process the queue
   */
  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.running.size < this.options.maxConcurrency) {
      if (!this.checkRateLimit()) {
        await this.waitForRateLimit();
        continue;
      }

      const item = this.queue.shift();
      if (!item) break;

      // Handle delayed items
      if (item.delay > 0) {
        setTimeout(() => {
          this.queue.unshift(item);
          this.process();
        }, item.delay);
        continue;
      }

      this.running.add(item.id);
      this.processItem(item);
    }

    this.processing = false;
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: QueueItem): Promise<void> {
    try {
      item.attempts++;
      const result = await item.execute();
      item.resolve(result);
    } catch (error) {
      if (item.attempts >= item.maxAttempts) {
        item.reject(error as Error);
      } else {
        // Retry with exponential backoff
        const retryDelay = this.options.retryDelay * Math.pow(2, item.attempts - 1);
        setTimeout(() => {
          this.queue.push(item);
          this.sortQueue();
          this.process();
        }, retryDelay);
      }
    } finally {
      this.running.delete(item.id);
      this.process();
    }
  }

  /**
   * Check if we're within rate limits
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Remove old timestamps
    this.lastProcessTimes = this.lastProcessTimes.filter(time => time > oneSecondAgo);

    return this.lastProcessTimes.length < this.options.rateLimitPerSecond;
  }

  /**
   * Wait until we can process again due to rate limiting
   */
  private async waitForRateLimit(): Promise<void> {
    if (this.lastProcessTimes.length === 0) return;

    const oldestTime = Math.min(...this.lastProcessTimes);
    const waitTime = 1000 - (Date.now() - oldestTime);

    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Sort queue by priority (higher priority first)
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Generate unique ID for queue items
   */
  private generateId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      runningCount: this.running.size,
      maxConcurrency: this.options.maxConcurrency,
      rateLimitPerSecond: this.options.rateLimitPerSecond,
      currentRate: this.lastProcessTimes.length
    };
  }

  /**
   * Clear the queue (only pending items, not running ones)
   */
  clearQueue(): void {
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared'));
    });
    this.queue = [];
  }

  /**
   * Pause processing
   */
  pause(): void {
    this.processing = false;
  }

  /**
   * Resume processing
   */
  resume(): void {
    if (!this.processing) {
      this.process();
    }
  }

  /**
   * Wait for all items to complete
   */
  async drain(): Promise<void> {
    while (this.queue.length > 0 || this.running.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

// WhatsApp-specific queue implementation
export class WhatsAppQueue extends SmartQueue {
  constructor() {
    super({
      maxConcurrency: 3, // WhatsApp recommends lower concurrency
      rateLimitPerSecond: 50, // WhatsApp API limit
      defaultMaxAttempts: 3,
      retryDelay: 2000 // 2 seconds between retries
    });
  }

  /**
   * Send WhatsApp message with queue management
   */
  async sendMessage(
    sendFunction: () => Promise<any>,
    phoneNumber: string,
    priority: number = 0
  ): Promise<any> {
    return this.add(sendFunction, priority, {
      maxAttempts: 3,
      delay: 0
    });
  }

  /**
   * Send bulk messages with smart batching
   */
  async sendBulkMessages(
    messages: Array<{ phone: string; sendFunction: () => Promise<any> }>,
    batchSize: number = 10,
    batchDelay: number = 1000
  ): Promise<any[]> {
    const results: any[] = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(msg => 
        this.sendMessage(msg.sendFunction, msg.phone)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to avoid rate limiting
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }
    
    return results;
  }
}
