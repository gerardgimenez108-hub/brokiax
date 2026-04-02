// ============================================
// BROKIAX — x402 USDC Micropayment Types
// Based on the x402 protocol (https://x402.org)
// ============================================

/** x402 payment header received in HTTP 402 response */
export interface X402PaymentRequired {
  /** List of accepted payment options */
  accepts: X402AcceptOption[];
  /** The resource being requested */
  resource: X402Resource;
  /** Error message if any */
  error?: string;
}

/** A payment option from the 402 response */
export interface X402AcceptOption {
  /** Payment scheme (e.g., "exact") */
  scheme: string;
  /** Network chain (e.g., "base") */
  network: string;
  /** USDC amount to pay (in smallest unit, 6 decimals) */
  maxAmountRequired: string;
  /** The recipient address */
  payeeAddress: string;
  /** Token contract address (USDC) */
  asset: string;
  /** Extra data for EIP-712 signing */
  extra?: {
    /** EIP-712 domain */
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
    /** Validity window */
    validAfter: string;
    validBefore: string;
    /** Nonce for replay protection */
    nonce: string;
  };
}

/** Resource being requested via x402 */
export interface X402Resource {
  /** The URL being accessed */
  url: string;
  /** HTTP method */
  method: string;
  /** Content type */
  contentType?: string;
}

/** User's wallet configuration for x402 payments */
export interface X402WalletConfig {
  /** User's Ethereum address on Base */
  address: string;
  /** Private key for signing (NEVER stored server-side, only in browser memory) */
  privateKey?: string;
  /** Current USDC balance (6 decimals) */
  usdcBalance?: string;
  /** Chain ID (Base = 8453, Base Sepolia = 84532) */
  chainId: number;
  /** Maximum spending per AI request (in USDC) */
  maxSpendPerRequest: number;
  /** Daily spending limit (in USDC) */
  dailySpendLimit: number;
}

/** Record of an x402 payment for tracking */
export interface X402PaymentRecord {
  id: string;
  timestamp: Date;
  model: string;
  amount: string;
  amountUsd: number;
  txHash?: string;
  resource: string;
  status: "signed" | "confirmed" | "failed";
}

/** x402 spending summary for dashboard display */
export interface X402SpendingSummary {
  todaySpent: number;
  monthSpent: number;
  totalSpent: number;
  transactionCount: number;
  dailyLimit: number;
  remainingToday: number;
}

/** USDC contract addresses by chain */
export const USDC_CONTRACTS: Record<number, string> = {
  8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",   // Base Mainnet
  84532: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia (testnet)
};

/** Claw402 gateway endpoints */
export const CLAW402_ENDPOINTS = {
  chat: "https://api.claw402.ai/v1/chat/completions",
  models: "https://api.claw402.ai/v1/models",
};

/** Available models through x402/Claw402 */
export const X402_AVAILABLE_MODELS = [
  { id: "deepseek-chat", name: "DeepSeek V3", provider: "DeepSeek" },
  { id: "deepseek-reasoner", name: "DeepSeek R1", provider: "DeepSeek" },
  { id: "qwen-max", name: "Qwen Max", provider: "Alibaba" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "OpenAI" },
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "claude-3-7-sonnet-latest", name: "Claude 3.7 Sonnet", provider: "Anthropic" },
  { id: "gemini-2.5-pro-preview-05-06", name: "Gemini 2.5 Pro", provider: "Google" },
  { id: "grok-3-mini", name: "Grok 3 Mini", provider: "xAI" },
  { id: "kimi-k2", name: "Kimi K2", provider: "Moonshot" },
  { id: "MiniMax-M1", name: "MiniMax M1", provider: "MiniMax" },
] as const;
