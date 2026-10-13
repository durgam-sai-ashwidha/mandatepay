import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldX,
  Clock,
  Coins,
  Copy,
  Check,
  RotateCcw,
  AlertTriangle,
  ArrowUpRight,
  UserCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { Mandate } from '../types/mandate';
import { weiToMon, shortenAddress } from '../lib/monad';

interface ActiveMandateCardProps {
  mandate: Mandate | null;
  onRevokeMandate: (mandateId: string) => void;
  onResetDemo: () => void;
  onCreateNewClick: () => void;
}

export const ActiveMandateCard: React.FC<ActiveMandateCardProps> = ({
  mandate,
  onRevokeMandate,
  onResetDemo,
  onCreateNewClick,
}) => {
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(Date.now());
  const [showRevokeConfirm, setShowRevokeConfirm] = useState<boolean>(false);
  const [showWeiDetails, setShowWeiDetails] = useState<boolean>(false);

  // Live timer tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!mandate) {
    return (
      <div className="p-8 rounded border border-[#363A30] bg-[#191C17] text-center">
        <Activity className="w-8 h-8 text-[#A2A69A] mx-auto mb-3" />
        <h4 className="font-heading font-bold text-base text-[#F1F0E8] mb-1">
          No Active Mandate Found
        </h4>
        <p className="font-body text-xs text-[#A2A69A] mb-5 max-w-sm mx-auto">
          Create a mandate to grant scoped payment authority to an AI agent, or load the hackathon demo.
        </p>
        <div className="flex items-center justify-center space-x-3">
          <button
            onClick={onResetDemo}
            className="px-4 py-2 rounded bg-[#D7FF64] text-[#111310] font-mono font-semibold text-xs hover:bg-[#c6f04e] transition-colors"
          >
            Load ResearchBot Demo
          </button>
          <button
            onClick={onCreateNewClick}
            className="px-4 py-2 rounded bg-[#20231D] border border-[#363A30] text-[#F1F0E8] font-mono text-xs hover:bg-[#252a22] transition-colors"
          >
            Create Custom Mandate
          </button>
        </div>
      </div>
    );
  }

  const isExpired = currentTimeMs >= mandate.expiryTimestamp;
  const isRevoked = mandate.isRevoked;
  const isActive = !isExpired && !isRevoked;

  // Exact BigInt integer calculations for daily velocity
  const dailyLimitWei = BigInt(mandate.dailyLimitWei || '0');
  const spentTodayWei = BigInt(mandate.spentTodayWei || '0');
  const remainingWei = dailyLimitWei > spentTodayWei ? dailyLimitWei - spentTodayWei : 0n;
  const maxPaymentWei = BigInt(mandate.maxPaymentWei || '0');

  // Percentage for the velocity bar
  const percentSpent = dailyLimitWei > 0n
    ? Math.min(100, Math.round(Number((spentTodayWei * 10000n) / dailyLimitWei) / 100))
    : 0;

  // Countdown calculation
  const remainingMs = Math.max(0, mandate.expiryTimestamp - currentTimeMs);
  const remainingSeconds = Math.floor(remainingMs / 1000);
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;

  const handleCopyId = () => {
    navigator.clipboard.writeText(mandate.mandateId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="rounded border border-[#363A30] bg-[#191C17] overflow-hidden">
      {/* Top Card Header */}
      <div className="px-5 py-4 border-b border-[#363A30] bg-[#141612] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isActive
                ? 'bg-[#D7FF64] shadow-[0_0_8px_#D7FF64]'
                : isRevoked
                ? 'bg-[#FF6B57]'
                : 'bg-[#E5B85C]'
            }`}
          />
          <span className="font-heading font-bold text-sm text-[#F1F0E8]">
            ACTIVE MANDATE
          </span>
          <span className="font-mono text-xs text-[#A2A69A]">
            [{mandate.mandateId}]
          </span>
          <button
            onClick={handleCopyId}
            title="Copy Mandate ID"
            className="text-[#A2A69A] hover:text-[#F1F0E8] transition-colors p-1"
          >
            {copiedId ? (
              <Check className="w-3.5 h-3.5 text-[#D7FF64]" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          <span
            className={`px-2.5 py-0.5 rounded text-[11px] font-mono uppercase font-semibold border ${
              isActive
                ? 'bg-[#D7FF64]/10 border-[#D7FF64]/40 text-[#D7FF64]'
                : isRevoked
                ? 'bg-[#FF6B57]/10 border-[#FF6B57]/40 text-[#FF6B57]'
                : 'bg-[#E5B85C]/10 border-[#E5B85C]/40 text-[#E5B85C]'
            }`}
          >
            {isRevoked
              ? 'REVOKED (SIMULATION — NOT ON-CHAIN)'
              : isExpired
              ? 'EXPIRED (SIMULATION — NOT ON-CHAIN)'
              : 'ACTIVE (SIMULATION — NOT ON-CHAIN)'}
          </span>

          <button
            onClick={() => setShowWeiDetails(!showWeiDetails)}
            className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#363A30] bg-[#20231D] text-[#A2A69A] hover:text-[#F1F0E8]"
          >
            {showWeiDetails ? 'Hide Wei' : 'Inspect Wei'}
          </button>
        </div>
      </div>

      {/* Card Content Grid */}
      <div className="p-5 space-y-5">
        {/* Mandate Principal & Recipient Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Authorized Agent */}
          <div className="p-3.5 rounded border border-[#363A30] bg-[#20231D]">
            <div className="text-[10px] font-mono uppercase text-[#A2A69A] mb-1 flex items-center justify-between">
              <span>Authorized Agent</span>
              <span className="text-[#D7FF64]">Autonomous Proposer</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-heading font-bold text-sm text-[#F1F0E8]">
                {mandate.authorizedAgent}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#111310] text-[#A2A69A] border border-[#363A30]">
                UNPRIVILEGED
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#A2A69A] mt-1 truncate">
              Owner: {shortenAddress(mandate.owner)}
            </div>
          </div>

          {/* Approved Recipient */}
          <div className="p-3.5 rounded border border-[#363A30] bg-[#20231D]">
            <div className="text-[10px] font-mono uppercase text-[#A2A69A] mb-1 flex items-center justify-between">
              <span>Approved Recipient</span>
              <span className="text-[#D7FF64]">Whitelisted Target</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-heading font-bold text-sm text-[#F1F0E8]">
                {mandate.recipientLabel || 'External Service'}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#A2A69A] mt-1 truncate" title={mandate.recipientAddress}>
              {mandate.recipientAddress}
            </div>
          </div>
        </div>

        {/* Purpose & Window */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded border border-[#363A30] bg-[#141612]">
            <span className="text-[#A2A69A] text-[10px] uppercase block mb-1">
              Authorized Purpose
            </span>
            <div className="inline-block px-2 py-0.5 rounded bg-[#20231D] text-[#D7FF64] border border-[#363A30] font-bold">
              {mandate.purposeId}
            </div>
          </div>

          <div className="p-3 rounded border border-[#363A30] bg-[#141612]">
            <div className="flex items-center justify-between text-[#A2A69A] text-[10px] uppercase mb-1">
              <span>Mandate Expiry Window</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-[#A2A69A]" />
                <span>{isExpired ? 'EXPIRED' : `${mins}m ${secs}s left`}</span>
              </span>
            </div>
            <div className="text-[#F1F0E8] font-mono text-xs">
              {new Date(mandate.expiryTimestamp).toLocaleTimeString()} ({isExpired ? 'Window Closed' : 'Active'})
            </div>
          </div>
        </div>

        {/* Daily Spending Velocity & Single Limit */}
        <div className="p-4 rounded border border-[#363A30] bg-[#20231D] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono uppercase text-[#A2A69A]">
                Single Transaction Ceiling
              </div>
              <div className="font-heading font-bold text-lg text-[#F1F0E8]">
                {weiToMon(maxPaymentWei)} MON
              </div>
            </div>

            <div className="sm:text-right">
              <div className="text-[10px] font-mono uppercase text-[#A2A69A]">
                Daily Spending Cap (24h Velocity)
              </div>
              <div className="font-mono text-xs text-[#F1F0E8]">
                <span className="font-bold text-[#D7FF64]">{weiToMon(spentTodayWei)} MON</span>
                <span className="text-[#A2A69A]"> / {weiToMon(dailyLimitWei)} MON</span>
              </div>
            </div>
          </div>

          {/* Velocity Progress Bar */}
          <div>
            <div className="w-full bg-[#111310] h-2 rounded-full overflow-hidden border border-[#363A30]">
              <div
                className={`h-full transition-all duration-300 ${
                  percentSpent >= 100
                    ? 'bg-[#FF6B57]'
                    : percentSpent >= 70
                    ? 'bg-[#E5B85C]'
                    : 'bg-[#D7FF64]'
                }`}
                style={{ width: `${percentSpent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-[#A2A69A] mt-1.5">
              <span>{percentSpent}% consumed today</span>
              <span>Remaining allowance: {weiToMon(remainingWei)} MON</span>
            </div>
          </div>
        </div>

        {/* Raw Wei Inspector (Visible if toggled) */}
        {showWeiDetails && (
          <div className="p-3 rounded bg-[#111310] border border-[#363A30] text-[11px] font-mono space-y-1.5 text-[#A2A69A]">
            <div className="text-[#D7FF64] font-bold uppercase text-[10px]">
              Integer Smallest-Unit Representation (Wei)
            </div>
            <div className="flex justify-between">
              <span>maxPaymentWei:</span>
              <span className="text-[#F1F0E8]">{mandate.maxPaymentWei} wei</span>
            </div>
            <div className="flex justify-between">
              <span>dailyLimitWei:</span>
              <span className="text-[#F1F0E8]">{mandate.dailyLimitWei} wei</span>
            </div>
            <div className="flex justify-between">
              <span>spentTodayWei:</span>
              <span className="text-[#F1F0E8]">{mandate.spentTodayWei} wei</span>
            </div>
            <div className="flex justify-between">
              <span>remainingWei:</span>
              <span className="text-[#F1F0E8]">{remainingWei.toString()} wei</span>
            </div>
          </div>
        )}

        {/* Actions & Revoke Button */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#363A30]">
          <div className="flex items-center space-x-2">
            <button
              onClick={onResetDemo}
              className="px-3 py-1.5 rounded bg-[#141612] border border-[#363A30] text-[#A2A69A] hover:text-[#F1F0E8] text-xs font-mono flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Hackathon Preset</span>
            </button>
            <button
              onClick={onCreateNewClick}
              className="px-3 py-1.5 rounded bg-[#141612] border border-[#363A30] text-[#A2A69A] hover:text-[#F1F0E8] text-xs font-mono"
            >
              + New Mandate
            </button>
          </div>

          {/* Revoke Button with Confirmation */}
          {!isRevoked ? (
            showRevokeConfirm ? (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-[#FF6B57]">Confirm revoke?</span>
                <button
                  onClick={() => {
                    onRevokeMandate(mandate.mandateId);
                    setShowRevokeConfirm(false);
                  }}
                  className="px-3 py-1 rounded bg-[#FF6B57] text-[#111310] font-mono font-bold text-xs hover:bg-[#e85b48]"
                >
                  Yes, Revoke
                </button>
                <button
                  onClick={() => setShowRevokeConfirm(false)}
                  className="px-2.5 py-1 rounded border border-[#363A30] text-[#A2A69A] text-xs font-mono hover:text-[#F1F0E8]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRevokeConfirm(true)}
                className="px-3 py-1.5 rounded border border-[#FF6B57]/50 text-[#FF6B57] hover:bg-[#FF6B57]/10 text-xs font-mono font-medium flex items-center space-x-1.5"
              >
                <ShieldX className="w-3.5 h-3.5" />
                <span>Revoke Mandate</span>
              </button>
            )
          ) : (
            <div className="text-xs font-mono text-[#FF6B57] font-semibold flex items-center space-x-1">
              <ShieldX className="w-3.5 h-3.5" />
              <span>Permanently Revoked by Owner</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
