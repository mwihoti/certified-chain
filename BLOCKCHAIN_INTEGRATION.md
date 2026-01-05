# Blockchain Certificate Integration

## Overview

This document describes the blockchain integration implementation for the LiteCert certificate verification system. The system uses the Cardano blockchain to anchor certificate data, ensuring tamper-proof and verifiable credentials.

## Architecture

### Flow Overview

```
Institution → Excel Upload → Parse Data → Generate Unique IDs → Hash Certificate Data → 
Submit to Blockchain → Store Transaction Hash → Return Updated Excel
```

### Key Components

1. **Cardano Service** (`lib/services/cardano.ts`)
   - Generates unique certificate identifiers (ORG3_USER_ENTRY format)
   - Hashes certificate data for privacy
   - Creates blockchain transactions with metadata
   - Manages wallet connections (placeholder for production)

2. **Excel Service** (`lib/services/excel.ts`)
   - Generates downloadable Excel templates
   - Parses uploaded Excel files
   - Updates Excel files with blockchain data
   - Handles file downloads

3. **Certificate Issuance** (`app/institution/issue/page.tsx`)
   - Single certificate issuance flow
   - Blockchain submission
   - Displays unique identifier and transaction hash

4. **Batch Upload** (`app/institution/batch/page.tsx`)
   - Excel file upload and parsing
   - Batch blockchain submissions
   - Progress tracking
   - Results download with blockchain data

5. **Certificate Retrieval** (`app/user/page.tsx`, `app/verify/page.tsx`)
   - Lookup by certificate number
   - Lookup by unique identifier
   - Display blockchain verification data

## Unique Identifier Format

### Format: `ORG3_USER_ENTRY`

- **ORG3**: First 3 letters of organization name (uppercase)
- **USER**: First 3 letters of user name or initials (uppercase)
- **ENTRY**: 2-digit incremental number (zero-padded)

### Examples
- `CAR_JOH_01` - Cardano University, John, Entry 01
- `KTD_DAN_01` - KTDA, Daniel, Entry 01
- `MOR_FAI_15` - Moringa School, Faith, Entry 15

## Certificate Data Hashing

Certificate data is hashed using SHA-256 to ensure privacy while maintaining verifiability. The hash includes:
- Recipient name
- Recipient email
- Recipient position
- Credential type
- Issue date
- Expiry date (if applicable)
- Institution ID

## Blockchain Transaction Metadata

Each certificate transaction includes metadata with:
```javascript
{
  674: { // Cardano metadata label
    msg: [
      'LiteCert Certificate',
      'ID: CAR_JOH_01',
      'Hash: ba7816bf8f01cfea...',
      'Issuer: Cardano State University',
      'Timestamp: 2024-01-15T10:30:00Z'
    ]
  }
}
```

## Excel Template Format

### Required Columns
- `recipientName`: Full legal name
- `recipientEmail`: Email address
- `recipientPosition`: Role/position (e.g., Graduate, Physician)
- `credentialType`: Type of credential
- `issueDate`: Issue date (YYYY-MM-DD)
- `expiryDate`: Expiry date (YYYY-MM-DD, optional)

### Output Columns (Added After Blockchain Submission)
- `uniqueIdentifier`: Generated unique ID
- `transactionHash`: Blockchain transaction hash

## Implementation Status

### ✅ Completed
- [x] Unique identifier generation
- [x] Certificate data hashing
- [x] Blockchain service module
- [x] Excel template generation
- [x] Excel file parsing
- [x] Single certificate issuance with blockchain
- [x] Batch certificate upload with blockchain
- [x] Certificate retrieval by unique identifier
- [x] Blockchain verification display

### 🔄 In Progress / Future Work
- [ ] Actual MeshJS wallet integration (currently placeholder)
- [ ] Real Cardano blockchain transactions
- [ ] Environment configuration for network selection
- [ ] Database integration for certificate storage
- [ ] Wallet authentication for institutions
- [ ] Transaction confirmation monitoring
- [ ] IPFS integration for certificate storage

## Wallet Integration

### Current Implementation
The wallet connection functions are currently placeholders. The actual implementation would use @meshsdk/core:

```typescript
// Production implementation
import { BrowserWallet } from '@meshsdk/core';

const wallet = await BrowserWallet.enable('eternl');
const addresses = await wallet.getUsedAddresses();
```

### MeshJS Documentation
- Official Docs: https://meshjs.dev/
- Wallet Connection: https://meshjs.dev/apis/wallets/browserwallet
- Transaction Building: https://meshjs.dev/apis/transaction

## Environment Variables

For production deployment, add these environment variables:

```env
# Cardano Network
NEXT_PUBLIC_CARDANO_NETWORK=preprod  # or mainnet, testnet
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=your_project_id

# LiteCert Wallet
LITECERT_WALLET_MNEMONIC=your_wallet_mnemonic
LITECERT_WALLET_ADDRESS=your_wallet_address

# Optional: IPFS
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_GATEWAY=https://ipfs.io/ipfs/
```

## Security Considerations

1. **Private Key Management**: Never expose wallet mnemonics or private keys in client-side code
2. **Certificate Hashing**: Sensitive data is hashed before blockchain submission
3. **Access Control**: Only verified institutions can issue certificates
4. **Transaction Validation**: All blockchain transactions are validated before confirmation
5. **Rate Limiting**: Implement rate limiting for batch uploads
6. **Input Validation**: All user inputs are validated and sanitized

## Testing

### Manual Testing

1. **Single Certificate Issuance**
   - Navigate to `/institution/issue`
   - Fill in certificate details
   - Submit and verify unique ID and TX hash are displayed

2. **Batch Upload**
   - Navigate to `/institution/batch`
   - Download template
   - Upload filled Excel file
   - Verify processing and download results

3. **Certificate Retrieval**
   - Navigate to `/user`
   - Use unique identifier tab
   - Enter identifier and verify certificate details

4. **Certificate Verification**
   - Navigate to `/verify`
   - Use unique ID tab
   - Verify blockchain data is displayed

## Dependencies

### Core Dependencies
- `@meshsdk/core`: Cardano blockchain interaction
- `@meshsdk/core-cst`: Cardano serialization
- `@meshsdk/core-csl`: Cardano crypto library
- `xlsx`: Excel file processing
- `crypto-js`: Cryptographic functions

### Installation
```bash
npm install @meshsdk/core @meshsdk/core-cst @meshsdk/core-csl xlsx crypto-js
```

## Troubleshooting

### Build Issues
If you encounter build errors related to libsodium or other crypto libraries:
1. Ensure all dependencies are installed: `npm install`
2. Clear Next.js cache: `rm -rf .next`
3. Rebuild: `npm run build`

### SSR Issues with MeshJS
MeshJS has some dependencies that don't work well with Server-Side Rendering. The wallet connection functions are designed to only run on the client side.

## Support

For questions or issues:
- Check MeshJS documentation: https://meshjs.dev/
- Review Cardano documentation: https://docs.cardano.org/
- Open an issue in the repository

## License

MIT License - See LICENSE file for details
