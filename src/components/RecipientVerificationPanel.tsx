import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Mandate, PolicyCheckDetail } from '../types/mandate';
import { evaluateMandatePolicy } from '../lib/policyEngine';
import { monToWei } from '../lib/monad';
import { DEMO_CONFIG } from '../config/contracts';

interface RecipientVerificationPanelProps {
  mandate: Mandate | null;
  contractAddress?: string;
}

export const RecipientVerificationPanel: React.FC<RecipientVerificationPanelProps> = ({
  mandate,
}) => {
  const [mandateIdInput, setMandateIdInput] = useState<string>(
    mandate ? mandate.mandateId : 'MAN-9482-MON'
  );
  const [recipientInput, setRecipientInput] = useState<string>(DEMO_CONFIG.recipientAddress);
  const [amountInput, setAmountInput] = useState<string>('0.02');
  const [purposeInput, setPurposeInput] = useState<string>(DEMO_CONFIG.purposeId);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<{
    tested: boolean;
    isAuthorized: boolean;
    checks: PolicyCheckDetail[];
    timestamp: number;
    notes: string;
  } | null>(null);

  const handleVerify = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const amountWei = monToWei(amountInput.trim());

    if (!mandate) {
      setVerificationResult({
        tested: true,
        isAuthorized: false,
        checks: [],
        timestamp: Date.now(),
        notes: 'SIMULATION — NOT ON-CHAIN: Mandate ID not found in registry state.',
      });
      setIsLoading(false);
      return;
    }

    if (mandate.mandateId.trim().toLowerCase() !== mandateIdInput.trim().toLowerCase()) {
      setVerificationResult({
        tested: true,
        isAuthorized: false,
        checks: [],
        timestamp: Date.now(),
        notes: `SIMULATION — NOT ON-CHAIN: Mandate ID "${mandateIdInput}" does not match active mandate in simulation.`,
      });
      setIsLoading(false);
      return;
    }

    const dummyProposal = {
      id: `query-${Date.now()}`,
      mandateId: mandate.mandateId,
      recipientAddress: recipientInput.trim(),
      amountInMon: amountInput.trim(),
      amountWei: amountWei.toString(),
      purposeId: purposeInput.trim().toUpperCase(),
      description: 'Independent recipient authorization verification check',
      proposedByAgent: mandate.authorizedAgent,
      timestamp: Date.now(),
      parsedByAi: false,
    };

    const trace = evaluateMandatePolicy(mandate, dummyProposal, Date.now());

    setVerificationResult({
      tested: true,
      isAuthorized: trace.isCompliant,
      checks: trace.checks,
      timestamp: Date.now(),
      notes: trace.isCompliant
        ? 'SIMULATION — NOT ON-CHAIN: Authority verified in mandate simulation. Policy checks passed.'
        : 'SIMULATION — NOT ON-CHAIN: Authorization refused in mandate simulation. One or more policy checks failed.',
    });
    setIsLoading(false);
  };

  const handleSetPreset = (recipient: string, amt: string, purp: string) => {
    setRecipientInput(recipient);
    setAmountInput(amt);
    setPurposeInput(purp);
    setVerificationResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-6 rounded border border-[#363A30] bg-[#191C17]">
        <div className="flex items-center space-x-2 text-xs font-mono text-[#D7FF64] mb-2 uppercase">
          <ShieldCheck className="w-4 h-4" />
          <span>Independent Vendor Verification</span>
        </div>
        <h3 className="font-heading font-bold text-xl sm:text-2xl text-[#F1F0E8] mb-2">
          Recipient Authorization Verifier
        </h3>
        <p className="font-body text-xs sm:text-sm text-[#A2A69A] max-w-3xl leading-relaxed">
          Recipients (e.g. <span className="text-[#F1F0E8] font-mono">LabelService</span> or external compute providers) do not trust the agent’s claim.
          Before releasing API keys, datasets, or compute, the recipient verifies mandate authorization parameters.
        </p>
      </div>

      {/* Verification Query Form */}
      <div className="rounded border border-[#363A30] bg-[#191C17] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#363A30] bg-[#141612] flex items-center justify-between">
          <span className="font-heading font-bold text-xs text-[#F1F0E8] uppercase tracking-wider">
            Query Mandate Authorization Endpoint
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-[#20231D] text-[#E5B85C] border border-[#E5B85C]/40">
            SIMULATION — NOT ON-CHAIN
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                Mandate Identifier
              </label>
              <input
                type="text"
                value={mandateIdInput}
                onChange={(e) => setMandateIdInput(e.target.value)}
                placeholder="e.g. MAN-9482-MON"
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                Recipient Hex Address (Caller)
              </label>
              <input
                type="text"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="0x..."
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                Claimed Amount (MON)
              </label>
              <input
                type="text"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0.02"
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                Purpose Category
              </label>
              <input
                type="text"
                value={purposeInput}
                onChange={(e) => setPurposeInput(e.target.value)}
                placeholder="DATA_LABELING"
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Presets for Recipient */}
          <div className="pt-1">
            <span className="text-[10px] font-mono uppercase text-[#A2A69A] block mb-1.5">
              Quick Query Scenarios:
            </span>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={() => handleSetPreset(DEMO_CONFIG.recipientAddress, '0.02', 'DATA_LABELING')}
                className="px-2.5 py-1 rounded bg-[#20231D] border border-[#D7FF64]/40 text-[#D7FF64] hover:bg-[#D7FF64]/10"
              >
                Legitimate Service Claim (0.02 MON)
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(DEMO_CONFIG.recipientAddress, '0.08', 'DATA_LABELING')}
                className="px-2.5 py-1 rounded bg-[#20231D] border border-[#363A30] text-[#A2A69A] hover:text-[#F1F0E8]"
              >
                Excessive Amount Claim (0.08 MON)
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset('0x000000000000000000000000000000000000dead', '0.02', 'DATA_LABELING')}
                className="px-2.5 py-1 rounded bg-[#20231D] border border-[#363A30] text-[#A2A69A] hover:text-[#F1F0E8]"
              >
                Impostor Recipient Address
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleVerify}
              disabled={isLoading}
              className="px-6 py-2.5 rounded bg-[#D7FF64] text-[#111310] font-mono font-bold text-xs hover:bg-[#c6f04e] transition-colors flex items-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating Simulation Parameters...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify Mandate Authority (Simulation)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Output */}
      {verificationResult && (
        <div className="rounded border border-[#363A30] bg-[#191C17] overflow-hidden">
          <div
            className={`px-5 py-4 border-b flex items-center justify-between ${
              verificationResult.isAuthorized
                ? 'bg-[#20231D] border-[#D7FF64]/40'
                : 'bg-[#20231D] border-[#FF6B57]/40'
            }`}
          >
            <div className="flex items-center space-x-3">
              {verificationResult.isAuthorized ? (
                <div className="w-7 h-7 rounded-full bg-[#D7FF64]/20 border border-[#D7FF64] flex items-center justify-center text-[#D7FF64]">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#FF6B57]/20 border border-[#FF6B57] flex items-center justify-center text-[#FF6B57]">
                  <XCircle className="w-4 h-4" />
                </div>
              )}
              <div>
                <span
                  className={`font-heading font-bold text-sm tracking-wide ${
                    verificationResult.isAuthorized ? 'text-[#D7FF64]' : 'text-[#FF6B57]'
                  }`}
                >
                  {verificationResult.isAuthorized
                    ? 'AUTHORIZATION VERIFIED: SAFE TO DELIVER SERVICE'
                    : 'AUTHORIZATION REFUSED: DO NOT FULFILL REQUEST'}
                </span>
                <p className="text-[11px] font-mono text-[#E5B85C] mt-0.5 font-medium">
                  SIMULATION — NOT ON-CHAIN • Evaluated at {new Date(verificationResult.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                verificationResult.isAuthorized
                  ? 'bg-[#D7FF64]/10 text-[#D7FF64] border border-[#D7FF64]/40'
                  : 'bg-[#FF6B57]/10 text-[#FF6B57] border border-[#FF6B57]/40'
              }`}
            >
              {verificationResult.isAuthorized ? 'SIMULATED PASS' : 'SIMULATED FAIL'}
            </span>
          </div>

          <div className="p-5 space-y-3">
            <p className="text-xs font-mono text-[#F1F0E8] bg-[#111310] p-3 rounded border border-[#363A30]">
              {verificationResult.notes}
            </p>

            {verificationResult.checks.length > 0 && (
              <div className="space-y-2 mt-4">
                <span className="text-[10px] font-mono uppercase text-[#A2A69A] block">
                  Detailed Verification Audit:
                </span>
                {verificationResult.checks.map((chk) => (
                  <div
                    key={chk.code}
                    className="p-2.5 rounded bg-[#20231D] border border-[#363A30] text-xs font-mono flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      {chk.passed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#D7FF64]" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-[#FF6B57]" />
                      )}
                      <span className="text-[#F1F0E8]">{chk.title}</span>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        chk.passed
                          ? 'bg-[#D7FF64]/10 text-[#D7FF64]'
                          : 'bg-[#FF6B57]/20 text-[#FF6B57]'
                      }`}
                    >
                      {chk.passed ? 'VERIFIED' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
