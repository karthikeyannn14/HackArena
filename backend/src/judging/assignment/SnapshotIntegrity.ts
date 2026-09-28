import * as crypto from 'crypto';

export class SnapshotIntegrity {
  /**
   * Deterministically hashes the snapshot payload.
   */
  public static calculateHash(snapshotPayload: any): string {
    // A deterministic stringifier for the snapshot
    const stringify = (obj: any): string => {
      if (typeof obj !== 'object' || obj === null) {
        return JSON.stringify(obj);
      }
      if (Array.isArray(obj)) {
        return '[' + obj.map(stringify).join(',') + ']';
      }
      const keys = Object.keys(obj).sort();
      return '{' + keys.map(k => JSON.stringify(k) + ':' + stringify(obj[k])).join(',') + '}';
    };

    const serialized = typeof snapshotPayload === 'string' 
      ? snapshotPayload 
      : stringify(snapshotPayload);
    
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Verifies the snapshot payload against the stored hash.
   */
  public static verify(snapshotPayload: any, storedHash: string | null): { isValid: boolean, expectedHash: string } {
    const currentHash = this.calculateHash(snapshotPayload);
    return {
      isValid: storedHash ? currentHash === storedHash : false,
      expectedHash: currentHash
    };
  }
}
