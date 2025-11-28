import { readFile, writeFile, mkdir, access, stat, readdir, unlink } from 'fs/promises';
import { join, dirname, extname, basename } from 'path';
import { app, dialog } from 'electron';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { parse as parseCSV } from 'csv-parse';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: Date;
}

export interface ParsedContact {
  name: string;
  phone: string;
  email?: string;
  tags?: string;
  rowNumber: number;
}

export interface ImportResult {
  totalRows: number;
  validContacts: ParsedContact[];
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

class FileService {
  private userDataPath: string;
  private uploadsPath: string;

  constructor() {
    this.userDataPath = app.getPath('userData');
    this.uploadsPath = join(this.userDataPath, 'uploads');
    this.ensureDirectoryExists(this.uploadsPath);
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await access(dirPath);
    } catch {
      await mkdir(dirPath, { recursive: true });
    }
  }

  // File operations
  public async selectFile(filters?: Electron.FileFilter[]): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: 'Select File',
      filters: filters || [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    return result.canceled ? null : result.filePaths[0];
  }

  public async selectSaveFile(defaultName?: string, filters?: Electron.FileFilter[]): Promise<string | null> {
    const result = await dialog.showSaveDialog({
      title: 'Save File',
      defaultPath: defaultName,
      filters: filters || [
        { name: 'CSV Files', extensions: ['csv'] },
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    return result.canceled ? null : result.filePath;
  }

  public async getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = await stat(filePath);
    const ext = extname(filePath);
    
    return {
      name: basename(filePath),
      path: filePath,
      size: stats.size,
      type: ext,
      lastModified: stats.mtime
    };
  }

  public async copyFileToUploads(sourcePath: string): Promise<string> {
    const fileName = `${Date.now()}_${basename(sourcePath)}`;
    const destPath = join(this.uploadsPath, fileName);
    
    await pipeline(
      createReadStream(sourcePath),
      createWriteStream(destPath)
    );

    return destPath;
  }

  // CSV parsing operations
  public async parseCSVFile(filePath: string, options: {
    nameColumn?: string;
    phoneColumn?: string;
    emailColumn?: string;
    tagsColumn?: string;
    hasHeader?: boolean;
  } = {}): Promise<ImportResult> {
    const {
      nameColumn = 'name',
      phoneColumn = 'phone',
      emailColumn = 'email',
      tagsColumn = 'tags',
      hasHeader = true
    } = options;

    const fileContent = await readFile(filePath, 'utf-8');
    const contacts: ParsedContact[] = [];
    const errors: Array<{ row: number; error: string; data: any }> = [];
    let rowNumber = hasHeader ? 2 : 1;

    return new Promise((resolve) => {
      createReadStream(filePath)
        .pipe(parseCSV({
          columns: hasHeader,
          skip_empty_lines: true,
          trim: true
        }))
        .on('data', (row: any) => {
          try {
            const contact = this.validateAndParseContact(row, {
              nameColumn,
              phoneColumn,
              emailColumn,
              tagsColumn,
              rowNumber
            });

            if (contact) {
              contacts.push(contact);
            }
          } catch (error: any) {
            errors.push({
              row: rowNumber,
              error: error.message,
              data: row
            });
          }
          rowNumber++;
        })
        .on('end', () => {
          resolve({
            totalRows: rowNumber - 1,
            validContacts: contacts,
            errors
          });
        })
        .on('error', (error) => {
          resolve({
            totalRows: 0,
            validContacts: [],
            errors: [{
              row: 0,
              error: `File parsing error: ${error.message}`,
              data: null
            }]
          });
        });
    });
  }

  private validateAndParseContact(row: any, options: {
    nameColumn: string;
    phoneColumn: string;
    emailColumn?: string;
    tagsColumn?: string;
    rowNumber: number;
  }): ParsedContact | null {
    const { nameColumn, phoneColumn, emailColumn, tagsColumn, rowNumber } = options;

    // Get values with fallback to common column names
    const name = this.getFieldValue(row, nameColumn, ['name', 'contact_name', 'full_name', 'first_name']);
    const phone = this.getFieldValue(row, phoneColumn, ['phone', 'phone_number', 'mobile', 'telephone', 'contact']);
    const email = emailColumn ? this.getFieldValue(row, emailColumn, ['email', 'email_address', 'mail']) : undefined;
    const tags = tagsColumn ? this.getFieldValue(row, tagsColumn, ['tags', 'category', 'group', 'label']) : undefined;

    // Validate required fields
    if (!name || !phone) {
      throw new Error(`Missing required fields: ${!name ? 'name' : ''}${!name && !phone ? ' and ' : ''}${!phone ? 'phone' : ''}`);
    }

    // Validate phone format (basic validation)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    if (!/^[\d\+]+$/.test(cleanPhone) || cleanPhone.length < 10) {
      throw new Error(`Invalid phone number format: ${phone}`);
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }

    return {
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim(),
      tags: tags?.trim(),
      rowNumber
    };
  }

  private getFieldValue(row: any, primaryField: string, fallbackFields: string[]): string | undefined {
    // Try primary field first
    if (row[primaryField]) {
      return row[primaryField];
    }

    // Try fallback fields
    for (const field of fallbackFields) {
      if (row[field]) {
        return row[field];
      }
    }

    return undefined;
  }

  public async exportToCSV(data: any[], filePath: string, options: {
    headers?: string[];
    delimiter?: string;
  } = {}): Promise<void> {
    const { headers = Object.keys(data[0] || {}), delimiter = ',' } = options;

    let csvContent = headers.join(delimiter) + '\n';

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvContent += values.join(delimiter) + '\n';
    }

    await writeFile(filePath, csvContent, 'utf-8');
  }

