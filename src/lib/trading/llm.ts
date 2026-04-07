import { Strategy } from "@/lib/types/strategy";
import { LLMDecision, ApiKey, LLMProvider } from "@/lib/types";
import { decryptText } from "@/lib/crypto/keys";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { doX402Request } from "@/lib/x402/client";
import { X402WalletConfig } from "@/lib/x402/types";
import { privateKeyToAccount } from "viem/accounts";

// ─── Shared Provider Factory ──────────────────────────────────────────────────
// Eliminates the 4x duplicated switch blocks. All provider initialization in one place.

const OPENAI_COMPATIBLE_PROVIDERS: Record<string, string> = {
  deepseek: "https://api.deepseek.com/v1",
  grok: "https://api.x.ai/v1",
  kimi: "https://api.moonshot.cn/v1",
  minimax: "https://api.minimax.chat/v1",
  qwen: "https://dashscope.aliyuncs.com/compatible-mode/v1",
};

function normalizePrivateKey(rawKey: string): `0x${string}` {
  return (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
}

export function createAIProvider(provider: LLMProvider, apiKey: string, modelName: string) {
  // x402 mode (bypasses Vercel SDK)
  if (provider === "x402") {
    return { isX402: true }; 
  }

  // OpenRouter — universal gateway
  if (provider === "openrouter") {
    const p = createOpenRouter({ apiKey });
    return p(modelName);
  }

  // Native SDKs
  if (provider === "openai") {
    const p = createOpenAI({ apiKey });
    return p(modelName);
  }
  if (provider === "anthropic") {
    const p = createAnthropic({ apiKey });
    return p(modelName);
  }
  if (provider === "gemini") {
    const p = createGoogleGenerativeAI({ apiKey });
    return p(modelName);
  }

  // OpenAI-compatible providers (DeepSeek, Grok, Kimi, MiniMax, Qwen)
  const baseURL = OPENAI_COMPATIBLE_PROVIDERS[provider];
  if (baseURL) {
    const p = createOpenAI({ apiKey, baseURL });
    return p(modelName);
  }

  throw new Error(`Proveedor de LLM "${provider}" no soportado.`);
}

// ─── Helper: Resolve provider + decrypt key ─────────────────────────────────

async function resolveProvider(
  userId: string,
  apiKeyId: string,
  modelName: string,
  db: FirebaseFirestore.Firestore
) {
  const keyDoc = await db.doc(`users/${userId}/apiKeys/${apiKeyId}`).get();
  if (!keyDoc.exists) throw new Error("API Key no encontrada o eliminada.");
  const keyData = keyDoc.data() as ApiKey;
  const rawKey = decryptText(keyData.encryptedKey, keyData.iv);
  const targetModel = modelName || (keyData.provider === "x402" ? "deepseek-chat" : "openai/gpt-4o");
  const aiModel = createAIProvider(keyData.provider, rawKey, targetModel);
  const walletAddress =
    keyData.provider === "x402"
      ? keyData.walletAddress || privateKeyToAccount(normalizePrivateKey(rawKey)).address
      : undefined;

  return { aiModel, targetModel, provider: keyData.provider, rawKey, walletAddress, chainId: keyData.chainId || 8453 };
}

// ─── Helper: Execute based on provider type ──────────────────────────────────
async function executeObjectGeneration<T>(
  providerInfo: { aiModel: any; targetModel: string; provider: string; rawKey: string; walletAddress?: string; chainId?: number },
  systemPrompt: string,
  schema: z.ZodType<T>,
  temperature: number
): Promise<T> {
  const { aiModel, targetModel, provider, rawKey, walletAddress, chainId } = providerInfo;

  if (provider === "x402") {
    // x402 direct execution
    const walletConfig: X402WalletConfig = {
      address: walletAddress || privateKeyToAccount(normalizePrivateKey(rawKey)).address,
      privateKey: normalizePrivateKey(rawKey),
      chainId: chainId || 8453,
      maxSpendPerRequest: 0.1,
      dailySpendLimit: 5,
    };
    
    // Auto-instruct the model to output strict JSON since we are not using the SDK's structural tooling
    const sysPromptWithJson = systemPrompt + "\n\nCRITICAL: Output strictly valid JSON matching the exact schema requirements. Do not use markdown wraps.";
    
    const response = await doX402Request({
      wallet: walletConfig,
      model: targetModel,
      messages: [{ role: "user", content: sysPromptWithJson }],
      temperature,
    });
    
    try {
      // Remove any potential markdown block wrappers
      let cleanText = response.content.trim();
      if (cleanText.startsWith("\`\`\`json")) cleanText = cleanText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "");
      return JSON.parse(cleanText) as T;
    } catch {
      throw new Error("El modelo x402 devolvió un formato JSON inválido.");
    }
  }

  // Native Vercel AI SDK execution
  const { object } = await generateObject({
    model: aiModel,
    schema,
    prompt: systemPrompt,
    temperature
  });
  return object as T;
}

