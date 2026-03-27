import { Strategy } from "@/lib/types/strategy";
import { LLMDecision, ApiKey } from "@/lib/types";
import { decryptText } from "@/lib/crypto/keys";
import { generateObject } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

export async function executeLLMSingle(
  userId: string,
  apiKeyId: string,
  modelName: string,
  strategy: Strategy,
  marketContext: string,
  maxAllocation: number,
  currentAllocation: number,
  openPositions: number,
  db: FirebaseFirestore.Firestore
): Promise<LLMDecision> {
  // 1. Fetch API key
  const keyDoc = await db.doc(`users/${userId}/apiKeys/${apiKeyId}`).get();
  if (!keyDoc.exists) throw new Error("API Key no encontrada o eliminada.");
  const keyData = keyDoc.data() as ApiKey;

  // 2. Decrypt key
  const rawKey = decryptText(keyData.encryptedKey, keyData.iv);

  // 3. Initialize Provider
  let aiModel;
  const targetModel = modelName || "openai/gpt-4o";

  switch (keyData.provider) {
    case "openrouter":
      const orProvider = createOpenRouter({ apiKey: rawKey });
      aiModel = orProvider(targetModel);
      break;
    case "openai":
      const oaProvider = createOpenAI({ apiKey: rawKey });
      aiModel = oaProvider(targetModel);
      break;
    case "anthropic":
      const anProvider = createAnthropic({ apiKey: rawKey });
      aiModel = anProvider(targetModel);
      break;
    case "gemini":
      const geProvider = createGoogleGenerativeAI({ apiKey: rawKey });
      aiModel = geProvider(targetModel);
      break;
    case "deepseek":
      const dsProvider = createOpenAI({ apiKey: rawKey, baseURL: "https://api.deepseek.com/v1" });
      aiModel = dsProvider(targetModel);
      break;
    default:
      throw new Error(`Proveedor de LLM ${keyData.provider} no soportado nativamente.`);
  }

  // 4. Build prompt context
  const systemPrompt = `
Eres Brokiax AI, un agente de trading autónomo.
Rol: ${strategy.config.promptSections?.roleDefinition || "Maximizar retorno ajustado al riesgo."}
Frecuencia: ${strategy.config.promptSections?.tradingFrequency || "Moderada."}
Reglas de Entrada: ${strategy.config.promptSections?.entryStandards || "Confluencia de indicadores."}
Proceso de Decisión: ${strategy.config.promptSections?.decisionProcess || "Analiza a fondo."}

Datos de Mercado Actuales (Tick en vivo):
${marketContext}

Configuración de Gestión de Riesgo actual:
- Capital máximo asignable: $${maxAllocation}
- Capital usado actualmente: $${currentAllocation}
- Posiciones abiertas en curso: ${openPositions} (Max Permitido: ${strategy.config.riskControl?.maxPositions})

INTRUCCIONES STRICTAS:
Analiza el contexto de precios y tu estrategia, y entonces decide tu próxima acción (BUY, SELL, o HOLD). 
Si decides HOLD, dejas el símbolo null y amount en 0.
Obligatorio generar tu proceso de razonamiento técnico exhaustivo en el campo 'reasoning'.
`;

  try {
    const { object } = await generateObject({
      model: aiModel,
      schema: z.object({
        action: z.enum(["BUY", "SELL", "HOLD"]),
        symbol: z.string().nullable().describe("Símbolo (ej. BTC/USDT) a operar. null si la acción es HOLD."),
        amount_usdt: z.number().describe("Cantidad en dólares a ejecutar de la orden. 0 si es HOLD."),
        reasoning: z.string().describe("Justificación técnica y lógica de tu decisión para guardar en logs."),
        confidence: z.number().min(0).max(1).describe("Nivel de confianza de 0 a 1.")
      }),
      prompt: systemPrompt,
      temperature: 0.2
    });

    return object as LLMDecision;
  } catch (err: any) {
    console.error("[LLM API] generateObject Error:", err);
    throw new Error(`Fallo en el servidor del LLM: ${err.message}`);
  }
}

