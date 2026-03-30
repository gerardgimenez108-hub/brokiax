import ccxt, { Exchange } from "ccxt";
import { ExchangeKey, LLMDecision } from "@/lib/types";
import { decryptText } from "@/lib/crypto/keys";

export interface TradeResult {
  success: boolean;
  orderId?: string;
  price?: number;
  amount?: number;
  fee?: number;
  message?: string;
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
    const apiKey = decryptText(exchangeKey.encryptedApiKey, exchangeKey.iv);
    let apiSecret = "";
    if (exchangeKey.encryptedApiSecret) {
      apiSecret = decryptText(exchangeKey.encryptedApiSecret, exchangeKey.iv);
    }

    // 2. Instantiate CCXT exchange client dynamically
    const exchangeId = exchangeKey.exchange;
    if (!(ccxt as NodeJS.Dict<any>)[exchangeId]) {
      throw new Error(`Unsupported exchange: ${exchangeId}`);
    }

    const exchangeClass = (ccxt as NodeJS.Dict<any>)[exchangeId] as typeof Exchange;
    const client = new exchangeClass({
      apiKey,
      secret: apiSecret,
      enableRateLimit: true,
      options: { defaultType: "spot" },
    });

    if (exchangeKey.sandbox) {
      client.setSandboxMode(true);
    }

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
    const market = client.market(ccxtSymbol);

    // Filter amount by exchange lot size/step rules
    const safeAmount = client.amountToPrecision(ccxtSymbol, orderQuantityBase);
    const parsedAmount = parseFloat(safeAmount);

    if (parsedAmount <= 0) {
       throw new Error(`Order amount ${orderQuantityBase} is below exchange minimum lot size`);
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
    console.error(`[EXECUTION] Failed to execute trade on ${exchangeKey.exchange}:`, error);
    return {
      success: false,
      message: error.message || "Unknown error during trade execution",
    };
  }
}
