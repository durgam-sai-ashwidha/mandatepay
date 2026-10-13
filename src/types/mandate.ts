/**
 * MandatePay Core Domain Types
 * Strict integer smallest-unit representations used for financial limits.
 */

export interface Mandate {
  mandateId: string;
  owner: string;
  authorizedAgent: string;
  recipientAddress: string;
  recipientLabel?: string;
  /** Maximum single payment in integer wei units (as string for serializability) */
  maxPaymentWei: string;
  /** Daily spending cap in integer wei units */
  dailyLimitWei: string;
  /** Cumulative amount spent today in integer wei units */
  spentTodayWei: string;
  purposeId: string;
  /** Expiration timestamp in epoch milliseconds */
  expiryTimestamp: number;
  isRevoked: boolean;
  createdAt: number;
}

export interface PaymentProposal {
  id: string;
  mandateId: string;
  recipientAddress: string;
  amountInMon: string;
  /** Exact integer smallest-unit wei */
  amountWei: string;
  purposeId: string;
  description: string;
  proposedByAgent: string;
  timestamp: number;
  parsedByAi: boolean;
}

export type PolicyCheckCode =
  | 'RECIPIENT_MATCH'
  | 'MAX_PAYMENT_LIMIT'
  | 'DAILY_VELOCITY_LIMIT'
  | 'PURPOSE_MATCH'
  | 'EXPIRY_VALID'
  | 'REVOCATION_STATUS';

export interface PolicyCheckDetail {
  code: PolicyCheckCode;
  title: string;
  passed: boolean;
  requiredValue: string;
  proposedValue: string;
  message: string;
  integerArithmeticTrace?: string;
}

export interface PolicyTrace {
  proposalId: string;
  mandateId: string;
  isCompliant: boolean;
  checks: PolicyCheckDetail[];
  computedAt: number;
}

export type ExecutionState =
  | 'idle'
  | 'checking'
  | 'submitting'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'reverted'
  | 'rejected'
  | 'error';

export interface TransactionRecord {
  id: string;
  mandateId: string;
  proposalId: string;
  recipient: string;
  recipientLabel?: string;
  amountMon: string;
  amountWei: string;
  purposeId: string;
  description: string;
  isSimulation: boolean;
  txHash?: string;
  status: 'CONFIRMED' | 'REVERTED' | 'REJECTED' | 'SIMULATED_SUCCESS' | 'SIMULATED_REJECTED';
  timestamp: number;
  blockNumber?: number;
  errorMessage?: string;
}

export interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isMonadTestnet: boolean;
  balanceMon: string | null;
  isConnecting: boolean;
  error: string | null;
}