export async function executeModerator(
  userId: string,
  apiKeyId: string,
  modelName: string,
  strategy: Strategy,
  pair: string,
  decisions: LLMDecision[],
  db: FirebaseFirestore.Firestore
) {
  // 1. Fetch API key
  const keyDoc = await db.doc(`users/${userId}/apiKeys/${apiKeyId}`).get();
  if (!keyDoc.exists) throw new Error("API Key del moderador no encontrada.");
  const keyData = keyDoc.data() as ApiKey;

  // 2. Decrypt key
  const rawKey = decryptText(keyData.encryptedKey, keyData.iv);

  // 3. Initialize Provider
  let aiModel;
  const targetModel = modelName || "openai/gpt-4o";

  switch (keyData.provider) {
    case "openrouter":
      const orProvider = createOpenRouter({ apiKey: rawKey });
      aiModel = orProvider(targetModel);
      break;
    case "openai":
      const oaProvider = createOpenAI({ apiKey: rawKey });
      aiModel = oaProvider(targetModel);
      break;
    case "anthropic":
      const anProvider = createAnthropic({ apiKey: rawKey });
      aiModel = anProvider(targetModel);
      break;
    case "gemini":
      const geProvider = createGoogleGenerativeAI({ apiKey: rawKey });
      aiModel = geProvider(targetModel);
      break;
    case "deepseek":
      const dsProvider = createOpenAI({ apiKey: rawKey, baseURL: "https://api.deepseek.com/v1" });
      aiModel = dsProvider(targetModel);
      break;
    default:
      throw new Error(`Proveedor de moderador no soportado.`);
  }

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
    const { object } = await generateObject({
      model: aiModel,
      schema: z.object({
        decision: z.enum(["BUY", "SELL", "HOLD"]),
        confidence: z.number().min(0).max(1),
        summary: z.string().describe("Resumen ejecutivo del consenso alcanzado y la justificación mayoritaria.")
      }),
      prompt: systemPrompt,
      temperature: 0.1
    });

    return object;
  } catch (err: any) {
    console.error("[MODERATOR] generateObject Error:", err);
    throw new Error(`Fallo en el servidor del Moderador: ${err.message}`);
  }
}

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
  const keyDoc = await db.doc(`users/${userId}/apiKeys/${apiKeyId}`).get();
  if (!keyDoc.exists) throw new Error("API Key no encontrada o eliminada.");
  const keyData = keyDoc.data() as ApiKey;

  const rawKey = decryptText(keyData.encryptedKey, keyData.iv);

  let aiModel;
  const targetModel = modelName || "openai/gpt-4o";

  switch (keyData.provider) {
    case "openrouter":
      const orProvider = createOpenRouter({ apiKey: rawKey });
      aiModel = orProvider(targetModel);
      break;
    case "openai":
      const oaProvider = createOpenAI({ apiKey: rawKey });
      aiModel = oaProvider(targetModel);
      break;
    case "anthropic":
      const anProvider = createAnthropic({ apiKey: rawKey });
      aiModel = anProvider(targetModel);
      break;
    case "gemini":
      const geProvider = createGoogleGenerativeAI({ apiKey: rawKey });
      aiModel = geProvider(targetModel);
      break;
    case "deepseek":
      const dsProvider = createOpenAI({ apiKey: rawKey, baseURL: "https://api.deepseek.com/v1" });
      aiModel = dsProvider(targetModel);
      break;
    default:
      throw new Error(`Proveedor de LLM ${keyData.provider} no soportado.`);
  }

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
    const { object } = await generateObject({
      model: aiModel,
      schema: z.object({
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
      prompt: systemPrompt,
      temperature: 0.3
    });

    return object as BacktestResult;
  } catch (err: any) {
    console.error("[BACKTEST] generateObject Error:", err);
    throw new Error(`Fallo en el servidor del Simulador: ${err.message}`);
  }
}
