// CSV Web Worker for streaming large files without blocking the UI
// This worker handles CSV parsing in a separate thread

interface CSVRow {
  [key: string]: string;
}

interface WorkerMessage {
  type: 'parse' | 'abort';
  data?: {
    file: File;
    delimiter?: string;
    hasHeaders?: boolean;
  };
}

interface WorkerResponse {
  type: 'progress' | 'complete' | 'error' | 'chunk';
  data?: {
    progress?: number;
    rows?: CSVRow[];
    headers?: string[];
    error?: string;
    chunk?: CSVRow[];
    chunkIndex?: number;
    totalChunks?: number;
  };
}

let isProcessing = false;
let shouldAbort = false;

// CSV Parser implementation
class CSVParser {
  private delimiter: string;
  private hasHeaders: boolean;
  private headers: string[] = [];

  constructor(delimiter: string = ',', hasHeaders: boolean = true) {
    this.delimiter = delimiter;
    this.hasHeaders = hasHeaders;
  }

  private parseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === this.delimiter && !inQuotes) {
        // Field delimiter
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    // Add the last field
    result.push(current.trim());
    return result;
  }

  private detectDelimiter(sample: string): string {
    const delimiters = [',', ';', '\t', '|'];
    const counts = delimiters.map(del => ({
      delimiter: del,
      count: (sample.match(new RegExp(`\\${del}`, 'g')) || []).length
    }));

    return counts.reduce((a, b) => a.count > b.count ? a : b).delimiter;
  }

  async parseFile(file: File, onProgress?: (progress: number) => void, onChunk?: (chunk: CSVRow[], index: number, total: number) => void): Promise<{ headers: string[], rows: CSVRow[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const chunkSize = 1024 * 1024; // 1MB chunks
      let offset = 0;
      let buffer = '';
      let allRows: CSVRow[] = [];
      let chunkIndex = 0;
      const totalChunks = Math.ceil(file.size / chunkSize);

      const processChunk = () => {
        if (shouldAbort) {
          reject(new Error('CSV parsing aborted'));
          return;
        }

        const end = Math.min(offset + chunkSize, file.size);
        const slice = file.slice(offset, end);
        
        reader.onload = (e) => {
          const text = e.target?.result as string;
          buffer += text;
          
          // Process complete lines
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          const chunkRows: CSVRow[] = [];
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = this.parseLine(line);

            // Detect delimiter on first line if not specified
            if (this.delimiter === ',' && i === 0 && this.hasHeaders) {
              this.delimiter = this.detectDelimiter(line);
            }

            // Extract headers if needed
            if (i === 0 && this.hasHeaders) {
              this.headers = values;
              continue;
            }

            // Create row object
            const row: CSVRow = {};
            for (let j = 0; j < values.length; j++) {
              const header = this.headers[j] || `column_${j + 1}`;
              row[header] = values[j];
            }
            
            chunkRows.push(row);
            allRows.push(row);
          }

          // Send chunk to main thread
          if (onChunk && chunkRows.length > 0) {
            onChunk(chunkRows, chunkIndex, totalChunks);
          }

          // Update progress
          offset = end;
          const progress = Math.round((offset / file.size) * 100);
          if (onProgress) {
            onProgress(progress);
          }

          // Continue or finish
          if (offset < file.size) {
            chunkIndex++;
            setTimeout(() => processChunk(), 0); // Yield to event loop
          } else {
            resolve({
              headers: this.headers,
              rows: allRows
            });
          }
        };

        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };

        reader.readAsText(slice);
      };

      processChunk();
    });
  }
}

// Main worker message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  switch (type) {
    case 'parse':
      if (isProcessing) {
        self.postMessage({ type: 'error', data: { error: 'Already processing a file' } });
        return;
      }

      if (!data || !data.file) {
        self.postMessage({ type: 'error', data: { error: 'No file provided' } });
        return;
      }

      isProcessing = true;
      shouldAbort = false;

      try {
        const parser = new CSVParser(data.delimiter, data.hasHeaders);
        
        const result = await parser.parseFile(
          data.file,
          (progress) => {
            // Send progress updates
            self.postMessage({
              type: 'progress',
              data: { progress }
            });
          },
          (chunk, index, total) => {
            // Send chunk data
            self.postMessage({
              type: 'chunk',
              data: {
                chunk,
                chunkIndex: index,
                totalChunks: total
              }
            });
          }
        );

        // Send final result
        self.postMessage({
          type: 'complete',
          data: {
            headers: result.headers,
            rows: result.rows
          }
        });

      } catch (error) {
        self.postMessage({
          type: 'error',
          data: {
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }
        });
      } finally {
        isProcessing = false;
        shouldAbort = false;
      }
      break;

    case 'abort':
      if (isProcessing) {
        shouldAbort = true;
        self.postMessage({
          type: 'error',
          data: { error: 'CSV parsing aborted' }
        });
      }
      break;

    default:
      self.postMessage({
        type: 'error',
        data: { error: 'Unknown message type' }
      });
  }
};

// Export for TypeScript
export {};
