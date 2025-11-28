// CSV Parser Manager - Manages the Web Worker for CSV processing
// This provides a clean interface for the main thread to interact with the CSV worker

export interface CSVRow {
  [key: string]: string;
}

export interface CSVParseOptions {
  delimiter?: string;
  hasHeaders?: boolean;
  chunkSize?: number;
}

export interface CSVParseProgress {
  progress: number;
  loaded: number;
  total: number;
  currentChunk: number;
  totalChunks: number;
}

export interface CSVParseResult {
  headers: string[];
  rows: CSVRow[];
  totalRows: number;
}

export class CSVParserManager {
  private worker: Worker | null = null;
  private isProcessing = false;
  private abortController: AbortController | null = null;

  constructor() {
    // Worker will be created when needed
  }

  /**
   * Parse a CSV file using Web Worker
   */
  async parseFile(
    file: File,
    options: CSVParseOptions = {},
    onProgress?: (progress: CSVParseProgress) => void,
    onChunk?: (chunk: CSVRow[], progress: CSVParseProgress) => void
  ): Promise<CSVParseResult> {
    if (this.isProcessing) {
      throw new Error('Already processing a CSV file');
    }

    // Create new worker
    this.worker = new Worker(new URL('../workers/csvWorker.ts', import.meta.url), {
      type: 'module'
    });

    this.isProcessing = true;
    this.abortController = new AbortController();

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Failed to create worker'));
        return;
      }

      // Handle worker messages
      this.worker.onmessage = (event: MessageEvent) => {
        const { type, data } = event.data;

        switch (type) {
          case 'progress':
            if (onProgress && data.progress !== undefined) {
              const progress: CSVParseProgress = {
                progress: data.progress,
                loaded: Math.round((data.progress / 100) * file.size),
                total: file.size,
                currentChunk: data.chunkIndex || 0,
                totalChunks: data.totalChunks || 1
              };
              onProgress(progress);
            }
            break;

          case 'chunk':
            if (onChunk && data.chunk && data.chunkIndex !== undefined) {
              const progress: CSVParseProgress = {
                progress: Math.round(((data.chunkIndex + 1) / data.totalChunks) * 100),
                loaded: Math.round(((data.chunkIndex + 1) / data.totalChunks) * file.size),
                total: file.size,
                currentChunk: data.chunkIndex,
                totalChunks: data.totalChunks || 1
              };
              onChunk(data.chunk, progress);
            }
            break;

          case 'complete':
            if (data.headers && data.rows) {
              const result: CSVParseResult = {
                headers: data.headers,
                rows: data.rows,
                totalRows: data.rows.length
              };
              this.cleanup();
              resolve(result);
            } else {
              this.cleanup();
              reject(new Error('Invalid complete message from worker'));
            }
            break;

          case 'error':
            this.cleanup();
            reject(new Error(data.error || 'Unknown error occurred'));
            break;

          default:
            console.warn('Unknown message type from worker:', type);
        }
      };

      // Handle worker errors
      this.worker.onerror = (error) => {
        this.cleanup();
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Handle abort signal
      if (this.abortController) {
        this.abortController.signal.addEventListener('abort', () => {
          this.abort();
          reject(new Error('CSV parsing aborted'));
        });
      }

      // Send parse message to worker
      this.worker.postMessage({
        type: 'parse',
        data: {
          file,
          delimiter: options.delimiter,
          hasHeaders: options.hasHeaders !== false // default to true
        }
      });
    });
  }

  /**
   * Abort current parsing operation
   */
  abort(): void {
    if (this.worker && this.isProcessing) {
      this.worker.postMessage({ type: 'abort' });
      this.cleanup();
    }
  }

  /**
   * Check if currently processing
   */
  get isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Clean up worker and reset state
   */
  private cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.isProcessing = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Validate CSV file
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    // Check file type
    const validTypes = [
      'text/csv',
      'text/plain',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|txt|xls|xlsx)$/i)) {
      return { valid: false, error: 'Invalid file type. Please upload a CSV, TXT, or Excel file' };
    }

    return { valid: true };
  }

  /**
   * Detect CSV delimiter from sample
   */
  static detectDelimiter(sample: string): string {
    const delimiters = [',', ';', '\t', '|'];
    const counts = delimiters.map(del => ({
      delimiter: del,
      count: (sample.match(new RegExp(`\\${del}`, 'g')) || []).length
    }));

    return counts.reduce((a, b) => a.count > b.count ? a : b).delimiter;
  }

  /**
   * Preview CSV file (first N rows)
   */
  async previewFile(
    file: File,
    maxRows: number = 10,
    options: CSVParseOptions = {}
  ): Promise<{ headers: string[]; rows: CSVRow[] }> {
    // Create a temporary worker for preview
    const worker = new Worker(new URL('../workers/csvWorker.ts', import.meta.url), {
      type: 'module'
    });

    return new Promise((resolve, reject) => {
      worker.onmessage = (event: MessageEvent) => {
        const { type, data } = event.data;

        switch (type) {
          case 'complete':
            if (data.headers && data.rows) {
              const previewRows = data.rows.slice(0, maxRows);
              worker.terminate();
              resolve({
                headers: data.headers,
                rows: previewRows
              });
            } else {
              worker.terminate();
              reject(new Error('Invalid complete message from worker'));
            }
            break;

          case 'error':
            worker.terminate();
            reject(new Error(data.error || 'Unknown error occurred'));
            break;

          case 'progress':
          case 'chunk':
            // Ignore progress and chunk messages for preview
            break;

          default:
            console.warn('Unknown message type from worker:', type);
        }
      };

      worker.onerror = (error) => {
        worker.terminate();
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Send parse message to worker
      worker.postMessage({
        type: 'parse',
        data: {
          file,
          delimiter: options.delimiter,
          hasHeaders: options.hasHeaders !== false
        }
      });
    });
  }

  /**
   * Destroy the parser manager
   */
  destroy(): void {
    this.cleanup();
  }
}

// Singleton instance for app-wide use
let csvParserInstance: CSVParserManager | null = null;

export function getCSVParser(): CSVParserManager {
  if (!csvParserInstance) {
    csvParserInstance = new CSVParserManager();
  }
  return csvParserInstance;
}
