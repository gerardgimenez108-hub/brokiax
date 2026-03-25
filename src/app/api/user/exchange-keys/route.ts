export const dynamic = "force-dynamic";
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
    const { name, provider, apiKey, apiSecret, passphrase } = body;

    if (!name || !provider || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Encrypt both keys
    const { encrypted: encKey, iv: ivKey } = encryptText(apiKey);
    const { encrypted: encSecret, iv: ivSecret } = encryptText(apiSecret);
    
    let encPassphrase, ivPassphrase;
    if (passphrase) {
        const encrypted = encryptText(passphrase);
        encPassphrase = encrypted.encrypted;
        ivPassphrase = encrypted.iv;
    }

    const keyRef = getAdminDb().collection("users").doc(userId).collection("exchangeKeys").doc();
    
    const keyData = {
      id: keyRef.id,
      name,
      provider,
      encryptedKey: encKey,
      ivKey,
      encryptedSecret: encSecret,
      ivSecret,
      ...(encPassphrase && { encryptedPassphrase: encPassphrase, ivPassphrase }),
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
        provider: data.provider,
        createdAt: data.createdAt,
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
