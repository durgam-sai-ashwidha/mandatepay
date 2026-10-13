# MandatePay — Permission Before Payment

**Monad Hackathon Project // Category: Trust, Identity & AI Infrastructure**

> *“Don’t give your AI agent a wallet. Give it a mandate.”*

---

## Honest Submission Status & Simulation Notice

> **Simulation only. No Monad contract is deployed in this demo.**
> All policy checks, spending velocity calculations, and audit records in this demo run in deterministic in-memory simulation.
> This demo does not fabricate transaction hashes, wallet balances, blockchain activity, or claim on-chain enforcement.

Every policy decision in the application is strictly labeled:
`SIMULATION — NOT ON-CHAIN`

---

## The Problem: AI Agents Holding Private Keys is Dangerous

Today's crypto-AI projects commonly give autonomous agents their own funded wallets and raw private keys. This design has critical security flaws:
1. **Prompt Injection & Adversarial Jailbreaks**: A compromised agent can be commanded to transfer 100% of its treasury to an attacker.
2. **Infinite Loops & Runaway Spend**: Buggy agent logic can burn an entire wallet balance on runaway compute or API loops.
3. **No Vendor Verifiability**: Service providers (GPU hosts, data vendors) have no way to verify whether an agent is authorized to pay for services before delivering work.

---

## The Solution: Programmatic Mandates

Instead of giving agents unrestricted keys, the human owner defines a bounded **Mandate**:
- **Authorized Agent**: Identity of the agent authorized to propose payments (e.g. `ResearchBot`).
- **Approved Recipient**: Whitelisted recipient address (e.g. `LabelService`).
- **Single Payment Cap**: Strict ceiling per disbursement (e.g. `0.03 MON`).
- **24-Hour Velocity Limit**: Cumulative daily spending ceiling (e.g. `0.05 MON`).
- **Designated Purpose**: Exact category of permitted work (e.g. `DATA_LABELING`).
- **Expiry Timestamp**: Hard time-bound validity window (e.g. 10 minutes).
- **Owner Revocation**: Instant human killswitch to invalidate the mandate immediately.

---

## Protocol Flow

```
OWNER (Human Principal)
  │
  ▼ Sets bounded parameters
MANDATE (Deterministic Policy State)
  │
  ▼ Proposes payment for service
AGENT REQUEST (Autonomous Proposal via Gemini Parser)
  │
  ▼ Evaluates 6-point integer rules
CONTRACT CHECK (Deterministic Policy Evaluation — Simulation)
  │
  ▼ Independently queries authority before delivery
RECIPIENT (Vendor / Service Provider Verification)
```

---

## Automated 6-Scenario Guided Walkthrough

Click the **“Run Demo”** button in the header or console to automatically execute the six core scenarios:

1. **Create a payment mandate**:
   Owner defines bounded mandate (`MAN-9482-MON`) with a 0.03 MON per-payment cap and 0.05 MON daily spending limit for `ResearchBot`.
2. **AI requests payment to an unauthorized recipient**:
   `ResearchBot` requests 0.02 MON to `0x000...dead`.
   **Result**: Policy engine rejects payment: **“Recipient not authorized.”** (SIMULATION — NOT ON-CHAIN).
3. **AI requests an amount above the limit**:
   `ResearchBot` requests 0.08 MON to `LabelService` (exceeds the 0.03 MON single payment ceiling).
   **Result**: Policy engine rejects payment: **“Exceeds per-payment limit.”** (SIMULATION — NOT ON-CHAIN).
4. **AI requests a payment after expiry**:
   `ResearchBot` requests 0.02 MON after the 10-minute validity window has elapsed.
   **Result**: Policy engine rejects payment: **“Mandate expired.”** (SIMULATION — NOT ON-CHAIN).
5. **AI requests a valid payment**:
   `ResearchBot` requests 0.02 MON to `LabelService` for `DATA_LABELING`.
   **Result**: Policy engine evaluates all 6 checks as compliant (`APPROVED (SIMULATION — NOT ON-CHAIN)`), updates daily velocity (+0.02 MON), and appends the settlement entry to the audit ledger.
6. **Final Screen**:
   **“AI proposed. MandatePay evaluated. Monad would enforce.”**

---

## What is Simulated vs. What Monad Would Enforce

