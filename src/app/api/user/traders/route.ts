export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";


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

    const body = await req.json();
    const { name, mode, llmProviderId, exchangeKeyId, strategyId, pairs, maxAllocation } = body;

    // TODO: Verify user subscription limits (is allowed to create more traders?)
    // TODO: Verify trial status

    if (!name || !llmProviderId || !exchangeKeyId || !strategyId || !pairs || !maxAllocation) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const traderRef = getAdminDb().collection("users").doc(userId).collection("traders").doc();
    
    const traderData = {
      id: traderRef.id,
      name,
      status: "stopped",
      mode: mode || "paper", // "paper" or "live"
      llmProviderId,
      exchangeKeyId,
      strategyId,
      pairs,
      maxAllocation,
      currentAllocation: 0,
      openPositions: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await traderRef.set(traderData);

    return NextResponse.json({ success: true, data: traderData });
  } catch (error: any) {
    console.error("Error creating trader:", error);
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

    const snapshot = await getAdminDb()
      .collection("users")
      .doc(userId)
      .collection("traders")
      .orderBy("createdAt", "desc")
      .get();

    const traders = snapshot.docs.map(doc => doc.data());

    return NextResponse.json({ success: true, data: traders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
