import CryptoJS from 'crypto-js';

export interface CertificateData {
  recipientName: string;
  recipientEmail: string;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string;
  institutionId: string;
  institutionName: string;
}

export interface UniqueIdentifier {
  orgCode: string;
  userCode: string;
  entryNumber: string;
  fullIdentifier: string;
}

export function generateUniqueIdentifier(
  organizationName: string,
  userName: string,
  entryNumber: number
): UniqueIdentifier {
  const orgCode = organizationName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();

  const nameParts = userName.trim().split(/\s+/);
  let userCode: string;

  if (nameParts.length >= 2) {
    userCode = nameParts
      .map((part) => part.charAt(0))
      .join('')
      .substring(0, 3)
      .toUpperCase();
  } else {
    userCode = userName
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase();
  }

  const entryStr = entryNumber.toString().padStart(2, '0');
  const fullIdentifier = `${orgCode}_${userCode}_${entryStr}`;

  return { orgCode, userCode, entryNumber: entryStr, fullIdentifier };
}

export function hashCertificateData(data: CertificateData): string {
  const dataString = JSON.stringify({
    recipientName: data.recipientName,
    recipientEmail: data.recipientEmail,
    recipientPosition: data.recipientPosition,
    credentialType: data.credentialType,
    issueDate: data.issueDate,
    expiryDate: data.expiryDate,
    institutionId: data.institutionId,
  });

  return CryptoJS.SHA256(dataString).toString();
}

export function buildCertificateNumber(institutionName: string, entryNumber: number) {
  const year = new Date().getFullYear();
  return `${institutionName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase()}-${year}-${String(entryNumber).padStart(5, '0')}`;
}
