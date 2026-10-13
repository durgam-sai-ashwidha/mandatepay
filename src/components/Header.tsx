import { Shield, ShieldAlert, Cpu, Layers, ExternalLink, Settings, Wallet, AlertTriangle, Play } from 'lucide-react';
import { WalletState } from '../types/mandate';
import { shortenAddress } from '../lib/monad';

interface HeaderProps {
  currentTab: 'landing' | 'console' | 'verify';
  setCurrentTab: (tab: 'landing' | 'console' | 'verify') => void;
  wallet: WalletState;
  onConnectWallet: () => void;
  onSwitchNetwork: () => void;
  contractAddress: string;
  onOpenContractConfig: () => void;
  hasGeminiKey: boolean;
  onRunDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  wallet,
  onConnectWallet,
  onSwitchNetwork,
  contractAddress,
  onOpenContractConfig,
  hasGeminiKey,
  onRunDemo,
}) => {
  return (
    <div className="sticky top-0 z-40 w-full backdrop-blur-md">
      {/* Required Hackathon Disclaimer Banner */}
      <div className="bg-[#E5B85C]/15 border-b border-[#E5B85C]/40 text-[#E5B85C] px-4 py-1.5 text-center text-xs font-mono font-semibold flex items-center justify-center space-x-2">
        <span className="w-2 h-2 rounded-full bg-[#E5B85C] animate-pulse" />
        <span>Simulation only. No Monad contract is deployed in this demo.</span>
      </div>

      <header className="border-b border-[#363A30] bg-[#111310]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Wordmark */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setCurrentTab('landing')}
              className="flex items-center space-x-2 text-left group focus:outline-none"
            >
              <div className="w-8 h-8 rounded border border-[#363A30] bg-[#191C17] flex items-center justify-center text-[#D7FF64] group-hover:border-[#D7FF64] transition-colors">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <span className="font-heading font-bold text-lg tracking-wider text-[#F1F0E8] group-hover:text-[#D7FF64] transition-colors">
                  MANDATEPAY
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-mono uppercase rounded bg-[#20231D] text-[#E5B85C] border border-[#363A30]">
                  SIMULATION DEMO
                </span>
              </div>
            </button>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setCurrentTab('landing')}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                  currentTab === 'landing'
                    ? 'bg-[#20231D] text-[#D7FF64] border border-[#363A30]'
                    : 'text-[#A2A69A] hover:text-[#F1F0E8] hover:bg-[#191C17]'
                }`}
              >
                Protocol Overview
              </button>
              <button
                onClick={() => setCurrentTab('console')}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                  currentTab === 'console'
                    ? 'bg-[#20231D] text-[#D7FF64] border border-[#363A30]'
                    : 'text-[#A2A69A] hover:text-[#F1F0E8] hover:bg-[#191C17]'
                }`}
              >
                Security Console
              </button>
              <button
                onClick={() => setCurrentTab('verify')}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded transition-colors ${
                  currentTab === 'verify'
                    ? 'bg-[#20231D] text-[#D7FF64] border border-[#363A30]'
                    : 'text-[#A2A69A] hover:text-[#F1F0E8] hover:bg-[#191C17]'
                }`}
              >
                Recipient Verifier
              </button>
            </nav>
          </div>

          {/* Right Status & Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Run Demo Button */}
            <button
              onClick={onRunDemo}
              title="Run automated 6-scenario demo walkthrough"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded bg-[#D7FF64] text-[#111310] hover:bg-[#c6f04e] transition-colors focus:outline-none cursor-pointer shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Demo</span>
            </button>

            {/* Mode Indicator Button */}
            <button
              onClick={onOpenContractConfig}
              title="Inspect contract architecture and deployment instructions"
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono rounded border transition-colors bg-[#191C17] hover:bg-[#20231D] border-[#E5B85C]/50"
            >
              <span className="w-2 h-2 rounded-full bg-[#E5B85C]" />
              <span className="hidden lg:inline text-[#A2A69A]">Mode:</span>
              <span className="text-[#E5B85C] font-semibold">SIMULATION</span>
              <Settings className="w-3 h-3 text-[#A2A69A] ml-1" />
            </button>

            {/* AI Parser Status */}
            <div
              title={hasGeminiKey ? 'Gemini 3.8 Flash Parser Online' : 'Gemini Key Missing: Manual Entry Enabled'}
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono rounded border border-[#363A30] bg-[#191C17]"
            >
              <Cpu className="w-3.5 h-3.5 text-[#A2A69A]" />
              <span className="text-[#A2A69A]">AI Parser:</span>
              <span className={hasGeminiKey ? 'text-[#D7FF64]' : 'text-[#E5B85C]'}>
                {hasGeminiKey ? 'ONLINE' : 'MANUAL'}
              </span>
            </div>

            {/* Wallet Panel */}
            {wallet.isConnected ? (
              <div className="flex items-center space-x-2 px-3 py-1 bg-[#191C17] border border-[#363A30] rounded">
                <div className="text-right">
                  <div className="text-xs font-mono font-medium text-[#F1F0E8]">
                    {shortenAddress(wallet.address)}
                  </div>
                  <div className="text-[10px] font-mono text-[#A2A69A]">
                    Simulation Principal
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                disabled={wallet.isConnecting}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono uppercase font-semibold rounded bg-[#D7FF64] text-[#111310] hover:bg-[#c6f04e] transition-colors focus:outline-none"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>{wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};
