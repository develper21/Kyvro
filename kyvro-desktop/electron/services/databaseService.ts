import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';

export interface Campaign {
  id: number;
  name: string;
  templateName: string;
  templateLanguage: string;
  status: 'draft' | 'sending' | 'completed' | 'paused' | 'failed';
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  scheduledAt?: string;
}

export interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  campaignId: number;
  contactId: number;
  whatsappMessageId?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  content: string;
  sentAt?: string;
  deliveredAt?: string;
  failedReason?: string;
  createdAt: string;
}

export interface LogEntry {
  id: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  metadata?: string;
  timestamp: string;
  source: string;
}

class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor() {
    this.dbPath = join(app.getPath('userData'), 'kyvro.db');
  }

  public async initialize(): Promise<void> {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Contacts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Campaigns table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        template_name TEXT NOT NULL,
        template_language TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        total_contacts INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        delivered_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        scheduled_at DATETIME
      )
    `);

    // Messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        contact_id INTEGER NOT NULL,
        whatsapp_message_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        content TEXT NOT NULL,
        sent_at DATETIME,
        delivered_at DATETIME,
        failed_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
      )
    `);

    // Logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        source TEXT NOT NULL
      )
    `);

    // Settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
      CREATE INDEX IF NOT EXISTS idx_messages_campaign ON messages(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_messages_contact ON messages(contact_id);
      CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
      CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    `);
  }

  // Campaign operations
  public async createCampaign(campaign: Omit<Campaign, 'id' | 'createdAt'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO campaigns (name, template_name, template_language, status, total_contacts, sent_count, delivered_count, failed_count, scheduled_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      campaign.name,
      campaign.templateName,
      campaign.templateLanguage,
      campaign.status,
      campaign.totalContacts,
      campaign.sentCount,
      campaign.deliveredCount,
      campaign.failedCount,
      campaign.scheduledAt || null
    );

    await this.log('info', `Campaign created: ${campaign.name}`, { campaignId: result.lastInsertRowid }, 'database');
    return result.lastInsertRowid as number;
  }

  public async getCampaigns(): Promise<Campaign[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT id, name, template_name as templateName, template_language as templateLanguage, status,
             total_contacts as totalContacts, sent_count as sentCount, delivered_count as deliveredCount,
             failed_count as failedCount, created_at as createdAt, scheduled_at as scheduledAt
      FROM campaigns
      ORDER BY created_at DESC
    `);

    return stmt.all() as Campaign[];
  }

  public async updateCampaignStatus(id: number, status: Campaign['status']): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('UPDATE campaigns SET status = ? WHERE id = ?');
    stmt.run(status, id);
    
    await this.log('info', `Campaign status updated: ${id} -> ${status}`, { campaignId: id }, 'database');
  }

  public async updateCampaignCounts(id: number, sent: number, delivered: number, failed: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE campaigns 
      SET sent_count = ?, delivered_count = ?, failed_count = ?
      WHERE id = ?
    `);
    
    stmt.run(sent, delivered, failed, id);
  }

  // Contact operations
  public async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO contacts (name, phone, email, tags)
      VALUES (?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(contact.name, contact.phone, contact.email || null, contact.tags || null);
      await this.log('info', `Contact created: ${contact.name}`, { contactId: result.lastInsertRowid }, 'database');
      return result.lastInsertRowid as number;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('Contact with this phone number already exists');
      }
      throw error;
    }
  }

  public async getContacts(): Promise<Contact[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT id, name, phone, email, tags, created_at as createdAt, updated_at as updatedAt
      FROM contacts
      ORDER BY created_at DESC
    `);

    return stmt.all() as Contact[];
  }

  public async searchContacts(query: string): Promise<Contact[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT id, name, phone, email, tags, created_at as createdAt, updated_at as updatedAt
      FROM contacts
      WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?
      ORDER BY created_at DESC
    `);

    const searchTerm = `%${query}%`;
    return stmt.all(searchTerm, searchTerm, searchTerm) as Contact[];
  }

  // Message operations
  public async createMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO messages (campaign_id, contact_id, whatsapp_message_id, status, content, sent_at, delivered_at, failed_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      message.campaignId,
      message.contactId,
      message.whatsappMessageId || null,
      message.status,
      message.content,
      message.sentAt || null,
      message.deliveredAt || null,
      message.failedReason || null
    );

    return result.lastInsertRowid as number;
  }

  public async updateMessageStatus(id: number, status: Message['status'], whatsappMessageId?: string, failedReason?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      UPDATE messages 
      SET status = ?, whatsapp_message_id = ?, failed_reason = ?, 
          sent_at = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END,
          delivered_at = CASE WHEN ? = 'delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END
      WHERE id = ?
    `);

    stmt.run(status, whatsappMessageId || null, failedReason || null, status, status, id);
  }

  public async getCampaignMessages(campaignId: number): Promise<Message[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT id, campaign_id as campaignId, contact_id as contactId, whatsapp_message_id as whatsappMessageId,
             status, content, sent_at as sentAt, delivered_at as deliveredAt, failed_reason as failedReason, created_at as createdAt
      FROM messages
      WHERE campaign_id = ?
      ORDER BY created_at DESC
    `);

    return stmt.all(campaignId) as Message[];
  }

  // Logging operations
  public async log(level: LogEntry['level'], message: string, metadata?: any, source: string = 'app'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO logs (level, message, metadata, source)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(level, message, metadata ? JSON.stringify(metadata) : null, source);
  }

  public async getLogs(level?: LogEntry['level'], limit: number = 100): Promise<LogEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = `
      SELECT id, level, message, metadata, timestamp, source
      FROM logs
    `;
    
    const params: any[] = [];
    
    if (level) {
      query += ' WHERE level = ?';
      params.push(level);
    }
    
    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(query);
    const logs = stmt.all(...params) as LogEntry[];
    
    // Parse metadata JSON
    return logs.map(log => ({
      ...log,
      metadata: log.metadata ? JSON.parse(log.metadata) : undefined
    }));
  }

  // Settings operations
  public async getSetting(key: string): Promise<string | null> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get(key) as { value: string } | undefined;
    return result ? result.value : null;
  }

  public async setSetting(key: string, value: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO settings (key, value)
      VALUES (?, ?)
    `);

    stmt.run(key, value);
  }

  // Statistics operations
  public async getDashboardStats(): Promise<{
    totalMessages: number;
    sentMessages: number;
    deliveredMessages: number;
    failedMessages: number;
    totalContacts: number;
    activeCampaigns: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const messageStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM messages
    `).get() as { total: number; sent: number; delivered: number; failed: number };

    const contactCount = this.db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number };
    const activeCampaigns = this.db.prepare("SELECT COUNT(*) as count FROM campaigns WHERE status IN ('sending', 'paused')").get() as { count: number };

    return {
      totalMessages: messageStats.total || 0,
      sentMessages: messageStats.sent || 0,
      deliveredMessages: messageStats.delivered || 0,
      failedMessages: messageStats.failed || 0,
      totalContacts: contactCount.count || 0,
      activeCampaigns: activeCampaigns.count || 0
    };
  }

  public async cleanup(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export default DatabaseService;
