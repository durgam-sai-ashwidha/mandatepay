import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ConsoleView } from './components/ConsoleView';
import { RecipientVerificationPanel } from './components/RecipientVerificationPanel';
import { ContractConfigModal } from './components/ContractConfigModal';
import { CreateMandateModal } from './components/CreateMandateModal';
import { DemoFinalModal } from './components/DemoFinalModal';
import {
  Mandate,
  PaymentProposal,
  WalletState,
  TransactionRecord,
} from './types/mandate';
import { CONTRACT_CONFIG, DEMO_CONFIG, MONAD_TESTNET_CONFIG } from './config/contracts';
import { monToWei, fetchMonadBalance, switchOrAddMonadTestnet } from './lib/monad';
import { evaluateMandatePolicy } from './lib/policyEngine';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'console' | 'verify'>('landing');

  // Contract address state (empty by default in honest simulation)
  const [contractAddress, setContractAddress] = useState<string>(() => {
    return localStorage.getItem('mp_contract_address') || CONTRACT_CONFIG.defaultAddress;
  });

  // Modal states
  const [isContractModalOpen, setIsContractModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isDemoFinalModalOpen, setIsDemoFinalModalOpen] = useState<boolean>(false);

  // Guided Demo Walkthrough State
  const [isDemoRunning, setIsDemoRunning] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(1);
  const [demoIsPlaying, setDemoIsPlaying] = useState<boolean>(false);
  const [demoProgressPercent, setDemoProgressPercent] = useState<number>(0);

  // Gemini API key presence
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);

  // Check backend health for Gemini key
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasGeminiKey) {
          setHasGeminiKey(true);
        }
      })
      .catch(() => {
        setHasGeminiKey(false);
      });
  }, []);

  // Wallet State
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isMonadTestnet: false,
    balanceMon: null,
    isConnecting: false,
    error: null,
  });

  // Generate Default Demo Mandate
  const createDemoMandate = useCallback((ownerAddress?: string): Mandate => {
    const maxWei = monToWei(DEMO_CONFIG.maxPaymentMon);
    const dailyWei = monToWei(DEMO_CONFIG.dailyLimitMon);
    const now = Date.now();
    return {
      mandateId: 'MAN-9482-MON',
      owner: ownerAddress || '0x5A4F0aD6F2C3B7E9e42A11370b4E5679A81D2305',
      authorizedAgent: DEMO_CONFIG.agentName,
      recipientAddress: DEMO_CONFIG.recipientAddress,
      recipientLabel: DEMO_CONFIG.recipientLabel,
      maxPaymentWei: maxWei.toString(),
      dailyLimitWei: dailyWei.toString(),
      spentTodayWei: '0',
      purposeId: DEMO_CONFIG.purposeId,
      expiryTimestamp: now + DEMO_CONFIG.expiryMinutes * 60 * 1000, // 10 minutes
      isRevoked: false,
      createdAt: now,
    };
  }, []);

  // Mandates State
  const [mandates, setMandates] = useState<Mandate[]>(() => {
    const saved = localStorage.getItem('mp_mandates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [createDemoMandate()];
  });

  const [activeMandateId, setActiveMandateId] = useState<string>('MAN-9482-MON');

  // Save mandates to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mp_mandates', JSON.stringify(mandates));
    } catch (e) {
      console.error(e);
    }
  }, [mandates]);

  // Current active mandate object
  const activeMandate = useMemo(() => {
    return mandates.find((m) => m.mandateId === activeMandateId) || mandates[0] || null;
  }, [mandates, activeMandateId]);

  // Current Proposal State
  const [currentProposal, setCurrentProposal] = useState<PaymentProposal | null>(() => {
    return {
      id: 'prop-init-1',
      mandateId: 'MAN-9482-MON',
      recipientAddress: DEMO_CONFIG.recipientAddress,
      amountInMon: '0.02',
      amountWei: monToWei('0.02').toString(),
      purposeId: DEMO_CONFIG.purposeId,
      description: 'Initial compliant proposal for batch #104 dataset labeling by ResearchBot',
      proposedByAgent: DEMO_CONFIG.agentName,
      timestamp: Date.now(),
      parsedByAi: false,
    };
  });

  // Deterministic Policy Trace: evaluates in real-time
  const policyTrace = useMemo(() => {
    if (!activeMandate || !currentProposal) return null;
    return evaluateMandatePolicy(activeMandate, currentProposal, Date.now());
  }, [activeMandate, currentProposal]);

  // Audit Records State
  const [auditRecords, setAuditRecords] = useState<TransactionRecord[]>(() => {
    const saved = localStorage.getItem('mp_audit_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [
      {
        id: 'seed-record-1',
        mandateId: 'MAN-9482-MON',
        proposalId: 'prop-pre-1',
        recipient: DEMO_CONFIG.recipientAddress,
        recipientLabel: DEMO_CONFIG.recipientLabel,
        amountMon: '0.01',
        amountWei: monToWei('0.01').toString(),
        purposeId: 'DATA_LABELING',
        description: 'Synthetic training dataset sample generation (Simulation)',
        isSimulation: true,
        status: 'SIMULATED_SUCCESS',
        timestamp: Date.now() - 3600000,
      },
    ];
  });

  // Save audit records
  useEffect(() => {
    try {
      localStorage.setItem('mp_audit_records', JSON.stringify(auditRecords));
    } catch (e) {
      console.error(e);
    }
  }, [auditRecords]);

  // Wallet Connection Logic
  const checkWalletState = useCallback(async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return;
    }
    const ethereum = (window as any).ethereum;
    try {
      const accounts: string[] = await ethereum.request({ method: 'eth_accounts' });
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        const isMonad = chainId === MONAD_TESTNET_CONFIG.chainId;
        const balance = await fetchMonadBalance(address);

        setWallet({
          address,
          chainId,
          isConnected: true,
          isMonadTestnet: isMonad,
          balanceMon: balance,
          isConnecting: false,
          error: null,
        });
      }
    } catch (err: any) {
      console.error('Error querying wallet state:', err);
    }
  }, []);

  useEffect(() => {
    checkWalletState();

    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      const handleAccountsChanged = (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          setWallet({
            address: null,
            chainId: null,
            isConnected: false,
            isMonadTestnet: false,
            balanceMon: null,
            isConnecting: false,
            error: null,
          });
        } else {
          checkWalletState();
        }
      };

      const handleChainChanged = () => {
        checkWalletState();
      };

      ethereum.on?.('accountsChanged', handleAccountsChanged);
      ethereum.on?.('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
        ethereum.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, [checkWalletState]);

  const handleConnectWallet = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert(
        'No EVM wallet detected (e.g. MetaMask). MandatePay is running in deterministic SIMULATION mode.'
      );
      return;
    }
    try {
      setWallet((w) => ({ ...w, isConnecting: true, error: null }));
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        await checkWalletState();
      }
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setWallet((w) => ({
        ...w,
        isConnecting: false,
        error: err.message || 'Failed to connect wallet',
      }));
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchOrAddMonadTestnet();
      await checkWalletState();
    } catch (err: any) {
      console.error('Failed to switch to Monad Testnet:', err);
      alert(`Could not switch network: ${err.message || 'Error occurred'}`);
    }
  };

  // Actions
  const handleRevokeMandate = (mandateId: string) => {
    setMandates((prev) =>
      prev.map((m) => {
        if (m.mandateId === mandateId) {
          return { ...m, isRevoked: true };
        }
        return m;
      })
    );

    const revokedRecord: TransactionRecord = {
      id: `sim-revoke-${Date.now()}`,
      mandateId,
      proposalId: 'N/A',
      recipient: activeMandate?.recipientAddress || 'N/A',
      recipientLabel: activeMandate?.recipientLabel,
      amountMon: '0',
      amountWei: '0',
      purposeId: activeMandate?.purposeId || 'N/A',
      description: `Owner triggered immediate revocation for mandate [${mandateId}] (SIMULATION — NOT ON-CHAIN).`,
      isSimulation: true,
      status: 'SIMULATED_SUCCESS',
      timestamp: Date.now(),
    };
    setAuditRecords((prev) => [revokedRecord, ...prev]);
  };

  const handleResetDemo = () => {
    const demo = createDemoMandate(wallet.address || undefined);
    setMandates((prev) => {
      const filtered = prev.filter((m) => m.mandateId !== demo.mandateId);
      return [demo, ...filtered];
    });
    setActiveMandateId(demo.mandateId);

    // Reset proposal to compliant preset
    setCurrentProposal({
      id: `prop-${Date.now()}`,
      mandateId: demo.mandateId,
      recipientAddress: DEMO_CONFIG.recipientAddress,
      amountInMon: '0.02',
      amountWei: monToWei('0.02').toString(),
      purposeId: DEMO_CONFIG.purposeId,
      description: 'ResearchBot requesting 0.02 MON to LabelService for DATA_LABELING batch #104',
      proposedByAgent: DEMO_CONFIG.agentName,
      timestamp: Date.now(),
      parsedByAi: false,
    });
  };

  const handleCreateMandate = (newMandate: Mandate) => {
    setMandates((prev) => [newMandate, ...prev]);
    setActiveMandateId(newMandate.mandateId);

    const record: TransactionRecord = {
      id: `sim-create-${Date.now()}`,
      mandateId: newMandate.mandateId,
      proposalId: 'N/A',
      recipient: newMandate.recipientAddress,
      recipientLabel: newMandate.recipientLabel,
      amountMon: '0',
      amountWei: '0',
      purposeId: newMandate.purposeId,
      description: `Mandate [${newMandate.mandateId}] created in simulation for ${newMandate.authorizedAgent} (SIMULATION — NOT ON-CHAIN).`,
      isSimulation: true,
      status: 'SIMULATED_SUCCESS',
      timestamp: Date.now(),
    };
    setAuditRecords((prev) => [record, ...prev]);
  };

  const handleParsedProposal = (data: {
    recipientAddress: string;
    amountInMon: string;
    purposeId: string;
    description: string;
    parsedByAi: boolean;
  }) => {
    if (!activeMandate) return;
    const amountWei = monToWei(data.amountInMon);
    const newProp: PaymentProposal = {
      id: `prop-${Date.now()}`,
      mandateId: activeMandate.mandateId,
      recipientAddress: data.recipientAddress,
      amountInMon: data.amountInMon,
      amountWei: amountWei.toString(),
      purposeId: data.purposeId,
      description: data.description,
      proposedByAgent: activeMandate.authorizedAgent,
      timestamp: Date.now(),
      parsedByAi: data.parsedByAi,
    };
    setCurrentProposal(newProp);
  };

  const handlePaymentExecuted = (record: TransactionRecord, addedSpentWei: bigint) => {
    // 1. Update mandate spentToday
    setMandates((prev) =>
      prev.map((m) => {
        if (m.mandateId === record.mandateId) {
          const currentSpent = BigInt(m.spentTodayWei || '0');
          const updatedSpent = currentSpent + addedSpentWei;
          return {
            ...m,
            spentTodayWei: updatedSpent.toString(),
          };
        }
        return m;
      })
    );

    // 2. Prepend to audit records
    setAuditRecords((prev) => [record, ...prev]);
  };

  const handleSaveContractAddress = (newAddr: string) => {
    setContractAddress(newAddr);
    localStorage.setItem('mp_contract_address', newAddr);
  };

  // =========================================================================
  // Guided Demo Walkthrough: 6 Required Scenarios Implementation
  // =========================================================================
  const applyDemoScenario = useCallback((step: number) => {
    const now = Date.now();
    const demoBase = createDemoMandate(wallet.address || undefined);

    if (step === 1) {
      // Scenario 1: Create a payment mandate.
      const freshMandate: Mandate = {
        ...demoBase,
        spentTodayWei: '0',
        isRevoked: false,
        expiryTimestamp: now + 10 * 60 * 1000,
      };
      setMandates((prev) => [freshMandate, ...prev.filter((m) => m.mandateId !== freshMandate.mandateId)]);
      setActiveMandateId(freshMandate.mandateId);

      setCurrentProposal({
        id: `prop-demo-1-${now}`,
        mandateId: freshMandate.mandateId,
        recipientAddress: DEMO_CONFIG.recipientAddress,
        amountInMon: '0.02',
        amountWei: monToWei('0.02').toString(),
        purposeId: DEMO_CONFIG.purposeId,
        description: 'Mandate established: ResearchBot bounded to 0.03 MON cap, 0.05 MON daily limit (SIMULATION — NOT ON-CHAIN)',
        proposedByAgent: DEMO_CONFIG.agentName,
        timestamp: now,
        parsedByAi: false,
      });
      setIsDemoFinalModalOpen(false);
    } else if (step === 2) {
      // Scenario 2: AI requests a payment to an unauthorized recipient.
      // Show rejection: “Recipient not authorized.”
      const activeM = {
        ...demoBase,
        spentTodayWei: '0',
        isRevoked: false,
        expiryTimestamp: now + 10 * 60 * 1000,
      };
      setMandates((prev) => [activeM, ...prev.filter((m) => m.mandateId !== activeM.mandateId)]);
      setActiveMandateId(activeM.mandateId);

      setCurrentProposal({
        id: `prop-demo-2-${now}`,
        mandateId: activeM.mandateId,
        recipientAddress: '0x000000000000000000000000000000000000dead',
        amountInMon: '0.02',
        amountWei: monToWei('0.02').toString(),
        purposeId: DEMO_CONFIG.purposeId,
        description: 'ResearchBot attempts payment to unauthorized address 0x000...dead',
        proposedByAgent: DEMO_CONFIG.agentName,
        timestamp: now,
        parsedByAi: false,
      });
      setIsDemoFinalModalOpen(false);
    } else if (step === 3) {
      // Scenario 3: AI requests an amount above the limit.
      // Show rejection: “Exceeds per-payment limit.”
      const activeM = {
        ...demoBase,
        spentTodayWei: '0',
        isRevoked: false,
        expiryTimestamp: now + 10 * 60 * 1000,
      };
      setMandates((prev) => [activeM, ...prev.filter((m) => m.mandateId !== activeM.mandateId)]);
      setActiveMandateId(activeM.mandateId);

      setCurrentProposal({
        id: `prop-demo-3-${now}`,
        mandateId: activeM.mandateId,
        recipientAddress: DEMO_CONFIG.recipientAddress,
        amountInMon: '0.08',
        amountWei: monToWei('0.08').toString(),
        purposeId: DEMO_CONFIG.purposeId,
        description: 'ResearchBot requesting 0.08 MON for dataset labeling (Exceeds 0.03 MON single limit)',
        proposedByAgent: DEMO_CONFIG.agentName,
        timestamp: now,
        parsedByAi: false,
      });
      setIsDemoFinalModalOpen(false);
    } else if (step === 4) {
      // Scenario 4: AI requests a payment after expiry.
      // Show rejection: “Mandate expired.”
      const expiredM: Mandate = {
        ...demoBase,
        spentTodayWei: '0',
        isRevoked: false,
        expiryTimestamp: now - 60000, // Expired 1 minute ago
      };
      setMandates((prev) => [expiredM, ...prev.filter((m) => m.mandateId !== expiredM.mandateId)]);
      setActiveMandateId(expiredM.mandateId);

      setCurrentProposal({
        id: `prop-demo-4-${now}`,
        mandateId: expiredM.mandateId,
        recipientAddress: DEMO_CONFIG.recipientAddress,
        amountInMon: '0.02',
        amountWei: monToWei('0.02').toString(),
        purposeId: DEMO_CONFIG.purposeId,
        description: 'ResearchBot requesting 0.02 MON after mandate validity window has closed',
        proposedByAgent: DEMO_CONFIG.agentName,
        timestamp: now,
        parsedByAi: false,
      });
      setIsDemoFinalModalOpen(false);
    } else if (step === 5) {
      // Scenario 5: AI requests a valid payment.
      // Show approval and add it to the audit ledger.
      const validM: Mandate = {
        ...demoBase,
        spentTodayWei: '0',
        isRevoked: false,
        expiryTimestamp: now + 10 * 60 * 1000,
      };
      setMandates((prev) => [validM, ...prev.filter((m) => m.mandateId !== validM.mandateId)]);
      setActiveMandateId(validM.mandateId);

      const approvedProp: PaymentProposal = {
        id: `prop-demo-5-${now}`,
        mandateId: validM.mandateId,
        recipientAddress: DEMO_CONFIG.recipientAddress,
        amountInMon: '0.02',
        amountWei: monToWei('0.02').toString(),
        purposeId: DEMO_CONFIG.purposeId,
        description: 'ResearchBot requesting 0.02 MON to LabelService for DATA_LABELING batch #104',
        proposedByAgent: DEMO_CONFIG.agentName,
        timestamp: now,
        parsedByAi: false,
      };
      setCurrentProposal(approvedProp);

      // Execute simulated payment & add to audit ledger
      const record: TransactionRecord = {
        id: `sim-demo-${now}`,
        mandateId: validM.mandateId,
        proposalId: approvedProp.id,
        recipient: approvedProp.recipientAddress,
        recipientLabel: validM.recipientLabel,
        amountMon: approvedProp.amountInMon,
        amountWei: approvedProp.amountWei,
        purposeId: approvedProp.purposeId,
        description: 'Approved payment disbursed in simulation for ResearchBot batch #104 (SIMULATION — NOT ON-CHAIN)',
        isSimulation: true,
        status: 'SIMULATED_SUCCESS',
        timestamp: now,
      };

      handlePaymentExecuted(record, BigInt(approvedProp.amountWei));
      setIsDemoFinalModalOpen(false);
    } else if (step === 6) {
      // Scenario 6: Show final screen: “AI proposed. MandatePay evaluated. Monad would enforce.”
      setIsDemoFinalModalOpen(true);
      setDemoIsPlaying(false);
    }
  }, [createDemoMandate, wallet.address]);

  // Automated step timer (walks through scenarios automatically)
  useEffect(() => {
    if (!isDemoRunning || !demoIsPlaying) return;

    if (demoStep >= 6) {
      setDemoIsPlaying(false);
      setIsDemoFinalModalOpen(true);
      return;
    }

    const interval = setInterval(() => {
      setDemoProgressPercent((prev) => {
        if (prev >= 100) {
          const nextStep = demoStep + 1;
          setDemoStep(nextStep);
          applyDemoScenario(nextStep);
          return 0;
        }
        return prev + 2.5; // ~4 seconds per scenario
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isDemoRunning, demoIsPlaying, demoStep, applyDemoScenario]);

  const handleStartRunDemo = () => {
    setIsDemoRunning(true);
    setDemoStep(1);
    setDemoProgressPercent(0);
    setDemoIsPlaying(true);
    setCurrentTab('console');
    applyDemoScenario(1);
  };

  const handleToggleDemoPlay = () => {
    setDemoIsPlaying((prev) => !prev);
  };

  const handleNextDemoStep = () => {
    const next = Math.min(6, demoStep + 1);
    setDemoStep(next);
    setDemoProgressPercent(0);
    applyDemoScenario(next);
  };

  const handlePrevDemoStep = () => {
    const prev = Math.max(1, demoStep - 1);
    setDemoStep(prev);
    setDemoProgressPercent(0);
    applyDemoScenario(prev);
  };

  const handleSelectDemoStep = (step: number) => {
    setDemoStep(step);
    setDemoProgressPercent(0);
    applyDemoScenario(step);
  };

  const handleExitDemo = () => {
    setIsDemoRunning(false);
    setDemoIsPlaying(false);
    setIsDemoFinalModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#111310] text-[#F1F0E8] flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        wallet={wallet}
        onConnectWallet={handleConnectWallet}
        onSwitchNetwork={handleSwitchNetwork}
        contractAddress={contractAddress}
        onOpenContractConfig={() => setIsContractModalOpen(true)}
        hasGeminiKey={hasGeminiKey}
        onRunDemo={handleStartRunDemo}
      />

      {/* Main Views */}
      <main className="flex-1">
        {currentTab === 'landing' ? (
          <LandingPage
            onGoToConsole={() => setCurrentTab('console')}
            onLoadDemoAndGo={() => {
              handleResetDemo();
              setCurrentTab('console');
            }}
            onRunDemo={handleStartRunDemo}
          />
        ) : currentTab === 'console' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
            <ConsoleView
              mandates={mandates}
              activeMandateId={activeMandateId}
              onSelectMandate={setActiveMandateId}
              onRevokeMandate={handleRevokeMandate}
              onResetDemo={handleResetDemo}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onOpenContractConfig={() => setIsContractModalOpen(true)}
              currentProposal={currentProposal}
              policyTrace={policyTrace}
              onParsedProposal={handleParsedProposal}
              wallet={wallet}
              contractAddress={contractAddress}
              onConnectWallet={handleConnectWallet}
              onSwitchNetwork={handleSwitchNetwork}
              onPaymentExecuted={handlePaymentExecuted}
              auditRecords={auditRecords}
              onClearHistory={() => setAuditRecords([])}
              hasGeminiKey={hasGeminiKey}
              isDemoRunning={isDemoRunning}
              demoStep={demoStep}
              demoProgressPercent={demoProgressPercent}
              demoIsPlaying={demoIsPlaying}
              onRunDemo={handleStartRunDemo}
              onToggleDemoPlay={handleToggleDemoPlay}
              onNextDemoStep={handleNextDemoStep}
              onPrevDemoStep={handlePrevDemoStep}
              onSelectDemoStep={handleSelectDemoStep}
              onExitDemo={handleExitDemo}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
            <RecipientVerificationPanel
              mandate={activeMandate}
              contractAddress={contractAddress}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <ContractConfigModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        contractAddress={contractAddress}
        onSaveContractAddress={handleSaveContractAddress}
      />

      <CreateMandateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateMandate={handleCreateMandate}
        wallet={wallet}
        contractAddress={contractAddress}
        onConnectWallet={handleConnectWallet}
        onSwitchNetwork={handleSwitchNetwork}
      />

      {/* Scenario 6 Final Screen Modal */}
      <DemoFinalModal
        isOpen={isDemoFinalModalOpen}
        onClose={() => setIsDemoFinalModalOpen(false)}
        onReplayDemo={handleStartRunDemo}
        onOpenContractCode={() => {
          setIsDemoFinalModalOpen(false);
          setIsContractModalOpen(true);
        }}
      />
    </div>
  );
}
