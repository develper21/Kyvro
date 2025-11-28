import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { SecureStore, ApiCredentials } from './secureStore';

export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'body' | 'header';
      parameters: Array<{
        type: 'text' | 'currency' | 'date_time';
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount_1000: number;
        };
        date_time?: {
          fallback_value: string;
        };
      }>;
    }>;
  };
}

export interface WhatsAppTemplate {
  name: string;
  category: string;
  language: string;
  status: string;
  components: Array<{
    type: string;
    text: string;
    example?: {
      body_text?: Array<string[]>;
    };
  }>;
}

export interface ApiResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  data?: any;
}

export class WhatsAppApiService {
  private apiClient: AxiosInstance;
  private secureStore: SecureStore;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(secureStore: SecureStore) {
    this.secureStore = secureStore;
    this.apiClient = axios.create({
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Kyvro-Desktop/1.0'
      }
    });

    // Request interceptor to add auth token
    this.apiClient.interceptors.request.use(async (config) => {
      const credentials = await this.secureStore.getApiCredentials();
      if (credentials) {
        config.headers.Authorization = `Bearer ${credentials.accessToken}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('WhatsApp API Error:', error.response?.data || error.message);
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Send a WhatsApp template message
   */
  async sendMessage(messageData: {
    to: string;
    templateName: string;
    languageCode: string;
    components?: Array<{
      type: 'body' | 'header';
      parameters: Array<{
        type: 'text' | 'currency' | 'date_time';
        text?: string;
        currency?: {
          fallback_value: string;
          code: string;
          amount_1000: number;
        };
        date_time?: {
          fallback_value: string;
        };
      }>;
    }>;
  }): Promise<ApiResponse> {
    try {
      const credentials = await this.secureStore.getApiCredentials();
      if (!credentials) {
        throw new Error('No API credentials found');
      }

      const message: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: messageData.to,
        type: 'template',
        template: {
          name: messageData.templateName,
          language: {
            code: messageData.languageCode
          },
          components: messageData.components
        }
      };

      const url = `${this.baseUrl}/${credentials.phoneNumberId}/messages`;
      const response = await this.apiClient.post(url, message);

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get available WhatsApp templates
   */
  async getTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const credentials = await this.secureStore.getApiCredentials();
      if (!credentials) {
        throw new Error('No API credentials found');
      }

      const url = `${this.baseUrl}/${credentials.whatsappBusinessAccountId}/message_templates`;
      const response = await this.apiClient.get(url);

      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      return [];
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<ApiResponse> {
    try {
      const credentials = await this.secureStore.getApiCredentials();
      if (!credentials) {
        throw new Error('No API credentials found');
      }

      const url = `${this.baseUrl}/${messageId}`;
      const response = await this.apiClient.get(url);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Remove all non-numeric characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid international number (8-15 digits)
    return cleanNumber.length >= 8 && cleanNumber.length <= 15 && cleanNumber.startsWith('1');
  }

  /**
   * Format phone number for WhatsApp API
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Remove leading + if present
    if (cleanNumber.startsWith('+')) {
      cleanNumber = cleanNumber.substring(1);
    }
    
    // Ensure it starts with country code (add if missing)
    if (!cleanNumber.startsWith('1') && cleanNumber.length === 10) {
      cleanNumber = '1' + cleanNumber;
    }
    
    return cleanNumber;
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<ApiResponse> {
    try {
      const templates = await this.getTemplates();
      return {
        success: true,
        data: { templatesCount: templates.length }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed'
      };
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 400:
          return new Error(data?.error?.error_user_msg || 'Bad request - Invalid parameters');
        case 401:
          return new Error('Unauthorized - Invalid or expired access token');
        case 403:
          return new Error('Forbidden - Insufficient permissions');
        case 404:
          return new Error('Not found - Resource does not exist');
        case 429:
          return new Error('Rate limit exceeded - Please try again later');
        case 500:
          return new Error('Internal server error - Please try again later');
        default:
          return new Error(data?.error?.error_user_msg || `API Error: ${status}`);
      }
    } else if (error.request) {
      // The request was made but no response was received
      return new Error('Network error - Unable to connect to WhatsApp API');
    } else {
      // Something happened in setting up the request that triggered an Error
      return new Error(error.message || 'Unknown error occurred');
    }
  }

  /**
   * Get rate limit information
   */
  getRateLimitInfo(): { maxRequests: number; windowMs: number } {
    return {
      maxRequests: 50, // WhatsApp API limit
      windowMs: 60000  // Per minute
    };
  }
}
