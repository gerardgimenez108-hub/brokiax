export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { buildRuntimeHealthSummary } from "@/lib/runtime/health";
import {
  getRecentRuntimeEvents,
  getRuntimeLeaseSnapshots,
  getRuntimeStatusSnapshots,
} from "@/lib/runtime/store";
import { isAuthorizedCronRequest } from "@/lib/runtime/showcase";

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const strict = req.nextUrl.searchParams.get("strict") === "1";
    const includeEvents = req.nextUrl.searchParams.get("events") !== "0";
    const includeLeases = req.nextUrl.searchParams.get("leases") !== "0";

    const [runtimeStatus, recentEvents, leases] = await Promise.all([
      getRuntimeStatusSnapshots(),
      includeEvents ? getRecentRuntimeEvents(5) : Promise.resolve([]),
      includeLeases ? getRuntimeLeaseSnapshots() : Promise.resolve([]),
    ]);

    const summary = buildRuntimeHealthSummary(runtimeStatus);

    return NextResponse.json(
      {
        success: true,
        data: {
          ...summary,
          recentEvents,
          leases,
        },
      },
      { status: strict && !summary.ok ? 503 : 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
