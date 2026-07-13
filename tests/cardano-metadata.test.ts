import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLiteCertMetadata } from '../lib/contracts/metadata.ts';

const textBytes = (value: string) => new TextEncoder().encode(value).length;

const certificateData = {
  recipientName: 'Ivy Karanja',
  recipientEmail: 'ivy.karanja@example.com',
  recipientPosition: 'Graduate',
  credentialType: 'Bachelor of Science',
  issueDate: '2026-05-29',
  expiryDate: '',
  institutionId: 'f8c1708b-f63b-468e-ade5-7f0b40c962dd',
  institutionName: 'Wallet Lab',
};

function metadataTextValues(value: string | string[] | number): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value;
  return [];
}

test('buildLiteCertMetadata keeps text metadata within Cardano limits', () => {
  const metadata = buildLiteCertMetadata({
    certificateData: {
      ...certificateData,
      institutionName: 'A very long institution name that would exceed the Cardano metadata text item limit',
    },
    certificateHash: 'd47af8ba286cbf418e80c4bb2fa172c32b307a0650c136fcc43f1b1c92462667',
    uniqueIdentifier: 'WAL_IK_02',
    issuedAt: '2026-05-29T07:17:57.737Z',
  });

  assert.equal(metadata.certificateHash, 'd47af8ba286cbf418e80c4bb2fa172c32b307a0650c136fcc43f1b1c92462667');
  assert.equal(textBytes(String(metadata.certificateHash)), 64);

  for (const value of Object.values(metadata)) {
    for (const text of metadataTextValues(value)) {
      assert.ok(textBytes(text) <= 64, `${text} exceeds 64 bytes`);
    }
  }
});

test('buildLiteCertMetadata includes only privacy-safe certificate fields', () => {
  const metadata = buildLiteCertMetadata({
    certificateData,
    certificateHash: 'd47af8ba286cbf418e80c4bb2fa172c32b307a0650c136fcc43f1b1c92462667',
    uniqueIdentifier: 'WAL_IK_02',
    issuedAt: '2026-05-29T07:17:57.737Z',
  });

  // Safe fields that are included
  assert.equal(metadata.certificateId, 'WAL_IK_02');
  assert.equal(metadata.institutionName, 'Wallet Lab');
  assert.equal(metadata.certificateHash, 'd47af8ba286cbf418e80c4bb2fa172c32b307a0650c136fcc43f1b1c92462667');

  // Privacy: personal data must NOT be in on-chain metadata
  assert.equal('recipientName' in metadata, false);
  assert.equal('recipientEmail' in metadata, false);
  assert.equal('recipientPosition' in metadata, false);
  assert.equal('credentialType' in metadata, false);
  assert.equal('issueDate' in metadata, false);
  assert.equal('expiryDate' in metadata, false);
});

test('buildLiteCertMetadata rejects identifiers that cannot fit on chain', () => {
  assert.throws(() =>
    buildLiteCertMetadata({
      certificateData,
      certificateHash: 'd47af8ba286cbf418e80c4bb2fa172c32b307a0650c136fcc43f1b1c92462667',
      uniqueIdentifier: 'X'.repeat(65),
    })
  );
});
