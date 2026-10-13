// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MandateRegistry
 * @notice Permission Before Payment — Enforces deterministic bounded mandates for AI agent payments on Monad.
 * @dev Protects principal funds by strictly checking recipient, single tx cap, 24h daily velocity,
 * purpose, expiration timestamp, and owner revocation before transferring native MON.
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

        // 1. Existence and ownership check (unauthorized callers)
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
     * @notice Retrieves the mandate details.
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
