import { Mandate, PaymentProposal, PolicyCheckDetail, PolicyTrace } from '../types/mandate';
import { weiToMon } from './monad';

/**
 * Deterministic Policy Evaluation Engine
 * Pure function: calculates authorization checks using strict integer arithmetic.
 * No floating point comparisons.
 */
export function evaluateMandatePolicy(
  mandate: Mandate,
  proposal: PaymentProposal,
  currentTimeMs: number = Date.now()
): PolicyTrace {
  const checks: PolicyCheckDetail[] = [];

  // Parse integer values
  const propAmountWei = BigInt(proposal.amountWei || '0');
  const maxPaymentWei = BigInt(mandate.maxPaymentWei || '0');
  const dailyLimitWei = BigInt(mandate.dailyLimitWei || '0');
  const spentTodayWei = BigInt(mandate.spentTodayWei || '0');
  const projectedTotalWei = spentTodayWei + propAmountWei;

  // 1. Recipient Match
  const reqRecipient = (mandate.recipientAddress || '').toLowerCase();
  const propRecipient = (proposal.recipientAddress || '').toLowerCase();
  const recipientPassed = Boolean(reqRecipient && propRecipient && reqRecipient === propRecipient);
  checks.push({
    code: 'RECIPIENT_MATCH',
    title: 'Recipient Authorization',
    passed: recipientPassed,
    requiredValue: mandate.recipientLabel ? `${mandate.recipientLabel} (${mandate.recipientAddress})` : mandate.recipientAddress,
    proposedValue: proposal.recipientAddress || 'Not specified',
    message: recipientPassed
      ? 'Recipient address precisely matches mandate authorization.'
      : 'Recipient not authorized. Mandate whitelist does not permit this address.',
  });

  // 2. Max Single Payment Limit (Integer arithmetic)
  const maxPaymentPassed = propAmountWei > 0n && propAmountWei <= maxPaymentWei;
  checks.push({
    code: 'MAX_PAYMENT_LIMIT',
    title: 'Single Payment Ceiling',
    passed: maxPaymentPassed,
    requiredValue: `≤ ${weiToMon(maxPaymentWei)} MON (${maxPaymentWei.toString()} wei)`,
    proposedValue: `${weiToMon(propAmountWei)} MON (${propAmountWei.toString()} wei)`,
    integerArithmeticTrace: `${propAmountWei.toString()} wei ${propAmountWei <= maxPaymentWei ? '≤' : '>'} ${maxPaymentWei.toString()} wei`,
    message: maxPaymentPassed
      ? `Proposed amount ${weiToMon(propAmountWei)} MON is within single tx limit (${weiToMon(maxPaymentWei)} MON).`
      : propAmountWei <= 0n
      ? 'Proposed payment amount must be greater than 0.'
      : `Exceeds per-payment limit. Maximum allowed single disbursement is ${weiToMon(maxPaymentWei)} MON.`,
  });

  // 3. Daily Velocity Limit (Integer arithmetic)
  const dailyLimitPassed = projectedTotalWei <= dailyLimitWei;
  checks.push({
    code: 'DAILY_VELOCITY_LIMIT',
    title: 'Daily Velocity Limit',
    passed: dailyLimitPassed,
    requiredValue: `≤ ${weiToMon(dailyLimitWei)} MON total daily cap`,
    proposedValue: `${weiToMon(projectedTotalWei)} MON projected (${weiToMon(spentTodayWei)} already spent + ${weiToMon(propAmountWei)} proposed)`,
    integerArithmeticTrace: `(${spentTodayWei.toString()} + ${propAmountWei.toString()}) = ${projectedTotalWei.toString()} wei ${dailyLimitPassed ? '≤' : '>'} ${dailyLimitWei.toString()} wei`,
    message: dailyLimitPassed
      ? `Projected daily spend (${weiToMon(projectedTotalWei)} MON) will remain within the ${weiToMon(dailyLimitWei)} MON cap.`
      : `Payment would breach daily budget. Spent today: ${weiToMon(spentTodayWei)} MON. Remaining daily allowance: ${weiToMon(dailyLimitWei > spentTodayWei ? dailyLimitWei - spentTodayWei : 0n)} MON.`,
  });

  // 4. Purpose ID Match
  const reqPurpose = (mandate.purposeId || '').trim().toUpperCase();
  const propPurpose = (proposal.purposeId || '').trim().toUpperCase();
  const purposePassed = Boolean(reqPurpose && propPurpose && reqPurpose === propPurpose);
  checks.push({
    code: 'PURPOSE_MATCH',
    title: 'Designated Purpose Check',
    passed: purposePassed,
    requiredValue: reqPurpose,
    proposedValue: propPurpose || 'MISSING',
    message: purposePassed
      ? `Purpose [${propPurpose}] is authorized under this mandate.`
      : `Purpose mismatch. Proposed [${propPurpose || 'NONE'}] is not permitted for mandate [${reqPurpose}].`,
  });

  // 5. Expiry Check
  const isExpired = currentTimeMs >= mandate.expiryTimestamp;
  const expiryPassed = !isExpired;
  const diffMs = mandate.expiryTimestamp - currentTimeMs;
  const diffSec = Math.floor(diffMs / 1000);
  const remainingText = diffSec > 0
    ? `${Math.floor(diffSec / 60)}m ${diffSec % 60}s remaining`
    : `Expired ${Math.abs(diffSec)}s ago`;

  checks.push({
    code: 'EXPIRY_VALID',
    title: 'Mandate Validity Window',
    passed: expiryPassed,
    requiredValue: `Before ${new Date(mandate.expiryTimestamp).toLocaleTimeString()}`,
    proposedValue: `${new Date(currentTimeMs).toLocaleTimeString()} (${remainingText})`,
    message: expiryPassed
      ? `Mandate is active. Window open for another ${remainingText}.`
      : `Mandate expired. Payment rejected by time boundary.`,
  });

  // 6. Revocation Check
  const revocationPassed = !mandate.isRevoked;
  checks.push({
    code: 'REVOCATION_STATUS',
    title: 'Owner Revocation Status',
    passed: revocationPassed,
    requiredValue: 'Active (Not Revoked)',
    proposedValue: mandate.isRevoked ? 'REVOKED' : 'ACTIVE',
    message: revocationPassed
      ? 'Mandate is in good standing. No revocation signaled by owner.'
      : 'Mandate has been explicitly REVOKED by the owner. All disbursements permanently barred.',
  });

  const isCompliant = checks.every((c) => c.passed);

  return {
    proposalId: proposal.id,
    mandateId: mandate.mandateId,
    isCompliant,
    checks,
    computedAt: currentTimeMs,
  };
}
