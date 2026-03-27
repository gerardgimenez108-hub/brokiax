import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// ─── GET /api/user/strategies ────────────────────────
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const snapshot = await getAdminDb()
      .collection(`users/${uid}/strategies`)
      .orderBy("createdAt", "desc")
      .get();

    const strategies = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    });

    return NextResponse.json(strategies);
  } catch (error) {
    console.error("Error fetching strategies:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ─── POST /api/user/strategies ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const uid = decodedToken.uid;

    const data = await req.json();

    if (!data.name || !data.config) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (name, config)" },
        { status: 400 }
      );
    }

    const newStrategy = {
      name: data.name,
      description: data.description || "",
      isActive: data.isActive ?? true,
      config: data.config,
      userId: uid,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await getAdminDb()
      .collection(`users/${uid}/strategies`)
      .add(newStrategy);

    // Fetch newly created to return it with dates/ID
    const savedDoc = await docRef.get();

    return NextResponse.json(
      { id: savedDoc.id, ...savedDoc.data() },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating strategy:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
