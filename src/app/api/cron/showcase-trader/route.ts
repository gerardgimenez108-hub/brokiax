// /api/cron/showcase-trader — Create/maintain showcase competition
// Called by Firebase Cloud Scheduler every 5 minutes

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedCronRequest, runShowcaseScheduler } from "@/lib/runtime/showcase";

async function handleCron(req: NextRequest) {
  try {
    if (!isAuthorizedCronRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return runShowcaseScheduler(`showcase:${process.env.VERCEL_REGION || "local"}`);

  } catch (error: unknown) {
    console.error("[SHOWCASE] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}
