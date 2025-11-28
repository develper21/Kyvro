import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

export interface Contact {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id?: number;
  name: string;
  templateName: string;
  templateLanguage: string;
  status: 'draft' | 'sending' | 'completed' | 'paused' | 'failed';
  totalContacts: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string;
}

export interface Message {
  id?: number;
  campaignId: number;
  contactId: number;
  phone: string;
  templateName: string;
  templateLanguage: string;
  variables?: string; // JSON string of variables
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  messageId?: string; // WhatsApp message ID
  error?: string;
  sentAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogEntry {
  id?: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: string; // JSON string of additional data
  timestamp: string;
  source: string;
}

export class DatabaseService {
  private db: Database | null = null;
  private dbPath: string;

  constructor() {
    // Store database in user data directory
    const userDataPath = process.env.NODE_ENV === 'development' 
      ? path.join(process.cwd(), 'data')
      : path.join(process.cwd(), '..', 'data');
    
    this.dbPath = path.join(userDataPath, 'kyvro.db');
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Create all necessary tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Contacts table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL UNIQUE,
        email TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Campaigns table
    await this.db.exec(`
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
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        scheduled_at DATETIME
      )
    `);

    // Messages table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        contact_id INTEGER NOT NULL,
        phone TEXT NOT NULL,
        template_name TEXT NOT NULL,
        template_language TEXT NOT NULL,
        variables TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        message_id TEXT,
        error TEXT,
        sent_at DATETIME,
        delivered_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
        FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
      )
    `);

    // Logs table
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        source TEXT NOT NULL
      )
    `);

    // Create indexes for better performance
    await this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
      CREATE INDEX IF NOT EXISTS idx_messages_campaign_id ON messages(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
      CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
      CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
    `);
  }

  /**
   * Contacts operations
   */
  async addContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.run(
      `INSERT INTO contacts (name, phone, email, tags) VALUES (?, ?, ?, ?)`,
      [contact.name, contact.phone, contact.email || null, contact.tags || null]
    );

    return result.lastID!;
  }

  async addContactsBatch(contacts: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number[]> {
    if (!this.db) throw new Error('Database not initialized');

    const results: number[] = [];
    
    await this.db.run('BEGIN TRANSACTION');
    
    try {
      for (const contact of contacts) {
        const result = await this.db.run(
          `INSERT OR IGNORE INTO contacts (name, phone, email, tags) VALUES (?, ?, ?, ?)`,
          [contact.name, contact.phone, contact.email || null, contact.tags || null]
        );
        if (result.lastID) {
          results.push(result.lastID);
        }
      }
      await this.db.run('COMMIT');
    } catch (error) {
      await this.db.run('ROLLBACK');
      throw error;
    }

    return results;
  }

  async getContacts(limit: number = 100, offset: number = 0): Promise<Contact[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.all(
      `SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return rows.map(this.mapRowToContact);
  }

  async searchContacts(query: string): Promise<Contact[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.all(
      `SELECT * FROM contacts 
       WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? OR tags LIKE ?
       ORDER BY name ASC`,
      [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`]
    );

    return rows.map(this.mapRowToContact);
  }

  /**
   * Campaigns operations
   */
  async createCampaign(campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.run(
      `INSERT INTO campaigns (name, template_name, template_language, status, total_contacts, sent_count, delivered_count, failed_count, scheduled_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        campaign.name,
        campaign.templateName,
        campaign.templateLanguage,
        campaign.status,
        campaign.totalContacts,
        campaign.sentCount,
        campaign.deliveredCount,
        campaign.failedCount,
        campaign.scheduledAt || null
      ]
    );

    return result.lastID!;
  }

  async getCampaigns(): Promise<Campaign[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.all(
      `SELECT * FROM campaigns ORDER BY created_at DESC`
    );

    return rows.map(this.mapRowToCampaign);
  }

  async updateCampaignStatus(id: number, status: Campaign['status']): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(
      `UPDATE campaigns SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status, id]
    );
  }

  async updateCampaignCounts(id: number, sentCount: number, deliveredCount: number, failedCount: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(
      `UPDATE campaigns SET sent_count = ?, delivered_count = ?, failed_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [sentCount, deliveredCount, failedCount, id]
    );
  }

  /**
   * Messages operations
   */
  async createMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.run(
      `INSERT INTO messages (campaign_id, contact_id, phone, template_name, template_language, variables, status, message_id, error, sent_at, delivered_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message.campaignId,
        message.contactId,
        message.phone,
        message.templateName,
        message.templateLanguage,
        message.variables || null,
        message.status,
        message.messageId || null,
        message.error || null,
        message.sentAt || null,
        message.deliveredAt || null
      ]
    );

    return result.lastID!;
  }

  async updateMessageStatus(id: number, status: Message['status'], messageId?: string, error?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [status];

    if (messageId) {
      updates.push('message_id = ?');
      values.push(messageId);
    }

    if (error) {
      updates.push('error = ?');
      values.push(error);
    }

    if (status === 'sent') {
      updates.push('sent_at = CURRENT_TIMESTAMP');
    } else if (status === 'delivered') {
      updates.push('delivered_at = CURRENT_TIMESTAMP');
    }

    values.push(id);

    await this.db.run(
      `UPDATE messages SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  }

  async getMessagesByCampaign(campaignId: number, limit: number = 100): Promise<Message[]> {
    if (!this.db) throw new Error('Database not initialized');

    const rows = await this.db.all(
      `SELECT * FROM messages WHERE campaign_id = ? ORDER BY created_at DESC LIMIT ?`,
      [campaignId, limit]
    );

    return rows.map(this.mapRowToMessage);
  }

  /**
   * Logging operations
   */
  async addLog(log: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.run(
      `INSERT INTO logs (level, message, data, source) VALUES (?, ?, ?, ?)`,
      [log.level, log.message, log.data || null, log.source]
    );
  }

  async getLogs(level?: LogEntry['level'], limit: number = 100): Promise<LogEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = `SELECT * FROM logs`;
    const params: any[] = [];

    if (level) {
      query += ` WHERE level = ?`;
      params.push(level);
    }

    query += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(limit);

    const rows = await this.db.all(query, params);
    return rows.map(this.mapRowToLog);
  }

  /**
   * Utility methods
   */
  private mapRowToContact(row: any): Contact {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      tags: row.tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToCampaign(row: any): Campaign {
    return {
      id: row.id,
      name: row.name,
      templateName: row.template_name,
      templateLanguage: row.template_language,
      status: row.status,
      totalContacts: row.total_contacts,
      sentCount: row.sent_count,
      deliveredCount: row.delivered_count,
      failedCount: row.failed_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      scheduledAt: row.scheduled_at
    };
  }

  private mapRowToMessage(row: any): Message {
    return {
      id: row.id,
      campaignId: row.campaign_id,
      contactId: row.contact_id,
      phone: row.phone,
      templateName: row.template_name,
      templateLanguage: row.template_language,
      variables: row.variables,
      status: row.status,
      messageId: row.message_id,
      error: row.error,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapRowToLog(row: any): LogEntry {
    return {
      id: row.id,
      level: row.level,
      message: row.message,
      data: row.data,
      timestamp: row.timestamp,
      source: row.source
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}