// ─── Single LLM Execution ───────────────────────────────────────────────────

export async function executeLLMSingle(
  userId: string,
  apiKeyId: string,
  modelName: string,
  strategyPrompt: string,
  marketContext: string,
  maxAllocation: number,
  currentAllocation: number,
  openPositions: number,
  db: FirebaseFirestore.Firestore
): Promise<LLMDecision> {
  const providerInfo = await resolveProvider(userId, apiKeyId, modelName, db);

  const systemPrompt = `
${strategyPrompt}

Datos de Mercado Actuales (Tick en vivo):
${marketContext}

Estado de Gestión de Riesgo de la Cuenta:
- Capital máximo asignable: $${maxAllocation}
- Capital usado actualmente: $${currentAllocation}
- Posiciones abiertas en curso: ${openPositions}

INTRUCCIONES STRICTAS:
Analiza el contexto de precios y tu estrategia, y entonces decide tu próxima acción (BUY, SELL, o HOLD). 
Si decides HOLD, dejas el símbolo null y amount en 0.
Obligatorio generar tu proceso de razonamiento técnico exhaustivo en el campo 'reasoning'.
`;

  try {
    const object = await executeObjectGeneration(
      providerInfo,
      systemPrompt,
      z.object({
        action: z.enum(["BUY", "SELL", "HOLD"]),
        symbol: z.string().nullable().describe("Símbolo (ej. BTC/USDT) a operar. null si la acción es HOLD."),
        amount_usdt: z.number().describe("Cantidad en dólares a ejecutar de la orden. 0 si es HOLD."),
        reasoning: z.string().describe("Justificación técnica y lógica de tu decisión para guardar en logs."),
        confidence: z.number().min(0).max(1).describe("Nivel de confianza de 0 a 1."),
        leverage: z.number().optional().describe("Apalancamiento a utilizar si se opera en futuros (swap). Opcional.")
      }),
      0.2
    );

    return object as LLMDecision;
  } catch (err: any) {
    console.error("[LLM API] generateObject Error:", err);
    throw new Error(`Fallo en el servidor del LLM: ${err.message}`);
  }
}

// ─── Moderator (Debate Arena consensus) ──────────────────────────────────────

export async function executeModerator(
  userId: string,
  apiKeyId: string,
  modelName: string,
  strategy: Strategy,
  pair: string,
  decisions: LLMDecision[],
  db: FirebaseFirestore.Firestore
) {
  const providerInfo = await resolveProvider(userId, apiKeyId, modelName, db);

  const decisionsText = decisions.map((d, i) => `IA ${i + 1}:\nDecisión: ${d.action}\nConfianza: ${Math.round((d.confidence || 0)*100)}%\nRazón: ${d.reasoning}`).join("\\n\\n");

  const systemPrompt = `
Eres Brokiax Moderador, el juez supremo de la Debate Arena.
Analiza las decisiones independientes de varios agentes de Inteligencia Artificial sobre el par ${pair} y emite un veredicto de consenso unificado.

Estrategia Operada: ${strategy.name}

Posturas de los Agentes Independientes:
${decisionsText}

INSTRUCCIONES STRICTAS:
Evalúa los argumentos cruzados y dictamina la acción de consenso final (BUY, SELL o HOLD).
Estima la confianza global del consenso (0 a 1).
Escribe un resumen ejecutivo justificando por qué se llegó a este dictamen mayoritario (o cómo resolviste un empate).
`;

  try {
    const object = await executeObjectGeneration(
      providerInfo,
      systemPrompt,
      z.object({
        decision: z.enum(["BUY", "SELL", "HOLD"]),
        confidence: z.number().min(0).max(1),
        summary: z.string().describe("Resumen ejecutivo del consenso alcanzado y la justificación mayoritaria.")
      }),
      0.1
    );

    return object;
  } catch (err: any) {
    console.error("[MODERATOR] generateObject Error:", err);
    throw new Error(`Fallo en el servidor del Moderador: ${err.message}`);
  }
}

