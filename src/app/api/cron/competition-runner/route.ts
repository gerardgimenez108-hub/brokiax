export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleCompetitionRunnerCron } from "@/lib/runtime/competition-runner";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    return await handleCompetitionRunnerCron(req);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handleCompetitionRunnerCron(req);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
