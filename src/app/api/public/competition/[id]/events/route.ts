// GET /api/public/competition/[id]/events — Read-only access to competition events
// No authentication required — public showcase endpoint

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

function toMillis(ts: unknown): number {
  if (!ts) return 0;
  if (typeof ts === "object" && ts !== null && "toMillis" in ts && typeof (ts as { toMillis: () => number }).toMillis === "function") {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (typeof ts === "object" && ts !== null && "seconds" in ts) {
    const withSeconds = ts as { seconds: number; nanoseconds?: number };
    if (typeof withSeconds.seconds === "number") {
      return withSeconds.seconds * 1000 + Math.floor((withSeconds.nanoseconds || 0) / 1_000_000);
    }
  }
  if (typeof ts === "number") return ts;
  return 0;
}

function mapEvent(doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) {
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
    tsMs: toMillis(d.timestamp),
  };
}

function stripTsMs<T extends { tsMs: number }>(entry: T): Omit<T, "tsMs"> {
  const { tsMs: _tsMs, ...rest } = entry;
  return rest;
}

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

    const eventsCol = db.collection("competitions").doc(id).collection("events");
    const wantsStream = req.nextUrl.searchParams.get("stream") === "1"
      || (req.headers.get("accept") || "").includes("text/event-stream");

    if (!wantsStream) {
      // Fetch last 100 events as JSON fallback
      const eventsSnap = await eventsCol.orderBy("timestamp", "desc").limit(100).get();
      const events = eventsSnap.docs.map(mapEvent).reverse().map(stripTsMs);
      return NextResponse.json({ success: true, events });
    }

    const encoder = new TextEncoder();
    let closed = false;
    let cursor = Number(req.nextUrl.searchParams.get("since") || 0);

    const stream = new ReadableStream({
      start(controller) {
        const send = (event: string, payload: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
        };

        const poll = async () => {
          if (closed) return;
          const snap = await eventsCol.orderBy("timestamp", "desc").limit(100).get();
          const rows = snap.docs.map(mapEvent);

          const fresh = rows
            .filter((e) => e.tsMs > cursor)
            .sort((a, b) => a.tsMs - b.tsMs);

          for (const event of fresh) {
            cursor = Math.max(cursor, event.tsMs);
            const data = stripTsMs(event);
            send(data.eventType || "message", data);
          }
        };

        send("connected", { competitionId: id, ts: Date.now() });

        poll()
          .then(async () => {
            const snap = await eventsCol.orderBy("timestamp", "desc").limit(100).get();
            const snapshotEvents = snap.docs.map(mapEvent).reverse().map(stripTsMs);
            send("snapshot", { events: snapshotEvents });
          })
          .catch((err) => {
            send("error", { message: err.message });
          });

        const pollTimer = setInterval(() => {
          poll().catch((err) => send("error", { message: err.message }));
        }, 2000);

        const heartbeatTimer = setInterval(() => {
          send("heartbeat", { ts: Date.now() });
        }, 15000);

        const close = () => {
          if (closed) return;
          closed = true;
          clearInterval(pollTimer);
          clearInterval(heartbeatTimer);
          controller.close();
        };

        req.signal.addEventListener("abort", close);
      },
      cancel() {
        closed = true;
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: unknown) {
    console.error("[PUBLIC EVENTS API] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