// ─── Debate Arena v2: Specialist Agent Roles ────────────────────────────────

export type AgentRole = "technical" | "sentiment" | "risk";

const ROLE_PROMPTS: Record<AgentRole, string> = {
  technical: `Eres un Analista Técnico cuantitativo de élite. Tu ÚNICA función es analizar el par de criptomonedas usando indicadores técnicos clásicos: RSI, MACD, Bandas de Bollinger, niveles de soporte/resistencia, volumen y estructura de precio (Higher Highs, Lower Lows).
  
Debes basar tu decisión EXCLUSIVAMENTE en la acción del precio y los indicadores técnicos. NO opines sobre fundamentales ni noticias. Tu trabajo es identificar la señal técnica más pura.`,

  sentiment: `Eres un Analista de Sentimiento de Mercado experto en RAG y NLP. Tu ÚNICA función es leer el contexto de noticias proporcionado, el macro actual del mercado y evaluar la psicología de la masa.
  
Busca indicadores de euforia, miedo (FUD) o adopción inminente en los titulares. Debes basar tu decisión de compra/venta midiendo si el sentimiento general apoya un rally o advierte de un crash inminente. Céntrate exclusivamente en la narrativa, desestima los aspectos puramente gráficos.`,

  risk: `Eres un estricto Gestor de Riesgo y Liquidez de un Hedge Fund. Tu función es proteger el capital pase lo que pase. Evalúas las condiciones del mercado buscando picos de volatilidad excesiva, asimetrías de riesgo/beneficio peligrosas o debilidad en el precio actual.
  
No entras en euforias. Si consideras que el mercado está errático o peligroso, tu voto SIEMPRE será HOLD. Si crees que hay una oportunidad con ratio R:R favorable basándote en que un Stop Loss ajustado sobreviviría, entonces apoyas el lado direccional.`
};

const ROLE_LABELS: Record<AgentRole, string> = {
  technical: "Analista Técnico",
  sentiment: "Analista de Sentimiento",
  risk: "Gestor de Riesgo"
};

export async function executeSpecialistAgent(
  userId: string,
  apiKeyId: string,
  modelName: string,
  role: AgentRole,
  pair: string,
  marketContext: string,
  strategy: Strategy,
  db: FirebaseFirestore.Firestore
): Promise<{ role: AgentRole; label: string; model: string; action: string; confidence: number; reasoning: string }> {
  const providerInfo = await resolveProvider(userId, apiKeyId, modelName, db);

  const rolePrompt = ROLE_PROMPTS[role];

  const fullPrompt = `${rolePrompt}

--- CONTEXTO DE MERCADO ACTUAL ---
Par: ${pair}
Precios en vivo: ${marketContext}

--- ESTRATEGIA OPERADA ---
${strategy.name}: ${strategy.config.promptSections?.roleDefinition || "Maximizar retorno ajustado al riesgo."}

Emite tu análisis desde tu rol de ${ROLE_LABELS[role]} y tu decisión final (BUY, SELL o HOLD).`;

  const object = await executeObjectGeneration(
    providerInfo,
    fullPrompt,
    z.object({
      action: z.enum(["BUY", "SELL", "HOLD"]),
      confidence: z.number().min(0).max(1).describe("Confianza de 0 a 1"),
      reasoning: z.string().describe("Análisis completo desde tu perspectiva de rol.")
    }),
    0.25
  );

  return {
    role,
    label: ROLE_LABELS[role],
    model: providerInfo.targetModel,
    ...object
  };
}

