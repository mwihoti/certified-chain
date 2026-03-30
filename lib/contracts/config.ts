// Contract addresses per network — populated after running scripts/deploy-contract.ts
// Override via env vars if needed
const CONTRACT_ADDRESSES: Record<string, string> = {
  preview: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PREVIEW ?? '',
  preprod: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_PREPROD ?? '',
  mainnet: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_MAINNET ?? '',
};

export function getContractAddress(network: 'preview' | 'preprod' | 'mainnet'): string {
  const addr = CONTRACT_ADDRESSES[network];
  if (!addr) {
    throw new Error(
      `Contract address not set for network "${network}". ` +
      `Run scripts/deploy-contract.ts and set NEXT_PUBLIC_CONTRACT_ADDRESS_${network.toUpperCase()} in .env.local`
    );
  }
  return addr;
}

// Min-ADA to lock at the contract UTxO (2 ADA in lovelace)
export const CONTRACT_MIN_LOVELACE = '2000000';

// Cardano metadata label for LiteCert certificates
export const LITECERT_METADATA_LABEL = 674;
