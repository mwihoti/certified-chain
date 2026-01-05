# LiteCert - Blockchain Certificate Verification System

A blockchain-based certificate verification platform built on Cardano. LiteCert enables institutions to issue tamper-proof digital credentials with unique identifiers that can be instantly verified by employers and other parties.

## Key Features

### 🔗 Blockchain Integration
- **Cardano Blockchain**: Certificates are anchored on the Cardano blockchain for immutability
- **Unique Identifiers**: Each certificate gets a unique ID in format `ORG3_USER_ENTRY` (e.g., `CAR_JOH_01`)
- **Transaction Hashes**: Every certificate has a verifiable blockchain transaction
- **Privacy-First**: Certificate data is hashed before blockchain submission

### 🏛️ Institution Portal
- Register and manage institutional accounts
- Issue individual certificates with blockchain anchoring
- **Batch upload certificates via Excel**
  - Download pre-formatted Excel template
  - Upload filled Excel with recipient details
  - System processes and submits to blockchain
  - Download updated Excel with unique IDs and transaction hashes
- View and manage all issued certificates
- Revoke certificates when needed

### 👤 User Portal
- **Retrieve certificates using certificate number or unique identifier**
- View blockchain verification data (unique ID and transaction hash)
- Download certificate as PDF
- Generate shareable verification links

### ✅ Verification Portal
- **Verify certificates by certificate number or unique identifier**
- View complete blockchain verification details
- Check certificate status (Valid/Revoked/Expired)
- Access blockchain transaction details

## Tech Stack

- **Framework**: Next.js 16 with React 18 and TypeScript
- **Blockchain**: Cardano via MeshJS SDK
- **Excel Processing**: xlsx library
- **Cryptography**: crypto-js for hashing
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: React Query (TanStack Query)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd litecert
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
bun install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
bun dev
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
app/
├── institution/         # Institution portal pages
│   ├── batch/          # Batch upload page
│   ├── dashboard/      # Dashboard page
│   ├── issue/          # Issue certificate page
│   ├── register/       # Registration page
│   └── page.tsx        # Login page
├── user/               # User portal pages
├── verify/             # Verification portal pages
├── layout.tsx          # Root layout with providers
├── page.tsx            # Home page
├── providers.tsx       # Client-side providers
└── globals.css         # Global styles and design tokens
components/
├── layout/             # Header, Footer, Layout components
└── ui/                 # Reusable UI components (shadcn/ui)
hooks/                  # Custom React hooks
lib/
├── mockData.ts         # Mock data for prototype
└── utils.ts            # Utility functions
```

## Demo Credentials

### Institution Login
- **Email**: demo@cardanostate.edu
- **Password**: Any password works (prototype mode)

### Sample Certificates to Verify

| Certificate Number | Position | Institution |
|-------------------|----------|-------------|
| CSU-2024-00147 | Graduate | Cardano State University |
| FKF-2024-01892 | Player | Football Kenya Federation |
| KKF-2024-00789 | Athlete | Kenya Karate Federation |
| MOR-2024-02567 | Graduate | Moringa School |
| NMB-2024-01567 | Surgeon | National Medical Board (Revoked) |

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Blockchain Integration

See [BLOCKCHAIN_INTEGRATION.md](./BLOCKCHAIN_INTEGRATION.md) for detailed documentation on:
- Unique identifier format (ORG3_USER_ENTRY)
- Certificate data hashing
- Blockchain transaction metadata
- Excel template format
- Wallet integration (with MeshJS)
- Environment variables for production

### Quick Overview

**Unique Identifier Format**: `ORG3_USER_ENTRY`
- Example: `CAR_JOH_01` (Cardano University, John, Entry 01)

**Certificate Issuance Flow**:
1. Institution fills Excel template with recipient details
2. System generates unique identifiers for each certificate
3. Certificate data is hashed for privacy
4. Transactions are submitted to Cardano blockchain
5. Updated Excel with unique IDs and transaction hashes is returned

**Certificate Retrieval**:
- Users can retrieve certificates using unique identifier
- Blockchain verification data is displayed (transaction hash, unique ID)

## Integration Points

This system integrates with:
- **Cardano Blockchain** - For certificate anchoring and verification (via MeshJS)
- **Eternl Wallet** - Wallet connection for blockchain transactions
- **Excel Processing** - For batch certificate uploads
- **Backend API** - For institution authentication and data persistence (future)
- **IPFS/Arweave** - For decentralized certificate storage (future)

## How can I edit this code?

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting. Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

Clone this repo and push changes. The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain?

Yes! Navigate to Project > Settings > Domains and click Connect Domain. Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
