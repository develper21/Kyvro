import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface that will be exposed to the renderer process
export interface ElectronAPI {
  // Window controls
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  
  // API Credentials Management
  getApiCredentials: () => Promise<{
    whatsappBusinessAccountId?: string;
    phoneNumberId?: string;
    accessToken?: string;
  } | null>;
  
  saveApiCredentials: (credentials: {
    whatsappBusinessAccountId: string;
    phoneNumberId: string;
    accessToken: string;
  }) => Promise<boolean>;
  
  // WhatsApp API
  sendWhatsAppMessage: (data: {
    to: string;
    templateName: string;
    languageCode: string;
    components: Array<{
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
  }) => Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
  
  getWhatsAppTemplates: () => Promise<Array<{
    name: string;
    category: string;
    language: string;
    status: string;
    components: Array<{
      type: string;
      text: string;
    }>;
  }>>;
  
  // System info
  platform: string;
  version: string;
}

// Create the secure API object
const electronAPI: ElectronAPI = {
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  
  // API Credentials Management
  getApiCredentials: () => ipcRenderer.invoke('get-api-credentials'),
  saveApiCredentials: (credentials) => ipcRenderer.invoke('save-api-credentials', credentials),
  
  // WhatsApp API
  sendWhatsAppMessage: (data) => ipcRenderer.invoke('send-whatsapp-message', data),
  getWhatsAppTemplates: () => ipcRenderer.invoke('get-whatsapp-templates'),
  
  // System info
  platform: process.platform,
  version: process.version
};

// Expose the API to the renderer process using contextBridge
// This is the secure way to expose Node.js APIs to the renderer
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definitions for TypeScript in the renderer process
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Additional security: Prevent access to Node.js globals
delete (globalThis as any).require;
delete (globalThis as any).exports;
delete (globalThis as any).module;
delete (globalThis as any).process;
delete (globalThis as any).global;
delete (globalThis as any).Buffer;
delete (globalThis as any).setImmediate;
delete (globalThis as any).clearImmediate;

// Console logging for debugging in development
if (process.env.NODE_ENV === 'development') {
  console.log('Electron preload script loaded successfully');
  console.log('Platform:', electronAPI.platform);
  console.log('Node version:', electronAPI.version);
}
