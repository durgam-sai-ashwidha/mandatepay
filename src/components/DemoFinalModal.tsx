import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ExternalLink,
  Lock,
  Layers,
  ArrowRight,
  Code,
  X,
} from 'lucide-react';

interface DemoFinalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReplayDemo: () => void;
  onOpenContractCode: () => void;
}

export const DemoFinalModal: React.FC<DemoFinalModalProps> = ({
  isOpen,
  onClose,
  onReplayDemo,
  onOpenContractCode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#191C17] border-2 border-[#D7FF64] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#363A30] flex items-center justify-between bg-[#141612]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#D7FF64]" />
            <span className="font-mono text-xs text-[#D7FF64] font-bold uppercase tracking-wider">
              Scenario 6 / 6 • Protocol Verification Completed
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#A2A69A] hover:text-[#F1F0E8] transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
          {/* Main Headline */}
          <div className="text-center max-w-xl mx-auto space-y-3">
            <div className="inline-block px-3 py-1 rounded bg-[#20231D] text-[#E5B85C] border border-[#E5B85C]/40 text-xs font-mono font-bold uppercase">
              SIMULATION — NOT ON-CHAIN
            </div>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-[#F1F0E8] leading-tight">
              “AI proposed. <br className="hidden sm:inline" />
              MandatePay evaluated. <br className="hidden sm:inline" />
              <span className="text-[#D7FF64]">Monad would enforce.”</span>
            </h2>
            <p className="font-body text-xs sm:text-sm text-[#A2A69A] leading-relaxed">
              You just witnessed the complete security lifecycle of MandatePay. The agent was given explicit boundaries—not private keys.
            </p>
          </div>

          {/* 6-Scenario Audit Summary */}
          <div className="p-4 rounded border border-[#363A30] bg-[#141612] space-y-2.5">
            <div className="text-[10px] font-mono uppercase text-[#A2A69A] tracking-wider mb-2">
              Automated Walkthrough Audit Trail:
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* 1 */}
              <div className="flex items-center justify-between p-2 rounded bg-[#191C17] border border-[#363A30]/60">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D7FF64] shrink-0" />
                  <span className="text-[#F1F0E8]">1. Mandate Created (0.03 MON cap, 0.05 MON daily limit)</span>
                </div>
                <span className="text-[10px] text-[#D7FF64] font-bold">ESTABLISHED</span>
              </div>

              {/* 2 */}
              <div className="flex items-center justify-between p-2 rounded bg-[#191C17] border border-[#363A30]/60">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-[#FF6B57] shrink-0" />
                  <span className="text-[#F1F0E8]">2. Unauthorized Recipient Attempt</span>
                </div>
                <span className="text-[10px] text-[#FF6B57] font-bold">“Recipient not authorized.”</span>
              </div>

              {/* 3 */}
              <div className="flex items-center justify-between p-2 rounded bg-[#191C17] border border-[#363A30]/60">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-[#FF6B57] shrink-0" />
                  <span className="text-[#F1F0E8]">3. Amount Above Ceiling (0.08 MON &gt; 0.03 MON)</span>
                </div>
                <span className="text-[10px] text-[#FF6B57] font-bold">“Exceeds per-payment limit.”</span>
              </div>

              {/* 4 */}
              <div className="flex items-center justify-between p-2 rounded bg-[#191C17] border border-[#363A30]/60">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-4 h-4 text-[#FF6B57] shrink-0" />
                  <span className="text-[#F1F0E8]">4. Proposal Past Window</span>
                </div>
                <span className="text-[10px] text-[#FF6B57] font-bold">“Mandate expired.”</span>
              </div>

              {/* 5 */}
              <div className="flex items-center justify-between p-2 rounded bg-[#191C17] border border-[#363A30]/60">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D7FF64] shrink-0" />
                  <span className="text-[#F1F0E8]">5. Compliant Payment (0.02 MON to LabelService)</span>
                </div>
                <span className="text-[10px] text-[#D7FF64] font-bold">APPROVED &amp; AUDITED</span>
              </div>
            </div>
          </div>

          {/* Core Takeaway Note */}
          <div className="p-3.5 rounded border border-[#E5B85C]/40 bg-[#E5B85C]/10 text-xs font-mono text-[#E5B85C]">
            <div className="font-bold uppercase tracking-wider mb-1">
              Simulation Disclaimer
            </div>
            <p className="text-[11px] text-[#A2A69A] leading-relaxed">
              Every decision in this demo was evaluated in memory using strict integer arithmetic. No Monad transaction occurred, and no fake transaction hashes were generated.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#363A30] bg-[#141612] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onOpenContractCode}
            className="flex items-center space-x-1.5 text-xs font-mono text-[#A2A69A] hover:text-[#D7FF64] transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Inspect MandateRegistry.sol</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onReplayDemo}
              className="px-3.5 py-2 rounded border border-[#363A30] bg-[#191C17] hover:bg-[#20231D] text-[#F1F0E8] text-xs font-mono flex items-center space-x-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D7FF64]" />
              <span>Replay Demo</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#D7FF64] text-[#111310] font-mono font-bold text-xs hover:bg-[#c6f04e] transition-colors"
            >
              Explore Console
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
