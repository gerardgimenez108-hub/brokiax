export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";


export async function DELETE(
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
    const { id: traderId } = await params;

    if (!traderId) {
      return NextResponse.json({ error: "Trader ID is required" }, { status: 400 });
    }

    // Comprobar estado antes de borrar
    const docRef = getAdminDb().collection("users").doc(userId).collection("traders").doc(traderId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
        return NextResponse.json({ error: "Trader not found" }, { status: 404 });
    }
    
    const status = doc.data()?.status;
    if (status === "active") {
        return NextResponse.json({ error: "Cannot delete an active trader. Stop it first." }, { status: 400 });
    }

    await docRef.delete();

    // Eliminar subcolecciones asociadas (trades, metrics) en un entorno real con un trigger o recursive delete
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH para actualizar estado (start, stop, pause)
export async function PATCH(
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
    const { id: traderId } = await params;
    
    const { action } = await req.json(); // start, stop, pause

    const validStatuses: Record<string, string> = {
        "start": "active",
        "stop": "stopped",
        "pause": "paused"
    };
    
    const newStatus = validStatuses[action];
    
    if (!newStatus) {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const docRef = getAdminDb().collection("users").doc(userId).collection("traders").doc(traderId);
    
    const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
    };

    if (newStatus === "active") {
        updateData.nextRunAt = new Date(); // Run immediately on start
    }

    await docRef.update(updateData);

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
