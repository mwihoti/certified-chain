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
  blockchainTxIndex: number;
  certificateHash: string;
  status: 'valid' | 'revoked' | 'expired';
  revokedAt?: string;
  revokedReason?: string;
  revokeTxHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface IssuanceDraftPayload {
  recipientName: string;
  recipientEmail: string;
  recipientPosition: string;
  credentialType: string;
  issueDate: string;
  expiryDate?: string;
}

export interface IssuanceJob {
  id: string;
  institutionId: string;
  institutionName: string;
  uniqueIdentifier: string;
  certificateNumber: string;
  certificateHash: string;
  status: 'pending' | 'submitted' | 'persisted' | 'failed';
  blockchainTxHash?: string;
  blockchainTxIndex?: number;
  errorMessage?: string;
  certificateId?: string;
  createdAt: string;
  updatedAt: string;
  draft: IssuanceDraftPayload;
}

export interface FinalizeIssuancePayload {
  txHash: string;
  txIndex: number;
  certificateHash: string;
  uniqueIdentifier: string;
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

export async function createIssuanceJob(
  draft: IssuanceDraftPayload
): Promise<ApiResponse<IssuanceJob>> {
  try {
    const response = await fetch(`${API_BASE_URL}/issuance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draft),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating issuance job:', error);
    return {
      success: false,
      error: 'Failed to create issuance job',
    };
  }
}

export async function finalizeIssuanceJob(
  jobId: string,
  payload: FinalizeIssuancePayload
): Promise<ApiResponse<{ job: IssuanceJob; certificate: CertificateRecord | null; reconciled?: boolean }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/issuance/${encodeURIComponent(jobId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error finalizing issuance job:', error);
    return {
      success: false,
      error: 'Failed to finalize issuance job',
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

// Revoke certificate — optionally record the on-chain revocation tx hash
export async function revokeCertificate(
  uniqueId: string,
  revokeTxHash?: string
): Promise<ApiResponse<CertificateRecord>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/certificates?uniqueId=${encodeURIComponent(uniqueId)}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeTxHash }),
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

// Organization API

export interface OrganizationData {
  id?: string;
  name: string;
  type: string;
  email: string;
  contactName: string;
  phone: string;
  numberOfCerts: number;
  organizationImageName?: string;
  certTemplateName?: string;
  recipientsExcelName?: string;
  status?: string;
  submittedAt?: string;
  completedAt?: string;
}

/**
 * Fetch all organizations or filter by status
 */
export async function getOrganizations(status?: string): Promise<ApiResponse<OrganizationData[]>> {
  try {
    const url = status 
      ? `${API_BASE_URL}/organizations?status=${encodeURIComponent(status)}`
      : `${API_BASE_URL}/organizations`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch organizations',
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return {
      success: false,
      error: 'Network error while fetching organizations',
    };
  }
}

/**
 * Get a specific organization by ID
 */
export async function getOrganization(id: string): Promise<ApiResponse<OrganizationData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/organizations?id=${encodeURIComponent(id)}`);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to fetch organization',
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching organization:', error);
    return {
      success: false,
      error: 'Network error while fetching organization',
    };
  }
}

/**
 * Create a new organization registration
 */
export async function createOrganization(
  organization: OrganizationData
): Promise<ApiResponse<OrganizationData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(organization),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to create organization',
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error creating organization:', error);
    return {
      success: false,
      error: 'Network error while creating organization',
    };
  }
}

/**
 * Update an existing organization
 */
export async function updateOrganization(
  id: string,
  updates: Partial<OrganizationData>
): Promise<ApiResponse<OrganizationData>> {
  try {
    const response = await fetch(`${API_BASE_URL}/organizations`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update organization',
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error updating organization:', error);
    return {
      success: false,
      error: 'Network error while updating organization',
    };
  }
}

/**
 * Delete an organization
 */
export async function deleteOrganization(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_BASE_URL}/organizations?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to delete organization',
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error deleting organization:', error);
    return {
      success: false,
      error: 'Network error while deleting organization',
    };
  }
}

export async function downloadOrganizationExcel(orgId: string): Promise<Blob> {
  const res = await fetch(`/api/organizations/${orgId}`);

  if (!res.ok){
    throw new Error('Failed to download organization Excel file');

  }
  return await res.blob();
}
