import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { createCompetitionSession } from "@/lib/trading/competition";
import { CompetitionConfig } from "@/lib/types";
import {
  acquireJobLease,
  releaseJobLease,
  startJobLeaseAutoRenewal,
} from "@/lib/runtime/job-lock";
import {
  markRuntimeErrored,
  markRuntimeHealthy,
  markRuntimeSkipped,
  markRuntimeStarted,
} from "@/lib/runtime/status";

const SHOWCASE_ID = "showcase-btc-usdt-1";
const SHOWCASE_JOB_KEY = "showcase-scheduler";
const SHOWCASE_HEARTBEAT_MS = 5 * 60 * 1000;

const SHOWCASE_PARTICIPANTS = [
  {
    apiKeyId: process.env.SHOWCASE_API_KEY_1 || "",
    modelId: "anthropic/claude-3.5-sonnet",
    modelName: "Claude 3.5 Sonnet",
    provider: "openrouter",
  },
  {
    apiKeyId: process.env.SHOWCASE_API_KEY_2 || "",
    modelId: "openai/gpt-4o",
    modelName: "GPT-4o",
    provider: "openrouter",
  },
  {
    apiKeyId: process.env.SHOWCASE_API_KEY_3 || "",
    modelId: "deepseek/deepseek-chat",
    modelName: "DeepSeek Chat",
    provider: "openrouter",
  },
];

const SHOWCASE_DEMO_PARTICIPANTS = [
  {
    apiKeyId: "",
    modelId: "demo-claude",
    modelName: "Claude Showcase",
    provider: "demo",
  },
  {
    apiKeyId: "",
    modelId: "demo-gpt",
    modelName: "GPT Showcase",
    provider: "demo",
  },
  {
    apiKeyId: "",
    modelId: "demo-deepseek",
    modelName: "DeepSeek Showcase",
    provider: "demo",
  },
];

const SHOWCASE_CONFIG: CompetitionConfig = {
  pair: "BTC/USDT",
  strategyId: "balanced",
  intervalSeconds: 30,
  maxCycles: 20,
  maxAllocation: 1000,
};

export function isAuthorizedCronRequest(req: Request | NextRequest) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const xCronSecret = req.headers.get("x-cron-secret") || req.headers.get("X-Cron-Secret");
  const expected = process.env.CRON_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!expected) {
    // In production, cron endpoints must never be open.
    return !isProduction;
  }

  return (
    authHeader === `Bearer ${expected}` ||
    xCronSecret === expected
  );
}

export async function runShowcaseScheduler(ownerId: string) {
  const lease = await acquireJobLease({
    key: SHOWCASE_JOB_KEY,
    ttlMs: 2 * 60 * 1000,
    ownerId,
  });

  if (!lease) {
    await markRuntimeSkipped(
      SHOWCASE_JOB_KEY,
      ownerId,
      "Showcase skipped because another worker owns the showcase lease.",
      SHOWCASE_HEARTBEAT_MS
    );

    return NextResponse.json(
      {
        success: true,
        status: "locked",
        competitionId: SHOWCASE_ID,
      },
      { status: 200 }
    );
  }

  const leaseAutoRenewal = startJobLeaseAutoRenewal({
    key: SHOWCASE_JOB_KEY,
    ttlMs: 2 * 60 * 1000,
    ownerId,
  });

  try {
    await markRuntimeStarted(
      SHOWCASE_JOB_KEY,
      ownerId,
      "Showcase scheduler started.",
      SHOWCASE_HEARTBEAT_MS
    );

    const db = getAdminDb();
    const compDoc = await db.collection("competitions").doc(SHOWCASE_ID).get();

    if (compDoc.exists) {
      const data = compDoc.data()!;

      if (data.status === "running") {
        await markRuntimeHealthy(
          SHOWCASE_JOB_KEY,
          ownerId,
          "Showcase session already queued or running.",
          { nextExpectedHeartbeatMs: SHOWCASE_HEARTBEAT_MS }
        );

        return NextResponse.json({
          success: true,
          status: "running",
          competitionId: SHOWCASE_ID,
        });
      }

      if (data.status === "waiting") {
        await markRuntimeHealthy(
          SHOWCASE_JOB_KEY,
          ownerId,
          "Showcase session already queued for execution.",
          { nextExpectedHeartbeatMs: SHOWCASE_HEARTBEAT_MS }
        );

        return NextResponse.json({
          success: true,
          status: "queued",
          competitionId: SHOWCASE_ID,
          showcaseMode: data.showcaseMode || "demo",
        });
      }

      if (data.status === "finished") {
        const finishedAt = data.finishedAt as { seconds?: number } | undefined;
        const now = Date.now();
        const finishedTime = finishedAt?.seconds ? finishedAt.seconds * 1000 : now;
        const minutesSinceFinished = (now - finishedTime) / 60000;

        if (minutesSinceFinished < 5) {
          await markRuntimeHealthy(
            SHOWCASE_JOB_KEY,
            ownerId,
            "Showcase cooling down before the next session.",
            { nextExpectedHeartbeatMs: SHOWCASE_HEARTBEAT_MS }
          );

          return NextResponse.json({
            success: true,
            status: "waiting",
            competitionId: SHOWCASE_ID,
          });
        }
      }
    }

    const oldEvents = await db.collection("competitions").doc(SHOWCASE_ID).collection("events").get();
    if (!oldEvents.empty) {
      const batch = db.batch();
      oldEvents.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    const missingKeys = SHOWCASE_PARTICIPANTS.filter((participant) => !participant.apiKeyId);
    const showcaseMode = missingKeys.length === 0 ? "llm" : "demo";
    const showcaseParticipants =
      showcaseMode === "llm" ? SHOWCASE_PARTICIPANTS : SHOWCASE_DEMO_PARTICIPANTS;

    const competitionId = await createCompetitionSession(
      "showcase",
      SHOWCASE_CONFIG,
      showcaseParticipants,
      SHOWCASE_ID
    );

    await db.collection("competitions").doc(SHOWCASE_ID).set(
      {
        isShowcase: true,
        showcaseName: "BTC/USDT Battle — Casa vs Invitados",
        showcaseMode,
      },
      { merge: true }
    );

    await markRuntimeHealthy(
      SHOWCASE_JOB_KEY,
      ownerId,
      `Showcase session queued in ${showcaseMode} mode.`,
      { nextExpectedHeartbeatMs: SHOWCASE_HEARTBEAT_MS }
    );

    return NextResponse.json({
      success: true,
      status: "queued",
      competitionId,
      showcaseMode,
    });
  } catch (error) {
    await markRuntimeErrored(
      SHOWCASE_JOB_KEY,
      ownerId,
      error,
      SHOWCASE_HEARTBEAT_MS
    );
    throw error;
  } finally {
    await leaseAutoRenewal.stop();
    await releaseJobLease(SHOWCASE_JOB_KEY, ownerId);
  }
}
