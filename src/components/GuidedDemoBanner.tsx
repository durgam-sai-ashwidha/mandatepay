import React from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  X,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export interface DemoStepInfo {
  step: number;
  title: string;
  badge: string;
  description: string;
  expectedOutcome: string;
}

export const DEMO_STEPS: DemoStepInfo[] = [
  {
    step: 1,
    title: 'Create a payment mandate',
    badge: 'Step 1 of 6',
    description: 'Owner establishes bounded mandate for ResearchBot (Max: 0.03 MON, Daily: 0.05 MON, Whitelist: LabelService).',
    expectedOutcome: 'MANDATE ESTABLISHED (SIMULATION — NOT ON-CHAIN)',
  },
  {
    step: 2,
    title: 'AI requests payment to unauthorized recipient',
    badge: 'Step 2 of 6',
    description: 'ResearchBot attempts to disburse 0.02 MON to an unapproved recipient address (0x000...dead).',
    expectedOutcome: 'REJECTED: “Recipient not authorized.” (SIMULATION — NOT ON-CHAIN)',
  },
  {
    step: 3,
    title: 'AI requests amount above the limit',
    badge: 'Step 3 of 6',
    description: 'ResearchBot requests 0.08 MON to LabelService, exceeding the 0.03 MON single payment ceiling.',
    expectedOutcome: 'REJECTED: “Exceeds per-payment limit.” (SIMULATION — NOT ON-CHAIN)',
  },
  {
    step: 4,
    title: 'AI requests payment after expiry',
    badge: 'Step 4 of 6',
    description: 'ResearchBot proposes a payment after the mandate validity window has elapsed.',
    expectedOutcome: 'REJECTED: “Mandate expired.” (SIMULATION — NOT ON-CHAIN)',
  },
  {
    step: 5,
    title: 'AI requests a valid payment',
    badge: 'Step 5 of 6',
    description: 'ResearchBot requests compliant 0.02 MON to LabelService for DATA_LABELING. All 6 checks pass.',
    expectedOutcome: 'APPROVED & LOGGED TO AUDIT LEDGER (SIMULATION — NOT ON-CHAIN)',
  },
  {
    step: 6,
    title: 'Final Evaluation Protocol',
    badge: 'Step 6 of 6',
    description: '“AI proposed. MandatePay evaluated. Monad would enforce.”',
    expectedOutcome: 'VERIFICATION COMPLETE (SIMULATION — NOT ON-CHAIN)',
  },
];

interface GuidedDemoBannerProps {
  currentStep: number;
  isPlaying: boolean;
  progressPercent: number;
  onTogglePlay: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onSelectStep: (step: number) => void;
  onExitDemo: () => void;
}

export const GuidedDemoBanner: React.FC<GuidedDemoBannerProps> = ({
  currentStep,
  isPlaying,
  progressPercent,
  onTogglePlay,
  onNextStep,
  onPrevStep,
  onSelectStep,
  onExitDemo,
}) => {
  const currentInfo = DEMO_STEPS.find((s) => s.step === currentStep) || DEMO_STEPS[0];

  return (
    <div className="rounded border-2 border-[#D7FF64] bg-[#141612] shadow-2xl overflow-hidden mb-6 transition-all">
      {/* Top progress indicator bar */}
      <div className="w-full bg-[#20231D] h-1.5 overflow-hidden">
        <div
          className="bg-[#D7FF64] h-full transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Step Info */}
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D7FF64] text-[#111310] uppercase">
                {currentInfo.badge}
              </span>
              <span className="text-[11px] font-mono font-semibold text-[#E5B85C] uppercase">
                SIMULATION — NOT ON-CHAIN
              </span>
              <span className="text-xs text-[#A2A69A] hidden sm:inline">•</span>
              <span className="text-xs font-mono text-[#A2A69A] hidden sm:inline">
                Automated Walkthrough
              </span>
            </div>

            <h3 className="font-heading font-bold text-base sm:text-lg text-[#F1F0E8] flex items-center space-x-2">
              <span>{currentInfo.title}</span>
            </h3>

            <p className="font-body text-xs text-[#A2A69A] leading-relaxed max-w-3xl">
              {currentInfo.description}
            </p>

            <div className="pt-1 flex items-center space-x-2 text-xs font-mono">
              <span className="text-[#A2A69A]">Simulated Outcome:</span>
              <span
                className={`font-bold ${
                  currentStep === 1 || currentStep === 5
                    ? 'text-[#D7FF64]'
                    : currentStep === 6
                    ? 'text-[#F1F0E8]'
                    : 'text-[#FF6B57]'
                }`}
              >
                {currentInfo.expectedOutcome}
              </span>
            </div>
          </div>

          {/* Right: Step Navigation & Playback Controls */}
          <div className="flex flex-wrap items-center gap-2 lg:self-center shrink-0">
            {/* Step Selector Pills */}
            <div className="flex items-center space-x-1 bg-[#191C17] border border-[#363A30] rounded p-1">
              {DEMO_STEPS.map((s) => (
                <button
                  key={s.step}
                  onClick={() => onSelectStep(s.step)}
                  title={`Jump to Scenario ${s.step}: ${s.title}`}
                  className={`w-7 h-7 rounded text-xs font-mono font-bold transition-all ${
                    s.step === currentStep
                      ? 'bg-[#D7FF64] text-[#111310]'
                      : 'text-[#A2A69A] hover:text-[#F1F0E8] hover:bg-[#20231D]'
                  }`}
                >
                  0{s.step}
                </button>
              ))}
            </div>

            {/* Play/Pause Button */}
            <button
              onClick={onTogglePlay}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isPlaying
                  ? 'bg-[#E5B85C] text-[#111310] hover:bg-[#d6a94e]'
                  : 'bg-[#D7FF64] text-[#111310] hover:bg-[#c6f04e]'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>

            {/* Prev/Next Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={onPrevStep}
                disabled={currentStep <= 1}
                className="p-1.5 rounded border border-[#363A30] bg-[#191C17] text-[#A2A69A] hover:text-[#F1F0E8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Scenario"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onNextStep}
                disabled={currentStep >= 6}
                className="p-1.5 rounded border border-[#363A30] bg-[#191C17] text-[#A2A69A] hover:text-[#F1F0E8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Next Scenario"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Exit Demo Button */}
            <button
              onClick={onExitDemo}
              className="p-1.5 rounded border border-[#363A30] bg-[#191C17] text-[#A2A69A] hover:text-[#FF6B57] transition-colors cursor-pointer"
              title="Exit Guided Demo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
