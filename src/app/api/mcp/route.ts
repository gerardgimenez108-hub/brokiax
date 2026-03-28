export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createBrokiaxMcpServer } from "@/lib/mcp/server";

/**
 * /api/mcp — Model Context Protocol endpoint for Brokiax.
 * 
 * This endpoint exposes Brokiax tools (list_traders, run_debate, etc.) 
 * to any MCP-compatible AI agent (Claude Desktop, Cursor, VS Code).
 * 
 * Authentication: Bearer token (Firebase ID Token)
 * Transport: JSON-RPC over HTTP (Streamable HTTP compatible)
 * Access: Enterprise plan only
 */

async function handleMcpRequest(req: NextRequest) {
  try {
    const { getAdminAuth, getAdminDb } = await import("@/lib/firebase/admin");

    // 1. Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid Authorization header. Use: Bearer <firebaseIdToken>" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    let userId: string;
    try {
      const decoded = await getAdminAuth().verifyIdToken(token);
      userId = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Check Enterprise plan
    const db = getAdminDb();
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();

    if (!userData || (userData.plan !== "enterprise" && userData.plan !== "elite")) {
      return NextResponse.json(
        {
          error: "MCP API access requires an Enterprise or Elite plan.",
          upgrade: "https://brokiax.com/settings/billing",
        },
        { status: 403 }
      );
    }

    // 3. Parse JSON-RPC request
    const body = await req.json();

    // 4. Create MCP server and process the request
    const server = createBrokiaxMcpServer();

    // We handle the JSON-RPC call manually since we're in a serverless env
    // The MCP SDK's McpServer.tool() handlers receive extra context
    const method = body.method;
    const params = body.params || {};
    const id = body.id;

    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "brokiax", version: "1.0.0" },
        },
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: [
            {
              name: "list_traders",
              description: "Lista todos los traders (agentes IA) del usuario autenticado.",
              inputSchema: { type: "object", properties: {} },
            },
            {
              name: "get_trader",
              description: "Obtiene detalles completos de un trader específico.",
              inputSchema: {
                type: "object",
                properties: { traderId: { type: "string", description: "ID del trader" } },
                required: ["traderId"],
              },
            },
            {
              name: "list_strategies",
              description: "Lista todas las estrategias de trading del usuario.",
              inputSchema: { type: "object", properties: {} },
            },
            {
              name: "get_market_prices",
              description: "Obtiene precios de mercado actuales (BTC, ETH, SOL, etc.).",
              inputSchema: { type: "object", properties: {} },
            },
            {
              name: "get_trade_logs",
              description: "Obtiene logs de decisiones recientes de un trader.",
              inputSchema: {
                type: "object",
                properties: {
                  traderId: { type: "string", description: "ID del trader" },
                  limit: { type: "number", description: "Max logs (default 10)" },
                },
                required: ["traderId"],
              },
            },
            {
              name: "run_analysis",
              description: "Ejecuta un ciclo de análisis de mercado de un trader activo.",
              inputSchema: {
                type: "object",
                properties: { traderId: { type: "string", description: "ID del trader" } },
                required: ["traderId"],
              },
            },
            {
              name: "run_debate",
              description: "Lanza Debate Arena v2: 4 especialistas + Moderador analizan un par de trading.",
              inputSchema: {
                type: "object",
                properties: {
                  pair: { type: "string", description: "Par de trading (ej. BTC/USDT)" },
                  strategyId: { type: "string", description: "ID de la estrategia" },
                  apiKeyId: { type: "string", description: "ID de la API Key" },
                  model: { type: "string", description: "Modelo LLM (ej. openai/gpt-4o)" },
                },
                required: ["pair", "strategyId", "apiKeyId", "model"],
              },
            },
          ],
        },
      });
    }

    if (method === "tools/call") {
      const toolName = params.name;
      const toolArgs = params.arguments || {};

      // Route to the appropriate handler
      const result = await executeToolCall(toolName, toolArgs, userId, db);

      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result,
      });
    }

    return NextResponse.json(
      { jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[MCP] Error:", error);
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32603, message: error.message } },
      { status: 500 }
    );
  }
}

