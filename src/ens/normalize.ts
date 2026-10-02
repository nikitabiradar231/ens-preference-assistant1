import { normalize } from 'viem/ens';

/**
 * Normalizes a user-provided ENS name string using ENSIP-15 standard rules.
 *
 * Requirements Met:
 * - Must be called BEFORE any ENS resolution occurs.
 * - Uses viem's built-in ENSIP-15 `normalize` function.
 * - Throws a clean descriptive error if input is empty or invalid.
 *
 * @param input Raw ENS name input from user
 * @returns ENSIP-15 normalized ENS name string
 */
export function normalizeEnsName(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('ENS name input must be a non-empty string.');
  }

  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new Error('ENS name cannot be empty or whitespace.');
  }

  try {
    // Normalizes using ENSIP-15 (Unicode UTS-51 / ENS specification)
    const normalized = normalize(trimmed);
    
    // Ensure name has an extension (e.g., .eth or .sepolia.eth)
    if (!normalized.includes('.')) {
      throw new Error(`Invalid ENS name "${input}": missing domain suffix (e.g., .eth).`);
    }

    return normalized;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid ENS name')) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Unknown normalization error';
    throw new Error(`ENSIP-15 Normalization failed for "${input}": ${message}`);
  }
}
