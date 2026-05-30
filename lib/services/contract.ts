/**
 * On-chain certificate operations using the LiteCert Aiken contract.
 *
 * Flow:
 *  Issue   → lock 2 ADA UTxO at contract address with inline datum
 *  Revoke  → spend that UTxO (requires institution signature)
 *  Verify  → fetch UTxO from Blockfrost, decode datum, compare hash
 */

import { certificateRegistryScript, isContractDeployed } from '@/lib/contracts/registry';
import { getContractAddress, CONTRACT_MIN_LOVELACE, LITECERT_METADATA_LABEL } from '@/lib/contracts/config';
import { buildLiteCertMetadata } from '@/lib/contracts/metadata';
import type { CertificateData } from '@/lib/domain/certificates';

// Inlined to avoid circular dependency with cardano.ts
function getNetwork(): 'preview' | 'preprod' | 'mainnet' {
  const n = process.env.NEXT_PUBLIC_CARDANO_NETWORK || 'preview';
  if (n !== 'preview' && n !== 'preprod' && n !== 'mainnet') return 'preview';
  return n as 'preview' | 'preprod' | 'mainnet';
}

function networkId(): 0 | 1 {
  return getNetwork() === 'mainnet' ? 1 : 0;
}

function blockfrostBaseUrl(): string {
  const network = getNetwork();
  if (network === 'mainnet') return 'https://cardano-mainnet.blockfrost.io/api/v0';
  return `https://cardano-${network}.blockfrost.io/api/v0`;
}

function blockfrostHeaders() {
  return { project_id: process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID! };
}

// Build the Plutus inline datum for a certificate
async function buildCertificateDatum(
  institutionPkh: string,
  certificateHash: string,
  uniqueIdentifier: string
) {
  const { mConStr0, mConStr1 } = await import('@meshsdk/core');

  return mConStr0([
    institutionPkh,
    certificateHash,
    Buffer.from(uniqueIdentifier).toString('hex'),
    BigInt(Math.floor(Date.now() / 1000)),
    mConStr1([]), // is_revoked: Bool = False
  ]);
}

// Submit certificate to the on-chain registry contract
export async function issueOnChain(
  wallet: any,
  certificateHash: string,
  uniqueIdentifier: string,
  certificateData: CertificateData
): Promise<{ txHash: string; txIndex: number }> {
  if (!isContractDeployed()) {
    throw new Error(
      'Contract not deployed. Build the Aiken contract and set NEXT_PUBLIC_CONTRACT_COMPILED_CODE.'
    );
  }

  const { Transaction, resolvePaymentKeyHash } = await import('@meshsdk/core');

  const network = getNetwork();
  const contractAddress = getContractAddress(network);

  const usedAddresses: string[] = await wallet.getUsedAddresses();
  if (!usedAddresses.length) throw new Error('No wallet addresses found.');

  const institutionPkh = resolvePaymentKeyHash(usedAddresses[0]);
  const datum = await buildCertificateDatum(institutionPkh, certificateHash, uniqueIdentifier);

  const tx = new Transaction({ initiator: wallet })
    .sendLovelace(
      { address: contractAddress, datum: { value: datum, inline: true } },
      CONTRACT_MIN_LOVELACE
    )
    .setMetadata(
      LITECERT_METADATA_LABEL,
      buildLiteCertMetadata({
        certificateData,
        certificateHash,
        uniqueIdentifier,
      })
    );

  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);

  return { txHash, txIndex: 0 };
}

// Revoke a certificate on-chain by spending the contract UTxO
export async function revokeOnChain(
  wallet: any,
  txHash: string,
  txIndex: number
): Promise<string> {
  if (!isContractDeployed()) {
    throw new Error('Contract not deployed.');
  }

  const { Transaction, BlockfrostProvider, mConStr0, resolvePaymentKeyHash } = await import('@meshsdk/core');

  const blockfrostKey = process.env.NEXT_PUBLIC_BLOCKFROST_PROJECT_ID!;
  const provider = new BlockfrostProvider(blockfrostKey);

  const utxos = await provider.fetchUTxOs(txHash);
  const contractUtxo = utxos.find((u) => u.input.outputIndex === txIndex);

  if (!contractUtxo) {
    throw new Error(`UTxO not found at ${txHash}#${txIndex}. It may have already been spent.`);
  }

  const usedAddresses: string[] = await wallet.getUsedAddresses();
  const institutionPkh = resolvePaymentKeyHash(usedAddresses[0]);

  const redeemer = { data: mConStr0([]) };

  const tx = new Transaction({ initiator: wallet })
    .redeemValue({
      value: contractUtxo,
      script: certificateRegistryScript,
      datum: 'inline',
      redeemer,
    })
    .setRequiredSigners([institutionPkh]);

  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx, true);
  return await wallet.submitTx(signedTx);
}

// Verify a certificate by querying the contract UTxO via Blockfrost
export interface ContractVerificationResult {
  found: boolean;
  isRevoked: boolean;
  certificateHash: string | null;
  uniqueIdentifier: string | null;
  issuedAt: number | null;
}

export async function verifyOnChain(
  txHash: string,
  txIndex: number,
  _expectedCertHash: string
): Promise<ContractVerificationResult> {
  const empty: ContractVerificationResult = {
    found: false,
    isRevoked: false,
    certificateHash: null,
    uniqueIdentifier: null,
    issuedAt: null,
  };

  try {
    const res = await fetch(`${blockfrostBaseUrl()}/txs/${txHash}/utxos`, {
      headers: blockfrostHeaders(),
    });

    if (!res.ok) return empty;

    const data = await res.json();
    const output = data.outputs?.find((o: any) => o.output_index === txIndex);
    if (!output?.inline_datum) return empty;

    const { deserializeDatum } = await import('@meshsdk/core');
    const decoded = deserializeDatum(output.inline_datum);

    if (decoded?.alternative !== 0 || !decoded.fields) return empty;

    const [, certHashHex, uniqueIdHex, issuedAtInt, isRevokedConstr] = decoded.fields;

    // In Plutus Bool: False = Constr 0 [], True = Constr 1 []
    const revokedBool = isRevokedConstr?.alternative === 1;
    const uniqueIdentifier = Buffer.from(uniqueIdHex, 'hex').toString('utf8');

    return {
      found: true,
      isRevoked: revokedBool,
      certificateHash: certHashHex,
      uniqueIdentifier,
      issuedAt: Number(issuedAtInt),
    };
  } catch (error) {
    console.error('Contract verification error:', error);
    return empty;
  }
}

// Get the contract address for the current network
export function getRegistryAddress(): string {
  const network = getNetwork();
  return getContractAddress(network);
}
