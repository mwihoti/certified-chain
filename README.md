# LiteCert - Blockchain Certificate Verification System

A frontend prototype for a blockchain-based certificate verification platform built on Cardano. LiteCert enables institutions to issue tamper-proof digital credentials that can be instantly verified by employers and other parties.

## Features

### 🏛️ Institution Portal
- Register and manage institutional accounts
- Issue individual certificates with blockchain anchoring simulation
- Batch upload certificates via CSV
- View and manage all issued certificates
- Revoke certificates when needed

### 👤 User Portal
- Retrieve certificates using certificate number and position
- Download certificate as PDF
- Generate shareable verification links
- View blockchain verification details

### ✅ Verification Portal
- Verify certificates by certificate number
- Upload PDF for hash verification (simulated)
- View certificate status (Valid/Revoked/Expired)
- Access blockchain transaction details

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **Routing**: React Router v6
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
http://localhost:5173
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Header, Footer, Layout components
│   └── ui/              # Reusable UI components (shadcn/ui)
├── hooks/               # Custom React hooks
├── lib/
│   ├── mockData.ts      # Mock data for prototype
│   └── utils.ts         # Utility functions
├── pages/
│   ├── institution/     # Institution portal pages
│   ├── user/            # User portal pages
│   └── verify/          # Verification portal pages
├── App.tsx              # Main app with routing
├── index.css            # Global styles and design tokens
└── main.tsx             # App entry point
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
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Future Integration Points

This prototype is designed to connect with:
- **Cardano Blockchain** - For certificate anchoring and verification
- **IPFS/Arweave** - For decentralized certificate storage
- **Backend API** - For institution authentication and data persistence

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
