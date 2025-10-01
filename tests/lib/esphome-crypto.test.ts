import { ESPHomeCrypto } from '../../lib/esphome-crypto';

describe('ESPHomeCrypto', () => {
  const validKey = 'Quvqw/PaxsHQ90BGdFN1jgDJ8iGgX2QfGVdvZttBemA=';
  let crypto: ESPHomeCrypto;

  beforeEach(() => {
    crypto = new ESPHomeCrypto(validKey);
  });

  describe('constructor', () => {
    it('should create instance with valid base64 key', () => {
      expect(() => new ESPHomeCrypto(validKey)).not.toThrow();
    });

    it('should throw error with invalid key length', () => {
      const shortKey = 'short';
      expect(() => new ESPHomeCrypto(shortKey)).toThrow('Invalid key length');
    });

    it('should throw error with invalid base64', () => {
      const invalidBase64 = 'invalid!@#$';
      expect(() => new ESPHomeCrypto(invalidBase64)).toThrow();
    });
  });

  describe('encryption and decryption', () => {
    it('should encrypt and decrypt a simple message', () => {
      const plaintext = Buffer.from('Hello ESPHome!', 'utf8');
      
      const encrypted = crypto.encrypt(plaintext);
      expect(encrypted.length).toBeGreaterThan(plaintext.length);
      expect(encrypted.length).toBe(12 + plaintext.length + 16); // nonce + plaintext + tag
      
      const decrypted = crypto.decrypt(encrypted);
      expect(decrypted).toEqual(plaintext);
    });

    it('should encrypt different messages differently', () => {
      const plaintext1 = Buffer.from('Message 1', 'utf8');
      const plaintext2 = Buffer.from('Message 2', 'utf8');
      
      const encrypted1 = crypto.encrypt(plaintext1);
      const encrypted2 = crypto.encrypt(plaintext2);
      
      expect(encrypted1).not.toEqual(encrypted2);
    });

    it('should handle empty messages', () => {
      const plaintext = Buffer.alloc(0);
      
      const encrypted = crypto.encrypt(plaintext);
      const decrypted = crypto.decrypt(encrypted);
      
      expect(decrypted).toEqual(plaintext);
    });

    it('should handle large messages', () => {
      const plaintext = Buffer.alloc(1024, 'A');
      
      const encrypted = crypto.encrypt(plaintext);
      const decrypted = crypto.decrypt(encrypted);
      
      expect(decrypted).toEqual(plaintext);
    });

    it('should fail decryption with wrong key', () => {
      const plaintext = Buffer.from('Secret message', 'utf8');
      const encrypted = crypto.encrypt(plaintext);
      
      const wrongCrypto = new ESPHomeCrypto('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=');
      
      expect(() => wrongCrypto.decrypt(encrypted)).toThrow('Authentication failed');
    });

    it('should fail decryption with corrupted data', () => {
      const plaintext = Buffer.from('Test message', 'utf8');
      const encrypted = crypto.encrypt(plaintext);
      
      // Corrupt the last byte
      encrypted[encrypted.length - 1] ^= 0xFF;
      
      expect(() => crypto.decrypt(encrypted)).toThrow('Authentication failed');
    });

    it('should fail decryption with too short message', () => {
      const shortMessage = Buffer.alloc(10); // Less than nonce + tag
      
      expect(() => crypto.decrypt(shortMessage)).toThrow('Message too short');
    });
  });

  describe('nonce management', () => {
    it('should increment nonce with each encryption', () => {
      const plaintext = Buffer.from('Test', 'utf8');
      
      const encrypted1 = crypto.encrypt(plaintext);
      const encrypted2 = crypto.encrypt(plaintext);
      
      // Nonces should be different (first 12 bytes)
      const nonce1 = encrypted1.slice(0, 12);
      const nonce2 = encrypted2.slice(0, 12);
      
      expect(nonce1).not.toEqual(nonce2);
    });

    it('should reset nonce counters', () => {
      const plaintext = Buffer.from('Test', 'utf8');
      
      // Encrypt some messages
      crypto.encrypt(plaintext);
      crypto.encrypt(plaintext);
      
      // Reset
      crypto.reset();
      
      // Should start from 0 again
      const encrypted = crypto.encrypt(plaintext);
      const nonce = encrypted.slice(0, 12);
      const expectedNonce = Buffer.alloc(12); // All zeros
      
      expect(nonce).toEqual(expectedNonce);
    });
  });

  describe('cross-instance communication', () => {
    it('should decrypt message encrypted by different instance', () => {
      const plaintext = Buffer.from('Cross-instance test', 'utf8');
      
      const senderCrypto = new ESPHomeCrypto(validKey);
      const receiverCrypto = new ESPHomeCrypto(validKey);
      
      const encrypted = senderCrypto.encrypt(plaintext);
      const decrypted = receiverCrypto.decrypt(encrypted);
      
      expect(decrypted).toEqual(plaintext);
    });
  });

  describe('utility methods', () => {
    it('should return the encryption key', () => {
      const returnedKey = crypto.getKey();
      expect(returnedKey).toBe(validKey);
    });
  });
});
