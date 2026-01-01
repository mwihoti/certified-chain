// Mock data for LiteCert prototype

export interface Institution {
  id: string;
  name: string;
  type: 'university' | 'hospital' | 'certification_body' | 'government';
  email: string;
  verified: boolean;
  registeredAt: string;
  certificatesIssued: number;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  recipientName: string;
  recipientPosition: string;
  institutionId: string;
  institutionName: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string;
  status: 'valid' | 'revoked' | 'expired';
  revokedAt?: string;
  revokedReason?: string;
  blockchainTxHash: string;
  ipfsCid: string;
  metadataHash: string;
}

export const mockInstitutions: Institution[] = [
  {
    id: 'inst-001',
    name: 'Cardano State University',
    type: 'university',
    email: 'registrar@cardanostate.edu',
    verified: true,
    registeredAt: '2026-01-01',
    certificatesIssued: 1247,
  },
  {
    id: 'inst-002',
    name: 'Metropolitan General Hospital',
    type: 'hospital',
    email: 'hr@metrogeneral.health',
    verified: true,
    registeredAt: '2025-11-20',
    certificatesIssued: 856,
  },
  {
    id: 'inst-003',
    name: 'Global Tech Certifications',
    type: 'certification_body',
    email: 'verify@globaltechcert.org',
    verified: true,
    registeredAt: '2025-10-10',
    certificatesIssued: 3421,
  },
  {
    id: 'inst-004',
    name: 'National Medical Board',
    type: 'government',
    email: 'certification@nmb.gov',
    verified: true,
    registeredAt: '2025-12-05',
    certificatesIssued: 2156,
  },
  {
    id: 'inst-005',
    name: 'Blockchain Academy',
    type: 'certification_body',
    email: 'admin@blockchainacademy.io',
    verified: true,
    registeredAt: '2025-09-01',
    certificatesIssued: 678,
  },
  {
    id: 'inst-006',
    name: 'Football Kenya Federation',
    type: 'certification_body',
    email: 'registrar@footballkenya.or.ke',
    verified: true,
    registeredAt: '2025-11-10',
    certificatesIssued: 2340,
  },
  {
    id: 'inst-007',
    name: 'Kenya Karate Federation',
    type: 'certification_body',
    email: 'certification@kenyakarate.org',
    verified: true,
    registeredAt: '2025-10-05',
    certificatesIssued: 1567,
  },
  {
    id: 'inst-008',
    name: 'Moringa School',
    type: 'university',
    email: 'certificates@moringaschool.com',
    verified: true,
    registeredAt: '2025-12-20',
    certificatesIssued: 4521,
  },
  {
    id: 'inst-009',
    name: 'Strathmore University',
    type: 'university',
    email: 'registrar@strathmore.edu',
    verified: true,
    registeredAt: '2025-12-08',
    certificatesIssued: 8934,
  },
  {
    id: 'inst-010',
    name: 'Kenya Rugby Union',
    type: 'certification_body',
    email: 'admin@kru.co.ke',
    verified: true,
    registeredAt: '2025-09-15',
    certificatesIssued: 892,
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert-001',
    certificateNumber: 'CSU-2024-00147',
    recipientName: 'Alice Johnson',
    recipientPosition: 'Graduate',
    institutionId: 'inst-001',
    institutionName: 'Cardano State University',
    credentialType: 'Bachelor of Science in Computer Science',
    issueDate: '2025-12-20',
    status: 'valid',
    blockchainTxHash: '0x8f3a2b1c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678',
    ipfsCid: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  },
  {
    id: 'cert-002',
    certificateNumber: 'MGH-2024-00892',
    recipientName: 'Dr. Robert Smith',
    recipientPosition: 'Physician',
    institutionId: 'inst-002',
    institutionName: 'Metropolitan General Hospital',
    credentialType: 'Board Certification in Internal Medicine',
    issueDate: '2025-10-15',
    expiryDate: '2030-10-15',
    status: 'valid',
    blockchainTxHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345679',
    ipfsCid: 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
    metadataHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'cert-003',
    certificateNumber: 'GTC-2024-03421',
    recipientName: 'Maria Garcia',
    recipientPosition: 'Developer',
    institutionId: 'inst-003',
    institutionName: 'Global Tech Certifications',
    credentialType: 'Certified Blockchain Developer',
    issueDate: '2025-11-01',
    expiryDate: '2027-11-01',
    status: 'valid',
    blockchainTxHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef123456780',
    ipfsCid: 'QmZoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
  },
  {
    id: 'cert-004',
    certificateNumber: 'NMB-2024-01567',
    recipientName: 'Dr. Sarah Chen',
    recipientPosition: 'Surgeon',
    institutionId: 'inst-004',
    institutionName: 'National Medical Board',
    credentialType: 'Medical License - General Surgery',
    issueDate: '2025-09-10',
    status: 'revoked',
    revokedAt: '2025-12-15',
    revokedReason: 'License suspended pending investigation',
    blockchainTxHash: '0x3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567891',
    ipfsCid: 'QmAoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  },
  {
    id: 'cert-005',
    certificateNumber: 'BA-2024-00234',
    recipientName: 'James Wilson',
    recipientPosition: 'Student',
    institutionId: 'inst-005',
    institutionName: 'Blockchain Academy',
    credentialType: 'Cardano Smart Contract Development',
    issueDate: '2025-12-10',
    expiryDate: '2026-12-10',
    status: 'valid',
    blockchainTxHash: '0x4d5e6f7890abcdef1234567890abcdef1234567890abcdef12345678902',
    ipfsCid: 'QmBoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  },
  {
    id: 'cert-006',
    certificateNumber: 'CSU-2024-00892',
    recipientName: 'Emily Brown',
    recipientPosition: 'Graduate',
    institutionId: 'inst-001',
    institutionName: 'Cardano State University',
    credentialType: 'Master of Business Administration',
    issueDate: '2025-12-20',
    status: 'valid',
    blockchainTxHash: '0x5e6f7890abcdef1234567890abcdef1234567890abcdef123456789023',
    ipfsCid: 'QmCoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',
  },
  {
    id: 'cert-007',
    certificateNumber: 'GTC-2024-02156',
    recipientName: 'Michael Lee',
    recipientPosition: 'Engineer',
    institutionId: 'inst-003',
    institutionName: 'Global Tech Certifications',
    credentialType: 'AWS Solutions Architect',
    issueDate: '2025-09-05',
    expiryDate: '2028-09-05',
    status: 'valid',
    blockchainTxHash: '0x6f7890abcdef1234567890abcdef1234567890abcdef1234567890234',
    ipfsCid: 'QmDoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
  },
  {
    id: 'cert-008',
    certificateNumber: 'MGH-2024-00234',
    recipientName: 'Dr. Lisa Taylor',
    recipientPosition: 'Nurse',
    institutionId: 'inst-002',
    institutionName: 'Metropolitan General Hospital',
    credentialType: 'Registered Nurse Certification',
    issueDate: '2025-08-20',
    expiryDate: '2027-08-20',
    status: 'valid',
    blockchainTxHash: '0x7890abcdef1234567890abcdef1234567890abcdef12345678902345',
    ipfsCid: 'QmEoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: 'd04b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807340fa',
  },
  {
    id: 'cert-009',
    certificateNumber: 'FKF-2024-01892',
    recipientName: 'Kevin Omondi',
    recipientPosition: 'Player',
    institutionId: 'inst-006',
    institutionName: 'Football Kenya Federation',
    credentialType: 'Professional Player License',
    issueDate: '2025-11-15',
    expiryDate: '2026-11-15',
    status: 'valid',
    blockchainTxHash: '0x890abcdef1234567890abcdef1234567890abcdef123456789023456',
    ipfsCid: 'QmFoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: 'e04b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807340fb',
  },
  {
    id: 'cert-010',
    certificateNumber: 'FKF-2024-00456',
    recipientName: 'Samuel Wanjala',
    recipientPosition: 'Coach',
    institutionId: 'inst-006',
    institutionName: 'Football Kenya Federation',
    credentialType: 'CAF A Coaching License',
    issueDate: '2025-09-20',
    expiryDate: '2028-09-20',
    status: 'valid',
    blockchainTxHash: '0x90abcdef1234567890abcdef1234567890abcdef1234567890234567',
    ipfsCid: 'QmGoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: 'f04b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807340fc',
  },
  {
    id: 'cert-011',
    certificateNumber: 'KKF-2024-00789',
    recipientName: 'Grace Muthoni',
    recipientPosition: 'Athlete',
    institutionId: 'inst-007',
    institutionName: 'Kenya Karate Federation',
    credentialType: 'Black Belt 3rd Dan Certificate',
    issueDate: '2025-12-10',
    status: 'valid',
    blockchainTxHash: '0x0abcdef1234567890abcdef1234567890abcdef12345678902345678',
    ipfsCid: 'QmHoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: '104b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807340fd',
  },
  {
    id: 'cert-012',
    certificateNumber: 'KKF-2024-01234',
    recipientName: 'Peter Kimani',
    recipientPosition: 'Referee',
    institutionId: 'inst-007',
    institutionName: 'Kenya Karate Federation',
    credentialType: 'National Referee Certification',
    issueDate: '2025-10-25',
    expiryDate: '2027-10-25',
    status: 'valid',
    blockchainTxHash: '0xabcdef1234567890abcdef1234567890abcdef123456789023456789',
    ipfsCid: 'QmIoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: '204b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807340fe',
  },
  {
    id: 'cert-013',
    certificateNumber: 'MOR-2024-02567',
    recipientName: 'Faith Wambui',
    recipientPosition: 'Graduate',
    institutionId: 'inst-008',
    institutionName: 'Moringa School',
    credentialType: 'Full Stack Web Development',
    issueDate: '2025-12-20',
    status: 'valid',
    blockchainTxHash: '0xbcdef1234567890abcdef1234567890abcdef1234567890234567890',
    ipfsCid: 'QmJoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: '304b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807340ff',
  },
  {
    id: 'cert-014',
    certificateNumber: 'MOR-2024-03421',
    recipientName: 'Brian Otieno',
    recipientPosition: 'Graduate',
    institutionId: 'inst-008',
    institutionName: 'Moringa School',
    credentialType: 'Data Science & Machine Learning',
    issueDate: '2025-12-15',
    status: 'valid',
    blockchainTxHash: '0xcdef1234567890abcdef1234567890abcdef12345678902345678901',
    ipfsCid: 'QmKoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: '404b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807341ff',
  },
  {
    id: 'cert-015',
    certificateNumber: 'STR-2024-05678',
    recipientName: 'Angela Njeri',
    recipientPosition: 'Graduate',
    institutionId: 'inst-009',
    institutionName: 'Strathmore University',
    credentialType: 'Bachelor of Commerce',
    issueDate: '2025-11-30',
    status: 'valid',
    blockchainTxHash: '0xdef1234567890abcdef1234567890abcdef123456789023456789012',
    ipfsCid: 'QmLoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: '504b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807342ff',
  },
  {
    id: 'cert-016',
    certificateNumber: 'KRU-2024-00123',
    recipientName: 'Collins Injera',
    recipientPosition: 'Player',
    institutionId: 'inst-010',
    institutionName: 'Kenya Rugby Union',
    credentialType: 'Professional Player Registration',
    issueDate: '2025-09-28',
    expiryDate: '2026-09-28',
    status: 'valid',
    blockchainTxHash: '0xef1234567890abcdef1234567890abcdef1234567890234567890123',
    ipfsCid: 'QmMoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco',
    metadataHash: '604b98f48e8f8bcc15c6ae5ac050801cd6dcfd428fb5f9e65c4e16e7807343ff',
  },
];

// Helper functions
export const findCertificate = (certNumber: string, position: string): Certificate | undefined => {
  return mockCertificates.find(
    cert => cert.certificateNumber.toLowerCase() === certNumber.toLowerCase() &&
            cert.recipientPosition.toLowerCase() === position.toLowerCase()
  );
};

export const findCertificateByNumber = (certNumber: string): Certificate | undefined => {
  return mockCertificates.find(
    cert => cert.certificateNumber.toLowerCase() === certNumber.toLowerCase()
  );
};

export const getInstitution = (id: string): Institution | undefined => {
  return mockInstitutions.find(inst => inst.id === id);
};

export const getInstitutionCertificates = (institutionId: string): Certificate[] => {
  return mockCertificates.filter(cert => cert.institutionId === institutionId);
};

// Generate verification code for sharing
export const generateVerificationCode = (certNumber: string): string => {
  const hash = certNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return `LC${hash.toString(36).toUpperCase()}${Date.now().toString(36).slice(-4).toUpperCase()}`;
};