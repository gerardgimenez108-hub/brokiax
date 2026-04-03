// POST /api/engine/competition — Create and start a competition
// GET /api/engine/competition?id=xxx — Get competition status

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createCompetitionSession, runCompetitionSession } from "@/lib/trading/competition";
import { CompetitionConfig } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { getAdminAuth, getAdminDb } = await import("@/lib/firebase/admin");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const db = getAdminDb();

    const body = await req.json();
    const { config, participants } = body as {
      config: CompetitionConfig;
      participants: Array<{ apiKeyId: string; modelId: string; modelName: string; provider: string }>;
    };

    if (!config || !participants || participants.length < 2) {
      return NextResponse.json(
        { error: "Se requieren al menos 2 participantes" },
        { status: 400 }
      );
    }

    if (participants.length > 8) {
      return NextResponse.json(
        { error: "Máximo 8 participantes por competencia" },
        { status: 400 }
      );
    }

    // Validate user owns the API keys
    for (const p of participants) {
      const keyDoc = await db.doc(`users/${userId}/apiKeys/${p.apiKeyId}`).get();
      if (!keyDoc.exists) {
        return NextResponse.json(
          { error: `API Key no encontrada: ${p.apiKeyId}` },
          { status: 400 }
        );
      }
    }

    // Create competition document
    const competitionId = await createCompetitionSession(userId, config, participants);

    // Start competition runner in background (fire-and-forget)
    // The API returns immediately; the session runs async
    runCompetitionSession(competitionId).catch((err) => {
      console.error(`[COMPETITION] Background runner failed for ${competitionId}:`, err);
    });

    return NextResponse.json({ success: true, competitionId }, { status: 201 });

  } catch (error: any) {
    console.error("[COMPETITION API] POST error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { getAdminAuth, getAdminDb } = await import("@/lib/firebase/admin");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const competitionId = req.nextUrl.searchParams.get("id");
    if (!competitionId) {
      return NextResponse.json({ error: "Competition ID required" }, { status: 400 });
    }

    const db = getAdminDb();
    const compDoc = await db.collection("competitions").doc(competitionId).get();

    if (!compDoc.exists) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    const data = compDoc.data()!;
    if (data.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, competition: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
