import crypto from 'crypto';

// The encryption key should be exactly 32 bytes (64 hex characters)
// For local development, fallback to a deterministic key if not set
const getMasterKey = () => {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    return Buffer.from(envKey, 'hex');
  }
  
  // WARNING: Only for development. In production this should throw an error.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY environment variable is missing or invalid. Must be 64 hex characters (32 bytes).');
  }
  
  // Development fallback key (32 bytes)
  return crypto.createHash('sha256').update('brokiax-dev-fallback-key-do-not-use-in-prod').digest();
};

export interface EncryptedData {
  encrypted: string;
  iv: string;
}

/**
 * Encrypts a string using AES-256-GCM
 */
export function encryptText(plaintext: string): EncryptedData {
  const MASTER_KEY = getMasterKey();
  const iv = crypto.randomBytes(12); // 96-bit nonce per NIST SP 800-38D for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    // We append the 16 bytes auth tag to the ciphertext
    encrypted: Buffer.concat([encrypted, authTag]).toString('base64'),
    iv: iv.toString('hex'),
  };
}

/**
 * Decrypts a string using AES-256-GCM
 */
export function decryptText(encryptedBase64: string, ivHex: string): string {
  const MASTER_KEY = getMasterKey();
  const iv = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(encryptedBase64, 'base64');
  
  // The last 16 bytes are the auth tag
  const authTag = data.subarray(-16);
  const encryptedData = data.subarray(0, -16);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(authTag);
  
  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]).toString('utf8');
}
