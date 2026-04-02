// ============================================
// BROKIAX — x402 Payment Client
// Implements the x402 USDC micropayment protocol
// Based on nofx/mcp/payment/x402.go (TypeScript port)
// ============================================

import {
  X402PaymentRequired,
  X402WalletConfig,
  X402PaymentRecord,
  USDC_CONTRACTS,
  CLAW402_ENDPOINTS,
} from "./types";

// ─── EIP-712 Types for USDC TransferWithAuthorization ───────────────────────

const TRANSFER_WITH_AUTHORIZATION_TYPES = {
  TransferWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

// ─── Decode x402 Payment Header ─────────────────────────────────────────────

/**
 * Decode the base64-encoded x402 payment requirement from the 402 response.
 */
export function decodePaymentHeader(headerValue: string): X402PaymentRequired {
  try {
    const decoded = atob(headerValue);
    return JSON.parse(decoded) as X402PaymentRequired;
  } catch {
    throw new Error("Failed to decode x402 payment header");
  }
}

// ─── Sign x402 Payment (Browser-side only) ──────────────────────────────────

/**
 * Sign an x402 payment using EIP-712 typed data signing.
 * This runs in the browser only — private keys NEVER leave the client.
 * 
 * @param wallet - The user's wallet config (with privateKey for signing)
 * @param paymentReq - The decoded 402 payment requirement
 * @returns The signed authorization as base64 string
 */
export async function signX402Payment(
  wallet: X402WalletConfig,
  paymentReq: X402PaymentRequired
): Promise<string> {
  const accept = paymentReq.accepts[0];
  if (!accept) throw new Error("No payment options available");
  if (!accept.extra) throw new Error("Missing EIP-712 extra data in payment requirement");

  // Validate spending limits BEFORE signing
  const amountUsd = parseFloat(accept.maxAmountRequired) / 1e6;
  if (amountUsd > wallet.maxSpendPerRequest) {
    throw new Error(
      `Coste $${amountUsd.toFixed(4)} excede el límite por request ($${wallet.maxSpendPerRequest})`
    );
  }

  const domain = {
    name: accept.extra.name,
    version: accept.extra.version,
    chainId: accept.extra.chainId,
    verifyingContract: accept.extra.verifyingContract as `0x${string}`,
  };

  const message = {
    from: wallet.address as `0x${string}`,
    to: accept.payeeAddress as `0x${string}`,
    value: BigInt(accept.maxAmountRequired),
    validAfter: BigInt(accept.extra.validAfter),
    validBefore: BigInt(accept.extra.validBefore),
    nonce: accept.extra.nonce as `0x${string}`,
  };

  // Dynamic import of viem to keep it client-side only
  const { createWalletClient, http } = await import("viem");
  const { privateKeyToAccount } = await import("viem/accounts");
  const { base, baseSepolia } = await import("viem/chains");

  const chain = wallet.chainId === 8453 ? base : baseSepolia;
  const account = privateKeyToAccount(wallet.privateKey as `0x${string}`);

  const client = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  const signature = await client.signTypedData({
    domain,
    types: TRANSFER_WITH_AUTHORIZATION_TYPES,
    primaryType: "TransferWithAuthorization",
    message,
  });

  // Encode the payment proof as base64
  const paymentProof = JSON.stringify({
    scheme: accept.scheme,
    network: accept.network,
    payload: {
      signature,
      authorization: {
        from: wallet.address,
        to: accept.payeeAddress,
        value: accept.maxAmountRequired,
        validAfter: accept.extra.validAfter,
        validBefore: accept.extra.validBefore,
        nonce: accept.extra.nonce,
      },
    },
  });

  return btoa(paymentProof);
}

// ─── Full x402 Request Flow ─────────────────────────────────────────────────

export interface X402RequestOptions {
  wallet: X402WalletConfig;
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  maxRetries?: number;
}

/**
 * Execute a full x402 AI request:
 * 1. Send request to Claw402
 * 2. If 402 received, sign the payment
 * 3. Resend with payment proof
 * 4. Return the AI response
 */
export async function doX402Request(
  options: X402RequestOptions
): Promise<{ content: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number }; paymentRecord: X402PaymentRecord }> {
  const { wallet, model, messages, temperature = 0.2, maxRetries = 2 } = options;

  const requestBody = JSON.stringify({
    model,
    messages,
    temperature,
  });

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Step 1: Initial request
      const response = await fetch(CLAW402_ENDPOINTS.chat, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      // If successful, return directly
      if (response.ok) {
        const data = await response.json();
        return {
          content: data.choices?.[0]?.message?.content || "",
          usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          paymentRecord: {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            model,
            amount: "0",
            amountUsd: 0,
            resource: CLAW402_ENDPOINTS.chat,
            status: "confirmed",
          },
        };
      }

      // Step 2: Handle 402 Payment Required
      if (response.status === 402) {
        const paymentHeader = response.headers.get("X-Payment") || response.headers.get("x-payment");
        if (!paymentHeader) {
          throw new Error("402 received but no X-Payment header found");
        }

        const paymentReq = decodePaymentHeader(paymentHeader);
        const paymentProof = await signX402Payment(wallet, paymentReq);

        // Step 3: Resend with payment proof
        const paidResponse = await fetch(CLAW402_ENDPOINTS.chat, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Payment": paymentProof,
          },
          body: requestBody,
        });

        if (!paidResponse.ok) {
          const errText = await paidResponse.text().catch(() => "Unknown error");
          throw new Error(`Payment accepted but request failed (${paidResponse.status}): ${errText}`);
        }

        const data = await paidResponse.json();
        const accept = paymentReq.accepts[0];
        const amountUsd = accept ? parseFloat(accept.maxAmountRequired) / 1e6 : 0;

        return {
          content: data.choices?.[0]?.message?.content || "",
          usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
          paymentRecord: {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            model,
            amount: accept?.maxAmountRequired || "0",
            amountUsd,
            resource: CLAW402_ENDPOINTS.chat,
            status: "confirmed",
          },
        };
      }

      // Other errors
      const errText = await response.text().catch(() => "Unknown error");
      throw new Error(`x402 request failed (${response.status}): ${errText}`);

    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(r => setTimeout(r, (attempt + 1) * 1000));
        continue;
      }
    }
  }

  throw lastError || new Error("x402 request failed after all retries");
}

// ─── Utilities ──────────────────────────────────────────────────────────────

/**
 * Check USDC balance for a given address on Base chain.
 * Client-side only.
 */
export async function checkUsdcBalance(address: string, chainId: number): Promise<string> {
  const { createPublicClient, http, parseAbi } = await import("viem");
  const { base, baseSepolia } = await import("viem/chains");

  const chain = chainId === 8453 ? base : baseSepolia;
  const usdcAddress = USDC_CONTRACTS[chainId];
  if (!usdcAddress) throw new Error(`USDC not configured for chain ${chainId}`);

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  const balance = await client.readContract({
    address: usdcAddress as `0x${string}`,
    abi: parseAbi(["function balanceOf(address) view returns (uint256)"]),
    functionName: "balanceOf",
    args: [address as `0x${string}`],
  });

  return balance.toString();
}

/**
 * Format USDC amount from smallest unit (6 decimals) to human-readable.
 */
export function formatUsdcAmount(amountSmallest: string): string {
  const num = parseFloat(amountSmallest) / 1e6;
  return `$${num.toFixed(4)}`;
}
