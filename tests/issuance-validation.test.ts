import test from 'node:test';
import assert from 'node:assert/strict';
import { issuanceDraftSchema, issuanceFinalizeSchema } from '../lib/validation/issuance.ts';

test('issuanceDraftSchema accepts a valid issuance payload', () => {
  const parsed = issuanceDraftSchema.parse({
    recipientName: 'Jane Doe',
    recipientEmail: 'jane@example.com',
    recipientPosition: 'Graduate',
    credentialType: 'Bachelor of Science',
    issueDate: '2026-05-26',
    expiryDate: '',
  });

  assert.equal(parsed.recipientEmail, 'jane@example.com');
});

test('issuanceDraftSchema rejects invalid email addresses', () => {
  assert.throws(() =>
    issuanceDraftSchema.parse({
      recipientName: 'Jane Doe',
      recipientEmail: 'not-an-email',
      recipientPosition: 'Graduate',
      credentialType: 'Bachelor of Science',
      issueDate: '2026-05-26',
    })
  );
});

test('issuanceFinalizeSchema requires tx hash and unique identifier', () => {
  const parsed = issuanceFinalizeSchema.parse({
    txHash: '1234567890abcdef',
    txIndex: 0,
    certificateHash: 'abcdef1234567890',
    uniqueIdentifier: 'CAR_JD_01',
  });

  assert.equal(parsed.txIndex, 0);
});
