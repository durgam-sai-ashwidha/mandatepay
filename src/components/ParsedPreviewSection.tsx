import React from 'react';
import { FileJson, Sparkles, UserCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { PaymentProposal } from '../types/mandate';
import { KNOWN_RECIPIENTS } from '../config/contracts';
import { shortenAddress } from '../lib/monad';

interface ParsedPreviewSectionProps {
  proposal: PaymentProposal | null;
}

export const ParsedPreviewSection: React.FC<ParsedPreviewSectionProps> = ({ proposal }) => {
  if (!proposal) {
    return (
      <div className="rounded border border-[#363A30] bg-[#191C17] p-6 text-center">
        <FileJson className="w-6 h-6 text-[#A2A69A] mx-auto mb-2" />
        <div className="text-xs font-mono text-[#A2A69A]">
          No proposal submitted yet. Enter a request above or select a preset to generate a proposal preview.
        </div>
      </div>
    );
  }

  // Check if recipient address matches any known alias
  let matchingAlias: string | null = null;
  for (const [alias, addr] of Object.entries(KNOWN_RECIPIENTS)) {
    if (addr.toLowerCase() === proposal.recipientAddress.toLowerCase()) {
      matchingAlias = alias;
      break;
    }
  }

  return (
    <div className="rounded border border-[#363A30] bg-[#191C17] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-[#363A30] bg-[#141612] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileJson className="w-4 h-4 text-[#D7FF64]" />
          <h4 className="font-heading font-bold text-xs text-[#F1F0E8] uppercase tracking-wider">
            Parsed Request Preview
          </h4>
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
            proposal.parsedByAi
              ? 'bg-[#20231D] text-[#D7FF64] border-[#D7FF64]/30'
              : 'bg-[#20231D] text-[#A2A69A] border-[#363A30]'
          }`}
        >
          {proposal.parsedByAi ? 'Gemini 3.8 Flash Parser' : 'Manual Entry'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          {/* Target Recipient */}
          <div className="p-3 bg-[#20231D] border border-[#363A30] rounded">
            <span className="text-[#A2A69A] text-[10px] uppercase block mb-1">
              Target Recipient
            </span>
            <div className="text-[#F1F0E8] font-bold truncate" title={proposal.recipientAddress}>
              {matchingAlias ? `${matchingAlias}` : shortenAddress(proposal.recipientAddress)}
            </div>
            <div className="text-[10px] text-[#A2A69A] font-mono truncate mt-0.5">
              {proposal.recipientAddress || 'NONE DETECTED'}
            </div>
          </div>

          {/* Proposed Amount */}
          <div className="p-3 bg-[#20231D] border border-[#363A30] rounded">
            <span className="text-[#A2A69A] text-[10px] uppercase block mb-1">
              Proposed Amount
            </span>
            <div className="text-[#D7FF64] font-bold text-sm">
              {proposal.amountInMon} MON
            </div>
            <div className="text-[10px] text-[#A2A69A] font-mono truncate mt-0.5">
              {proposal.amountWei} wei
            </div>
          </div>

          {/* Purpose ID */}
          <div className="p-3 bg-[#20231D] border border-[#363A30] rounded">
            <span className="text-[#A2A69A] text-[10px] uppercase block mb-1">
              Purpose ID
            </span>
            <div className="text-[#F1F0E8] font-bold">
              {proposal.purposeId || 'NOT_SPECIFIED'}
            </div>
            <div className="text-[10px] text-[#A2A69A] truncate mt-0.5">
              Proposer: {proposal.proposedByAgent}
            </div>
          </div>
        </div>

        {/* Description / Intent */}
        <div className="p-3 bg-[#111310] border border-[#363A30] rounded text-xs font-mono">
          <span className="text-[#A2A69A] text-[10px] uppercase block mb-0.5">
            Extracted Intent Summary
          </span>
          <p className="text-[#F1F0E8] text-[11px] leading-relaxed">
            {proposal.description}
          </p>
        </div>
      </div>
    </div>
  );
};
