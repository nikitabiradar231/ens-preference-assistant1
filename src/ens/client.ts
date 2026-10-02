import { createPublicClient, http, type PublicClient } from 'viem';
import { sepolia } from 'viem/chains';

let publicClientInstance: PublicClient | null = null;

/**
 * Returns a configured Viem Public Client connected strictly to Ethereum Sepolia network.
 *
 * Requirements Met:
 * - Uses Sepolia testnet explicitly (`sepolia` chain).
 * - Configurable RPC endpoint with reliable public RPC fallbacks.
 */
export function getSepoliaPublicClient(): PublicClient {
  if (publicClientInstance) {
    return publicClientInstance;
  }

  const customRpc = process.env.SEPOLIA_RPC_URL;
  const transport = customRpc
    ? http(customRpc)
    : http('https://ethereum-sepolia-rpc.publicnode.com');

  publicClientInstance = createPublicClient({
    chain: sepolia,
    transport,
  });

  return publicClientInstance;
}
