import { SnapshotIntegrity } from '../src/judging/assignment/SnapshotIntegrity';
import { AuditService, AuditAction } from '../src/judging/audit';

describe('Phase 6B: Snapshot Integrity and Audit Hardening (Pure Tests)', () => {

  describe('1. Assignment Snapshot Hash', () => {
    const snapshotA = { 
      assignmentRunId: 'run-1', 
      algorithmVersion: 'TEST_1.0', 
      projects: [{ id: 'p1' }], 
      judges: [{ id: 'j1' }] 
    };
    
    const snapshotB = { 
      assignmentRunId: 'run-1', 
      algorithmVersion: 'TEST_1.0', 
      judges: [{ id: 'j1' }], 
      projects: [{ id: 'p1' }] 
    }; // same semantic content, different key order

    const snapshotC = { 
      assignmentRunId: 'run-2', 
      algorithmVersion: 'TEST_1.0', 
      projects: [{ id: 'p1' }], 
      judges: [{ id: 'j1' }] 
    };

    it('identical snapshots produce identical hashes', () => {
      const hash1 = SnapshotIntegrity.calculateHash(snapshotA);
      const hash2 = SnapshotIntegrity.calculateHash(snapshotA);
      expect(hash1).toBe(hash2);
      expect(hash1).toBeDefined();
    });

    it('identical semantic snapshots (different key order) produce identical hashes', () => {
      const hash1 = SnapshotIntegrity.calculateHash(snapshotA);
      const hash2 = SnapshotIntegrity.calculateHash(snapshotB);
      expect(hash1).toBe(hash2);
    });

    it('different snapshots produce different hashes', () => {
      const hashA = SnapshotIntegrity.calculateHash(snapshotA);
      const hashC = SnapshotIntegrity.calculateHash(snapshotC);
      expect(hashA).not.toBe(hashC);
    });

    it('snapshot verification succeeds for an untouched snapshot', () => {
      const storedHash = SnapshotIntegrity.calculateHash(snapshotA);
      const result = SnapshotIntegrity.verify(snapshotA, storedHash);
      expect(result.isValid).toBe(true);
      expect(result.expectedHash).toBe(storedHash);
    });

    it('snapshot verification fails after snapshot content changes', () => {
      const storedHash = SnapshotIntegrity.calculateHash(snapshotA);
      // maliciously alter snapshot
      const alteredSnapshot = { ...snapshotA, algorithmVersion: 'HACKED_2.0' };
      const result = SnapshotIntegrity.verify(alteredSnapshot, storedHash);
      expect(result.isValid).toBe(false);
      expect(result.expectedHash).not.toBe(storedHash);
    });
  });

  describe('2. Audit Integrity Verification', () => {
    it('AuditService verification handles valid audit records', () => {
      const validRecords: any[] = [
        { id: '1', actor: 'a1', action: 'A', entity: 'E', entityId: 'e1', timestamp: new Date('2026-09-28T10:00:00.000Z'), metadata: {} },
        { id: '2', actor: 'a1', action: 'B', entity: 'E', entityId: 'e2', timestamp: new Date('2026-09-28T10:05:00.000Z'), metadata: { reason: 'ok' } }
      ];
      const result = AuditService.verifyAuditIntegrity(validRecords);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('AuditService verification detects missing required fields', () => {
      const invalidRecords: any[] = [
        { id: '1', actor: 'a1', action: 'A', entity: 'E', entityId: 'e1', timestamp: new Date('2026-09-28T10:00:00.000Z'), metadata: {} },
        { id: '2', /* missing actor */ action: 'B', entity: 'E', entityId: 'e2', timestamp: new Date('2026-09-28T10:05:00.000Z') }
      ];
      const result = AuditService.verifyAuditIntegrity(invalidRecords);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toMatch(/missing required fields/);
    });

    it('AuditService verification detects chronological ordering violations', () => {
      const outOfOrder: any[] = [
        { id: '1', actor: 'a1', action: 'A', entity: 'E', entityId: 'e1', timestamp: new Date('2026-09-28T10:10:00.000Z'), metadata: {} },
        { id: '2', actor: 'a1', action: 'B', entity: 'E', entityId: 'e2', timestamp: new Date('2026-09-28T10:05:00.000Z'), metadata: {} }
      ];
      const result = AuditService.verifyAuditIntegrity(outOfOrder);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toMatch(/Chronological ordering violated/);
    });
  });

  describe('3. CSV Export Audit Event', () => {
    it('CSV_EXPORTED is recognized as a valid audit action', () => {
      expect(AuditAction).toHaveProperty('CSV_EXPORTED');
      expect((AuditAction as any).CSV_EXPORTED).toBe('CSV_EXPORTED');
    });
  });

});
