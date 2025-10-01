import { ChaCha20Poly1305 } from '@stablelib/chacha20poly1305';
import { decode as base64Decode } from '@stablelib/base64';

export class ESPHomeCrypto {
  private cipher: ChaCha20Poly1305;
  private key: Uint8Array;
  private sendNonce = 0;
  private receiveNonce = 0;

  constructor(base64Key: string) {
    // Decode the base64 encryption key
    this.key = base64Decode(base64Key);
    if (this.key.length !== 32) {
      throw new Error(`Invalid key length: expected 32 bytes, got ${this.key.length}`);
    }
    this.cipher = new ChaCha20Poly1305(this.key);
  }

  /**
   * Encrypt a message for sending to ESPHome
   */
  encrypt(plaintext: Buffer): Buffer {
    // Create nonce: 8 bytes of zeros + 4 bytes counter (little endian)
    const nonce = new Uint8Array(12);
    const nonceView = new DataView(nonce.buffer);
    nonceView.setUint32(8, this.sendNonce, true); // little endian
    this.sendNonce++;

    // Encrypt the message
    const ciphertext = this.cipher.seal(nonce, new Uint8Array(plaintext));
    
    // Return nonce + ciphertext
    const result = new Uint8Array(nonce.length + ciphertext.length);
    result.set(nonce, 0);
    result.set(ciphertext, nonce.length);
    
    return Buffer.from(result);
  }

  /**
   * Decrypt a message received from ESPHome
   */
  decrypt(encryptedData: Buffer): Buffer {
    if (encryptedData.length < 12 + 16) { // nonce + minimum ciphertext + tag
      throw new Error('Message too short');
    }

    // Extract nonce and ciphertext properly using Buffer.slice
    const nonce = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);

    // Decrypt the message
    const plaintext = this.cipher.open(new Uint8Array(nonce), new Uint8Array(ciphertext));
    if (!plaintext) {
      throw new Error('Authentication failed - invalid ciphertext or key');
    }

    return Buffer.from(plaintext);
  }

  /**
   * Reset nonce counters (for new connections)
   */
  reset(): void {
    this.sendNonce = 0;
    this.receiveNonce = 0;
  }

  /**
   * Get the encryption key for debugging
   */
  getKey(): string {
    return Buffer.from(this.key).toString('base64');
  }
}
