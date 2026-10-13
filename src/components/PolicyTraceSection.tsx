import React from 'react';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Binary,
} from 'lucide-react';
import { PolicyTrace } from '../types/mandate';

interface PolicyTraceSectionProps {
  trace: PolicyTrace | null;
  contractAddress?: string;
}

export const PolicyTraceSection: React.FC<PolicyTraceSectionProps> = ({
  trace,
}) => {
  if (!trace) {
    return (
      <div className="rounded border border-[#363A30] bg-[#191C17] p-6 text-center">
        <ShieldCheck className="w-6 h-6 text-[#A2A69A] mx-auto mb-2" />
        <div className="text-xs font-mono text-[#A2A69A]">
          No proposal submitted. The 6-point policy check trace will evaluate in simulation once an agent proposal is provided.
        </div>
      </div>
    );
  }

  const passedCount = trace.checks.filter((c) => c.passed).length;
  const totalCount = trace.checks.length;

  return (
    <div className="rounded border border-[#363A30] bg-[#191C17] overflow-hidden">
      {/* Top Banner with Strict Simulation Label */}
      <div className="px-5 py-2.5 bg-[#141612] border-b border-[#363A30] flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#A2A69A]">POLICY EVALUATION MODE:</span>
        <span className="px-2 py-0.5 rounded font-bold uppercase bg-[#20231D] text-[#E5B85C] border border-[#E5B85C]/40">
          SIMULATION — NOT ON-CHAIN
        </span>
      </div>

      {/* Header with Compliance Verdict */}
      <div
        className={`px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
          trace.isCompliant
            ? 'bg-[#20231D] border-[#D7FF64]/40'
            : 'bg-[#20231D] border-[#FF6B57]/40'
        }`}
      >
        <div className="flex items-center space-x-3">
          {trace.isCompliant ? (
            <div className="w-8 h-8 rounded-full bg-[#D7FF64]/10 border border-[#D7FF64] flex items-center justify-center text-[#D7FF64]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#FF6B57]/10 border border-[#FF6B57] flex items-center justify-center text-[#FF6B57]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          )}

          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`font-heading font-bold text-sm tracking-wide ${
                  trace.isCompliant ? 'text-[#D7FF64]' : 'text-[#FF6B57]'
                }`}
              >
                {trace.isCompliant
                  ? 'POLICY DECISION: COMPLIANT & AUTHORIZED (SIMULATION — NOT ON-CHAIN)'
                  : 'POLICY DECISION: BLOCKED — NON-COMPLIANT (SIMULATION — NOT ON-CHAIN)'}
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#E5B85C] mt-0.5 font-medium">
              SIMULATION — NOT ON-CHAIN • Deterministic Arithmetic Verification
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span
            className={`px-2.5 py-1 rounded border font-semibold ${
              trace.isCompliant
                ? 'bg-[#D7FF64]/10 text-[#D7FF64] border-[#D7FF64]/40'
                : 'bg-[#FF6B57]/10 text-[#FF6B57] border-[#FF6B57]/40'
            }`}
          >
            {passedCount} / {totalCount} CHECKS PASSED (SIMULATION — NOT ON-CHAIN)
          </span>
        </div>
      </div>

      {/* 6-Point Trace Checks List */}
      <div className="p-5 space-y-3">
        {trace.checks.map((check, idx) => {
          return (
            <div
              key={check.code}
              className={`p-3.5 rounded border text-xs font-mono transition-all ${
                check.passed
                  ? 'bg-[#20231D]/80 border-[#363A30]'
                  : 'bg-[#FF6B57]/5 border-[#FF6B57]/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  {check.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-[#D7FF64] shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#FF6B57] shrink-0" />
                  )}
                  <span className="font-bold text-[#F1F0E8]">
                    0{idx + 1}. {check.title}
                  </span>
                  <span className="text-[10px] text-[#A2A69A]">[{check.code}]</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-[#A2A69A] hidden sm:inline">SIMULATION — NOT ON-CHAIN</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      check.passed
                        ? 'bg-[#D7FF64]/10 text-[#D7FF64] border border-[#D7FF64]/30'
                        : 'bg-[#FF6B57]/20 text-[#FF6B57] border border-[#FF6B57]/50'
                    }`}
                  >
                    {check.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              {/* Required vs Proposed Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 p-2 rounded bg-[#111310] border border-[#363A30]/50 text-[11px]">
                <div>
                  <span className="text-[#A2A69A] block text-[10px] uppercase">
                    Mandate Constraint:
                  </span>
                  <span className="text-[#F1F0E8] font-medium truncate block">
                    {check.requiredValue}
                  </span>
                </div>
                <div>
                  <span className="text-[#A2A69A] block text-[10px] uppercase">
                    Proposed Parameter:
                  </span>
                  <span
                    className={`font-medium truncate block ${
                      check.passed ? 'text-[#D7FF64]' : 'text-[#FF6B57]'
                    }`}
                  >
                    {check.proposedValue}
                  </span>
                </div>
              </div>

              {/* Exact Integer Arithmetic Trace */}
              {check.integerArithmeticTrace && (
                <div className="flex items-center space-x-1.5 text-[10px] text-[#A2A69A] font-mono mb-1.5 bg-[#141612] px-2 py-1 rounded border border-[#363A30]/40">
                  <Binary className="w-3 h-3 text-[#D7FF64]" />
                  <span>Integer Trace: </span>
                  <code className="text-[#F1F0E8]">{check.integerArithmeticTrace}</code>
                </div>
              )}

              {/* Result explanation */}
              <p
                className={`text-[11px] leading-relaxed mt-1 ${
                  check.passed ? 'text-[#A2A69A]' : 'text-[#FF6B57]'
                }`}
              >
                {check.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
