/**
 * lib/mcp/server.ts
 * Brokiax MCP Server — Exposes trading platform capabilities as MCP tools.
 * Any AI agent (Claude Desktop, Cursor, VS Code) can control Brokiax traders.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchMarketPrices } from "@/lib/trading/exchange";

export function createBrokiaxMcpServer() {
  const server = new McpServer({
    name: "brokiax",
    version: "1.0.0",
  });

  // ─── Tool 1: list_traders ────────────────────────────────────────
  server.tool(
    "list_traders",
    "Lista todos los traders (agentes IA) del usuario autenticado. Devuelve nombre, par, estado y modelo LLM de cada trader.",
    {},
    async (_args, extra) => {
      const { userId, db } = extra as any;
      const snapshot = await db.collection(`users/${userId}/traders`).get();
      const traders = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(traders, null, 2),
          },
        ],
      };
    }
  );

  // ─── Tool 2: get_trader ──────────────────────────────────────────
  server.tool(
    "get_trader",
    "Obtiene detalles completos de un trader específico por su ID.",
    { traderId: z.string().describe("ID del trader a consultar") },
    async (args, extra) => {
      const { userId, db } = extra as any;
      const doc = await db.doc(`users/${userId}/traders/${args.traderId}`).get();
      if (!doc.exists) {
        return {
          content: [{ type: "text" as const, text: "Trader no encontrado." }],
          isError: true,
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ id: doc.id, ...doc.data() }, null, 2),
          },
        ],
      };
    }
  );

  // ─── Tool 3: list_strategies ─────────────────────────────────────
  server.tool(
    "list_strategies",
    "Lista todas las estrategias de trading configuradas por el usuario.",
    {},
    async (_args, extra) => {
      const { userId, db } = extra as any;
      const snapshot = await db.collection(`users/${userId}/strategies`).get();
      const strategies = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(strategies, null, 2),
          },
        ],
      };
    }
  );

  // ─── Tool 4: get_market_prices ───────────────────────────────────
  server.tool(
    "get_market_prices",
    "Obtiene precios de mercado actuales de las principales criptomonedas (BTC, ETH, SOL, etc.).",
    {},
    async () => {
      const prices = await fetchMarketPrices();
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(prices, null, 2),
          },
        ],
      };
    }
  );

  // ─── Tool 5: get_trade_logs ──────────────────────────────────────
  server.tool(
    "get_trade_logs",
    "Obtiene los logs de decisiones recientes de un trader. Útil para auditoría y análisis de rendimiento.",
    {
      traderId: z.string().describe("ID del trader"),
      limit: z.number().optional().default(10).describe("Número máximo de logs a devolver (default: 10)"),
    },
    async (args, extra) => {
      const { userId, db } = extra as any;
      const snapshot = await db
        .collection(`users/${userId}/traders/${args.traderId}/logs`)
        .orderBy("timestamp", "desc")
        .limit(args.limit || 10)
        .get();
      const logs = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(logs, null, 2),
          },
        ],
      };
    }
  );

  // ─── Tool 6: run_analysis ────────────────────────────────────────
  server.tool(
    "run_analysis",
    "Ejecuta un ciclo de análisis (tick) de un trader activo. El agente IA del trader analiza el mercado y devuelve su decisión (BUY/SELL/HOLD).",
    {
      traderId: z.string().describe("ID del trader a ejecutar"),
    },
    async (args, extra) => {
      const { userId, db } = extra as any;
      const traderDoc = await db.doc(`users/${userId}/traders/${args.traderId}`).get();
      if (!traderDoc.exists) {
        return {
          content: [{ type: "text" as const, text: "Trader no encontrado." }],
          isError: true,
        };
      }
      const trader = traderDoc.data();

      // Use the same LLM execution logic as the engine tick
      const { executeLLMSingle } = await import("@/lib/trading/llm");
      const prices = await fetchMarketPrices();
      const base = trader.pair?.split("/")[0];
      const data = prices.find((x: any) => x.symbol === base);
      const marketContext = `${trader.pair}: $${data?.price || "N/A"}`;

      // Fetch strategy
      const stratDoc = await db.doc(`users/${userId}/strategies/${trader.strategyId}`).get();
      const strategy = stratDoc.exists ? stratDoc.data() : { name: "Default", config: { promptSections: {}, riskControl: {} } };

      const decision = await executeLLMSingle(
        userId,
        trader.apiKeyId,
        trader.llmModel,
        strategy as any,
        marketContext,
        trader.maxAllocation || 1000,
        0,
        0,
        db
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { traderId: args.traderId, pair: trader.pair, decision },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ─── Tool 7: run_debate ──────────────────────────────────────────
  server.tool(
    "run_debate",
    "Lanza un Debate Arena v2 completo: 4 agentes especialistas (Técnico, Fundamental, Alcista, Bajista) debaten y un Moderador emite el veredicto de consenso.",
    {
      pair: z.string().describe("Par de trading (ej. BTC/USDT)"),
      strategyId: z.string().describe("ID de la estrategia a utilizar"),
      apiKeyId: z.string().describe("ID de la API Key para los LLMs"),
      model: z.string().describe("Modelo a usar (ej. openai/gpt-4o)"),
    },
    async (args, extra) => {
      const { userId, db } = extra as any;
      const { executeSpecialistAgent, executeModerator } = await import("@/lib/trading/llm");
      const { fetchMarketNews } = await import("@/lib/trading/search");

      // Fetch strategy
      const stratDoc = await db.doc(`users/${userId}/strategies/${args.strategyId}`).get();
      if (!stratDoc.exists) {
        return {
          content: [{ type: "text" as const, text: "Estrategia no encontrada." }],
          isError: true,
        };
      }
      const strategy = stratDoc.data() as any;

      // Fetch market + news in parallel
      const [prices, news] = await Promise.all([
        fetchMarketPrices(),
        fetchMarketNews(args.pair),
      ]);
      const base = args.pair.split("/")[0];
      const data = prices.find((x: any) => x.symbol === base);
      const marketContext = `${args.pair}: $${data?.price || "N/A"}\n\n--- NOTICIAS (RAG) ---\n${news.summary}`;

      // Run 4 specialists
      const roles = ["technical", "fundamental", "bull", "bear"] as const;
      const specialists = await Promise.all(
        roles.map(async (role) => {
          try {
            return {
              ...(await executeSpecialistAgent(
                userId,
                args.apiKeyId,
                args.model,
                role,
                args.pair,
                marketContext,
                strategy,
                db
              )),
              success: true,
            };
          } catch (err: any) {
            return { role, label: role, model: args.model, action: "HOLD", confidence: 0, reasoning: `Error: ${err.message}`, success: false };
          }
        })
      );

      // Moderator
      const successfulDecisions = specialists
        .filter((s) => s.success)
        .map((s) => ({
          action: s.action as any,
          symbol: args.pair,
          amount_usdt: 0,
          confidence: s.confidence,
          reasoning: `[${s.label}] ${s.reasoning}`,
        }));

      let moderator;
      try {
        moderator = await executeModerator(userId, args.apiKeyId, args.model, strategy, args.pair, successfulDecisions, db);
      } catch (err: any) {
        moderator = { decision: "HOLD", confidence: 0, summary: `Moderador falló: ${err.message}` };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ specialists, moderator, newsQuery: news.query }, null, 2),
          },
        ],
      };
    }
  );

  return server;
}
