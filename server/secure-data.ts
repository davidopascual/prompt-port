import fs from 'fs/promises';
import path from 'path';

export class SecureDataManager {
  private static dataRetentionHours = parseInt(process.env.DATA_RETENTION_HOURS || '24');
  private static tempDir = path.join(process.cwd(), 'temp_secure');

  // Ensure temp directory exists and is secure
  static async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { mode: 0o700 }); // Owner read/write/execute only
    }
  }

  // Create a temporary secure file for processing
  static async createTempFile(content: string, prefix: string = 'secure'): Promise<string> {
    await this.ensureTempDir();
    
    const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
    const filePath = path.join(this.tempDir, fileName);
    
    await fs.writeFile(filePath, content, { mode: 0o600 }); // Owner read/write only
    
    // Schedule automatic cleanup
    setTimeout(async () => {
      try {
        await this.secureDelete(filePath);
      } catch (error) {
        console.error(`Failed to auto-cleanup temp file: ${filePath}`, error);
      }
    }, this.dataRetentionHours * 60 * 60 * 1000);
    
    return filePath;
  }

  // Securely delete a file by overwriting it multiple times
  static async secureDelete(filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;
      
      // Overwrite the file multiple times with random data
      for (let i = 0; i < 3; i++) {
        const randomData = Buffer.alloc(fileSize);
        for (let j = 0; j < fileSize; j++) {
          randomData[j] = Math.floor(Math.random() * 256);
        }
        await fs.writeFile(filePath, randomData);
      }
      
      // Finally delete the file
      await fs.unlink(filePath);
      console.log(`Securely deleted: ${filePath}`);
    } catch (error) {
      console.error(`Failed to securely delete ${filePath}:`, error);
    }
  }

  // Clean up old temporary files
  static async cleanupOldFiles(): Promise<void> {
    try {
      await this.ensureTempDir();
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = this.dataRetentionHours * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await this.secureDelete(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old files:', error);
    }
  }

  // Secure JSON processing - never keep original data in memory longer than needed
  static async processJsonSecurely<T>(
    content: string, 
    processor: (data: any) => Promise<T>
  ): Promise<T> {
    let tempFile: string | null = null;
    
    try {
      // Parse JSON once
      const jsonData = JSON.parse(content);
      
      // Process immediately
      const result = await processor(jsonData);
      
      // Clear the original data from memory
      const keys = Object.keys(jsonData);
      keys.forEach(key => {
        if (typeof jsonData[key] === 'string') {
          jsonData[key] = 'CLEARED';
        } else if (Array.isArray(jsonData[key])) {
          jsonData[key].length = 0;
        } else if (typeof jsonData[key] === 'object') {
          Object.keys(jsonData[key]).forEach(subKey => {
            jsonData[key][subKey] = 'CLEARED';
          });
        }
      });
      
      return result;
    } finally {
      if (tempFile) {
        await this.secureDelete(tempFile);
      }
    }
  }
}

// Initialize cleanup on startup
SecureDataManager.cleanupOldFiles().catch(console.error);

// Schedule regular cleanup
setInterval(() => {
  SecureDataManager.cleanupOldFiles().catch(console.error);
}, 60 * 60 * 1000); // Every hour
