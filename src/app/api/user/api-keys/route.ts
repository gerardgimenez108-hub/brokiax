export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { encryptText } from "@/lib/crypto/keys";
import { LLMProvider } from "@/lib/types";
import { z } from "zod";
import { privateKeyToAccount } from "viem/accounts";

const apiKeySchema = z.object({
  name: z.string().trim().min(1).max(120),
  provider: z.custom<LLMProvider>((value) => typeof value === "string" && value.length > 0, "Proveedor inválido"),
  rawKey: z.string().trim().min(1),
});

function normalizePrivateKey(rawKey: string): `0x${string}` {
  return (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
}

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

    const parsed = apiKeySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { name, provider, rawKey } = parsed.data;

    const { encrypted, iv } = encryptText(rawKey);

    const keyRef = getAdminDb().collection("users").doc(userId).collection("apiKeys").doc();
    let walletAddress: string | undefined;
    let chainId: number | undefined;

    if (provider === "x402") {
      walletAddress = privateKeyToAccount(normalizePrivateKey(rawKey)).address;
      chainId = 8453;
    }
    
    const keyData = {
      id: keyRef.id,
      name,
      provider,
      encryptedKey: encrypted,
      iv,
      ...(walletAddress ? { walletAddress, chainId } : {}),
      createdAt: new Date(),
    };

    await keyRef.set(keyData);

    return NextResponse.json({
      success: true,
      data: {
        id: keyData.id,
        name: keyData.name,
        provider: keyData.provider,
        createdAt: keyData.createdAt,
        walletAddress: keyData.walletAddress || null,
        chainId: keyData.chainId || null,
      }
    });

  } catch (error: any) {
    console.error("Error creating API key:", error);
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
      .collection("apiKeys")
      .orderBy("createdAt", "desc")
      .get();

    const keys = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.id,
        name: data.name,
        provider: data.provider,
        createdAt: data.createdAt,
        lastUsedAt: data.lastUsedAt,
        walletAddress: data.walletAddress || null,
        chainId: data.chainId || null,
      };
    });

    return NextResponse.json({ success: true, data: keys });

  } catch (error: any) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
