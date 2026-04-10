export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { buildRuntimeHealthSummary } from "@/lib/runtime/health";
import { RuntimeStatusSnapshot } from "@/lib/types";
import { isAuthorizedCronRequest } from "@/lib/runtime/showcase";

function toIsoString(value: any): string | null {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return null;
}

export async function GET(req: NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const runtimeDocs = await db
      .collection("runtimeStatus")
      .where("key", "in", ["trading-engine", "showcase-scheduler", "competition-runner"])
      .get();

    const runtimeStatus: RuntimeStatusSnapshot[] = runtimeDocs.docs.map((doc) => {
      const data = doc.data();
      return {
        key: data.key,
        label: data.label,
        state: data.state,
        ownerId: data.ownerId || undefined,
        lastMessage: data.lastMessage || undefined,
        lastHeartbeatAt: toIsoString(data.lastHeartbeatAt),
        lastStartedAt: toIsoString(data.lastStartedAt),
        lastFinishedAt: toIsoString(data.lastFinishedAt),
        lastSuccessAt: toIsoString(data.lastSuccessAt),
        lastErrorAt: toIsoString(data.lastErrorAt),
        lastDurationMs:
          typeof data.lastDurationMs === "number" ? data.lastDurationMs : undefined,
        lastProcessed:
          typeof data.lastProcessed === "number" ? data.lastProcessed : undefined,
        lastSkipped:
          typeof data.lastSkipped === "number" ? data.lastSkipped : undefined,
        nextExpectedHeartbeatAt: toIsoString(data.nextExpectedHeartbeatAt),
      };
    });

    const summary = buildRuntimeHealthSummary(runtimeStatus);
    const strict = req.nextUrl.searchParams.get("strict") === "1";

    return NextResponse.json(
      {
        success: true,
        data: summary,
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
