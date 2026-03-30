/**
 * Contract Deployment Helper
 *
 * Run AFTER building the Aiken contract:
 *   cd contracts/litecert-registry && aiken build
 *
 * Then set the compiled code in .env.local:
 *   NEXT_PUBLIC_CONTRACT_COMPILED_CODE=<hex from plutus.json>
 *
 * Finally run this script to get the contract addresses:
 *   pnpm tsx scripts/deploy-contract.ts
 */

import { resolvePlutusScriptAddress } from '@meshsdk/core';
import type { PlutusScript } from '@meshsdk/core';

const compiledCode = process.env.NEXT_PUBLIC_CONTRACT_COMPILED_CODE;

if (!compiledCode) {
  console.error(
    'Error: NEXT_PUBLIC_CONTRACT_COMPILED_CODE is not set.\n' +
    'Build the contract first:\n' +
    '  cd contracts/litecert-registry\n' +
    '  aiken build\n' +
    '  cat plutus.json | jq -r ".validators[0].compiledCode"\n' +
    'Then add it to .env.local'
  );
  process.exit(1);
}

const script: PlutusScript = {
  code: compiledCode,
  version: 'V3',
};

const networks = [
  { name: 'preview',  id: 0 as 0 | 1 },
  { name: 'preprod',  id: 0 as 0 | 1 },
  { name: 'mainnet',  id: 1 as 0 | 1 },
];

console.log('\nLiteCert Registry Contract Addresses\n' + '='.repeat(45));

for (const network of networks) {
  const address = resolvePlutusScriptAddress(script, network.id);
  const envKey = `NEXT_PUBLIC_CONTRACT_ADDRESS_${network.name.toUpperCase()}`;
  console.log(`\n${network.name.padEnd(10)} ${address}`);
  console.log(`  Add to .env.local: ${envKey}=${address}`);
}

console.log('\nDone. Add the addresses above to your .env.local file.\n');
