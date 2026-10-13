import React, { useState } from 'react';
import {
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import {
  Mandate,
  PaymentProposal,
  PolicyTrace,
  WalletState,
  ExecutionState,
  TransactionRecord,
} from '../types/mandate';
import { shortenAddress } from '../lib/monad';

interface ExecutionSectionProps {
  mandate: Mandate | null;
  proposal: PaymentProposal | null;
  policyTrace: PolicyTrace | null;
  wallet: WalletState;
  contractAddress: string;
  onConnectWallet: () => void;
  onSwitchNetwork: () => void;
  onPaymentExecuted: (record: TransactionRecord, addedSpentWei: bigint) => void;
}

export const ExecutionSection: React.FC<ExecutionSectionProps> = ({
  mandate,
  proposal,
  policyTrace,
  onPaymentExecuted,
}) => {
  const [execState, setExecState] = useState<ExecutionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCompliant = Boolean(policyTrace?.isCompliant);

  const handleExecute = async () => {
    if (!mandate || !proposal || !policyTrace) return;

    if (!isCompliant) {
      setErrorMessage('Execution blocked: Payment proposal failed deterministic policy simulation checks.');
      return;
    }

    setErrorMessage(null);

    try {
      setExecState('submitting');
      // Realistic UI transition for simulated execution
      await new Promise((resolve) => setTimeout(resolve, 500));

      const record: TransactionRecord = {
        id: `sim-${Date.now()}`,
        mandateId: mandate.mandateId,
        proposalId: proposal.id,
        recipient: proposal.recipientAddress,
        recipientLabel: mandate.recipientLabel,
        amountMon: proposal.amountInMon,
        amountWei: proposal.amountWei,
        purposeId: proposal.purposeId,
        description: proposal.description,
        isSimulation: true,
        status: 'SIMULATED_SUCCESS',
        timestamp: Date.now(),
      };

      setExecState('confirmed');
      onPaymentExecuted(record, BigInt(proposal.amountWei));
    } catch (err: any) {
      setExecState('error');
      setErrorMessage(err.message || 'Simulation execution failed.');
    }
  };

  if (!proposal) {
    return null;
  }

  const failedCheck = policyTrace?.checks.find((c) => !c.passed);
  let primaryRejectionReason = 'Policy violation';
  if (failedCheck?.code === 'RECIPIENT_MATCH') {
    primaryRejectionReason = 'Recipient not authorized.';
  } else if (failedCheck?.code === 'MAX_PAYMENT_LIMIT') {
    primaryRejectionReason = 'Exceeds per-payment limit.';
  } else if (failedCheck?.code === 'EXPIRY_VALID') {
    primaryRejectionReason = 'Mandate expired.';
  } else if (failedCheck?.code === 'DAILY_VELOCITY_LIMIT') {
    primaryRejectionReason = 'Exceeds daily spending limit.';
  } else if (failedCheck?.code === 'REVOCATION_STATUS') {
    primaryRejectionReason = 'Mandate revoked by owner.';
  } else if (failedCheck) {
    primaryRejectionReason = failedCheck.message;
  }

  return (
    <div className="rounded border border-[#363A30] bg-[#191C17] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#363A30] bg-[#141612] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-[#D7FF64]" />
          <h4 className="font-heading font-bold text-sm text-[#F1F0E8]">
            Payment Settlement Simulator
          </h4>
        </div>

        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#20231D] text-[#E5B85C] border border-[#E5B85C]/40">
          SIMULATION — NOT ON-CHAIN
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Simulation Disclaimer Banner */}
        <div className="p-3.5 rounded border border-[#E5B85C]/40 bg-[#E5B85C]/10 text-xs font-mono text-[#E5B85C] flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold uppercase tracking-wider">
              SIMULATION ONLY — NO MONAD CONTRACT IS DEPLOYED IN THIS DEMO
            </div>
            <p className="text-[11px] text-[#A2A69A] mt-1 leading-relaxed">
              All policy checks, limits, and velocity calculations are evaluated in memory.
              No live transactions are broadcast, and no fake transaction hashes are fabricated.
            </p>
          </div>
        </div>

        {/* Execution Summary Box */}
        <div className="p-4 rounded border border-[#363A30] bg-[#20231D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div>
            <span className="text-[#A2A69A] text-[10px] uppercase block">
              Policy Decision Status
            </span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              {isCompliant ? (
                <>
                  <CheckCircle className="w-4 h-4 text-[#D7FF64]" />
                  <span className="text-[#D7FF64] font-bold">
                    APPROVED (SIMULATION — NOT ON-CHAIN)
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-[#FF6B57]" />
                  <span className="text-[#FF6B57] font-bold">
                    REJECTED: “{primaryRejectionReason}” (SIMULATION — NOT ON-CHAIN)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-[#A2A69A] text-[10px] uppercase block">
              Proposed Disbursement
            </span>
            <span className="text-base font-heading font-bold text-[#F1F0E8]">
              {proposal.amountInMon} MON
            </span>
            <span className="text-[10px] text-[#A2A69A] block font-mono">
              To: {shortenAddress(proposal.recipientAddress)}
            </span>
          </div>
        </div>

        {/* Confirmed Feedback */}
        {execState === 'confirmed' && (
          <div className="p-3.5 rounded border border-[#D7FF64]/40 bg-[#D7FF64]/10 text-xs font-mono text-[#D7FF64] space-y-1">
            <div className="flex items-center space-x-2 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>SIMULATED PAYMENT RECORDED (NOT ON-CHAIN)</span>
            </div>
            <p className="text-[11px] text-[#A2A69A]">
              Mandate velocity updated by +{proposal.amountInMon} MON. Entry logged to the simulation audit ledger. No on-chain transaction hash generated.
            </p>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3.5 rounded border border-[#FF6B57]/50 bg-[#FF6B57]/10 text-xs font-mono text-[#FF6B57] space-y-1">
            <div className="flex items-center space-x-2 font-bold">
              <XCircle className="w-4 h-4" />
              <span>EXECUTION BLOCKED</span>
            </div>
            <p className="text-[11px] text-[#A2A69A] leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleExecute}
            disabled={!isCompliant || execState === 'submitting'}
            className={`w-full py-3 rounded font-mono font-bold text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer ${
              !isCompliant
                ? 'bg-[#20231D] text-[#A2A69A] border border-[#363A30] cursor-not-allowed opacity-60'
                : execState === 'submitting'
                ? 'bg-[#E5B85C] text-[#111310]'
                : 'bg-[#D7FF64] text-[#111310] hover:bg-[#c6f04e]'
            }`}
          >
            {execState === 'submitting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Simulating Settlement Accounting...</span>
              </>
            ) : !isCompliant ? (
              <span>Execution Blocked: “{primaryRejectionReason}” (SIMULATION — NOT ON-CHAIN)</span>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Execute Simulated Payment ({proposal.amountInMon} MON)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
