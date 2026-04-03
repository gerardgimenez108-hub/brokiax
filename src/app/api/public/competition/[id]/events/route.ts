// GET /api/public/competition/[id]/events — Read-only access to competition events
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

    // Check competition exists and is showcase
    const compDoc = await db.collection("competitions").doc(id).get();
    if (!compDoc.exists) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    const data = compDoc.data()!;
    if (!data.isShowcase) {
      return NextResponse.json({ error: "Competition not public" }, { status: 403 });
    }

    // Fetch last 100 events
    const eventsCol = db.collection("competitions").doc(id).collection("events");
    const eventsQuery = eventsCol.orderBy("timestamp", "desc").limit(100);
    const eventsSnap = await eventsQuery.get();

    const events = eventsSnap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        cycleIndex: d.cycleIndex,
        participantId: d.participantId,
        model: d.model,
        provider: d.provider,
        action: d.action,
        symbol: d.symbol,
        reasoning: d.reasoning,
        confidence: d.confidence,
        pnlPercent: d.pnlPercent,
        tradeStatus: d.tradeStatus,
        timestamp: d.timestamp,
        eventType: d.eventType,
      };
    }).reverse(); // Return in chronological order

    return NextResponse.json({ success: true, events });
  } catch (error: any) {
    console.error("[PUBLIC EVENTS API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
