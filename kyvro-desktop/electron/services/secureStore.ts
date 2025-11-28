import * as keytar from 'keytar';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Service name for keytar - should be unique to your app
const SERVICE_NAME = 'com.kyvro.desktop';

// Encryption key derivation (in production, use a more secure method)
const getEncryptionKey = (): string => {
  // In a real app, you'd want to derive this from system-specific info
  // or use the system's secure storage mechanisms
  return 'kyvro-secure-key-2023'; // This should be more sophisticated in production
};

export interface ApiCredentials {
  whatsappBusinessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
}

export class SecureStore {
  private encryptionKey: string;
  
  constructor() {
    this.encryptionKey = getEncryptionKey();
  }

  /**
   * Encrypt sensitive data before storing
   */
  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const key = scryptSync(this.encryptionKey, 'salt', 32);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data after retrieving
   */
  private decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = scryptSync(this.encryptionKey, 'salt', 32);
      const decipher = createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt stored credentials');
    }
  }

  /**
   * Store API credentials securely
   */
  async saveApiCredentials(credentials: ApiCredentials): Promise<boolean> {
    try {
      // Encrypt the credentials before storing
      const encryptedCredentials = this.encrypt(JSON.stringify(credentials));
      
      // Store in system keychain
      await keytar.setPassword(SERVICE_NAME, 'api-credentials', encryptedCredentials);
      
      console.log('API credentials saved securely');
      return true;
    } catch (error) {
      console.error('Failed to save API credentials:', error);
      return false;
    }
  }

  /**
   * Retrieve API credentials from secure storage
   */
  async getApiCredentials(): Promise<ApiCredentials | null> {
    try {
      // Retrieve from system keychain
      const encryptedCredentials = await keytar.getPassword(SERVICE_NAME, 'api-credentials');
      
      if (!encryptedCredentials) {
        return null;
      }

      // Decrypt the credentials
      const decryptedCredentials = this.decrypt(encryptedCredentials);
      const credentials = JSON.parse(decryptedCredentials) as ApiCredentials;
      
      // Validate the credentials structure
      if (!credentials.whatsappBusinessAccountId || !credentials.phoneNumberId || !credentials.accessToken) {
        console.error('Invalid credentials structure found');
        await this.clearApiCredentials();
        return null;
      }
      
      return credentials;
    } catch (error) {
      console.error('Failed to retrieve API credentials:', error);
      return null;
    }
  }

  /**
   * Clear stored API credentials
   */
  async clearApiCredentials(): Promise<boolean> {
    try {
      await keytar.deletePassword(SERVICE_NAME, 'api-credentials');
      console.log('API credentials cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear API credentials:', error);
      return false;
    }
  }

  /**
   * Check if credentials exist
   */
  async hasCredentials(): Promise<boolean> {
    const credentials = await this.getApiCredentials();
    return credentials !== null;
  }

  /**
   * Validate credentials format
   */
  validateCredentials(credentials: ApiCredentials): boolean {
    const requiredFields = ['whatsappBusinessAccountId', 'phoneNumberId', 'accessToken'];
    return requiredFields.every(field => 
      credentials[field as keyof ApiCredentials] && 
      typeof credentials[field as keyof ApiCredentials] === 'string' && 
      credentials[field as keyof ApiCredentials].trim().length > 0
    );
  }

  /**
   * Store additional app settings (non-sensitive)
   */
  async saveSetting(key: string, value: string): Promise<boolean> {
    try {
      await keytar.setPassword(SERVICE_NAME, `setting-${key}`, value);
      return true;
    } catch (error) {
      console.error(`Failed to save setting ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve app settings
   */
  async getSetting(key: string): Promise<string | null> {
    try {
      return await keytar.getPassword(SERVICE_NAME, `setting-${key}`);
    } catch (error) {
      console.error(`Failed to retrieve setting ${key}:`, error);
      return null;
    }
  }

  /**
   * Clear all stored data (for logout/reset)
   */
  async clearAllData(): Promise<boolean> {
    try {
      // Clear credentials
      await this.clearApiCredentials();
      
      // Note: In a full implementation, you might want to clear all settings
      // This would require iterating through stored keys, which keytar doesn't directly support
      
      console.log('All stored data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }
}
