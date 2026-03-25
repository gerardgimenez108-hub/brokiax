export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { encryptText } from "@/lib/crypto/keys";

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
    const { name, provider, rawKey } = body;

    if (!name || !provider || !rawKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { encrypted, iv } = encryptText(rawKey);

    const keyRef = getAdminDb().collection("users").doc(userId).collection("apiKeys").doc();
    
    const keyData = {
      id: keyRef.id,
      name,
      provider,
      encryptedKey: encrypted,
      iv,
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
