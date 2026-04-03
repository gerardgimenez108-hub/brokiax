// GET /api/public/competition/[id] — Read-only access to competition data
// No authentication required — public showcase endpoint

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getAdminDb } = await import("@/lib/firebase/admin");
    const db = getAdminDb();

    const { id } = await params;

    const compDoc = await db.collection("competitions").doc(id).get();
    if (!compDoc.exists) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    const data = compDoc.data()!;

    // Only show "showcase" competitions (publicly visible)
    if (!data.isShowcase) {
      return NextResponse.json({ error: "Competition not public" }, { status: 403 });
    }

    // Sanitize: remove sensitive data
    const sanitized = {
      id: data.id,
      status: data.status,
      startedAt: data.startedAt,
      finishedAt: data.finishedAt,
      config: data.config,
      participants: data.participants.map((p: any) => ({
        id: p.id,
        modelId: p.modelId,
        modelName: p.modelName,
        provider: p.provider,
        color: p.color,
        status: p.status,
        currentPnlPercent: p.currentPnlPercent,
        totalTrades: p.totalTrades,
        winTrades: p.winTrades,
        lastReasoning: p.lastReasoning,
        lastConfidence: p.lastConfidence,
        lastAction: p.lastAction,
      })),
      leaderboard: data.leaderboard,
      currentCycle: data.currentCycle,
    };

    return NextResponse.json({ success: true, competition: sanitized });
  } catch (error: any) {
    console.error("[PUBLIC COMPETITION API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
