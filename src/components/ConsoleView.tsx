import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  RotateCcw,
  Activity,
  Layers,
  Cpu,
  Terminal,
  ExternalLink,
  Wallet,
  Settings,
  Play,
} from 'lucide-react';
import {
  Mandate,
  PaymentProposal,
  PolicyTrace,
  WalletState,
  TransactionRecord,
} from '../types/mandate';
import { ActiveMandateCard } from './ActiveMandateCard';
import { AgentRequestSection } from './AgentRequestSection';
import { ParsedPreviewSection } from './ParsedPreviewSection';
import { PolicyTraceSection } from './PolicyTraceSection';
import { ExecutionSection } from './ExecutionSection';
import { AuditHistorySection } from './AuditHistorySection';
import { GuidedDemoBanner } from './GuidedDemoBanner';
import { MONAD_TESTNET_CONFIG } from '../config/contracts';
import { shortenAddress } from '../lib/monad';

interface ConsoleViewProps {
  mandates: Mandate[];
  activeMandateId: string | null;
  onSelectMandate: (mandateId: string) => void;
  onRevokeMandate: (mandateId: string) => void;
  onResetDemo: () => void;
  onOpenCreateModal: () => void;
  onOpenContractConfig: () => void;
  currentProposal: PaymentProposal | null;
  policyTrace: PolicyTrace | null;
  onParsedProposal: (proposalData: any) => void;
  wallet: WalletState;
  contractAddress: string;
  onConnectWallet: () => void;
  onSwitchNetwork: () => void;
  onPaymentExecuted: (record: TransactionRecord, addedSpentWei: bigint) => void;
  auditRecords: TransactionRecord[];
  onClearHistory: () => void;
  hasGeminiKey: boolean;
  isDemoRunning?: boolean;
  demoStep?: number;
  demoProgressPercent?: number;
  demoIsPlaying?: boolean;
  onRunDemo?: () => void;
  onToggleDemoPlay?: () => void;
  onNextDemoStep?: () => void;
  onPrevDemoStep?: () => void;
  onSelectDemoStep?: (step: number) => void;
  onExitDemo?: () => void;
}

