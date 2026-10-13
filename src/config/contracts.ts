/**
 * MandatePay — Monad Testnet & Smart Contract Configuration
 * 
 * All contract addresses, ABIs, and network settings are centralized here.
 * No contract addresses are hardcoded elsewhere in the application.
 */

export interface MonadNetworkConfig {
  chainId: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const MONAD_TESTNET_CONFIG: MonadNetworkConfig = {
  chainId: 10143,
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: ['https://testnet-rpc.monad.xyz'],
  blockExplorerUrls: ['https://testnet.monadexplorer.com'],
};

/**
 * Default MandateRegistry Contract configuration.
 * By default, this is left unconfigured ("") until the user or deployer sets it.
 * When unconfigured, the app operates in clearly labeled:
 * "CONTRACT NOT CONFIGURED — SIMULATION MODE (NOT ON-CHAIN)".
 */
export const CONTRACT_CONFIG = {
  // If you deploy the MandateRegistry contract to Monad Testnet, set its address here or in the UI configuration panel.
  defaultAddress: '',
  
  // Standard ABI for the MandateRegistry contract on Monad
  abi: [
    {
      type: 'function',
      name: 'createMandate',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'mandateId', type: 'bytes32' },
        { name: 'agentName', type: 'string' },
        { name: 'recipient', type: 'address' },
        { name: 'maxPayment', type: 'uint256' },
        { name: 'dailyLimit', type: 'uint256' },
        { name: 'purposeId', type: 'string' },
        { name: 'expiryTimestamp', type: 'uint256' },
      ],
      outputs: [],
    },
    {
      type: 'function',
      name: 'executePayment',
      stateMutability: 'payable',
      inputs: [
        { name: 'mandateId', type: 'bytes32' },
        { name: 'recipient', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'purposeId', type: 'string' },
      ],
      outputs: [{ name: 'success', type: 'bool' }],
    },
    {
      type: 'function',
      name: 'revokeMandate',
      stateMutability: 'nonpayable',
      inputs: [{ name: 'mandateId', type: 'bytes32' }],
      outputs: [],
    },
    {
      type: 'function',
      name: 'getMandate',
      stateMutability: 'view',
      inputs: [{ name: 'mandateId', type: 'bytes32' }],
      outputs: [
        {
          name: 'mandate',
          type: 'tuple',
          components: [
            { name: 'owner', type: 'address' },
            { name: 'agentName', type: 'string' },
            { name: 'recipient', type: 'address' },
            { name: 'maxPayment', type: 'uint256' },
            { name: 'dailyLimit', type: 'uint256' },
            { name: 'purposeId', type: 'string' },
            { name: 'expiryTimestamp', type: 'uint256' },
            { name: 'isRevoked', type: 'bool' },
            { name: 'spentToday', type: 'uint256' },
            { name: 'lastResetTimestamp', type: 'uint256' },
          ],
        },
      ],
    },
    {
      type: 'function',
      name: 'verifyMandateAuthorization',
      stateMutability: 'view',
      inputs: [
        { name: 'mandateId', type: 'bytes32' },
        { name: 'recipient', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'purposeId', type: 'string' },
      ],
      outputs: [{ name: 'isValid', type: 'bool' }],
    },
    {
      type: 'event',
      name: 'MandateCreated',
      inputs: [
        { name: 'mandateId', type: 'bytes32', indexed: true },
        { name: 'owner', type: 'address', indexed: true },
        { name: 'recipient', type: 'address', indexed: false },
        { name: 'maxPayment', type: 'uint256', indexed: false },
      ],
    },
    {
      type: 'event',
      name: 'PaymentExecuted',
      inputs: [
        { name: 'mandateId', type: 'bytes32', indexed: true },
        { name: 'recipient', type: 'address', indexed: true },
        { name: 'amount', type: 'uint256', indexed: false },
        { name: 'purposeId', type: 'string', indexed: false },
      ],
    },
    {
      type: 'event',
      name: 'MandateRevoked',
      inputs: [
        { name: 'mandateId', type: 'bytes32', indexed: true },
        { name: 'owner', type: 'address', indexed: true },
      ],
    },
  ] as const,
};

/**
 * Standard known aliases for the Monad Hackathon demo
 */
export const DEMO_CONFIG = {
  agentName: 'ResearchBot',
  recipientLabel: 'LabelService',
  recipientAddress: '0x71C83669F3F629474fe5e542D157a972c6e6A795',
  purposeId: 'DATA_LABELING',
  maxPaymentMon: '0.03',
  dailyLimitMon: '0.05',
  expiryMinutes: 10,
};

export const KNOWN_RECIPIENTS: Record<string, string> = {
  LabelService: '0x71C83669F3F629474fe5e542D157a972c6e6A795',
  DataVendorAlpha: '0x88b85777F9fa7eDa65A206Fe7D4C7F60c7A064B9',
  ComputeHostPrime: '0x3D7E8bDbB4aEFEcfFE6943C8861E2d3c90772719',
};

export const KNOWN_PURPOSES = [
  'DATA_LABELING',
  'RPC_COMPUTE',
  'INFERENCE_CREDITS',
  'STORAGE_DEPOSIT',
  'TRAINING_CORPUS_ACCESS',
  'GRAPH_INDEXING',
];
