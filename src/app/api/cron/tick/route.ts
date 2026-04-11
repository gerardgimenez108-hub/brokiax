import { NextResponse } from "next/server";
import { runTradingEngineCycle } from "@/lib/runtime/orchestrator";
import { isAuthorizedCronRequest } from "@/lib/runtime/showcase";

// This route should only be accessible securely (e.g. via Firebase Cloud Scheduler + secret header)
export const maxDuration = 300; // 5 minutes max duration for serverless processing

export async function GET(request: Request) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log("[CRON] Initiating tick cycle for trading engine...");

    const run = await runTradingEngineCycle({
      ownerId: `cron:${process.env.VERCEL_REGION || "local"}`,
    });

    return NextResponse.json({
      success: true,
      processedTraders: run.processed,
      skippedTraders: run.skipped,
      leaseAcquired: run.leaseAcquired,
      message: run.leaseAcquired
        ? `Tick complete. Evaluated ${run.processed} traders (${run.skipped} skipped due to interval limits).`
        : "Tick skipped because another engine worker already owns the lease.",
    });

  } catch (error: any) {
    console.error("[CRON] Tick interval failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
