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

export interface BlockchainResult {
  txHash: string;
  uniqueIdentifier: string;
  certificateHash: string;
  timestamp: number;
}

// Generate unique certificate identifier: ORG3_USER_ENTRY
export function generateUniqueIdentifier(
  organizationName: string,
  userName: string,
  entryNumber: number
): UniqueIdentifier {
  // Extract first 3 letters of organization (uppercase)
  const orgCode = organizationName
    .replace(/[^a-zA-Z]/g, '')
    .substring(0, 3)
    .toUpperCase();

  // Extract user code (first 3 letters or initials)
  const nameParts = userName.trim().split(/\s+/);
  let userCode: string;
  
  if (nameParts.length >= 2) {
    // Use initials if multiple names
    userCode = nameParts
      .map(part => part.charAt(0))
      .join('')
      .substring(0, 3)
      .toUpperCase();
  } else {
    // Use first 3 letters of single name
    userCode = userName
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase();
  }

  // Format entry number with leading zeros
  const entryStr = entryNumber.toString().padStart(2, '0');
  
  const fullIdentifier = `${orgCode}_${userCode}_${entryStr}`;

  return {
    orgCode,
    userCode,
    entryNumber: entryStr,
    fullIdentifier,
  };
}

// Hash certificate data for privacy
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

// Create transaction metadata for certificate
export function createCertificateMetadata(
  uniqueIdentifier: string,
  certificateHash: string,
  institutionName: string
): Record<string, any> {
  return {
    674: { // Label for certificate metadata
      msg: [
        'LiteCert Certificate',
        `ID: ${uniqueIdentifier}`,
        `Hash: ${certificateHash}`,
        `Issuer: ${institutionName}`,
        `Timestamp: ${new Date().toISOString()}`,
      ],
    },
  };
}

// Connect to Eternl wallet
// Note: This is a placeholder for actual wallet integration
// In production, implement using @meshsdk/core in a client-side only context
export async function connectWallet(): Promise<any | null> {
  try {
    // Check if wallet is available
    if (typeof window === 'undefined') {
      console.error('Window object not available');
      return null;
    }

    // TODO: Implement actual wallet connection using @meshsdk/core
    // For now, this is a placeholder that simulates wallet connection
    console.log('Wallet connection would be initiated here');
    
    return null;
  } catch (error) {
    console.error('Error connecting to wallet:', error);
    return null;
  }
}

// Get wallet address
export async function getWalletAddress(wallet: any): Promise<string | null> {
  try {
    // TODO: Implement actual wallet address retrieval
    // const addresses = await wallet.getUsedAddresses();
    // return addresses[0] || null;
    
    return null;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
}

// Submit certificate to blockchain (mock implementation)
// In production, this would use the actual Mesh SDK to create and submit transactions
export async function submitCertificateToBlockchain(
  certificateData: CertificateData,
  uniqueIdentifier: string
): Promise<BlockchainResult> {
  // Hash the certificate data
  const certificateHash = hashCertificateData(certificateData);
  
  // Create metadata
  const metadata = createCertificateMetadata(
    uniqueIdentifier,
    certificateHash,
    certificateData.institutionName
  );

  try {
    // For now, we'll simulate the blockchain submission
    // In production, you would:
    // 1. Connect to the LiteCert wallet
    // 2. Build a transaction with the metadata
    // 3. Submit the transaction to Cardano
    // 4. Wait for confirmation
    
    // Simulate transaction submission delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a mock transaction hash (Cardano format - 64 characters hex without 0x prefix)
    // In production, this comes from the actual blockchain
    const mockTxHash = Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    return {
      txHash: mockTxHash,
      uniqueIdentifier,
      certificateHash,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('Error submitting to blockchain:', error);
    throw new Error('Failed to submit certificate to blockchain');
  }
}

// Verify certificate on blockchain (mock implementation)
export async function verifyCertificateOnChain(
  uniqueIdentifier: string,
  txHash: string
): Promise<boolean> {
  try {
    // In production, this would:
    // 1. Query the blockchain for the transaction
    // 2. Verify the transaction exists and contains the expected metadata
    // 3. Check the unique identifier in the metadata
    
    // For now, simulate verification
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock verification always succeeds if we have both values
    return !!(uniqueIdentifier && txHash);
  } catch (error) {
    console.error('Error verifying on blockchain:', error);
    return false;
  }
}

// Get next entry number for an organization (in production, query from database)
// For now, use a timestamp-based approach to minimize collisions
let entryCounter = 1;

export function getNextEntryNumber(
  organizationId: string,
  userName: string
): number {
  // In production, this would query the database for the highest entry number
  // for this organization and user combination, then increment
  // For demo purposes, use an incrementing counter to avoid duplicates
  return entryCounter++;
}

// Batch submit certificates to blockchain
export async function batchSubmitCertificates(
  certificates: CertificateData[]
): Promise<BlockchainResult[]> {
  const results: BlockchainResult[] = [];
  
  for (let i = 0; i < certificates.length; i++) {
    const cert = certificates[i];
    
    // Generate unique identifier
    const entryNumber = getNextEntryNumber(cert.institutionId, cert.recipientName);
    const identifier = generateUniqueIdentifier(
      cert.institutionName,
      cert.recipientName,
      entryNumber
    );
    
    // Submit to blockchain
    const result = await submitCertificateToBlockchain(cert, identifier.fullIdentifier);
    results.push(result);
  }
  
  return results;
}
