import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export class DataEncryption {
  private key: Buffer;

  constructor(encryptionKey?: string) {
    if (encryptionKey) {
      this.key = Buffer.from(encryptionKey, 'hex');
    } else {
      // Generate a random key if none provided (for development)
      this.key = crypto.randomBytes(KEY_LENGTH);
      console.warn('Using generated encryption key. Set ENCRYPTION_KEY env var for production.');
    }
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, this.key);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine iv + tag + encrypted data
    return iv.toString('hex') + tag.toString('hex') + encrypted;
  }

  decrypt(encryptedText: string): string {
    const iv = Buffer.from(encryptedText.slice(0, IV_LENGTH * 2), 'hex');
    const tag = Buffer.from(encryptedText.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex');
    const encrypted = encryptedText.slice((IV_LENGTH + TAG_LENGTH) * 2);
    
    const decipher = crypto.createDecipher(ALGORITHM, this.key);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Securely hash sensitive data for logging/analytics without storing actual content
  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
  }
}

export const dataEncryption = new DataEncryption(process.env.ENCRYPTION_KEY);
