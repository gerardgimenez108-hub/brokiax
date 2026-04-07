import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";
import { normalizeStrategyConfig } from "@/lib/types/strategy";
import { z } from "zod";

const createStrategySchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().default(""),
  isActive: z.boolean().optional().default(true),
  config: z.unknown().transform((value) => normalizeStrategyConfig(value)),
});

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

    const parsed = createStrategySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload de estrategia inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const newStrategy = {
      name: data.name,
      description: data.description,
      isActive: data.isActive,
      config: data.config,
      userId: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
