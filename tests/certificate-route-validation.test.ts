import test from 'node:test';
import assert from 'node:assert/strict';
import {
  certificateLookupSchema,
  certificateUpdateSchema,
  revokeCertificateSchema,
} from '../lib/validation/certificates.ts';

test('certificateLookupSchema allows public lookup by unique id', () => {
  const parsed = certificateLookupSchema.parse({ uniqueId: 'CAR_JD_01' });
  assert.equal(parsed.uniqueId, 'CAR_JD_01');
});

test('certificateUpdateSchema rejects empty unique identifiers', () => {
  assert.throws(() =>
    certificateUpdateSchema.parse({
      uniqueIdentifier: '',
      status: 'revoked',
    })
  );
});

test('revokeCertificateSchema accepts optional revoke tx hash', () => {
  const parsed = revokeCertificateSchema.parse({ revokeTxHash: 'tx_123' });
  assert.equal(parsed.revokeTxHash, 'tx_123');
});
