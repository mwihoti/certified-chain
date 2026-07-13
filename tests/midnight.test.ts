import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeBytes,
  computeCertDataHash,
  certIdToBytes32,
  deriveInstitutionKeyHash,
  FIELD_SIZES,
  type CertificateWitness,
} from '../lib/midnight/helpers';

test('encodeBytes: encodes UTF-8 string to fixed-length hex', () => {
  const result = encodeBytes('test', 8);
  assert.equal(result, '7465737400000000');
});

test('encodeBytes: truncates strings longer than target length', () => {
  const result = encodeBytes('abcdefghij', 5);
  assert.equal(result, '6162636465');
});

test('encodeBytes: handles empty strings', () => {
  const result = encodeBytes('', 4);
  assert.equal(result, '00000000');
});

test('encodeBytes: handles unicode characters', () => {
  const result = encodeBytes('é', 4);
  // é is 2 bytes in UTF-8: c3 a9
  assert.equal(result, 'c3a90000');
});

test('FIELD_SIZES: all fields are 64 bytes matching Compact contract', () => {
  assert.equal(FIELD_SIZES.recipientName, 64);
  assert.equal(FIELD_SIZES.credentialType, 64);
  assert.equal(FIELD_SIZES.issueDate, 64);
  assert.equal(FIELD_SIZES.institutionId, 64);
});

test('computeCertDataHash: computes SHA-256 hash of witness data', async () => {
  const witness: CertificateWitness = {
    recipientName: 'John Doe',
    credentialType: 'Coaching License',
    issueDate: '2025-01-15',
    institutionId: 'FKF',
  };

  const hash = await computeCertDataHash(witness);

  // Hash should be 64 hex characters (32 bytes)
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test('computeCertDataHash: produces deterministic output', async () => {
  const witness: CertificateWitness = {
    recipientName: 'Jane Smith',
    credentialType: 'Referee Certificate',
    issueDate: '2025-03-20',
    institutionId: 'FKF',
  };

  const hash1 = await computeCertDataHash(witness);
  const hash2 = await computeCertDataHash(witness);

  assert.equal(hash1, hash2);
});

test('computeCertDataHash: produces different hashes for different inputs', async () => {
  const witness1: CertificateWitness = {
    recipientName: 'Alice',
    credentialType: 'License A',
    issueDate: '2025-01-01',
    institutionId: 'ORG1',
  };

  const witness2: CertificateWitness = {
    recipientName: 'Bob',
    credentialType: 'License B',
    issueDate: '2025-02-02',
    institutionId: 'ORG2',
  };

  const hash1 = await computeCertDataHash(witness1);
  const hash2 = await computeCertDataHash(witness2);

  assert.notEqual(hash1, hash2);
});

test('computeCertDataHash: handles empty witness fields', async () => {
  const witness: CertificateWitness = {
    recipientName: '',
    credentialType: '',
    issueDate: '',
    institutionId: '',
  };

  const hash = await computeCertDataHash(witness);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test('certIdToBytes32: converts unique identifier to 32-byte hex', () => {
  const result = certIdToBytes32('FKF_KOM_01');
  assert.match(result, /^[a-f0-9]{64}$/);
});

test('certIdToBytes32: produces deterministic output', () => {
  const result1 = certIdToBytes32('TEST_CERT_123');
  const result2 = certIdToBytes32('TEST_CERT_123');
  assert.equal(result1, result2);
});

test('certIdToBytes32: produces different hashes for different IDs', () => {
  const result1 = certIdToBytes32('FKF_KOM_01');
  const result2 = certIdToBytes32('FKF_KOM_02');
  assert.notEqual(result1, result2);
});

test('deriveInstitutionKeyHash: derives 32-byte key hash from institution ID', () => {
  const result = deriveInstitutionKeyHash('FKF');
  assert.match(result, /^[a-f0-9]{64}$/);
});

test('deriveInstitutionKeyHash: produces deterministic output', () => {
  const result1 = deriveInstitutionKeyHash('ORG_001');
  const result2 = deriveInstitutionKeyHash('ORG_001');
  assert.equal(result1, result2);
});

test('deriveInstitutionKeyHash: produces different hashes for different institutions', () => {
  const result1 = deriveInstitutionKeyHash('FKF');
  const result2 = deriveInstitutionKeyHash('FIFA');
  assert.notEqual(result1, result2);
});

// TODO (Phase 13): Hash alignment test
test('Hash alignment: NOTE - computeCertDataHash uses SHA-256, Compact uses persistentHash (Poseidon)', async () => {
  // This test documents the hash algorithm mismatch.
  // The Compact contract uses persistentHash<Vector<4, Bytes<64>>>
  // which is Poseidon hash over a prime field, NOT SHA-256.
  //
  // Phase 13 must:
  // 1. Import Poseidon hash from @midnight-ntwrk/compact-runtime
  // 2. Replace SHA-256 in computeCertDataHash with Poseidon
  // 3. Verify hash matches compiled contract output
  //
  // For now, this test just verifies the function runs.

  const witness: CertificateWitness = {
    recipientName: 'Test User',
    credentialType: 'Test Cert',
    issueDate: '2025-01-01',
    institutionId: 'TEST',
  };

  const hash = await computeCertDataHash(witness);
  assert.match(hash, /^[a-f0-9]{64}$/);

  // TODO: Replace with actual Poseidon hash verification
  // const expectedPoseidonHash = '...'; // from compiled contract
  // assert.equal(hash, expectedPoseidonHash);
});
