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

// Get Cardano network configuration
export function getCardanoNetwork(): 'preview' | 'preprod' | 'mainnet' {
    const network = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preview';
    if (network !== 'preview' && network !== 'preprod' && network !== 'mainnet') {
        console.warn(`Invalid network ${network}, defaulting to preview`);
        return 'preview';
    }
    return network as 'preview' | 'preprod' | 'mainnet';
}

// Note: For actual wallet connections, use the wallet-client.ts module directly in client components
// The functions below are kept for backwards compatibility but will use wallet-client internally

// Connect to Eternl wallet (client-side only)
// For actual use, import from wallet-client.ts directly
export async function connectWallet(): Promise<any | null> {
    if (typeof window === 'undefined') {
        console.warn('connectWallet called in server context');
        return null;
    }

    try {
        // In production, use wallet-client.ts directly in your client components
        console.log('Wallet connection should be handled in client components using wallet-client.ts');
        return null;
    } catch (error) {
        console.error('Error connecting to wallet:', error);
        return null;
    }
}

// Get wallet address (client-side only)
export async function getWalletAddress(wallet: any): Promise<string | null> {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        if (!wallet) {
            console.error('No wallet provided');
            return null;
        }

        const addresses = await wallet.getUsedAddresses();
        if (!addresses || addresses.length === 0) {
            console.error('No addresses found in wallet');
            return null;
        }

        return addresses[0];
    } catch (error) {
        console.error('Error getting wallet address:', error);
        return null;
    }
}

// Get wallet balance (client-side only)
export async function getWalletBalance(wallet: any): Promise<string | null> {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        if (!wallet) {
            console.error('No wallet provided');
            return null;
        }

        const balance = await wallet.getBalance();
        return balance;
    } catch (error) {
        console.error('Error getting wallet balance:', error);
        return null;
    }
}

// Submit certificate to blockchain
// Note: Actual blockchain submission requires client-side wallet connection
// Use wallet-client.ts for wallet functionality
export async function submitCertificateToBlockchain(
    certificateData: CertificateData,
    uniqueIdentifier: string,
    wallet?: any
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
        // If wallet is provided and we're in browser, attempt actual blockchain submission
        if (wallet && typeof window !== 'undefined') {
            try {
                // Check if Blockfrost is configured
                const network = getCardanoNetwork();
                const blockfrostKey = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID;

                if (!blockfrostKey || blockfrostKey.includes('your_')) {
                    console.warn('Blockfrost API key not configured, using mock submission');
                    return mockBlockchainSubmission(uniqueIdentifier, certificateHash);
                }

                // TODO: Implement actual blockchain transaction here
                // This requires MeshJS which must be imported dynamically in a client component
                // For now, we use mock submission
                console.log('Wallet provided, would submit to blockchain with:', {
                    network,
                    metadata,
                    uniqueIdentifier,
                });

                return mockBlockchainSubmission(uniqueIdentifier, certificateHash);
            } catch (error) {
                console.error('Error submitting to blockchain, falling back to mock:', error);
                return mockBlockchainSubmission(uniqueIdentifier, certificateHash);
            }
        }

        // Fallback to mock submission
        return mockBlockchainSubmission(uniqueIdentifier, certificateHash);
    } catch (error) {
        console.error('Error in certificate submission:', error);
        throw new Error('Failed to submit certificate to blockchain');
    }
}

// Mock blockchain submission for development/testing
async function mockBlockchainSubmission(
    uniqueIdentifier: string,
    certificateHash: string
): Promise<BlockchainResult> {
    // Simulate transaction submission delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate a mock transaction hash (Cardano format - 64 characters hex without 0x prefix)
    const mockTxHash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).join('');

    return {
        txHash: mockTxHash,
        uniqueIdentifier,
        certificateHash,
        timestamp: Date.now(),
    };
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