import { ExchangeKey, LLMDecision } from "@/lib/types";
import { decryptText } from "@/lib/crypto/keys";
import { createExchange } from "@/lib/trading/exchange";

export interface TradeResult {
  success: boolean;
  orderId?: string;
  price?: number;
  amount?: number;
  fee?: number;
  message?: string;
}

function decryptExchangeCredential(
  encryptedValue: string | undefined,
  iv: string | undefined,
  fieldName: string
) {
  if (!encryptedValue) {
    return "";
  }

  if (!iv) {
    throw new Error(`Missing IV for ${fieldName}`);
  }

  return decryptText(encryptedValue, iv);
}

/**
 * Executes a real live market order on a crypto exchange using CCXT.
 */
export async function executeLiveTrade(
  exchangeKey: ExchangeKey,
  decision: LLMDecision,
  prices: { symbol: string; price: number }[]
): Promise<TradeResult> {
  try {
    if (!decision.symbol || decision.action === "HOLD") {
      return { success: false, message: "No action or symbol to trade." };
    }

    // 1. Decrypt API Keys
    const exchangeId = exchangeKey.exchange || exchangeKey.provider;
    if (!exchangeId) {
      throw new Error("Exchange identifier not found");
    }

    const apiKey = decryptExchangeCredential(
      exchangeKey.encryptedApiKey || exchangeKey.encryptedKey,
      exchangeKey.apiKeyIv || exchangeKey.ivKey || exchangeKey.iv,
      "api key"
    );
    const apiSecret = decryptExchangeCredential(
      exchangeKey.encryptedApiSecret || exchangeKey.encryptedSecret,
      exchangeKey.apiSecretIv || exchangeKey.ivSecret || exchangeKey.iv,
      "api secret"
    );

    // 2. Instantiate CCXT exchange client dynamically using Factory
    const targetType = decision.leverage && decision.leverage > 1 ? "swap" : "spot";
    
    let apiPassword = undefined;
    if (exchangeKey.encryptedApiPassword || exchangeKey.encryptedPassphrase) {
      apiPassword = decryptExchangeCredential(
        exchangeKey.encryptedApiPassword || exchangeKey.encryptedPassphrase,
        exchangeKey.apiPasswordIv || exchangeKey.ivPassphrase || exchangeKey.iv,
        "api password"
      );
    }

    const client = createExchange(
      exchangeId.toLowerCase(),
      targetType,
      { apiKey, secret: apiSecret, password: apiPassword },
      exchangeKey.sandbox
    );

    // Verify connection / balance optionally (skip for speed if preferred)
    // await client.fetchBalance();

    // 3. Prepare order details
    // Ensure the symbol is formatted for ccxt (e.g., "BTC/USDT")
    const ccxtSymbol = decision.symbol.includes("/") ? decision.symbol : `${decision.symbol}/USDT`;
    
    // Find the current market price from our pre-fetched prices to calculate base token amount
    const baseAsset = ccxtSymbol.split("/")[0];
    const marketPrice = prices.find(p => p.symbol === baseAsset)?.price;

    if (!marketPrice || marketPrice <= 0) {
      throw new Error(`Market price for ${baseAsset} not found or invalid`);
    }

    // amount_usdt represents how much USDT we want to spend (or sell value)
    const orderQuantityBase = decision.amount_usdt / marketPrice;

    // Load markets to get precision and stepSizes
    await client.loadMarkets();
    // Filter amount by exchange lot size/step rules
    const safeAmount = client.amountToPrecision(ccxtSymbol, orderQuantityBase);
    const parsedAmount = parseFloat(safeAmount);

    if (parsedAmount <= 0) {
       throw new Error(`Order amount ${orderQuantityBase} is below exchange minimum lot size`);
    }

    // Attempt to set leverage if Trading SWAP/Futures
    if (decision.leverage && decision.leverage > 1 && targetType === "swap") {
      try {
        await client.setLeverage(decision.leverage, ccxtSymbol);
      } catch (err: any) {
        console.warn(`[EXECUTION] Could not set leverage on ${exchangeId} for ${ccxtSymbol}: ${err.message}`);
        // We do not throw here as some exchanges have account-wide leverage or it's already set
      }
    }

    // 4. Execute the Market Order
    const side = decision.action.toLowerCase() as "buy" | "sell";
    const order = await client.createMarketOrder(ccxtSymbol, side, parsedAmount);

    // Calculate average fill price if available
    const averagePrice = order.average || order.price || marketPrice;
    
    // Attempt to extract fees
    let feeAmount = 0;
    if (order.fee && typeof order.fee.cost === "number") {
      feeAmount = order.fee.cost;
    }

    return {
      success: true,
      orderId: order.id,
      price: averagePrice,
      amount: order.filled || parsedAmount,
      fee: feeAmount,
      message: `Successfully executed ${side.toUpperCase()} for ${parsedAmount} ${baseAsset}`,
    };
  } catch (error: any) {
    console.error(`[EXECUTION] Failed to execute trade on ${exchangeKey.exchange || exchangeKey.provider}:`, error);
    return {
      success: false,
      message: error.message || "Unknown error during trade execution",
    };
  }
}
