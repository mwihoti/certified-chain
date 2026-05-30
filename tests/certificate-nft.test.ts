import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCertificateNftMetadata,
  buildCertificateNftSvg,
  type CertificateNftImageData,
} from '../lib/domain/certificate-nft.ts';

const certificate: CertificateNftImageData = {
  uniqueIdentifier: 'WAL_IK_02',
  certificateNumber: 'WAL-2026-00002',
  recipientName: 'Ivy Karanja',
  recipientEmail: 'ivy@example.com',
  recipientPosition: 'Graduate',
  credentialType: 'Bachelor of Science',
  issueDate: '2026-05-29',
  expiryDate: '',
  institutionName: 'Wallet Lab',
  blockchainTxHash: 'd47af8ba286cbf418e80c4bb2fa172c32b307a0650c136fcc43f1b1c92462667',
  certificateHash: 'a47af8ba286cbf418e80c4bb2fa172c32b307a0650c136fcc43f1b1c92462667',
  status: 'valid',
};

test('buildCertificateNftSvg renders certificate details as an SVG image', () => {
  const svg = buildCertificateNftSvg(certificate);

  assert.match(svg, /^<\?xml version="1.0"/);
  assert.match(svg, /<svg /);
  assert.match(svg, /viewBox="0 0 1600 1200"/);
  assert.match(svg, /Ivy Karanja/);
  assert.match(svg, /Bachelor of Science/);
  assert.match(svg, /WAL_IK_02/);
  assert.match(svg, /Scan certificate image/);
});

test('buildCertificateNftSvg can render an organization logo and embedded QR code', () => {
  const svg = buildCertificateNftSvg({
    ...certificate,
    organizationLogoUrl: 'ipfs://QmLogoHash',
    qrCodeSvg: '<svg width="132" height="132"><rect width="132" height="132"/></svg>',
  });

  assert.match(svg, /https:\/\/gateway\.pinata\.cloud\/ipfs\/QmLogoHash/);
  assert.match(svg, /<image href=/);
  assert.match(svg, /<svg width="132" height="132">/);
});

test('buildCertificateNftMetadata returns Cardano 721-style metadata with image URL', () => {
  const metadata = buildCertificateNftMetadata(
    certificate,
    'https://example.com/api/certificates/WAL_IK_02/nft-image',
    'policy123'
  );

  const asset = metadata['721'].policy123.WAL_IK_02;
  assert.equal(asset.image, 'https://example.com/api/certificates/WAL_IK_02/nft-image');
  assert.equal(asset.mediaType, 'image/svg+xml');
  assert.equal(asset.recipientName, 'Ivy Karanja');
  assert.equal(asset.credentialType, 'Bachelor of Science');
});
