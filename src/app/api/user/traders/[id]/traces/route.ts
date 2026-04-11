export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

function toIsoString(value: any): string | null {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return null;
}

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isFinite(parsed)) {
    return 20;
  }

  return Math.max(1, Math.min(parsed, 50));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getAdminAuth, getAdminDb } = await import("@/lib/firebase/admin");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const { id } = await params;
    const limit = parseLimit(req.nextUrl.searchParams.get("limit"));
    const includeReasoning = req.nextUrl.searchParams.get("includeReasoning") !== "0";
    const db = getAdminDb();

    const traderRef = db.doc(`users/${userId}/traders/${id}`);
    const traderDoc = await traderRef.get();

    if (!traderDoc.exists) {
      return NextResponse.json({ error: "Trader not found" }, { status: 404 });
    }

    const tradesSnap = await traderRef
      .collection("trades")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const traces = tradesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        side: data.side,
        symbol: data.symbol,
        status: data.status,
        price: typeof data.price === "number" ? data.price : null,
        amountUsdt: typeof data.amountUsdt === "number" ? data.amountUsdt : null,
        quantity: typeof data.quantity === "number" ? data.quantity : null,
        confidence: typeof data.confidence === "number" ? data.confidence : null,
        errorMessage: data.errorMessage || null,
        createdAt: toIsoString(data.createdAt),
        ...(includeReasoning ? { reasoning: data.reasoning || "" } : {}),
        trace: data.trace || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        traderId: id,
        count: traces.length,
        traces,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
