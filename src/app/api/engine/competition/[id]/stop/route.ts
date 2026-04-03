// POST /api/engine/competition/[id]/stop — Stop a running competition

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { stopCompetition } from "@/lib/trading/competition";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getAdminAuth } = await import("@/lib/firebase/admin");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    const { id } = await params;

    const { getAdminDb } = await import("@/lib/firebase/admin");
    const db = getAdminDb();

    const compDoc = await db.collection("competitions").doc(id).get();
    if (!compDoc.exists) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    const data = compDoc.data()!;
    if (data.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await stopCompetition(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