async function executeToolCall(
  toolName: string,
  args: any,
  userId: string,
  db: FirebaseFirestore.Firestore
) {
  const { fetchMarketPrices } = await import("@/lib/trading/exchange");

  switch (toolName) {
    case "list_traders": {
      const snap = await db.collection(`users/${userId}/traders`).get();
      const traders = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      return { content: [{ type: "text", text: JSON.stringify(traders, null, 2) }] };
    }

    case "get_trader": {
      const doc = await db.doc(`users/${userId}/traders/${args.traderId}`).get();
      if (!doc.exists) return { content: [{ type: "text", text: "Trader no encontrado." }], isError: true };
      return { content: [{ type: "text", text: JSON.stringify({ id: doc.id, ...doc.data() }, null, 2) }] };
    }

    case "list_strategies": {
      const snap = await db.collection(`users/${userId}/strategies`).get();
      const strategies = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      return { content: [{ type: "text", text: JSON.stringify(strategies, null, 2) }] };
    }

    case "get_market_prices": {
      const prices = await fetchMarketPrices();
      return { content: [{ type: "text", text: JSON.stringify(prices, null, 2) }] };
    }

    case "get_trade_logs": {
      const snap = await db
        .collection(`users/${userId}/traders/${args.traderId}/logs`)
        .orderBy("timestamp", "desc")
        .limit(args.limit || 10)
        .get();
      const logs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      return { content: [{ type: "text", text: JSON.stringify(logs, null, 2) }] };
    }

    case "run_analysis": {
      const { executeLLMSingle } = await import("@/lib/trading/llm");
      const traderDoc = await db.doc(`users/${userId}/traders/${args.traderId}`).get();
      if (!traderDoc.exists) return { content: [{ type: "text", text: "Trader no encontrado." }], isError: true };
      const trader = traderDoc.data()!;
      const prices = await fetchMarketPrices();
      const base = trader.pair?.split("/")[0];
      const data = prices.find((x: any) => x.symbol === base);
      const marketContext = `${trader.pair}: $${data?.price || "N/A"}`;
      const stratDoc = await db.doc(`users/${userId}/strategies/${trader.strategyId}`).get();
      const strategy = stratDoc.exists ? stratDoc.data() : { name: "Default", config: { promptSections: {}, riskControl: {} } };
      const decision = await executeLLMSingle(userId, trader.apiKeyId, trader.llmModel, strategy as any, marketContext, trader.maxAllocation || 1000, 0, 0, db);
      return { content: [{ type: "text", text: JSON.stringify({ traderId: args.traderId, pair: trader.pair, decision }, null, 2) }] };
    }

    case "run_debate": {
      const { executeSpecialistAgent, executeModerator } = await import("@/lib/trading/llm");
      const { fetchMarketNews } = await import("@/lib/trading/search");
      const stratDoc = await db.doc(`users/${userId}/strategies/${args.strategyId}`).get();
      if (!stratDoc.exists) return { content: [{ type: "text", text: "Estrategia no encontrada." }], isError: true };
      const strategy = stratDoc.data() as any;
      const [prices, news] = await Promise.all([fetchMarketPrices(), fetchMarketNews(args.pair)]);
      const base = args.pair.split("/")[0];
      const data = prices.find((x: any) => x.symbol === base);
      const marketContext = `${args.pair}: $${data?.price || "N/A"}\n\n--- NOTICIAS (RAG) ---\n${news.summary}`;
      const roles = ["technical", "fundamental", "bull", "bear"] as const;
      const specialists = await Promise.all(
        roles.map(async (role) => {
          try {
            return { ...(await executeSpecialistAgent(userId, args.apiKeyId, args.model, role, args.pair, marketContext, strategy, db)), success: true };
          } catch (err: any) {
            return { role, label: role, model: args.model, action: "HOLD", confidence: 0, reasoning: `Error: ${err.message}`, success: false };
          }
        })
      );
      const decisions = specialists.filter(s => s.success).map(s => ({ action: s.action as any, symbol: args.pair, amount_usdt: 0, confidence: s.confidence, reasoning: `[${s.label}] ${s.reasoning}` }));
      let moderator;
      try { moderator = await executeModerator(userId, args.apiKeyId, args.model, strategy, args.pair, decisions, db); }
      catch (err: any) { moderator = { decision: "HOLD", confidence: 0, summary: `Moderador falló: ${err.message}` }; }
      return { content: [{ type: "text", text: JSON.stringify({ specialists, moderator, newsQuery: news.query }, null, 2) }] };
    }

    default:
      return { content: [{ type: "text", text: `Herramienta desconocida: ${toolName}` }], isError: true };
  }
}

export { handleMcpRequest as POST };
