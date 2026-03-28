/**
 * lib/trading/search.ts
 * Web search utility for RAG context — fetches live news before LLM decisions.
 * Uses Tavily API (best-in-class for AI/RAG use cases).
 */

import { tavily } from "@tavily/core";

export interface NewsResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface MarketNewsContext {
  query: string;
  results: NewsResult[];
  summary: string;
}

/**
 * Fetch live market news for a trading pair.
 * Returns a formatted context string ready to inject into LLM prompts.
 */
export async function fetchMarketNews(pair: string, apiKey?: string): Promise<MarketNewsContext> {
  const key = apiKey || process.env.TAVILY_API_KEY;

  if (!key) {
    return {
      query: pair,
      results: [],
      summary: "[Búsqueda web no disponible — configura TAVILY_API_KEY en tus variables de entorno]"
    };
  }

  const base = pair.split("/")[0]; // BTC from BTC/USDT
  const query = `${base} cryptocurrency price analysis news market outlook 2025`;

  try {
    const client = tavily({ apiKey: key });

    const response = await client.search(query, {
      searchDepth: "basic",
      maxResults: 5,
      includeAnswer: true,
    });

    const results: NewsResult[] = (response.results || []).map((r: any) => ({
      title: r.title || "",
      url: r.url || "",
      content: (r.content || "").slice(0, 400), // Trim to avoid huge prompts
      score: r.score || 0,
      published_date: r.publishedDate
    }));

    // Build a concise summary for the LLM prompt
    const bulletPoints = results
      .slice(0, 4)
      .map((r, i) => `${i + 1}. [${r.title}]: ${r.content}`)
      .join("\n");

    const summary = response.answer
      ? `Resumen de Mercado (Tavily AI): ${response.answer}\n\nFuentes:\n${bulletPoints}`
      : `Noticias Recientes de ${base}:\n${bulletPoints}`;

    return { query, results, summary };
  } catch (err: any) {
    console.error("[SEARCH] Tavily error:", err.message);
    return {
      query,
      results: [],
      summary: `[Error fetching news for ${base}: ${err.message}]`
    };
  }
}
