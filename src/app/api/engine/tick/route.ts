import { NextRequest, NextResponse } from "next/server";
import { processActiveTraders } from "@/lib/trading/engine";

export const dynamic = "force-dynamic";

// In production, you would protect this endpoint with a secret
// matching the one configured in your CRON service.
const CRON_SECRET = process.env.CRON_SECRET || "dev-cron-secret-123";

// ─── POST /api/engine/tick ───────────────────────────
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    
    // In dev, we can bypass strictly checking if testing locally without headers
    // but typically you should require `Bearer <secret>`
    if (authHeader && authHeader !== `Bearer ${CRON_SECRET}`) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
      }
    }

    const start = Date.now();
    
    // Run the engine
    const { processed, skipped } = await processActiveTraders();

    const elapsedMs = Date.now() - start;

    return NextResponse.json({
      success: true,
      processed,
      skipped,
      elapsedMs
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CRON TICK] Error executing trading engine tick:", error);
    return NextResponse.json(
      { error: "Internal engine block", details: error.message },
      { status: 500 }
    );
  }
}