// ─── Backtest Simulator ─────────────────────────────────────────────────────

export interface BacktestResult {
  totalReturn: number;
  winRate: number;
  maxDrawdown: number;
  sharpe: number;
  trades: {
    date: string;
    side: "BUY" | "SELL";
    entry: number;
    exit: number;
    pnl: number;
    reasoning: string;
  }[];
}

export async function executeBacktestSim(
  userId: string,
  apiKeyId: string,
  modelName: string,
  strategy: Strategy,
  pair: string,
  timeframe: string,
  capital: number,
  db: FirebaseFirestore.Firestore
): Promise<BacktestResult> {
  const providerInfo = await resolveProvider(userId, apiKeyId, modelName, db);

  const systemPrompt = `
Eres un motor avanzado de backtesting cuantitativo. 
Debes simular una prueba histórica MUY REALISTA de la siguiente estrategia de trading operando el par ${pair} durante el período de los últimos ${timeframe}, asumiendo un capital inicial de $${capital}.

ESPECIFICACIONES DE LA ESTRATEGIA:
Nombre: ${strategy.name}
Rol: ${strategy.config.promptSections?.roleDefinition || "Maximizar retorno ajustado al riesgo."}
Frecuencia Operativa: ${strategy.config.promptSections?.tradingFrequency || "Moderada"}
Reglas de Entrada: ${strategy.config.promptSections?.entryStandards || "Múltiples confluencias técnicas"}
Gestión de Riesgo: Max posiciones ${strategy.config.riskControl?.maxPositions || 1}

INSTRUCCIONES STRICTAS:
1. Genera un historial sintético pero matemáticamente coherente y riguroso de trades.
2. Proporciona entre 6 y 15 operaciones con fechas lógicas distribuidas dentro del marco de ${timeframe} retrocediendo desde HOY.
3. Si el 'tradingFrequency' de la estrategia es bajo, genera pocos trades. Si es alto, genera la cantidad pertinente.
4. Las operaciones deben incluir trades ganadores y perdedores reales para simular el fallo inherente de cualquier estrategia.
5. Calcula las métricas globales coherentes a ese array matemático generado: 'totalReturn' en % global, 'winRate' del 0 a 100%, 'maxDrawdown' como valor positivo (ej. 15.4%), 'sharpe' ratio.
6. Los precios de entry y exit DEBEN ser tangencialmente realistas a la escala de precios histórica de ${pair}.
7. Incluye en 'reasoning' una explicación de 1-2 frases detallando exactamente qué indicadores técnicos o lógicos activaron de forma teórica esta operación basados en las Reglas de Entrada de la estrategia.
`;

  try {
    const object = await executeObjectGeneration(
      providerInfo,
      systemPrompt,
      z.object({
        totalReturn: z.number().describe("Retorno total acumulado en %, ej: 14.5 o -5.2"),
        winRate: z.number().describe("Porcentaje de acierto de 0 a 100"),
        maxDrawdown: z.number().describe("Peor caída de equity positiva, ej: 8.5"),
        sharpe: z.number().describe("Sharpe Ratio aproximado de 0 a 4"),
        trades: z.array(z.object({
          date: z.string().describe("Fecha en formato YYYY-MM-DD"),
          side: z.enum(["BUY", "SELL"]),
          entry: z.number().describe("Precio exacto simulado de entrada"),
          exit: z.number().describe("Precio exacto simulado de salida"),
          pnl: z.number().describe("Retorno de la operación en %, positivo para profit, negativo loss"),
          reasoning: z.string().describe("Justificación estricta teórica del trade.")
        }))
      }),
      0.3
    );

    return object as BacktestResult;
  } catch (err: any) {
    console.error("[BACKTEST] generateObject Error:", err);
    throw new Error(`Fallo en el servidor del Simulador: ${err.message}`);
  }
}
