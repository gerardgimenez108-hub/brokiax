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

// ─── Debate Arena v2: Specialist Agent Roles ────────────────────────────────

export type AgentRole = "technical" | "fundamental" | "bull" | "bear";

const ROLE_PROMPTS: Record<AgentRole, string> = {
  technical: `Eres un Analista Técnico cuantitativo de élite. Tu ÚNICA función es analizar el par de criptomonedas usando indicadores técnicos clásicos: RSI, MACD, Bandas de Bollinger, niveles de soporte/resistencia, volumen y estructura de precio (Higher Highs, Lower Lows).
  
Debes basar tu decisión EXCLUSIVAMENTE en la acción del precio y los indicadores técnicos. NO opines sobre fundamentales ni noticias. Tu trabajo es identificar la señal técnica más pura.`,

  fundamental: `Eres un Analista Fundamental macro de criptoactivos. Tu función es evaluar el activo desde una perspectiva de valor intrínseco: adopción on-chain, dominancia del par en su sector, actividad de red, sentimiento institucional y condición macro del mercado cripto (fases de ciclo, dominancia de BTC, etc.).
  
Debes basar tu decisión en factores estructurales y de largo plazo. Señala si el activo está sobrecomprado/sobrevendido fundamentalmente.`,

  bull: `Eres el Agente Alcista (Bull). Tu misión es construir el argumento maás sólido posible a favor de una posición COMPRADORA en este activo AHORA MISMO.
  
Destaca todos los catalizadores positivos: momentum técnico favorable, narrativas alcistas del sector, divergencias positivas, niveles de soporte clave, potencial de upside. Sé convincente pero riguroso. Al final emite tu decisión recomendada.`,

  bear: `Eres el Agente Bajista (Bear). Tu misión es construir el argumento más sólido posible en contra de abrir una posición larga, o a favor de una posición VENDEDORA.
  
Destaca todos los riesgos: sobrecompra, divergencias negativas, resistencias clave, macro adverso, posibles trampa alcista, riesgo de liquidez. Sé contundente y riguroso. Al final emite tu decisión recomendada.`
};

const ROLE_LABELS: Record<AgentRole, string> = {
  technical: "Analista Técnico",
  fundamental: "Analista Fundamental",
  bull: "Agente Alcista",
  bear: "Agente Bajista"
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
  const keyDoc = await db.doc(`users/${userId}/apiKeys/${apiKeyId}`).get();
  if (!keyDoc.exists) throw new Error(`API Key (${apiKeyId}) no encontrada.`);
  const keyData = keyDoc.data() as ApiKey;
  const rawKey = decryptText(keyData.encryptedKey, keyData.iv);

  let aiModel;
  const targetModel = modelName || "openai/gpt-4o";

  switch (keyData.provider) {
    case "openrouter": { const p = createOpenRouter({ apiKey: rawKey }); aiModel = p(targetModel); break; }
    case "openai": { const p = createOpenAI({ apiKey: rawKey }); aiModel = p(targetModel); break; }
    case "anthropic": { const p = createAnthropic({ apiKey: rawKey }); aiModel = p(targetModel); break; }
    case "gemini": { const p = createGoogleGenerativeAI({ apiKey: rawKey }); aiModel = p(targetModel); break; }
    case "deepseek": { const p = createOpenAI({ apiKey: rawKey, baseURL: "https://api.deepseek.com/v1" }); aiModel = p(targetModel); break; }
    default: throw new Error(`Proveedor ${keyData.provider} no soportado.`);
  }

  const rolePrompt = ROLE_PROMPTS[role];

  const fullPrompt = `${rolePrompt}

--- CONTEXTO DE MERCADO ACTUAL ---
Par: ${pair}
Precios en vivo: ${marketContext}

--- ESTRATEGIA OPERADA ---
${strategy.name}: ${strategy.config.promptSections?.roleDefinition || "Maximizar retorno ajustado al riesgo."}

Emite tu análisis desde tu rol de ${ROLE_LABELS[role]} y tu decisión final (BUY, SELL o HOLD).`;

  const { object } = await generateObject({
    model: aiModel,
    schema: z.object({
      action: z.enum(["BUY", "SELL", "HOLD"]),
      confidence: z.number().min(0).max(1).describe("Confianza de 0 a 1"),
      reasoning: z.string().describe("Análisis completo desde tu perspectiva de rol.")
    }),
    prompt: fullPrompt,
    temperature: 0.25
  });

  return {
    role,
    label: ROLE_LABELS[role],
    model: targetModel,
    ...object
  };
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
