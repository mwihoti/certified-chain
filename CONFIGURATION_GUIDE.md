# Cardano Network Configuration Guide

## Overview
LiteCert now supports actual MeshJS wallet integration and backend API for certificate storage. This guide explains how to configure and use these features.

## Cardano Network Setup

### 1. Choose Your Network

LiteCert supports three Cardano networks:
- **Preview** (Recommended for development) - Fast, free testnet
- **Preprod** - Pre-production testnet
- **Mainnet** - Production network (requires real ADA)

### 2. Get Blockfrost API Key

1. Visit [blockfrost.io](https://blockfrost.io/)
2. Create a free account
3. Create a new project for your chosen network
4. Copy your project ID (API key)

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Use 'preview' for development (recommended)
NEXT_PUBLIC_CARDANO_NETWORK=preview

# Your Blockfrost API key for the chosen network
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=previewYourActualProjectIdHere

# API base URL (default for local development)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

## Wallet Integration

### Installing Eternl Wallet

1. Install [Eternl Wallet](https://eternl.io/) browser extension
2. Create or import a wallet
3. **For Preview Network**: 
   - Switch wallet to Preview network in Eternl settings
   - Get test ADA from [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)

### Using the Wallet

The wallet connection is automatic when:
1. Eternl wallet is installed
2. User approves connection
3. Blockfrost API key is configured

**Fallback Behavior**: If wallet or Blockfrost is not configured, the system automatically uses mock blockchain submission for development.

## Backend API

### Certificate Storage API

The backend API provides REST endpoints for certificate management:

#### Endpoints

**GET /api/certificates**
- Query params: `uniqueId` or `certNumber`
- Returns certificate data

**POST /api/certificates**
- Body: Certificate data (see API service for schema)
- Creates new certificate record

**PUT /api/certificates**
- Body: `{ uniqueIdentifier, ...updates }`
- Updates existing certificate

**DELETE /api/certificates**
- Query param: `uniqueId`
- Soft deletes (revokes) certificate

### Storage Implementation

**Development**: Uses in-memory Map storage (data lost on restart)

**Production**: Replace with actual database:
1. Set up PostgreSQL, MongoDB, or preferred database
2. Replace Map storage in `/app/api/certificates/route.ts`
3. Set `DATABASE_URL` in environment variables

Example database integration (PostgreSQL with Prisma):

```typescript
// Instead of: certificates.set(uniqueId, cert)
// Use: await prisma.certificate.create({ data: cert })
```

## Testing the Integration

### 1. Test Wallet Connection

```javascript
import { connectWallet, getWalletAddress } from '@/lib/services/cardano';

const wallet = await connectWallet();
if (wallet) {
  const address = await getWalletAddress(wallet);
  console.log('Connected:', address);
}
```

### 2. Test Certificate Issuance

1. Navigate to `/institution/issue`
2. Fill in certificate details
3. Submit form
4. Observe:
   - Unique identifier generated
   - Transaction submitted to Cardano Preview
   - Certificate saved to API
   - Transaction hash displayed

### 3. Test Certificate Retrieval

1. Navigate to `/user` or `/verify`
2. Use unique identifier tab
3. Enter the unique ID from issuance
4. Certificate should be retrieved from API

## Network Costs

### Preview/Preprod (Testnet)
- **FREE** - Use test ADA from faucet
- Perfect for development and testing
- No real value transactions

### Mainnet (Production)
- Requires real ADA for transaction fees
- Typical certificate transaction: ~0.17 ADA
- Budget accordingly for production use

## Troubleshooting

### Wallet Not Connecting

1. Check Eternl wallet is installed
2. Verify wallet is on correct network (Preview/Preprod/Mainnet)
3. Check browser console for errors
4. Ensure you've approved connection in wallet

### Blockfrost API Errors

1. Verify API key is correct
2. Check API key matches network (preview key for preview network)
3. Verify no rate limits exceeded
4. Check [Blockfrost Status](https://status.blockfrost.io/)

### Transactions Failing

1. Check wallet has sufficient ADA for fees
2. Verify network is not congested
3. Check transaction metadata size limits
4. Review browser console for detailed errors

### API Not Working

1. Verify API routes are accessible (check `/api/certificates`)
2. Check browser console for CORS errors
3. Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly
4. Check server logs for backend errors

## Production Deployment

### Checklist

- [ ] Set up production database
- [ ] Update API routes to use database
- [ ] Configure production Blockfrost API key (mainnet)
- [ ] Set `NEXT_PUBLIC_CARDANO_NETWORK=mainnet`
- [ ] Fund LiteCert wallet with sufficient ADA
- [ ] Set up monitoring for transaction failures
- [ ] Implement rate limiting for API endpoints
- [ ] Add authentication for institution accounts
- [ ] Set up backup/recovery procedures
- [ ] Test thoroughly on testnet before mainnet

### Environment Variables for Production

```env
NEXT_PUBLIC_CARDANO_NETWORK=mainnet
NEXT_PUBLIC_BLOCKFROST_PROJECT_ID=mainnetYourProjectIdHere
NEXT_PUBLIC_API_BASE_URL=https://your-domain.com/api
DATABASE_URL=postgresql://user:pass@host:5432/litecert
```

## Additional Resources

- [MeshJS Documentation](https://meshjs.dev/)
- [Cardano Documentation](https://docs.cardano.org/)
- [Blockfrost Documentation](https://docs.blockfrost.io/)
- [Eternl Wallet Guide](https://eternl.io/app/docs)
- [Cardano Preview Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet/)

## Support

For issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Check server logs
4. Consult MeshJS/Blockfrost documentation
5. Open an issue in the repository