export const ConsoleView: React.FC<ConsoleViewProps> = ({
  mandates,
  activeMandateId,
  onSelectMandate,
  onRevokeMandate,
  onResetDemo,
  onOpenCreateModal,
  onOpenContractConfig,
  currentProposal,
  policyTrace,
  onParsedProposal,
  wallet,
  contractAddress,
  onConnectWallet,
  onSwitchNetwork,
  onPaymentExecuted,
  auditRecords,
  onClearHistory,
  hasGeminiKey,
  isDemoRunning,
  demoStep,
  demoProgressPercent,
  demoIsPlaying,
  onRunDemo,
  onToggleDemoPlay,
  onNextDemoStep,
  onPrevDemoStep,
  onSelectDemoStep,
  onExitDemo,
}) => {
  const activeMandate = mandates.find((m) => m.mandateId === activeMandateId) || null;
  const isContractConfigured = Boolean(contractAddress && contractAddress.trim().length > 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Automated Guided Demo Controller Banner */}
      {isDemoRunning && (
        <GuidedDemoBanner
          currentStep={demoStep || 1}
          isPlaying={Boolean(demoIsPlaying)}
          progressPercent={demoProgressPercent || 0}
          onTogglePlay={onToggleDemoPlay || (() => {})}
          onNextStep={onNextDemoStep || (() => {})}
          onPrevStep={onPrevDemoStep || (() => {})}
          onSelectStep={onSelectDemoStep || (() => {})}
          onExitDemo={onExitDemo || (() => {})}
        />
      )}

      {/* Top Status Bar: Network & Contract & Wallet Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Network Status Card */}
        <div className="p-3.5 rounded border border-[#363A30] bg-[#191C17] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF64]" />
            <div>
              <div className="text-[10px] font-mono uppercase text-[#A2A69A]">Target Network</div>
              <div className="font-heading font-bold text-xs text-[#F1F0E8]">
                {MONAD_TESTNET_CONFIG.chainName}
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#20231D] text-[#A2A69A] border border-[#363A30]">
            Chain {MONAD_TESTNET_CONFIG.chainId}
          </span>
        </div>

        {/* Contract Architecture Status Card */}
        <div
          onClick={onOpenContractConfig}
          className="p-3.5 rounded border border-[#363A30] bg-[#191C17] hover:bg-[#20231D] cursor-pointer transition-colors flex items-center justify-between"
        >
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5B85C]" />
            <div>
              <div className="text-[10px] font-mono uppercase text-[#A2A69A]">Demo Architecture</div>
              <div className="font-mono text-xs font-semibold text-[#E5B85C]">
                SIMULATION — NOT ON-CHAIN
              </div>
            </div>
          </div>
          <Settings className="w-4 h-4 text-[#A2A69A]" />
        </div>

        {/* Wallet Connection Status Card */}
        <div className="p-3.5 rounded border border-[#363A30] bg-[#191C17] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Wallet className="w-4 h-4 text-[#A2A69A]" />
            <div>
              <div className="text-[10px] font-mono uppercase text-[#A2A69A]">Connected Principal</div>
              <div className="font-mono text-xs font-semibold text-[#F1F0E8]">
                {wallet.isConnected ? shortenAddress(wallet.address) : 'No Wallet Connected'}
              </div>
            </div>
          </div>
          {!wallet.isConnected ? (
            <button
              onClick={onConnectWallet}
              className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#D7FF64] text-[#111310] font-bold"
            >
              Connect
            </button>
          ) : !wallet.isMonadTestnet ? (
            <button
              onClick={onSwitchNetwork}
              className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#FF6B57] text-[#111310] font-bold"
            >
              Switch Chain
            </button>
          ) : (
            <span className="text-[10px] font-mono text-[#D7FF64] font-bold">
              {Number(wallet.balanceMon || 0).toFixed(3)} MON
            </span>
          )}
        </div>
      </div>

      {/* Mandate Selector Bar (if multiple mandates exist) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded border border-[#363A30] bg-[#141612]">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-[11px] font-mono uppercase text-[#A2A69A] shrink-0 mr-1">
            Mandates ({mandates.length}):
          </span>
          {mandates.map((m) => (
            <button
              key={m.mandateId}
              onClick={() => onSelectMandate(m.mandateId)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors shrink-0 border ${
                m.mandateId === activeMandateId
                  ? 'bg-[#20231D] text-[#D7FF64] border-[#D7FF64]/50'
                  : 'bg-[#191C17] text-[#A2A69A] border-[#363A30] hover:text-[#F1F0E8]'
              }`}
            >
              {m.mandateId} {m.isRevoked ? '(REVOKED)' : ''}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {onRunDemo && (
            <button
              onClick={onRunDemo}
              className="px-3 py-1 rounded text-xs font-mono font-bold bg-[#D7FF64] text-[#111310] hover:bg-[#c6f04e] flex items-center space-x-1 cursor-pointer shadow-sm"
              title="Walk through the 6 automated demo scenarios"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Demo</span>
            </button>
          )}
          <button
            onClick={onResetDemo}
            className="px-2.5 py-1 rounded text-xs font-mono text-[#A2A69A] hover:text-[#F1F0E8] border border-[#363A30] bg-[#191C17] flex items-center space-x-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="px-3 py-1 rounded text-xs font-mono font-semibold bg-[#20231D] border border-[#363A30] text-[#F1F0E8] hover:bg-[#252a22] hover:border-[#D7FF64] flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Mandate</span>
          </button>
        </div>
      </div>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Mandate State & Verification (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <ActiveMandateCard
            mandate={activeMandate}
            onRevokeMandate={onRevokeMandate}
            onResetDemo={onResetDemo}
            onCreateNewClick={onOpenCreateModal}
          />

          {/* Policy Trace Section (renders 6-point verification) */}
          <PolicyTraceSection trace={policyTrace} contractAddress={contractAddress} />
        </div>

        {/* Right Column: Proposal Input, Parsing, and Execution (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Agent Request Interface */}
          <AgentRequestSection
            onParsedProposal={onParsedProposal}
            hasGeminiKey={hasGeminiKey}
            activeAgentName={activeMandate ? activeMandate.authorizedAgent : 'ResearchBot'}
          />

          {/* Parsed JSON Preview */}
          <ParsedPreviewSection proposal={currentProposal} />

          {/* Payment Execution Engine */}
          <ExecutionSection
            mandate={activeMandate}
            proposal={currentProposal}
            policyTrace={policyTrace}
            wallet={wallet}
            contractAddress={contractAddress}
            onConnectWallet={onConnectWallet}
            onSwitchNetwork={onSwitchNetwork}
            onPaymentExecuted={onPaymentExecuted}
          />
        </div>
      </div>

      {/* Bottom Section: Audit History Ledger */}
      <AuditHistorySection
        records={auditRecords}
        onClearHistory={onClearHistory}
      />
    </div>
  );
};