  public async exportToJSON(data: any[], filePath: string): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    await writeFile(filePath, jsonContent, 'utf-8');
  }

  // Template operations
  public async saveTemplate(template: any, name: string): Promise<string> {
    const templatesPath = join(this.userDataPath, 'templates');
    await this.ensureDirectoryExists(templatesPath);
    
    const templatePath = join(templatesPath, `${name}.json`);
    await writeFile(templatePath, JSON.stringify(template, null, 2), 'utf-8');
    
    return templatePath;
  }

  public async loadTemplate(name: string): Promise<any | null> {
    const templatePath = join(this.userDataPath, 'templates', `${name}.json`);
    
    try {
      const content = await readFile(templatePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  public async getTemplates(): Promise<string[]> {
    const templatesPath = join(this.userDataPath, 'templates');
    await this.ensureDirectoryExists(templatesPath);
    
    try {
      const files = await readdir(templatesPath);
      return files
        .filter((file: any) => file.endsWith('.json'))
        .map((file: any) => file.replace('.json', ''));
    } catch {
      return [];
    }
  }

  // Backup operations
  public async createBackup(): Promise<string> {
    const backupsPath = join(this.userDataPath, 'backups');
    await this.ensureDirectoryExists(backupsPath);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(backupsPath, `kyvro_backup_${timestamp}.json`);
    
    // This would be implemented to backup all user data
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      // Add actual data here
    };
    
    await writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf-8');
    
    return backupPath;
  }

  public async restoreBackup(backupPath: string): Promise<void> {
    const content = await readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(content);
    
    // Implement restore logic here
    console.log('Restoring backup:', backupData);
  }

  // File cleanup
  public async cleanupUploads(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    try {
      const files = await readdir(this.uploadsPath);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = join(this.uploadsPath, file);
        const stats = await stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up uploads:', error);
    }
  }

  public async getUploadsSize(): Promise<number> {
    try {
      const files = await readdir(this.uploadsPath);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = join(this.uploadsPath, file);
        const stats = await stat(filePath);
        totalSize += stats.size;
      }
      
      return totalSize;
    } catch {
      return 0;
    }
  }
}

export default FileService;