| Feature / Check | Current Demo (Simulation) | What `MandateRegistry.sol` Enforces on Monad |
|---|---|---|
| **Mandate Storage** | Browser memory & local storage | On-chain mapping `mapping(bytes32 => Mandate)` |
| **Agent Authorization** | Gemini extracts JSON; engine checks fields | Only owner can execute transfers under mandate |
| **Recipient Whitelist** | Case-insensitive EVM string comparison | `require(recipient == mandate.recipient)` |
| **Per-Payment Cap** | Integer arithmetic (`propWei <= maxWei`) | `require(amount <= mandate.maxPayment)` |
| **Daily Spending Velocity** | BigInt accumulation with reset logic | Reset after 1 day; `require(spentToday + amount <= dailyLimit)` |
| **Time Expiration** | JavaScript timestamp comparison | `require(block.timestamp < mandate.expiryTimestamp)` |
| **Owner Revocation** | In-memory flag `isRevoked: true` | `mandate.isRevoked = true` via `revokeMandate()` |
| **Fund Transfer** | Balance accounting update in state | Safe transfer `recipient.call{value: amount}("")` |
| **Reentrancy Protection** | JavaScript single-threaded event loop | `nonReentrant` state lock |
| **Recipient Verification** | UI verification query endpoint | Real view call `verifyMandateAuthorization()` |

---

## Complete Solidity Contract (`contracts/MandateRegistry.sol`)

Below is the verified Solidity contract matching the application ABI:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MandateRegistry
 * @notice Permission Before Payment — Enforces deterministic bounded mandates for AI agent payments on Monad.
 */
