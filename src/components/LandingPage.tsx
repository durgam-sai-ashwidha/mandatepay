import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  Lock,
  Cpu,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Zap,
  Server,
  Layers,
  ChevronRight,
  ExternalLink,
  Play,
} from 'lucide-react';
import { DEMO_CONFIG } from '../config/contracts';

interface LandingPageProps {
  onGoToConsole: () => void;
  onLoadDemoAndGo: () => void;
  onRunDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToConsole,
  onLoadDemoAndGo,
  onRunDemo,
}) => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const protocolSteps = [
    {
      role: 'OWNER',
      title: 'Human Principal Sets Mandate',
      badge: 'Step 1: Authorization Origin',
      summary: 'The owner creates an on-chain or cryptographically signed mandate defining strict rules.',
      details: [
        'Specifies approved recipient address (e.g. LabelService)',
        'Sets maximum single payment cap (e.g. 0.03 MON)',
        'Enforces daily spending ceiling (e.g. 0.05 MON)',
        'Restricts to explicit purpose (e.g. DATA_LABELING)',
        'Configures immutable expiry window (e.g. 10 minutes)',
      ],
      actor: 'Human Wallet / Treasury multisig',
    },
    {
      role: 'MANDATE',
      title: 'Bound Contract Boundary',
      badge: 'Step 2: Policy State',
      summary: 'Mandate is committed with an immutable ID and active status.',
      details: [
        'Stored as structured state with integer smallest-unit wei values',
        'Tracks cumulative daily velocity (spentToday)',
        'Maintains instantaneous revocation killswitch for the owner',
        'Completely isolates owner funds: agent never receives private keys',
      ],
      actor: 'MandateRegistry Protocol Specification',
    },
    {
      role: 'AGENT REQUEST',
      title: 'Autonomous Proposal',
      badge: 'Step 3: Unprivileged Proposal',
      summary: 'AI agent proposes a payment for external services or compute.',
      details: [
        'Agent generates natural language or JSON payment proposal',
        'Gemini parser extracts structured parameters (recipient, amount, purpose)',
        'CRITICAL GUARANTEE: LLMs have ZERO signing or disbursement authority',
        'Proposal contains only intent, waiting for deterministic validation',
      ],
      actor: 'Autonomous AI Agent (e.g. ResearchBot)',
    },
    {
      role: 'CONTRACT CHECK',
      title: 'Deterministic Policy Enforcement',
      badge: 'Step 4: Zero-Trust Verification',
      summary: 'Deterministic policy engine evaluates 6-point verification using integer arithmetic.',
      details: [
        'Validates recipient address matches mandate authorization exactly',
        'Checks proposed amount <= max single transaction ceiling',
        'Verifies projected daily spend (spentToday + amount) <= daily limit',
        'Confirms purpose matches permitted category',
        'Verifies block timestamp < expiry timestamp and mandate is not revoked',
      ],
      actor: 'Deterministic Policy Engine (Simulation)',
    },
    {
      role: 'RECIPIENT',
      title: 'Independent Verification & Service Release',
      badge: 'Step 5: Settlement & Delivery',
      summary: 'Recipient confirms authorized payment receipt before delivering goods or compute.',
      details: [
        'Recipient API queries verifyMandateAuthorization endpoint',
        'Payment settled directly from owner treasury via mandate rules',
        'Agent receives API tokens, training datasets, or inference responses',
        'Complete verifiable audit trail preserved in session ledger',
      ],
      actor: 'Service Provider (e.g. LabelService)',
    },
  ];

  return (
    <div className="min-h-screen bg-[#111310] text-[#F1F0E8] flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 border-b border-[#363A30] overflow-hidden">
        {/* Subtle grid background */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#F1F0E8 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Tagline Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-[#191C17] border border-[#363A30] text-xs font-mono mb-8">
            <span className="w-2 h-2 rounded-full bg-[#D7FF64]" />
            <span className="text-[#A2A69A]">MONAD HACKATHON</span>
            <span className="text-[#363A30]">/</span>
            <span className="text-[#D7FF64]">TRUST, IDENTITY & AI INFRASTRUCTURE</span>
          </div>

          {/* Wordmark & Main Headline */}
          <div className="max-w-4xl">
            <div className="font-mono text-xs uppercase tracking-widest text-[#A2A69A] mb-3">
              MANDATEPAY — PERMISSION BEFORE PAYMENT
            </div>
            <h1 className="font-heading font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-[#F1F0E8] leading-[1.08] mb-6">
              Give agents permission. <br />
              <span className="text-[#D7FF64]">Not the keys.</span>
            </h1>
            <p className="font-body text-lg sm:text-xl text-[#A2A69A] leading-relaxed max-w-3xl mb-10">
              Define the boundaries. Let the agent propose the payment. Let the recipient verify the authority.
            </p>

            {/* Core Message Quote */}
            <div className="p-4 rounded border border-[#363A30] bg-[#191C17] mb-10 max-w-2xl flex items-start space-x-3">
              <Lock className="w-5 h-5 text-[#D7FF64] shrink-0 mt-0.5" />
              <div>
                <p className="font-mono text-sm text-[#F1F0E8] font-medium">
                  “Don’t give your AI agent a wallet. Give it a mandate.”
                </p>
                <p className="font-body text-xs text-[#A2A69A] mt-1">
                  Autonomous agents should never hold private keys or unrestricted balances. MandatePay introduces bounded programmatic mandates enforced deterministically on Monad.
                </p>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={onRunDemo}
                className="px-6 py-3.5 rounded bg-[#D7FF64] text-[#111310] font-mono font-bold text-sm hover:bg-[#c6f04e] transition-colors flex items-center space-x-2 focus:outline-none cursor-pointer shadow-lg"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Demo (6 Scenarios)</span>
              </button>

              <button
                onClick={onGoToConsole}
                className="px-6 py-3.5 rounded bg-[#191C17] border border-[#363A30] text-[#F1F0E8] font-mono font-semibold text-sm hover:bg-[#20231D] hover:border-[#D7FF64] transition-colors flex items-center space-x-2 focus:outline-none cursor-pointer"
              >
                <span>Create a Mandate</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onLoadDemoAndGo}
                className="px-6 py-3.5 rounded bg-[#191C17] border border-[#363A30] text-[#A2A69A] font-mono text-sm hover:bg-[#20231D] hover:text-[#F1F0E8] transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-[#D7FF64]" />
                <span>Launch ResearchBot Preset</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Protocol Flow Stepper */}
      <section className="py-16 border-b border-[#363A30] bg-[#141612]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10">
            <div>
              <div className="text-xs font-mono uppercase text-[#D7FF64] mb-1">
                Zero-Trust Pipeline
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#F1F0E8]">
                Protocol Flow Architecture
              </h2>
            </div>
            <p className="text-xs font-mono text-[#A2A69A] mt-2 sm:mt-0">
              CLICK A NODE TO INSPECT THE SECURITY BOUNDARY
            </p>
          </div>

          {/* Stepper Chain Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
            {protocolSteps.map((step, idx) => {
              const isSelected = activeStep === idx;
              return (
                <button
                  key={step.role}
                  onClick={() => setActiveStep(idx)}
                  className={`p-3 rounded text-left transition-all border ${
                    isSelected
                      ? 'bg-[#20231D] border-[#D7FF64] shadow-sm'
                      : 'bg-[#191C17] border-[#363A30] hover:border-[#A2A69A]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-[#A2A69A]">0{idx + 1}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64]" />}
                  </div>
                  <div className="font-mono font-bold text-xs tracking-wider text-[#F1F0E8]">
                    {step.role}
                  </div>
                  <div className="text-[11px] text-[#A2A69A] truncate mt-0.5">
                    {step.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Step Detail Card */}
          <div className="p-6 rounded border border-[#363A30] bg-[#191C17]">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4 pb-4 border-b border-[#363A30]">
              <div>
                <span className="inline-block px-2 py-0.5 text-[11px] font-mono rounded bg-[#20231D] text-[#D7FF64] border border-[#363A30] mb-2">
                  {protocolSteps[activeStep].badge}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#F1F0E8]">
                  {protocolSteps[activeStep].title}
                </h3>
                <p className="font-body text-sm text-[#A2A69A] mt-1">
                  {protocolSteps[activeStep].summary}
                </p>
              </div>
              <div className="shrink-0 p-3 rounded bg-[#20231D] border border-[#363A30] text-xs font-mono">
                <div className="text-[#A2A69A] text-[10px] uppercase">Enforcing Entity</div>
                <div className="text-[#F1F0E8] font-medium mt-0.5">
                  {protocolSteps[activeStep].actor}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase text-[#A2A69A] mb-2">
                Operational Rules & Invariants:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {protocolSteps[activeStep].details.map((detail, dIdx) => (
                  <div
                    key={dIdx}
                    className="flex items-start space-x-2 text-xs font-mono text-[#F1F0E8] p-2.5 rounded bg-[#20231D]/60 border border-[#363A30]/50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D7FF64] shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Principles */}
      <section className="py-20 border-b border-[#363A30] bg-[#111310]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="text-xs font-mono uppercase text-[#D7FF64] mb-2">
              Foundational Security Pillars
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#F1F0E8]">
              Three Principles of MandatePay
            </h2>
            <p className="font-body text-sm text-[#A2A69A] mt-2 max-w-2xl">
              Architected specifically to solve the catastrophic risks of AI agents handling on-chain money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Principle 1 */}
            <div className="p-6 rounded border border-[#363A30] bg-[#191C17] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded border border-[#363A30] bg-[#20231D] flex items-center justify-center text-[#D7FF64] mb-5 font-mono font-bold text-sm">
                  01
                </div>
                <h3 className="font-heading text-lg font-bold text-[#F1F0E8] mb-3">
                  Bounded Authority
                </h3>
                <p className="font-body text-xs text-[#A2A69A] leading-relaxed mb-4">
                  Never hand raw private keys or unlimited balances to autonomous agents. Mandates define narrow, explicit boundaries:
                </p>
                <ul className="space-y-2 text-xs font-mono text-[#F1F0E8] mb-6">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64]" />
                    <span>Per-transaction spending cap</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64]" />
                    <span>24-hour daily velocity limit</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64]" />
                    <span>Hard expiration timestamp</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64]" />
                    <span>Approved recipient whitelist</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-[#363A30] text-[11px] font-mono text-[#A2A69A]">
                Worst-case exposure = strictly bounded to mandate ceiling.
              </div>
            </div>

            {/* Principle 2 */}
            <div className="p-6 rounded border border-[#363A30] bg-[#191C17] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded border border-[#363A30] bg-[#20231D] flex items-center justify-center text-[#D7FF64] mb-5 font-mono font-bold text-sm">
                  02
                </div>
                <h3 className="font-heading text-lg font-bold text-[#F1F0E8] mb-3">
                  Deterministic Enforcement
                </h3>
                <p className="font-body text-xs text-[#A2A69A] leading-relaxed mb-4">
                  Large Language Models are probabilistic and prone to prompt injection, hallucination, and adversarial compromise.
                </p>
                <div className="p-3 rounded bg-[#20231D] border border-[#363A30] text-xs font-mono text-[#F1F0E8] mb-4 space-y-1">
                  <div className="text-[#A2A69A] text-[10px]">INVARIANT</div>
                  <div>Gemini parses parameters only.</div>
                  <div className="text-[#D7FF64]">Smart contract enforces rules.</div>
                </div>
                <p className="font-body text-xs text-[#A2A69A] leading-relaxed mb-6">
                  Monad EVM bytecode evaluates mathematical integer arithmetic without relying on AI discretion.
                </p>
              </div>
              <div className="pt-4 border-t border-[#363A30] text-[11px] font-mono text-[#A2A69A]">
                100% deterministic code. Zero probabilistic trust.
              </div>
            </div>

            {/* Principle 3 */}
            <div className="p-6 rounded border border-[#363A30] bg-[#191C17] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded border border-[#363A30] bg-[#20231D] flex items-center justify-center text-[#D7FF64] mb-5 font-mono font-bold text-sm">
                  03
                </div>
                <h3 className="font-heading text-lg font-bold text-[#F1F0E8] mb-3">
                  Verifiable Authorization
                </h3>
                <p className="font-body text-xs text-[#A2A69A] leading-relaxed mb-4">
                  Recipients (GPU nodes, data labeling vendors, inference APIs) cannot trust agent self-declarations.
                </p>
                <ul className="space-y-2 text-xs font-mono text-[#F1F0E8] mb-6">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64]" />
                    <span>Independent query endpoint</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64]" />
                    <span>Zero-trust recipient validation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64]" />
                    <span>Cryptographic audit proof</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D7FF64]" />
                    <span>Delivery contingent on check</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-[#363A30] text-[11px] font-mono text-[#A2A69A]">
                Recipient independently confirms authority before servicing.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Matrix: Agent Wallet vs MandatePay */}
      <section className="py-16 border-b border-[#363A30] bg-[#141612]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#F1F0E8]">
              Comparison: Direct Agent Wallet vs. MandatePay
            </h2>
            <p className="font-body text-xs sm:text-sm text-[#A2A69A] mt-2">
              Why giving autonomous agents raw private keys is a critical architectural flaw.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border border-[#363A30] rounded">
              <thead>
                <tr className="bg-[#191C17] border-b border-[#363A30] text-[#A2A69A]">
                  <th className="p-3.5">Security Vector</th>
                  <th className="p-3.5 text-[#FF6B57]">Direct Agent Wallet (Dangerous)</th>
                  <th className="p-3.5 text-[#D7FF64]">MandatePay Architecture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#363A30] bg-[#191C17]/60">
                <tr>
                  <td className="p-3.5 font-medium text-[#F1F0E8]">Key Custody</td>
                  <td className="p-3.5 text-[#FF6B57]">Agent holds private key in server memory</td>
                  <td className="p-3.5 text-[#D7FF64]">Agent holds zero private keys. Owner retains custody.</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#F1F0E8]">Prompt Injection</td>
                  <td className="p-3.5 text-[#FF6B57]">Hacker commands agent to drain 100% of wallet</td>
                  <td className="p-3.5 text-[#D7FF64]">Contract rejects any spend outside mandate limits</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#F1F0E8]">Recipient Whitelist</td>
                  <td className="p-3.5 text-[#FF6B57]">Can send funds to any arbitrary external address</td>
                  <td className="p-3.5 text-[#D7FF64]">Locked to approved recipient (e.g. LabelService)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#F1F0E8]">Spending Velocity</td>
                  <td className="p-3.5 text-[#FF6B57]">Unlimited loop exhaustion in seconds</td>
                  <td className="p-3.5 text-[#D7FF64]">Integer daily limit with automated lock</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#F1F0E8]">Emergency Stop</td>
                  <td className="p-3.5 text-[#FF6B57]">Requires racing agent to withdraw funds</td>
                  <td className="p-3.5 text-[#D7FF64]">Instant owner revocation method revokes authorization</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-[#F1F0E8]">Recipient Trust</td>
                  <td className="p-3.5 text-[#FF6B57]">Recipient must trust agent promises</td>
                  <td className="p-3.5 text-[#D7FF64]">Recipient verifies on-chain authorization independently</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-[#111310]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl font-bold text-[#F1F0E8] mb-4">
            Ready to test the MandatePay simulation?
          </h2>
          <p className="font-body text-sm text-[#A2A69A] mb-8 max-w-xl mx-auto">
            Experience how ResearchBot proposes payments to LabelService while strict deterministic policy checks prevent unauthorized transactions in memory.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onRunDemo}
              className="px-6 py-3 rounded bg-[#D7FF64] text-[#111310] font-mono font-bold text-sm hover:bg-[#c6f04e] transition-colors flex items-center space-x-2 cursor-pointer shadow-lg"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run Demo (6 Scenarios)</span>
            </button>
            <button
              onClick={onLoadDemoAndGo}
              className="px-6 py-3 rounded bg-[#191C17] border border-[#363A30] text-[#F1F0E8] font-mono text-sm hover:bg-[#20231D] transition-colors"
            >
              Start Custom Session
            </button>
            <button
              onClick={onGoToConsole}
              className="px-6 py-3 rounded bg-[#191C17] border border-[#363A30] text-[#A2A69A] hover:text-[#F1F0E8] font-mono text-sm hover:bg-[#20231D]"
            >
              Open Console
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#363A30] py-6 bg-[#111310]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#A2A69A]">
          <div>
            MANDATEPAY // Simulation Prototype (No Monad Contract Deployed)
          </div>
          <div className="mt-2 sm:mt-0">
            Permission Before Payment • Deterministic Simulation • Monad Architecture Ready
          </div>
        </div>
      </footer>
    </div>
  );
};
