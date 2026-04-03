import { NextResponse } from "next/server";
import { processActiveTraders } from "@/lib/trading/engine";
import { getAdminDb } from "@/lib/firebase/admin";

// This route should only be accessible securely (e.g. via Vercel Cron or a secret header)
export const maxDuration = 300; // 5 minutes max duration for serverless processing

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Protect cron route with a pre-shared secret (skip if not configured for local dev)
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[CRON] Initiating tick cycle for trading engine...");
    
    const { processed, skipped } = await processActiveTraders();
    
    return NextResponse.json({
      success: true,
      processedTraders: processed,
      skippedTraders: skipped,
      message: `Tick complete. Evaluated ${processed} traders (${skipped} skipped due to interval limits).`
    });

  } catch (error: any) {
    console.error("[CRON] Tick interval failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
