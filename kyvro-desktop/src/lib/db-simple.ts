// Simple database service for cross-platform compatibility
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
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed';
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
  variables?: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  messageId?: string;
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
  data?: string;
  timestamp: string;
  source: string;
}

export interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalContacts: number;
  sentMessages: number;
  deliveryRate: number;
}

export class DatabaseService {
  private contacts: Contact[] = [];
  private campaigns: Campaign[] = [];
  private messages: Message[] = [];
  private logs: LogEntry[] = [];

  constructor() {
    this.loadSampleData();
  }

  private loadSampleData(): void {
    // Sample data for development
    this.contacts = [
      {
        id: 1,
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john@example.com',
        tags: 'customer,vip',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Jane Smith',
        phone: '+0987654321',
        email: 'jane@example.com',
        tags: 'prospect',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.campaigns = [
      {
        id: 1,
        name: 'Welcome Campaign',
        templateName: 'welcome_message',
        templateLanguage: 'en',
        status: 'completed',
        totalContacts: 2,
        sentCount: 2,
        deliveredCount: 2,
        failedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Promotional Offer',
        templateName: 'promo_offer',
        templateLanguage: 'en',
        status: 'draft',
        totalContacts: 0,
        sentCount: 0,
        deliveredCount: 0,
        failedCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.messages = [
      {
        id: 1,
        campaignId: 1,
        contactId: 1,
        phone: '+1234567890',
        templateName: 'welcome_message',
        templateLanguage: 'en',
        status: 'delivered',
        messageId: 'msg_123',
        sentAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  async initialize(): Promise<void> {
    console.log('Database initialized (in-memory mode)');
  }

  // Contacts
  async getContacts(): Promise<Contact[]> {
    return [...this.contacts];
  }

  async createContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const id = Math.max(...this.contacts.map(c => c.id || 0), 0) + 1;
    const newContact: Contact = {
      ...contact,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.contacts.push(newContact);
    return id;
  }

  async updateContact(id: number, contact: Partial<Contact>): Promise<boolean> {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.contacts[index] = {
      ...this.contacts[index],
      ...contact,
      updatedAt: new Date().toISOString()
    };
    return true;
  }

  async deleteContact(id: number): Promise<boolean> {
    const index = this.contacts.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.contacts.splice(index, 1);
    return true;
  }

  // Campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return [...this.campaigns];
  }

  async createCampaign(campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const id = Math.max(...this.campaigns.map(c => c.id || 0), 0) + 1;
    const newCampaign: Campaign = {
      ...campaign,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.campaigns.push(newCampaign);
    return id;
  }

  async updateCampaign(id: number, campaign: Partial<Campaign>): Promise<boolean> {
    const index = this.campaigns.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.campaigns[index] = {
      ...this.campaigns[index],
      ...campaign,
      updatedAt: new Date().toISOString()
    };
    return true;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const index = this.campaigns.findIndex(c => c.id === id);
    if (index === -1) return false;
    
    this.campaigns.splice(index, 1);
    return true;
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const totalCampaigns = this.campaigns.length;
    const activeCampaigns = this.campaigns.filter(c => c.status === 'running' || c.status === 'scheduled').length;
    const totalContacts = this.contacts.length;
    const sentMessages = this.messages.filter(m => m.status === 'sent' || m.status === 'delivered').length;
    const deliveryRate = sentMessages > 0 ? (this.messages.filter(m => m.status === 'delivered').length / sentMessages) * 100 : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      totalContacts,
      sentMessages,
      deliveryRate: Math.round(deliveryRate * 100) / 100
    };
  }

  // Messages
  async getMessages(campaignId?: number): Promise<Message[]> {
    if (campaignId) {
      return this.messages.filter(m => m.campaignId === campaignId);
    }
    return [...this.messages];
  }

  async createMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const id = Math.max(...this.messages.map(m => m.id || 0), 0) + 1;
    const newMessage: Message = {
      ...message,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.messages.push(newMessage);
    return id;
  }

  // Logs
  async addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: LogEntry = {
      ...entry,
      id: Math.max(...this.logs.map(l => l.id || 0), 0) + 1,
      timestamp: new Date().toISOString()
    };
    this.logs.push(logEntry);
  }

  async getLogs(level?: string, limit: number = 100): Promise<LogEntry[]> {
    let filteredLogs = [...this.logs];
    if (level) {
      filteredLogs = filteredLogs.filter(l => l.level === level);
    }
    return filteredLogs.slice(-limit);
  }
}
