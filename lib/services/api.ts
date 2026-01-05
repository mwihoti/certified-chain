// API client for certificate operations

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export interface CertificateRecord {
  id: string;
  uniqueIdentifier: string;
  certificateNumber: string;
  recipientName: string;
  recipientEmail: string;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string;
  institutionId: string;
  institutionName: string;
  blockchainTxHash: string;
  certificateHash: string;
  status: 'valid' | 'revoked' | 'expired';
  revokedAt?: string;
  revokedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Save certificate to backend
export async function saveCertificate(
  certificate: Omit<CertificateRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<ApiResponse<CertificateRecord>> {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(certificate),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving certificate:', error);
    return {
      success: false,
      error: 'Failed to save certificate',
    };
  }
}

// Get certificate by unique identifier
export async function getCertificateByUniqueId(
  uniqueId: string
): Promise<ApiResponse<CertificateRecord>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/certificates?uniqueId=${encodeURIComponent(uniqueId)}`
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return {
      success: false,
      error: 'Failed to fetch certificate',
    };
  }
}

// Get certificate by certificate number
export async function getCertificateByCertNumber(
  certNumber: string
): Promise<ApiResponse<CertificateRecord>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/certificates?certNumber=${encodeURIComponent(certNumber)}`
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return {
      success: false,
      error: 'Failed to fetch certificate',
    };
  }
}

// Get all certificates
export async function getAllCertificates(): Promise<ApiResponse<CertificateRecord[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates`);

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return {
      success: false,
      error: 'Failed to fetch certificates',
    };
  }
}

// Update certificate
export async function updateCertificate(
  uniqueIdentifier: string,
  updates: Partial<CertificateRecord>
): Promise<ApiResponse<CertificateRecord>> {
  try {
    const response = await fetch(`${API_BASE_URL}/certificates`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ uniqueIdentifier, ...updates }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating certificate:', error);
    return {
      success: false,
      error: 'Failed to update certificate',
    };
  }
}

// Revoke certificate
export async function revokeCertificate(
  uniqueId: string
): Promise<ApiResponse<CertificateRecord>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/certificates?uniqueId=${encodeURIComponent(uniqueId)}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error revoking certificate:', error);
    return {
      success: false,
      error: 'Failed to revoke certificate',
    };
  }
}
