import dotenv from 'dotenv';
dotenv.config();
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('Invalid encryption key. Must be 32 bytes (64 hex characters)');
}

export const hashValue = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

export const encrypt = (text) => {
  try {
    if (!text || typeof text !== 'string') return text;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      algorithm, 
      Buffer.from(ENCRYPTION_KEY, 'hex'), 
      iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

export const decrypt = (text) => {
  try {
    if (!text || !text.includes(':')) return text;

    const [ivHex, encryptedText] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(
      algorithm, 
      Buffer.from(ENCRYPTION_KEY, 'hex'), 
      iv
    );
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};