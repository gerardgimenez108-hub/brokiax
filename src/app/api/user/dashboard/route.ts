export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { RuntimeStatusSnapshot } from "@/lib/types";

function bucketMinute(date: Date): number {
  return Math.floor(date.getTime() / 60000) * 60000;
}

function formatBucketLabel(date: Date): string {
  return date.toLocaleString("es-ES", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function resolveTraderEquityValue(trader: Record<string, any>): number {
  return (
    toFiniteNumber(trader.currentValue) ??
    toFiniteNumber(trader.initialCapital) ??
    toFiniteNumber(trader.maxAllocation) ??
    0
  );
}

function resolveMetricEquityValue(metric: Record<string, any>): number | null {
  return (
    toFiniteNumber(metric.equity) ??
    toFiniteNumber(metric.totalValue)
  );
}

export async function GET(req: NextRequest) {
  try {
    const { getAdminAuth, getAdminDb } = await import("@/lib/firebase/admin");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const db = getAdminDb();

    const traderSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("traders")
      .orderBy("createdAt", "desc")
      .get();

    const traders: Array<Record<string, any>> = traderSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const metricsByTrader = await Promise.all(
      traderSnapshot.docs.map(async (traderDoc) => {
        const metricsSnap = await traderDoc.ref
          .collection("metrics")
          .orderBy("timestamp", "asc")
          .limitToLast(40)
          .get();

        return {
          traderId: traderDoc.id,
          initialValue: resolveTraderEquityValue(traderDoc.data()),
          points: metricsSnap.docs
            .map((doc) => doc.data())
            .map((metric) => {
              const value = resolveMetricEquityValue(metric);
              if (!metric.timestamp?.toDate || value === null) {
                return null;
              }

              return {
                timestamp: metric.timestamp.toDate() as Date,
                value,
              };
            })
            .filter((point): point is { timestamp: Date; value: number } => point !== null),
        };
      })
    );

    const bucketSet = new Set<number>();
    for (const traderMetrics of metricsByTrader) {
      for (const point of traderMetrics.points) {
        bucketSet.add(bucketMinute(point.timestamp));
      }
    }

    const sortedBuckets = [...bucketSet].sort((a, b) => a - b).slice(-60);

    let equityHistory: Array<{ date: string; value: number }> = [];

    if (sortedBuckets.length > 0) {
      equityHistory = sortedBuckets.map((bucket) => {
        let total = 0;

        for (const traderMetrics of metricsByTrader) {
          let lastValue = traderMetrics.initialValue;

          for (const point of traderMetrics.points) {
            if (bucketMinute(point.timestamp) <= bucket) {
              lastValue = point.value;
            } else {
              break;
            }
          }

          total += lastValue;
        }

        return {
          date: formatBucketLabel(new Date(bucket)),
          value: Number(total.toFixed(2)),
        };
      });
    } else {
      const totalCurrentValue = traders.reduce(
        (sum, trader) => sum + resolveTraderEquityValue(trader),
        0
      );

      equityHistory = [
        {
          date: "Ahora",
          value: Number(totalCurrentValue.toFixed(2)),
        },
      ];
    }

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

    return NextResponse.json({
      success: true,
      data: {
        traders,
        equityHistory,
        runtimeStatus,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
