import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCertificateNumber,
  generateUniqueIdentifier,
  hashCertificateData,
} from '../lib/domain/certificates.ts';

test('generateUniqueIdentifier produces stable organization and user codes', () => {
  const identifier = generateUniqueIdentifier('Cardano State University', 'John Doe', 7);

  assert.equal(identifier.orgCode, 'CAR');
  assert.equal(identifier.userCode, 'JD');
  assert.equal(identifier.entryNumber, '07');
  assert.equal(identifier.fullIdentifier, 'CAR_JD_07');
});

test('hashCertificateData changes when certificate payload changes', () => {
  const base = {
    recipientName: 'Jane Doe',
    recipientEmail: 'jane@example.com',
    recipientPosition: 'Graduate',
    credentialType: 'Bachelor of Science',
    issueDate: '2026-05-26',
    expiryDate: '',
    institutionId: 'inst-1',
    institutionName: 'Cardano State University',
  };

  const first = hashCertificateData(base);
  const second = hashCertificateData({ ...base, credentialType: 'Master of Science' });

  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
});

test('buildCertificateNumber uses institution prefix and zero-padded sequence', () => {
  const number = buildCertificateNumber('Football Kenya Federation', 42);

  assert.match(number, /^FOO-\d{4}-00042$/);
});
