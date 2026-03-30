// Type stub for @midnight-ntwrk/sdk — not yet published.
// Remove this file once the real SDK is installed.
declare module '@midnight-ntwrk/sdk' {
  export class MidnightProvider {
    constructor(options: { network: string; nodeUrl: string; proofServerUrl: string });
  }
  export class ContractClient {
    constructor(options: { provider: MidnightProvider; address: string });
    call(method: string, args: Record<string, unknown>): Promise<{ hash: string; submit(): Promise<void> }>;
    prove(circuit: string, args: Record<string, unknown>): Promise<{ proof: string; publicInputs: string[] }>;
    verify(circuit: string, args: { proof: string; publicInputs: string[] }): Promise<boolean>;
  }
}
