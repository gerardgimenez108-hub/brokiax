import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import * as admin from "firebase-admin";

// Helper to get UID from token
async function getUid(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    return decodedToken.uid;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await getUid(req);
    if (!uid) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const doc = await getAdminDb()
      .doc(`users/${uid}/strategies/${id}`)
      .get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Estrategia no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error fetching strategy:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await getUid(req);
    if (!uid) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    const docRef = getAdminDb()
      .doc(`users/${uid}/strategies/${id}`);

    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Estrategia no encontrada" }, { status: 404 });
    }

    const updateData = {
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Remove immutable fields just in case
    delete updateData.id;
    delete updateData.userId;
    delete updateData.createdAt;

    await docRef.update(updateData);
    
    // Return updated doc
    const updated = await docRef.get();
    return NextResponse.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error("Error updating strategy:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const uid = await getUid(req);
    if (!uid) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const docRef = getAdminDb()
      .doc(`users/${uid}/strategies/${id}`);

    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Estrategia no encontrada" }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error deleting strategy:", error);
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
