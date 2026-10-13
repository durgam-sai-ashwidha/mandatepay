import React from 'react';
import { History, ExternalLink, ShieldCheck, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { TransactionRecord } from '../types/mandate';
import { shortenAddress } from '../lib/monad';

interface AuditHistorySectionProps {
  records: TransactionRecord[];
  onClearHistory: () => void;
}

export const AuditHistorySection: React.FC<AuditHistorySectionProps> = ({
  records,
  onClearHistory,
}) => {
  return (
    <div className="rounded border border-[#363A30] bg-[#191C17] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#363A30] bg-[#141612] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-[#D7FF64]" />
          <h4 className="font-heading font-bold text-sm text-[#F1F0E8]">
            Settlement Audit Ledger
          </h4>
          <span className="text-xs font-mono text-[#A2A69A]">
            ({records.length} records)
          </span>
        </div>

        {records.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[11px] font-mono text-[#A2A69A] hover:text-[#FF6B57] transition-colors"
          >
            Clear Ledger
          </button>
        )}
      </div>

      {records.length === 0 ? (
        <div className="p-8 text-center text-xs font-mono text-[#A2A69A]">
          <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
          No transactions recorded yet in this session. Execute a proposal or test simulation above to generate verifiable audit entries.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#141612] border-b border-[#363A30] text-[#A2A69A]">
                <th className="p-3">Time</th>
                <th className="p-3">Mandate ID</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Purpose</th>
                <th className="p-3">Mode & Status</th>
                <th className="p-3">Tx Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#363A30]/60">
              {records.map((r) => {
                const isConfirmed = r.status === 'CONFIRMED' || r.status === 'SIMULATED_SUCCESS';
                return (
                  <tr key={r.id} className="hover:bg-[#20231D]/50 transition-colors">
                    <td className="p-3 text-[#A2A69A] whitespace-nowrap">
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3 text-[#F1F0E8] font-medium whitespace-nowrap">
                      {r.mandateId}
                    </td>
                    <td className="p-3 text-[#F1F0E8] whitespace-nowrap" title={r.recipient}>
                      {r.recipientLabel ? `${r.recipientLabel}` : shortenAddress(r.recipient)}
                    </td>
                    <td className="p-3 text-[#D7FF64] font-bold whitespace-nowrap">
                      {r.amountMon} MON
                    </td>
                    <td className="p-3 text-[#A2A69A] whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-[#111310] border border-[#363A30] text-[10px] text-[#F1F0E8]">
                        {r.purposeId}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold border bg-[#20231D] text-[#D7FF64] border-[#363A30]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>SIMULATED — SUCCESS</span>
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="text-[#A2A69A]/70 text-[11px]">N/A (Simulation — Not On-Chain)</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
