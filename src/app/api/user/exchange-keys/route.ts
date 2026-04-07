export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { encryptText } from "@/lib/crypto/keys";
import { ExchangeId, PLAN_LIMITS, PlanTier } from "@/lib/types";
import { z } from "zod";

const exchangeKeySchema = z.object({
  name: z.string().trim().min(1).max(120),
  provider: z.custom<ExchangeId>((value) => typeof value === "string" && value.length > 0, "Exchange inválido"),
  apiKey: z.string().trim().min(1),
  apiSecret: z.string().trim().min(1),
  passphrase: z.string().trim().optional(),
  sandbox: z.boolean().optional().default(false),
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

    const parsed = exchangeKeySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { name, provider, apiKey, apiSecret, passphrase, sandbox } = parsed.data;
    const db = getAdminDb();
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    const plan = (userDoc.data()?.plan || "starter") as PlanTier;
    const planLimits = PLAN_LIMITS[plan];

    const existingKeys = await userRef.collection("exchangeKeys").count().get();
    if (existingKeys.data().count >= planLimits.maxExchanges) {
      return NextResponse.json(
        { error: `Tu plan ${plan} permite hasta ${planLimits.maxExchanges} exchanges conectados.` },
        { status: 403 }
      );
    }

    const { encrypted: encryptedApiKey, iv: apiKeyIv } = encryptText(apiKey);
    const { encrypted: encryptedApiSecret, iv: apiSecretIv } = encryptText(apiSecret);
    
    let encryptedApiPassword: string | undefined;
    let apiPasswordIv: string | undefined;
    if (passphrase) {
      const encrypted = encryptText(passphrase);
      encryptedApiPassword = encrypted.encrypted;
      apiPasswordIv = encrypted.iv;
    }

    const keyRef = userRef.collection("exchangeKeys").doc();
    
    const keyData = {
      id: keyRef.id,
      name,
      exchange: provider,
      encryptedApiKey,
      apiKeyIv,
      encryptedApiSecret,
      apiSecretIv,
      sandbox,
      ...(encryptedApiPassword && apiPasswordIv ? { encryptedApiPassword, apiPasswordIv } : {}),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await keyRef.set(keyData);

    return NextResponse.json({
      success: true,
      data: {
        id: keyData.id,
        name: keyData.name,
        exchange: keyData.exchange,
        provider: keyData.exchange,
        createdAt: keyData.createdAt,
      }
    });
  } catch (error: any) {
    console.error("Error creating exchange key:", error);
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
      .collection("exchangeKeys")
      .orderBy("createdAt", "desc")
      .get();

    const keys = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        exchange: data.exchange || data.provider,
        provider: data.exchange || data.provider,
        createdAt: data.createdAt,
        sandbox: Boolean(data.sandbox),
      };
    });

    return NextResponse.json({ success: true, data: keys });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
