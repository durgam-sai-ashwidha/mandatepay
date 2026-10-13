import fs from 'fs';
import path from 'path';
// @ts-ignore
import solc from 'solc';
// @ts-ignore
import ganache from 'ganache';
import {
  parseEther,
  formatEther,
  keccak256,
  toHex,
  encodeFunctionData,
  decodeFunctionResult,
} from 'viem';

export function compileMandateRegistry() {
  const contractPath = path.resolve('contracts', 'MandateRegistry.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'MandateRegistry.sol': { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: 'paris',
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode'],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const fatal = output.errors.filter((e: any) => e.severity === 'error');
    if (fatal.length > 0) {
      console.error('Compilation fatal errors:', fatal);
      throw new Error('Solidity compilation failed');
    }
  }

  const contractData = output.contracts['MandateRegistry.sol']['MandateRegistry'];
  const abi = contractData.abi;
  const bytecode = '0x' + contractData.evm.bytecode.object;

  return { abi, bytecode };
}

async function runTests() {
  console.log('====================================================');
  console.log(' MANDATEPAY ON-CHAIN TEST SUITE (Monad / EVM)');
  console.log('====================================================\n');

  console.log('1. Compiling MandateRegistry.sol...');
  const { abi, bytecode } = compileMandateRegistry();
  console.log('✓ Compilation succeeded. Bytecode size:', bytecode.length / 2, 'bytes.\n');

  console.log('2. Starting isolated test EVM instance...');
  const provider = ganache.provider({
    logging: { quiet: true },
    wallet: {
      totalAccounts: 5,
      defaultBalance: 100, // 100 MON per account
    },
  });

  const accounts = (await provider.request({
    method: 'eth_accounts',
    params: [],
  })) as string[];

  const [owner, agent, recipient, attacker, otherRecipient] = accounts;
  console.log('Owner address:    ', owner);
  console.log('Recipient address:', recipient);
  console.log('Attacker address: ', attacker);

  // Deploy contract
  console.log('\n3. Deploying MandateRegistry...');
  const deployTx = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: owner,
        data: bytecode,
        gas: '0x3d0900', // 4,000,000 gas
      },
    ],
  });

  const receipt = (await provider.request({
    method: 'eth_getTransactionReceipt',
    params: [deployTx],
  })) as any;

  const contractAddress = receipt.contractAddress;
  console.log('✓ Deployed MandateRegistry at address:', contractAddress);

  // Helper wrappers for EVM interaction
  async function callRead(functionName: string, args: any[], from: string = owner) {
    const data = encodeFunctionData({ abi, functionName, args });
    const resultHex = (await provider.request({
      method: 'eth_call',
      params: [{ from, to: contractAddress, data }, 'latest'],
    })) as `0x${string}`;
    return decodeFunctionResult({ abi, functionName, data: resultHex });
  }

  async function callWrite(
    functionName: string,
    args: any[],
    from: string = owner,
    value: bigint = 0n
  ) {
    const data = encodeFunctionData({ abi, functionName, args });
    const txObj: any = {
      from,
      to: contractAddress,
      data,
      gas: '0x2dc6c0', // 3,000,000 gas
    };
    if (value > 0n) {
      txObj.value = '0x' + value.toString(16);
    }
    const hash = (await provider.request({
      method: 'eth_sendTransaction',
      params: [txObj],
    })) as string;
    const rc = (await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [hash],
    })) as any;
    if (rc.status !== '0x1') {
      throw new Error(`Transaction reverted: ${hash}`);
    }
    return hash;
  }

  async function getBalance(addr: string): Promise<bigint> {
    const hex = (await provider.request({
      method: 'eth_getBalance',
      params: [addr, 'latest'],
    })) as string;
    return BigInt(hex);
  }

  let passedTests = 0;
  const totalTests = 8;

  function toBytes32(str: string): `0x${string}` {
    return keccak256(toHex(str));
  }

  // TEST 1: Successful mandate creation and valid payment execution
  console.log('\n--- TEST 1: Successful Mandate Creation & Payment Execution ---');
  try {
    const mandateId = toBytes32('MAN-TEST-SUCCESS');
    const maxPayment = parseEther('0.03');
    const dailyLimit = parseEther('0.05');
    const paymentAmount = parseEther('0.02');
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 3600); // 1 hour

    // Create mandate
    await callWrite('createMandate', [
      mandateId,
      'ResearchBot',
      recipient,
      maxPayment,
      dailyLimit,
      'DATA_LABELING',
      expiry,
    ]);

    // Recipient-side verification before payment
    const isAuthBefore = await callRead('verifyMandateAuthorization', [
      mandateId,
      recipient,
      paymentAmount,
      'DATA_LABELING',
    ]);
    if (!isAuthBefore) throw new Error('Authorization check failed before payment');

    const recipientBalBefore = await getBalance(recipient);

    // Execute payment with exact value
    await callWrite(
      'executePayment',
      [mandateId, recipient, paymentAmount, 'DATA_LABELING'],
      owner,
      paymentAmount
    );

    const recipientBalAfter = await getBalance(recipient);
    const diff = recipientBalAfter - recipientBalBefore;

    if (diff !== paymentAmount) {
      throw new Error(
        `Transferred MON mismatch. Expected ${formatEther(paymentAmount)}, got ${formatEther(diff)}`
      );
    }

    // Verify stored mandate state
    const storedMandate: any = await callRead('getMandate', [mandateId]);
    if (BigInt(storedMandate.spentToday) !== paymentAmount) {
      throw new Error(`spentToday not incremented. Value: ${storedMandate.spentToday}`);
    }

    console.log(
      '✓ PASS: Mandate created, authorized payment executed, MON transferred to recipient, spentToday incremented.'
    );
    passedTests++;
  } catch (err: any) {
    console.error('✗ FAIL Test 1:', err.message);
  }

  // TEST 2: Wrong recipient rejection
  console.log('\n--- TEST 2: Wrong Recipient Rejection ---');
  try {
    const mandateId = toBytes32('MAN-TEST-SUCCESS');
    const paymentAmount = parseEther('0.01');

    let reverted = false;
    try {
      await callWrite(
        'executePayment',
        [mandateId, otherRecipient, paymentAmount, 'DATA_LABELING'],
        owner,
        paymentAmount
      );
    } catch {
      reverted = true;
    }
    if (!reverted) throw new Error('Payment to wrong recipient should have reverted');

    const isAuth = await callRead('verifyMandateAuthorization', [
      mandateId,
      otherRecipient,
      paymentAmount,
      'DATA_LABELING',
    ]);
    if (isAuth) throw new Error('verifyMandateAuthorization returned true for wrong recipient');

    console.log('✓ PASS: Wrong recipient strictly barred by contract and rejected by verifier.');
    passedTests++;
  } catch (err: any) {
    console.error('✗ FAIL Test 2:', err.message);
  }

  // TEST 3: Wrong purpose rejection
  console.log('\n--- TEST 3: Wrong Purpose ID Rejection ---');
  try {
    const mandateId = toBytes32('MAN-TEST-SUCCESS');
    const paymentAmount = parseEther('0.01');

    let reverted = false;
    try {
      await callWrite(
        'executePayment',
        [mandateId, recipient, paymentAmount, 'RPC_COMPUTE'],
        owner,
        paymentAmount
      );
    } catch {
      reverted = true;
    }
    if (!reverted) throw new Error('Payment with wrong purpose should have reverted');

    const isAuth = await callRead('verifyMandateAuthorization', [
      mandateId,
      recipient,
      paymentAmount,
      'RPC_COMPUTE',
    ]);
    if (isAuth) throw new Error('verifyMandateAuthorization returned true for wrong purpose');

    console.log('✓ PASS: Wrong purpose ID strictly barred by contract and rejected by verifier.');
    passedTests++;
  } catch (err: any) {
    console.error('✗ FAIL Test 3:', err.message);
  }

  // TEST 4: Single payment ceiling rejection (> 0.03 MON)
  console.log('\n--- TEST 4: Single Payment Ceiling Rejection ---');
  try {
    const mandateId = toBytes32('MAN-TEST-SUCCESS');
    const overLimitAmount = parseEther('0.04');

    let reverted = false;
    try {
      await callWrite(
        'executePayment',
        [mandateId, recipient, overLimitAmount, 'DATA_LABELING'],
        owner,
        overLimitAmount
      );
    } catch {
      reverted = true;
    }
    if (!reverted) throw new Error('Payment exceeding single limit should have reverted');

    const isAuth = await callRead('verifyMandateAuthorization', [
      mandateId,
      recipient,
      overLimitAmount,
      'DATA_LABELING',
    ]);
    if (isAuth) throw new Error('verifyMandateAuthorization returned true for over-limit payment');

    console.log('✓ PASS: Single payment ceiling strictly enforced on-chain.');
    passedTests++;
  } catch (err: any) {
    console.error('✗ FAIL Test 4:', err.message);
  }

  // TEST 5: Daily cap violation rejection (spent 0.02, limit 0.05)
  console.log('\n--- TEST 5: Daily Spending Cap Violation Rejection ---');
  try {
    const mandateId = toBytes32('MAN-TEST-SUCCESS');
    // Spend 0.025 (total will be 0.045 <= 0.05)
    await callWrite(
      'executePayment',
      [mandateId, recipient, parseEther('0.025'), 'DATA_LABELING'],
      owner,
      parseEther('0.025')
    );

    // Now total spent is 0.045 MON. Trying to spend 0.01 breaches 0.05 daily cap.
    let reverted = false;
    try {
      await callWrite(
        'executePayment',
        [mandateId, recipient, parseEther('0.01'), 'DATA_LABELING'],
        owner,
        parseEther('0.01')
      );
    } catch {
      reverted = true;
    }
    if (!reverted) throw new Error('Daily cap breach should have reverted');

    const isAuth = await callRead('verifyMandateAuthorization', [
      mandateId,
      recipient,
      parseEther('0.01'),
      'DATA_LABELING',
    ]);
    if (isAuth) throw new Error('verifyMandateAuthorization returned true for daily cap breach');

    console.log('✓ PASS: 24h daily velocity ceiling strictly barred payments exceeding budget.');
    passedTests++;
  } catch (err: any) {
    console.error('✗ FAIL Test 5:', err.message);
  }

  // TEST 6: Mandate expiration rejection
  console.log('\n--- TEST 6: Expired Mandate Rejection ---');
  try {
    const mandateId = toBytes32('MAN-TEST-EXPIRED');
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 10);
    await callWrite('createMandate', [
      mandateId,
      'ResearchBot',
      recipient,
      parseEther('0.03'),
      parseEther('0.05'),
      'DATA_LABELING',
      expiry,
    ]);

    // Advance EVM block timestamp
    await provider.request({
      method: 'evm_increaseTime',
      params: [30],
    });
    await provider.request({
      method: 'evm_mine',
      params: [],
    });

    let reverted = false;
    try {
      await callWrite(
        'executePayment',
        [mandateId, recipient, parseEther('0.01'), 'DATA_LABELING'],
        owner,
        parseEther('0.01')
      );
    } catch {
      reverted = true;
    }
    if (!reverted) throw new Error('Expired mandate execution should have reverted');

    const isAuth = await callRead('verifyMandateAuthorization', [
      mandateId,
      recipient,
      parseEther('0.01'),
      'DATA_LABELING',
    ]);
    if (isAuth) throw new Error('verifyMandateAuthorization returned true for expired mandate');

    console.log('✓ PASS: Expired mandate automatically locks down on-chain.');
    passedTests++;
  } catch (err: any) {
    console.error('✗ FAIL Test 6:', err.message);
  }

  // TEST 7: Owner revocation rejection
  console.log('\n--- TEST 7: Revoked Mandate Rejection ---');
  try {
    const mandateId = toBytes32('MAN-TEST-REVOKED');
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 7200);
    await callWrite('createMandate', [
      mandateId,
      'ResearchBot',
      recipient,
      parseEther('0.03'),
      parseEther('0.05'),
      'DATA_LABELING',
      expiry,
    ]);

    // Revoke
    await callWrite('revokeMandate', [mandateId], owner);

    let reverted = false;
    try {
      await callWrite(
        'executePayment',
        [mandateId, recipient, parseEther('0.01'), 'DATA_LABELING'],
        owner,
        parseEther('0.01')
      );
    } catch {
      reverted = true;
    }
    if (!reverted) throw new Error('Revoked mandate execution should have reverted');

    const isAuth = await callRead('verifyMandateAuthorization', [
      mandateId,
      recipient,
      parseEther('0.01'),
      'DATA_LABELING',
    ]);
    if (isAuth) throw new Error('verifyMandateAuthorization returned true for revoked mandate');

    console.log('✓ PASS: Owner revocation immediately locks mandate from any future payments.');
    passedTests++;
  } catch (err: any) {
    console.error('✗ FAIL Test 7:', err.message);
  }

  // TEST 8: Unauthorized callers rejection
  console.log('\n--- TEST 8: Unauthorized Callers Rejection ---');
  try {
    const mandateId = toBytes32('MAN-TEST-AUTH');
    const expiry = BigInt(Math.floor(Date.now() / 1000) + 7200);
    await callWrite('createMandate', [
      mandateId,
      'ResearchBot',
      recipient,
      parseEther('0.03'),
      parseEther('0.05'),
      'DATA_LABELING',
      expiry,
    ]);

    // Attacker tries to revoke
    let attackerRevokeFailed = false;
    try {
      await callWrite('revokeMandate', [mandateId], attacker);
    } catch {
      attackerRevokeFailed = true;
    }
    if (!attackerRevokeFailed) throw new Error('Attacker was able to revoke another owner mandate');

    // Attacker tries to execute payment
    let attackerPayFailed = false;
    try {
      await callWrite(
        'executePayment',
        [mandateId, recipient, parseEther('0.01'), 'DATA_LABELING'],
        attacker,
        parseEther('0.01')
      );
    } catch {
      attackerPayFailed = true;
    }
    if (!attackerPayFailed) throw new Error('Attacker was able to execute payment on another owner mandate');

    console.log('✓ PASS: Unauthorized callers strictly prevented from revoking or executing payments.');
    passedTests++;
  } catch (err: any) {
    console.error('✗ FAIL Test 8:', err.message);
  }

  console.log('\n====================================================');
  console.log(` TEST SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
