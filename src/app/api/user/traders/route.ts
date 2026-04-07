export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { PLAN_LIMITS, PlanTier } from "@/lib/types";
import { STRATEGY_INFO } from "@/lib/strategies";
import { z } from "zod";

const traderSchema = z.object({
  name: z.string().trim().min(1).max(120),
  mode: z.enum(["paper", "live"]).default("paper"),
  llmProviderId: z.string().trim().min(1),
  llmModel: z.string().trim().min(1),
  exchangeKeyId: z.string().trim().optional().nullable(),
  strategyId: z.string().trim().min(1),
  pairs: z.array(z.string().trim().min(1)).min(1).max(20),
  maxAllocation: z.coerce.number().positive(),
});

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

    const parsed = traderSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, mode, llmProviderId, llmModel, exchangeKeyId, strategyId, pairs, maxAllocation } = parsed.data;
    const db = getAdminDb();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const plan = (userDoc.data()?.plan || "starter") as PlanTier;
    const planLimits = PLAN_LIMITS[plan];

    const traderCount = await userRef.collection("traders").count().get();
    if (traderCount.data().count >= planLimits.maxTraders) {
      return NextResponse.json(
        { error: `Tu plan ${plan} permite hasta ${planLimits.maxTraders} traders.` },
        { status: 403 }
      );
    }

    if (mode === "live" && !exchangeKeyId) {
      return NextResponse.json({ error: "Live trading requiere una exchange key." }, { status: 400 });
    }

    const builtInStrategy = Object.prototype.hasOwnProperty.call(STRATEGY_INFO, strategyId);
    if (!builtInStrategy) {
      const strategyDoc = await userRef.collection("strategies").doc(strategyId).get();
      if (!strategyDoc.exists) {
        return NextResponse.json({ error: "La estrategia seleccionada no existe." }, { status: 400 });
      }
    }

    if (exchangeKeyId) {
      const exchangeKeyDoc = await userRef.collection("exchangeKeys").doc(exchangeKeyId).get();
      if (!exchangeKeyDoc.exists) {
        return NextResponse.json({ error: "La exchange key seleccionada no existe." }, { status: 400 });
      }
    }

    const traderRef = userRef.collection("traders").doc();
    
    const traderData = {
      id: traderRef.id,
      name,
      status: "stopped",
      mode,
      llmProviderId,
      llmModel,
      exchangeKeyId: exchangeKeyId || null,
      strategyId,
      pairs,
      maxAllocation,
      currentAllocation: 0,
      openPositions: 0,
      intervalMinutes: builtInStrategy ? STRATEGY_INFO[strategyId as keyof typeof STRATEGY_INFO].defaultInterval : 15,
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