contract MandateRegistry {
    // Reentrancy Guard
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _reentrancyStatus;

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

    // Mapping from mandateId hash to Mandate struct
    mapping(bytes32 => Mandate) private _mandates;

    // Events matching ABI
    event MandateCreated(
        bytes32 indexed mandateId,
        address indexed owner,
        address recipient,
        uint256 maxPayment
    );

    event PaymentExecuted(
        bytes32 indexed mandateId,
        address indexed recipient,
        uint256 amount,
        string purposeId
    );

    event MandateRevoked(
        bytes32 indexed mandateId,
        address indexed owner
    );

    modifier nonReentrant() {
        require(_reentrancyStatus != _ENTERED, "ReentrancyGuard: reentrant call");
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    constructor() {
        _reentrancyStatus = _NOT_ENTERED;
    }

    /**
     * @notice Registers a new payment mandate bound to an authorized agent.
     */
    function createMandate(
        bytes32 mandateId,
        string calldata agentName,
        address recipient,
        uint256 maxPayment,
        uint256 dailyLimit,
        string calldata purposeId,
        uint256 expiryTimestamp
    ) external {
        require(mandateId != bytes32(0), "Invalid mandateId");
        require(_mandates[mandateId].owner == address(0), "Mandate already exists");
        require(recipient != address(0), "Invalid recipient address");
        require(maxPayment > 0, "Max payment must be greater than zero");
        require(dailyLimit >= maxPayment, "Daily limit must be >= max payment");
        require(expiryTimestamp > block.timestamp, "Expiry must be in the future");
        require(bytes(agentName).length > 0, "Agent name required");
        require(bytes(purposeId).length > 0, "Purpose ID required");

        _mandates[mandateId] = Mandate({
            owner: msg.sender,
            agentName: agentName,
            recipient: recipient,
            maxPayment: maxPayment,
            dailyLimit: dailyLimit,
            purposeId: purposeId,
            expiryTimestamp: expiryTimestamp,
            isRevoked: false,
            spentToday: 0,
            lastResetTimestamp: block.timestamp
        });

        emit MandateCreated(mandateId, msg.sender, recipient, maxPayment);
    }

    /**
     * @notice Executes payment under the authorized mandate.
     * @dev msg.value must strictly equal amount, and is safely transferred to recipient.
     */
    function executePayment(
        bytes32 mandateId,
        address recipient,
        uint256 amount,
        string calldata purposeId
    ) external payable nonReentrant returns (bool) {
        Mandate storage mandate = _mandates[mandateId];

        // 1. Existence and ownership check
        require(mandate.owner != address(0), "Mandate does not exist");
        require(msg.sender == mandate.owner, "Unauthorized caller: must be mandate owner");

        // 2. Revocation check
        require(!mandate.isRevoked, "Mandate has been revoked by owner");

        // 3. Expiry check
        require(block.timestamp < mandate.expiryTimestamp, "Mandate has expired");

        // 4. Recipient match
        require(recipient == mandate.recipient, "Unauthorized recipient address");

        // 5. Purpose match
        require(
            keccak256(bytes(purposeId)) == keccak256(bytes(mandate.purposeId)),
            "Purpose ID mismatch"
        );

        // 6. Payment limits
        require(amount > 0, "Amount must be greater than zero");
        require(amount <= mandate.maxPayment, "Amount exceeds max single payment limit");
        require(msg.value == amount, "Transferred MON must equal authorized amount");

        // 7. 24-hour daily limit accounting
        if (block.timestamp >= mandate.lastResetTimestamp + 1 days) {
            mandate.spentToday = 0;
            mandate.lastResetTimestamp = block.timestamp;
        }

        require(
            mandate.spentToday + amount <= mandate.dailyLimit,
            "Payment exceeds daily spending limit"
        );

        // Update state before external transfer (checks-effects-interactions)
        mandate.spentToday += amount;

        // 8. Safe MON transfer to recipient
        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Failed to transfer MON to recipient");

        emit PaymentExecuted(mandateId, recipient, amount, purposeId);
        return true;
    }

    /**
     * @notice Revokes a mandate immediately.
     */
    function revokeMandate(bytes32 mandateId) external {
        Mandate storage mandate = _mandates[mandateId];
        require(mandate.owner != address(0), "Mandate does not exist");
        require(msg.sender == mandate.owner, "Unauthorized caller: must be mandate owner");
        require(!mandate.isRevoked, "Mandate already revoked");

        mandate.isRevoked = true;
        emit MandateRevoked(mandateId, msg.sender);
    }

    /**
     * @notice Retrieves mandate details.
     */
    function getMandate(bytes32 mandateId) external view returns (Mandate memory) {
        require(_mandates[mandateId].owner != address(0), "Mandate does not exist");
        return _mandates[mandateId];
    }

    /**
     * @notice Recipient-side verification: checks if a claimed payment is authorized.
     */
    function verifyMandateAuthorization(
        bytes32 mandateId,
        address recipient,
        uint256 amount,
        string calldata purposeId
    ) external view returns (bool isValid) {
        Mandate storage mandate = _mandates[mandateId];
        if (mandate.owner == address(0)) return false;
        if (mandate.isRevoked) return false;
        if (block.timestamp >= mandate.expiryTimestamp) return false;
        if (recipient != mandate.recipient) return false;
        if (amount == 0 || amount > mandate.maxPayment) return false;
        if (keccak256(bytes(purposeId)) != keccak256(bytes(mandate.purposeId))) return false;

        uint256 currentSpent = mandate.spentToday;
        if (block.timestamp >= mandate.lastResetTimestamp + 1 days) {
            currentSpent = 0;
        }

        if (currentSpent + amount > mandate.dailyLimit) return false;

        return true;
    }
}
```

---

## Monad Testnet Deployment Instructions (Remix IDE)

To deploy the contract onto Monad Testnet:

1. **Get Monad Testnet MON**:
   - Network: Monad Testnet
   - Chain ID: `10143` (`0x279f`)
   - RPC URL: `https://testnet-rpc.monad.xyz`
   - Currency Symbol: `MON`
   - Explorer: `https://testnet.monadexplorer.com`
   - Official Faucet: `https://testnet.monad.xyz`

2. **Open Remix IDE**:
   - Navigate to [remix.ethereum.org](https://remix.ethereum.org).
   - Create a new file `MandateRegistry.sol` under `contracts/`.
   - Paste the code from `contracts/MandateRegistry.sol`.

3. **Compile**:
   - In the Solidity Compiler tab, select version `0.8.20` or higher.
   - EVM Version: `paris` or `default`.
   - Click **Compile MandateRegistry.sol**.

4. **Deploy**:
   - Go to the **Deploy & Run Transactions** tab.
   - In Environment, select **Injected Provider - MetaMask**.
   - Confirm your MetaMask is switched to Monad Testnet (Chain ID `10143`).
   - Select contract `MandateRegistry`.
   - Click **Deploy** (constructor requires 0 arguments).
   - Sign the deployment transaction in MetaMask.
