import React, { useState } from 'react';
import {
  X,
  ShieldPlus,
  Zap,
  Clock,
  Binary,
  AlertTriangle,
} from 'lucide-react';
import { Mandate, WalletState } from '../types/mandate';
import { DEMO_CONFIG } from '../config/contracts';
import { monToWei } from '../lib/monad';

interface CreateMandateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMandate: (mandate: Mandate) => void;
  wallet: WalletState;
  contractAddress?: string;
  onConnectWallet?: () => void;
  onSwitchNetwork?: () => void;
}

export const CreateMandateModal: React.FC<CreateMandateModalProps> = ({
  isOpen,
  onClose,
  onCreateMandate,
  wallet,
}) => {
  const [agentName, setAgentName] = useState<string>(DEMO_CONFIG.agentName);
  const [recipientLabel, setRecipientLabel] = useState<string>(DEMO_CONFIG.recipientLabel);
  const [recipientAddress, setRecipientAddress] = useState<string>(DEMO_CONFIG.recipientAddress);
  const [maxPaymentMon, setMaxPaymentMon] = useState<string>(DEMO_CONFIG.maxPaymentMon);
  const [dailyLimitMon, setDailyLimitMon] = useState<string>(DEMO_CONFIG.dailyLimitMon);
  const [purposeId, setPurposeId] = useState<string>(DEMO_CONFIG.purposeId);
  const [expiryMinutes, setExpiryMinutes] = useState<number>(DEMO_CONFIG.expiryMinutes);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoadDemo = () => {
    setAgentName(DEMO_CONFIG.agentName);
    setRecipientLabel(DEMO_CONFIG.recipientLabel);
    setRecipientAddress(DEMO_CONFIG.recipientAddress);
    setMaxPaymentMon(DEMO_CONFIG.maxPaymentMon);
    setDailyLimitMon(DEMO_CONFIG.dailyLimitMon);
    setPurposeId(DEMO_CONFIG.purposeId);
    setExpiryMinutes(DEMO_CONFIG.expiryMinutes);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const maxWei = monToWei(maxPaymentMon);
    const dailyWei = monToWei(dailyLimitMon);

    if (maxWei <= 0n) {
      setErrorMsg('Max payment limit must be greater than zero.');
      return;
    }
    if (dailyWei < maxWei) {
      setErrorMsg('Daily spending limit cannot be less than single transaction max payment.');
      return;
    }

    const now = Date.now();
    const expiryTimestampMs = now + expiryMinutes * 60 * 1000;
    const mandateId = `MAN-${Math.floor(1000 + Math.random() * 9000)}-MON`;

    const newMandate: Mandate = {
      mandateId,
      owner: wallet.address || '0x5A4F0aD6F2C3B7E9e42A11370b4E5679A81D2305',
      authorizedAgent: agentName.trim(),
      recipientAddress: recipientAddress.trim(),
      recipientLabel: recipientLabel.trim(),
      maxPaymentWei: maxWei.toString(),
      dailyLimitWei: dailyWei.toString(),
      spentTodayWei: '0',
      purposeId: purposeId.trim().toUpperCase(),
      expiryTimestamp: expiryTimestampMs,
      isRevoked: false,
      createdAt: now,
    };

    onCreateMandate(newMandate);
    onClose();
  };

  const previewMaxWei = monToWei(maxPaymentMon);
  const previewDailyWei = monToWei(dailyLimitMon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-[#191C17] border border-[#363A30] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#363A30] flex items-center justify-between bg-[#141612]">
          <div className="flex items-center space-x-2">
            <ShieldPlus className="w-4 h-4 text-[#D7FF64]" />
            <h3 className="font-heading font-bold text-base text-[#F1F0E8]">
              Create Payment Mandate (Simulation)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#A2A69A] hover:text-[#F1F0E8] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Status banner */}
          <div className="p-3 rounded border text-xs font-mono flex items-start space-x-2.5 bg-[#20231D] border-[#E5B85C]/40 text-[#E5B85C]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider">
                SIMULATION — NOT ON-CHAIN
              </div>
              <p className="text-[11px] text-[#A2A69A] mt-0.5">
                Mandate will be registered in deterministic session simulation. No on-chain contract is deployed or broadcast in this demo.
              </p>
            </div>
          </div>

          {/* Quick preset trigger */}
          <div className="flex items-center justify-between pb-2 border-b border-[#363A30]">
            <span className="text-xs font-mono text-[#A2A69A]">
              Demo Defaults:
            </span>
            <button
              type="button"
              onClick={handleLoadDemo}
              className="text-xs font-mono text-[#D7FF64] hover:underline flex items-center space-x-1"
            >
              <Zap className="w-3 h-3" />
              <span>Fill ResearchBot / LabelService</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                Authorized Agent Name
              </label>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                Purpose ID
              </label>
              <input
                type="text"
                value={purposeId}
                onChange={(e) => setPurposeId(e.target.value)}
                placeholder="DATA_LABELING"
                required
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                Approved Recipient Label
              </label>
              <input
                type="text"
                value={recipientLabel}
                onChange={(e) => setRecipientLabel(e.target.value)}
                placeholder="e.g. LabelService"
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                Approved Recipient Address (EVM hex)
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                required
                placeholder="0x..."
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                Max Single Payment (MON)
              </label>
              <input
                type="text"
                value={maxPaymentMon}
                onChange={(e) => setMaxPaymentMon(e.target.value)}
                required
                placeholder="0.03"
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
              />
              <span className="text-[10px] font-mono text-[#A2A69A] mt-1 block">
                Wei: {previewMaxWei.toString()}
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                Daily Spending Limit (MON)
              </label>
              <input
                type="text"
                value={dailyLimitMon}
                onChange={(e) => setDailyLimitMon(e.target.value)}
                required
                placeholder="0.05"
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
              />
              <span className="text-[10px] font-mono text-[#A2A69A] mt-1 block">
                Wei: {previewDailyWei.toString()}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
              Expiry Duration (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={1440}
              value={expiryMinutes}
              onChange={(e) => setExpiryMinutes(Number(e.target.value))}
              required
              className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-[#FF6B57]/10 border border-[#FF6B57]/40 rounded text-xs font-mono text-[#FF6B57]">
              {errorMsg}
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 flex justify-end space-x-3 border-t border-[#363A30]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded border border-[#363A30] text-[#A2A69A] hover:text-[#F1F0E8] text-xs font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-[#D7FF64] text-[#111310] font-mono font-bold text-xs hover:bg-[#c6f04e] transition-colors"
            >
              Create Mandate (Simulation)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
