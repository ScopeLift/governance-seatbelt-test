// Type definitions copied from governance-seatbelt repository
// https://github.com/uniswapfoundation/governance-seatbelt

export interface StructuredSimulationReport {
  title: string;
  proposalText: string;
  status: 'success' | 'warning' | 'error';
  summary: string;
  checks: SimulationCheck[];
  stateChanges: SimulationStateChange[];
  events: SimulationEvent[];
  metadata: {
    blockNumber: string;
    timestamp: string;
    proposalId: string;
    proposer: string;
  };
}

export interface SimulationCheck {
  title: string;
  status: 'passed' | 'warning' | 'error';
  details: string;
  info: string[];
}

export interface SimulationStateChange {
  contract: string;
  contractAddress: string;
  key: string;
  oldValue: string;
  newValue: string;
}

export interface SimulationEvent {
  address: string;
  topics: string[];
  data: string;
  decoded?: {
    name: string;
    signature: string;
    args: Record<string, any>;
  };
}

export interface SimulationCalldata {
  target: string;
  value: string;
  signature: string;
  calldata: string;
  decoded?: {
    name: string;
    inputs: Array<{
      name: string;
      type: string;
      value: any;
    }>;
  };
}

export interface FrontendData {
  proposalData: {
    id: string;
    targets: `0x${string}`[];
    values: bigint[] | string[];
    signatures: string[];
    calldatas: `0x${string}`[];
    description: string;
  };
  report: {
    status: 'success' | 'warning' | 'error';
    summary: string;
    markdownReport: string;
    structuredReport?: StructuredSimulationReport;
  };
}

export interface SimulationConfig {
  type: 'executed' | 'proposed' | 'new';
  proposalId?: string;
  daoName: string;
  governorAddress: string;
  blockNumber?: string;
}

export interface SimulationResult {
  config: SimulationConfig;
  report: StructuredSimulationReport;
  frontendData: FrontendData;
}

export interface TenderlySimulation {
  id: string;
  status: string;
  block_number: number;
  transaction_index: number;
  from: string;
  to: string;
  input: string;
  gas: number;
  gas_price: string;
  gas_used: number;
  value: string;
  method: string;
  decoded_input: any;
  call_trace: any[];
  logs: any[];
  balance_diff: any[];
  state_diff: any[];
}