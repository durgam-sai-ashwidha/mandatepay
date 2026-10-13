import {
  formatEther,
  parseEther,
  keccak256,
  toHex,
  encodeFunctionData,
  createPublicClient,
  http,
} from 'viem';
import { MONAD_TESTNET_CONFIG, CONTRACT_CONFIG } from '../config/contracts';

/**
 * Safely parse a human-readable MON string into integer wei (BigInt).
 * Returns 0n if invalid.
 */
export function monToWei(amountStr: string): bigint {
  try {
    const trimmed = amountStr.trim();
    if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) < 0) {
      return 0n;
    }
    return parseEther(trimmed);
  } catch {
    return 0n;
  }
}

/**
 * Format integer wei string or BigInt into a clean MON string.
 */
export function weiToMon(wei: string | bigint): string {
  try {
    const bn = typeof wei === 'string' ? BigInt(wei) : wei;
    return formatEther(bn);
  } catch {
    return '0';
  }
}

/**
 * Format address or hash into shortened checksummed display (0x1234...5678)
 */
export function shortenAddress(address?: string | null): string {
  if (!address) return 'Not Connected';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Convert string mandate ID into canonical bytes32 hex for on-chain contract calls.
 */
export function mandateIdToBytes32(mandateId: string): `0x${string}` {
  const trimmed = mandateId.trim();
  if (trimmed.startsWith('0x') && trimmed.length === 66) {
    return trimmed as `0x${string}`;
  }
  return keccak256(toHex(trimmed));
}

export const monadTestnetChain = {
  id: MONAD_TESTNET_CONFIG.chainId,
  name: MONAD_TESTNET_CONFIG.chainName,
  nativeCurrency: MONAD_TESTNET_CONFIG.nativeCurrency,
  rpcUrls: {
    default: { http: MONAD_TESTNET_CONFIG.rpcUrls },
  },
  blockExplorers: {
    default: { name: 'MonadExplorer', url: MONAD_TESTNET_CONFIG.blockExplorerUrls[0] },
  },
} as const;

/**
 * Public client connected directly to Monad Testnet RPC for real view / read calls.
 */
export const monadPublicClient = createPublicClient({
  chain: monadTestnetChain as any,
  transport: http(MONAD_TESTNET_CONFIG.rpcUrls[0]),
});

/**
 * Query real verifyMandateAuthorization on-chain view function.
 */
export async function verifyMandateAuthorizationOnChain(
  contractAddress: string,
  mandateId: string,
  recipientAddress: string,
  amountWei: bigint,
  purposeId: string
): Promise<boolean> {
  if (!contractAddress || !contractAddress.trim()) {
    throw new Error('Contract address not configured');
  }

  const mandateIdB32 = mandateIdToBytes32(mandateId);

  const result = await monadPublicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'verifyMandateAuthorization',
    args: [mandateIdB32, recipientAddress as `0x${string}`, amountWei, purposeId],
  });

  return Boolean(result);
}

/**
 * Query real getMandate on-chain view function.
 */
export async function getMandateOnChain(
  contractAddress: string,
  mandateId: string
): Promise<any> {
  if (!contractAddress || !contractAddress.trim()) {
    throw new Error('Contract address not configured');
  }

  const mandateIdB32 = mandateIdToBytes32(mandateId);

  const result = await monadPublicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: CONTRACT_CONFIG.abi,
    functionName: 'getMandate',
    args: [mandateIdB32],
  });

  return result;
}

/**
 * Request wallet switch or add Monad Testnet (Chain ID 10143 / 0x279f)
 */
export async function switchOrAddMonadTestnet(): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('No EVM wallet detected in browser');
  }

  const ethereum = (window as any).ethereum;
  const hexChainId = `0x${MONAD_TESTNET_CONFIG.chainId.toString(16)}`;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }],
    });
    return true;
  } catch (switchError: any) {
    // 4902 indicates that the chain has not been added to the wallet yet
    if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hexChainId,
              chainName: MONAD_TESTNET_CONFIG.chainName,
              nativeCurrency: MONAD_TESTNET_CONFIG.nativeCurrency,
              rpcUrls: MONAD_TESTNET_CONFIG.rpcUrls,
              blockExplorerUrls: MONAD_TESTNET_CONFIG.blockExplorerUrls,
            },
          ],
        });
        return true;
      } catch (addError) {
        throw addError;
      }
    }
    throw switchError;
  }
}

/**
 * Fetch native MON balance for an address
 */
export async function fetchMonadBalance(address: string): Promise<string> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    return '0.0000';
  }
  try {
    const ethereum = (window as any).ethereum;
    const balanceHex = await ethereum.request({
      method: 'eth_getBalance',
      params: [address, 'latest'],
    });
    const balanceBigInt = BigInt(balanceHex);
    return formatEther(balanceBigInt);
  } catch (err) {
    console.error('Failed to fetch balance:', err);
    return '0.0000';
  }
}
