import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, ShieldAlert, Cpu, Terminal, BookOpen, AlertTriangle } from 'lucide-react';
import { CONTRACT_CONFIG, MONAD_TESTNET_CONFIG } from '../config/contracts';

interface ContractConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractAddress: string;
  onSaveContractAddress: (newAddress: string) => void;
}

export const ContractConfigModal: React.FC<ContractConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedAbi, setCopiedAbi] = useState<boolean>(false);
  const [copiedSource, setCopiedSource] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'source' | 'abi' | 'guide'>('source');

  if (!isOpen) return null;

  const handleCopyAbi = () => {
    navigator.clipboard.writeText(JSON.stringify(CONTRACT_CONFIG.abi, null, 2));
    setCopiedAbi(true);
    setTimeout(() => setCopiedAbi(false), 2000);
  };

  const handleCopySolidity = async () => {
    try {
      const res = await fetch('/contracts/MandateRegistry.sol');
      const text = await res.text();
      navigator.clipboard.writeText(text);
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    } catch {
      navigator.clipboard.writeText('// Refer to contracts/MandateRegistry.sol in project');
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#191C17] border border-[#363A30] rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#363A30] flex items-center justify-between bg-[#141612]">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-[#D7FF64]" />
            <h3 className="font-heading font-bold text-base text-[#F1F0E8]">
              Smart Contract Architecture &amp; Deployment Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#A2A69A] hover:text-[#F1F0E8] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#363A30] bg-[#111310] px-6 text-xs font-mono">
          <button
            onClick={() => setActiveTab('source')}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'source'
                ? 'border-[#D7FF64] text-[#D7FF64]'
                : 'border-transparent text-[#A2A69A] hover:text-[#F1F0E8]'
            }`}
          >
            Solidity Contract (MandateRegistry.sol)
          </button>
          <button
            onClick={() => setActiveTab('abi')}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors ${
              activeTab === 'abi'
                ? 'border-[#D7FF64] text-[#D7FF64]'
                : 'border-transparent text-[#A2A69A] hover:text-[#F1F0E8]'
            }`}
          >
            Contract ABI
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2.5 px-3 border-b-2 font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'guide'
                ? 'border-[#D7FF64] text-[#D7FF64]'
                : 'border-transparent text-[#A2A69A] hover:text-[#F1F0E8]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Monad Deployment Steps</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Honest Status Disclaimer */}
          <div className="p-3.5 rounded border border-[#E5B85C]/50 bg-[#E5B85C]/10 text-xs font-mono text-[#E5B85C] flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold uppercase tracking-wider">
                SIMULATION ONLY — NO MONAD CONTRACT IS DEPLOYED IN THIS DEMO
              </div>
              <p className="text-[11px] text-[#A2A69A] mt-1 leading-relaxed">
                All evaluations in this demo are performed in deterministic session memory.
                No live Monad contract is deployed, and no fake transaction hashes are fabricated.
                The verified Solidity implementation is provided below for evaluation and testnet deployment.
              </p>
            </div>
          </div>

          {/* Network Details */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-[#111310] border border-[#363A30] rounded">
              <span className="text-[#A2A69A] block text-[10px] uppercase">Target Network</span>
              <span className="text-[#F1F0E8] font-bold">{MONAD_TESTNET_CONFIG.chainName}</span>
            </div>
            <div className="p-3 bg-[#111310] border border-[#363A30] rounded">
              <span className="text-[#A2A69A] block text-[10px] uppercase">Chain ID</span>
              <span className="text-[#D7FF64] font-bold">{MONAD_TESTNET_CONFIG.chainId} (0x279f)</span>
            </div>
          </div>

          {activeTab === 'source' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#A2A69A]">
                  MandateRegistry.sol (Solidity ^0.8.20)
                </span>
                <button
                  type="button"
                  onClick={handleCopySolidity}
                  className="flex items-center space-x-1 text-xs font-mono text-[#D7FF64] hover:underline"
                >
                  {copiedSource ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#D7FF64]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Solidity Code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#111310] border border-[#363A30] rounded p-3 text-[11px] font-mono text-[#A2A69A] max-h-64 overflow-y-auto">
                <pre>{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MandateRegistry {
    struct Mandate {
        address owner;
        string agentName;
        address recipient;
        uint256 maxPayment;
        uint256 dailyLimit;
        string purposeId;
        uint256 expiryTimestamp;
        bool isRevoked;
        uint256 spentToday;
        uint256 lastResetTimestamp;
    }

    mapping(bytes32 => Mandate) private _mandates;

    event MandateCreated(bytes32 indexed mandateId, address indexed owner, address recipient, uint256 maxPayment);
    event PaymentExecuted(bytes32 indexed mandateId, address indexed recipient, uint256 amount, string purposeId);
    event MandateRevoked(bytes32 indexed mandateId, address indexed owner);

    function createMandate(...) external;
    function executePayment(...) external payable returns (bool);
    function revokeMandate(bytes32 mandateId) external;
    function getMandate(bytes32 mandateId) external view returns (Mandate memory);
    function verifyMandateAuthorization(...) external view returns (bool isValid);
}`}</pre>
              </div>
              <p className="text-[11px] font-mono text-[#A2A69A]">
                Full source code with checks-effects-interactions, reentrancy guards, and daily velocity tracking is available in <code className="text-[#F1F0E8]">contracts/MandateRegistry.sol</code>.
              </p>
            </div>
          ) : activeTab === 'abi' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-[#A2A69A]">
                  Application Binary Interface (ABI)
                </span>
                <button
                  type="button"
                  onClick={handleCopyAbi}
                  className="flex items-center space-x-1 text-xs font-mono text-[#D7FF64] hover:underline"
                >
                  {copiedAbi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#D7FF64]" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ABI JSON</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#111310] border border-[#363A30] rounded p-3 text-[11px] font-mono text-[#A2A69A] max-h-64 overflow-y-auto">
                <pre>{JSON.stringify(CONTRACT_CONFIG.abi, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs font-mono">
              <div className="p-3.5 rounded bg-[#111310] border border-[#363A30] space-y-2">
                <div className="text-sm font-heading font-bold text-[#D7FF64]">
                  Deploy MandateRegistry to Monad Testnet via Remix
                </div>
                <p className="text-[#A2A69A] text-[11px] leading-relaxed">
                  Follow these steps to deploy <code className="text-[#F1F0E8]">contracts/MandateRegistry.sol</code> onto Monad Testnet:
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded bg-[#20231D] border border-[#363A30]">
                  <div className="font-bold text-[#F1F0E8] mb-1">Step 1: Get Monad Testnet MON</div>
                  <p className="text-[#A2A69A] text-[11px]">
                    Obtain testnet MON from the official Monad faucet:
                  </p>
                  <a
                    href="https://testnet.monad.xyz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#D7FF64] underline inline-flex items-center space-x-1 mt-1 text-[11px]"
                  >
                    <span>https://testnet.monad.xyz</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 rounded bg-[#20231D] border border-[#363A30]">
                  <div className="font-bold text-[#F1F0E8] mb-1">Step 2: Copy Solidity Contract</div>
                  <p className="text-[#A2A69A] text-[11px] mb-2">
                    Copy the complete code from <code className="text-[#F1F0E8]">contracts/MandateRegistry.sol</code>:
                  </p>
                  <button
                    onClick={handleCopySolidity}
                    className="px-3 py-1.5 rounded bg-[#111310] border border-[#363A30] text-[#D7FF64] hover:border-[#D7FF64] text-[11px] flex items-center space-x-1.5"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedSource ? 'Copied Solidity Code!' : 'Copy MandateRegistry.sol'}</span>
                  </button>
                </div>

                <div className="p-3 rounded bg-[#20231D] border border-[#363A30]">
                  <div className="font-bold text-[#F1F0E8] mb-1">Step 3: Deploy via Remix IDE</div>
                  <ol className="list-decimal list-inside text-[#A2A69A] text-[11px] space-y-1">
                    <li>Open <a href="https://remix.ethereum.org" target="_blank" rel="noopener noreferrer" className="text-[#D7FF64] underline">remix.ethereum.org</a>.</li>
                    <li>Create file <code className="text-[#F1F0E8]">MandateRegistry.sol</code> and paste code.</li>
                    <li>Select Compiler: <code className="text-[#F1F0E8]">0.8.20+</code> (e.g. 0.8.20, EVM: default/paris).</li>
                    <li>In Deploy tab, select Environment: <code className="text-[#D7FF64]">Injected Provider - MetaMask</code>.</li>
                    <li>Ensure network is Chain ID <code className="text-[#D7FF64]">10143</code> (Monad Testnet).</li>
                    <li>Click <code className="text-[#D7FF64]">Deploy</code> (constructor takes 0 arguments).</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#363A30] bg-[#141612] flex items-center justify-between">
          <a
            href="https://testnet.monadexplorer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-xs font-mono text-[#A2A69A] hover:text-[#D7FF64]"
          >
            <span>Monad Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#20231D] border border-[#363A30] text-[#F1F0E8] hover:bg-[#252a22] text-xs font-mono"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
