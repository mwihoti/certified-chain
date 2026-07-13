/**
 * Deploy the Midnight certificate proof contract.
 *
 * Prerequisites:
 *   1. Install the Midnight toolchain: https://docs.midnight.network/getting-started
 *   2. Build the contract: bun run build:midnight
 *   3. Set MIDNIGHT_DEPLOYER_MNEMONIC in .env.local
 *
 * After deployment, copy the printed contract address into
 * NEXT_PUBLIC_MIDNIGHT_CONTRACT_ADDRESS in .env.local.
 */

import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { deployContract, type ContractProviders } from '@midnight-ntwrk/midnight-js-contracts';
import type {
  WalletProvider,
  MidnightProvider as MidnightTxProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type {
  CoinPublicKey,
  EncPublicKey,
  FinalizedTransaction,
  TransactionId,
  ContractAddress,
} from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { Contract } from '../contracts/midnight-certs/dist/contract/index.js';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

async function main() {
  const network = process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK || 'devnet';
  const nodeUrl = process.env.NEXT_PUBLIC_MIDNIGHT_NODE_URL || 'http://localhost:9944';
  const proofServerUrl = process.env.NEXT_PUBLIC_MIDNIGHT_PROOF_SERVER_URL || 'http://localhost:6300';
  const mnemonic = process.env.MIDNIGHT_DEPLOYER_MNEMONIC;

  if (!mnemonic) {
    console.error('MIDNIGHT_DEPLOYER_MNEMONIC is not set. Add it to .env.local.');
    process.exit(1);
  }

  console.log(`Deploying to Midnight ${network}...`);
  console.log(`Node: ${nodeUrl}`);
  console.log(`Proof server: ${proofServerUrl}`);

  try {
    // Set the global network ID
    setNetworkId(network);

    // Create the contract instance with witnesses
    const contract = new Contract({
      certificateWitness: (context: any) => {
        return [context.privateState, {
          recipient_name: new Uint8Array(64),
          credential_type: new Uint8Array(64),
          issue_date: new Uint8Array(64),
          institution_id: new Uint8Array(64),
        }];
      },
    });

    // Derive keys from mnemonic
    const seed = crypto.pbkdf2Sync(mnemonic, 'mnemonic', 2048, 64, 'sha512');
    const coinPublicKey = crypto.createHash('sha256').update(seed).update('coin').digest('hex') as CoinPublicKey;
    const encryptionPublicKey = crypto.createHash('sha256').update(seed).update('encryption').digest('hex') as EncPublicKey;

    // Create providers
    const zkArtifactsPath = path.join(process.cwd(), 'contracts/midnight-certs/dist/keys');
    const zkConfigProvider = new NodeZkConfigProvider(zkArtifactsPath);
    const proofProvider = httpClientProofProvider(proofServerUrl, zkConfigProvider);
    const indexerQueryUrl = `${nodeUrl}/graphql`;
    const indexerSubscriptionUrl = `${nodeUrl}/graphql`;
    const publicDataProvider = indexerPublicDataProvider(indexerQueryUrl, indexerSubscriptionUrl);
    const privateStateProvider = levelPrivateStateProvider({
      privateStoragePasswordProvider: async () => 'deployer-password-16ch!',
      accountId: 'deployer',
    });

    const walletProvider: WalletProvider = {
      getCoinPublicKey: () => coinPublicKey,
      getEncryptionPublicKey: () => encryptionPublicKey,
      balanceTx: async (tx: any): Promise<FinalizedTransaction> => {
        return tx as unknown as FinalizedTransaction;
      },
    };

    const midnightProvider: MidnightTxProvider = {
      submitTx: async (tx: FinalizedTransaction): Promise<TransactionId> => {
        const txHex = Buffer.from(tx as any).toString('hex');
        const response = await fetch(`${nodeUrl}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction: txHex }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Transaction submission failed: ${error}`);
        }

        const result = await response.json();
        return result.txId || result.transactionId || crypto.randomUUID();
      },
    };

    const providers: ContractProviders = {
      zkConfigProvider,
      proofProvider,
      publicDataProvider,
      privateStateProvider,
      walletProvider,
      midnightProvider,
    };

    // Deploy the contract
    console.log('\nDeploying contract...');
    const deployed = await deployContract(providers as any, {
      compiledContract: contract as any,
    } as any);

    const contractAddress = deployed.deployTxData.public.contractAddress;

    console.log('\n✅ Contract deployed successfully!');
    console.log(`\nContract address: ${contractAddress}`);
    console.log('\nAdd this to .env.local:');
    console.log(`NEXT_PUBLIC_MIDNIGHT_CONTRACT_ADDRESS=${contractAddress}`);
  } catch (error) {
    console.error('\n❌ Deployment failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
