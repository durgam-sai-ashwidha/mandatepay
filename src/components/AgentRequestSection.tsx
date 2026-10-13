import React, { useState } from 'react';
import {
  Terminal,
  Cpu,
  Send,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Edit3,
  CheckCircle,
  Shield,
  Layers,
} from 'lucide-react';
import { KNOWN_RECIPIENTS, KNOWN_PURPOSES, DEMO_CONFIG } from '../config/contracts';
import { monToWei } from '../lib/monad';

interface ParsedRequestData {
  recipientAddress: string;
  amountInMon: string;
  purposeId: string;
  description: string;
  parsedByAi: boolean;
}

interface AgentRequestSectionProps {
  onParsedProposal: (data: ParsedRequestData) => void;
  hasGeminiKey: boolean;
  activeAgentName: string;
}

export const AgentRequestSection: React.FC<AgentRequestSectionProps> = ({
  onParsedProposal,
  hasGeminiKey,
  activeAgentName,
}) => {
  const [naturalPrompt, setNaturalPrompt] = useState<string>(
    'ResearchBot requesting 0.02 MON to LabelService for DATA_LABELING batch #104 (500 synthetic dataset annotations).'
  );
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  // Manual input fields
  const [manualRecipient, setManualRecipient] = useState<string>(DEMO_CONFIG.recipientAddress);
  const [manualAmount, setManualAmount] = useState<string>('0.02');
  const [manualPurpose, setManualPurpose] = useState<string>(DEMO_CONFIG.purposeId);
  const [manualDesc, setManualDesc] = useState<string>(
    'Payment for dataset tagging batch #104 by ResearchBot'
  );

  const presets = [
    {
      label: 'Compliant (0.02 MON)',
      prompt:
        'ResearchBot requesting 0.02 MON to LabelService for DATA_LABELING batch #104 (500 synthetic dataset annotations).',
      type: 'pass',
    },
    {
      label: 'Over Max Limit (0.04 MON)',
      prompt:
        'ResearchBot requesting 0.04 MON to LabelService for DATA_LABELING large corpus extraction.',
      type: 'fail_max',
    },
    {
      label: 'Over Daily Cap (0.06 MON)',
      prompt:
        'ResearchBot proposing 0.06 MON payment to LabelService for DATA_LABELING high priority pipeline.',
      type: 'fail_daily',
    },
    {
      label: 'Wrong Recipient',
      prompt:
        'ResearchBot proposing 0.02 MON payment to DataVendorAlpha for DATA_LABELING external indexes.',
      type: 'fail_recipient',
    },
    {
      label: 'Wrong Purpose (RPC_COMPUTE)',
      prompt:
        'ResearchBot requesting 0.02 MON to LabelService for RPC_COMPUTE node leasing.',
      type: 'fail_purpose',
    },
  ];

  const handleParseWithGemini = async () => {
    if (!naturalPrompt.trim()) return;

    setIsParsing(true);
    setParseError(null);

    try {
      const response = await fetch('/api/parse-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: naturalPrompt,
          knownRecipients: KNOWN_RECIPIENTS,
          knownPurposes: KNOWN_PURPOSES,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();

      onParsedProposal({
        recipientAddress: data.recipientAddress || '',
        amountInMon: data.amountInMon || '0',
        purposeId: data.purposeId || '',
        description: data.description || naturalPrompt,
        parsedByAi: true,
      });
    } catch (err: any) {
      console.warn('Gemini parser error:', err);
      setParseError(
        err.message ||
          'Failed to reach Gemini API. You can switch to Manual Entry Mode below to test instantly.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onParsedProposal({
      recipientAddress: manualRecipient.trim(),
      amountInMon: manualAmount.trim(),
      purposeId: manualPurpose.trim().toUpperCase(),
      description: manualDesc.trim(),
      parsedByAi: false,
    });
  };

  return (
    <div className="rounded border border-[#363A30] bg-[#191C17] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#363A30] bg-[#141612] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#D7FF64]" />
          <h4 className="font-heading font-bold text-sm text-[#F1F0E8]">
            Agent Payment Proposal Interface
          </h4>
        </div>

        <button
          onClick={() => setIsManualMode(!isManualMode)}
          className="text-xs font-mono px-2.5 py-1 rounded border border-[#363A30] bg-[#20231D] text-[#A2A69A] hover:text-[#F1F0E8] flex items-center space-x-1"
        >
          <Edit3 className="w-3 h-3" />
          <span>{isManualMode ? 'Switch to AI Parser' : 'Manual Entry Mode'}</span>
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Strict AI Boundary Warning */}
        <div className="p-3 rounded border border-[#363A30] bg-[#111310] flex items-start space-x-2.5 text-xs font-mono">
          <Shield className="w-4 h-4 text-[#D7FF64] shrink-0 mt-0.5" />
          <div className="text-[#A2A69A]">
            <span className="text-[#F1F0E8] font-bold">CRITICAL AI BOUNDARY: </span>
            Gemini parses natural language into structured parameters only (recipient, amount, purpose).
            Gemini <span className="text-[#FF6B57] font-semibold">NEVER</span> authorizes, signs, or decides whether payments are approved. All policies are enforced deterministically on Monad.
          </div>
        </div>

        {!isManualMode ? (
          /* Natural Language Input Mode */
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase text-[#A2A69A]">
                  Agent Prompt / Payment Request (Natural Language)
                </label>
                <span className="text-[10px] font-mono text-[#D7FF64]">
                  Proposer: {activeAgentName}
                </span>
              </div>
              <textarea
                rows={3}
                value={naturalPrompt}
                onChange={(e) => setNaturalPrompt(e.target.value)}
                placeholder="e.g. ResearchBot requesting 0.02 MON to LabelService for DATA_LABELING..."
                className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded p-3 text-xs font-mono text-[#F1F0E8] focus:outline-none placeholder-[#A2A69A]/40"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="text-[10px] font-mono uppercase text-[#A2A69A] block mb-1.5">
                Test Scenario Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNaturalPrompt(p.prompt);
                      setParseError(null);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors border ${
                      p.type === 'pass'
                        ? 'bg-[#20231D] border-[#D7FF64]/40 text-[#D7FF64] hover:bg-[#D7FF64]/10'
                        : 'bg-[#20231D] border-[#363A30] text-[#A2A69A] hover:text-[#F1F0E8] hover:border-[#A2A69A]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error banner if Gemini failed */}
            {parseError && (
              <div className="p-3 rounded border border-[#FF6B57]/50 bg-[#FF6B57]/10 text-xs font-mono text-[#FF6B57] flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div>{parseError}</div>
                  <button
                    onClick={() => setIsManualMode(true)}
                    className="mt-1.5 text-[11px] underline font-bold hover:text-white"
                  >
                    Click to switch to manual parameter entry
                  </button>
                </div>
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleParseWithGemini}
                disabled={isParsing || !naturalPrompt.trim()}
                className="px-5 py-2.5 rounded bg-[#D7FF64] text-[#111310] font-mono font-semibold text-xs hover:bg-[#c6f04e] transition-colors flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{isParsing ? 'Parsing with Gemini 3.8 Flash...' : 'Extract Parameters with Gemini'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Manual Entry Mode */
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                  Recipient Address (EVM hex)
                </label>
                <input
                  type="text"
                  value={manualRecipient}
                  onChange={(e) => setManualRecipient(e.target.value)}
                  placeholder="0x..."
                  required
                  className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                  Proposed Amount (MON)
                </label>
                <input
                  type="text"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="0.02"
                  required
                  className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                  Purpose ID (Uppercase)
                </label>
                <input
                  type="text"
                  value={manualPurpose}
                  onChange={(e) => setManualPurpose(e.target.value)}
                  placeholder="DATA_LABELING"
                  required
                  className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-[#A2A69A] mb-1">
                  Task Description
                </label>
                <input
                  type="text"
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  placeholder="Describe the task..."
                  required
                  className="w-full bg-[#111310] border border-[#363A30] focus:border-[#D7FF64] rounded px-3 py-2 text-xs font-mono text-[#F1F0E8] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 rounded bg-[#D7FF64] text-[#111310] font-mono font-semibold text-xs hover:bg-[#c6f04e] transition-colors flex items-center space-x-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Structured Proposal</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
