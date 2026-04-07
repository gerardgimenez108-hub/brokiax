// /api/cron/showcase-trader — Create/maintain showcase competition
// Called by Firebase Cloud Scheduler every 5 minutes

export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import {
  createCompetitionSession,
  runCompetitionSession,
} from "@/lib/trading/competition";
import { CompetitionConfig } from "@/lib/types";

const SHOWCASE_ID = "showcase-btc-usdt-1";

// Showcase participants — these are the "house" API keys
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

const SHOWCASE_CONFIG: CompetitionConfig = {
  pair: "BTC/USDT",
  strategyId: "balanced",
  intervalSeconds: 30, // Faster cycles for demo purposes
  maxCycles: 20,
  maxAllocation: 1000, // 1000€ paper trading per participant
};

async function handleCron(req: NextRequest) {
  try {
    // Verify cron secret (recommended: Authorization: Bearer <CRON_SECRET>)
    const authHeader = req.headers.get("Authorization");
    const xCronSecret = req.headers.get("X-Cron-Secret");
    const expected = process.env.CRON_SECRET;

    const isAuthorized =
      !expected ||
      authHeader === `Bearer ${expected}` ||
      xCronSecret === expected;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { getAdminDb } = await import("@/lib/firebase/admin");
    const db = getAdminDb();

    // Check if showcase competition exists and is still running
    const compDoc = await db.collection("competitions").doc(SHOWCASE_ID).get();

    if (compDoc.exists) {
      const data = compDoc.data()!;

      // If still running and not finished, keep it
      if (data.status === "running") {
        console.log(`[SHOWCASE] Competition ${SHOWCASE_ID} is still running (cycle ${data.currentCycle})`);
        return NextResponse.json({
          success: true,
          status: "running",
          competitionId: SHOWCASE_ID,
        });
      }

      // If finished, wait a bit before restarting (to show results)
      if (data.status === "finished") {
        const finishedAt = data.finishedAt as { seconds?: number } | undefined;
        const now = Date.now();
        const finishedTime = finishedAt?.seconds ? finishedAt.seconds * 1000 : now;
        const minutesSinceFinished = (now - finishedTime) / 60000;

        // Wait 5 minutes after finish before restarting
        if (minutesSinceFinished < 5) {
          console.log(`[SHOWCASE] Competition finished ${minutesSinceFinished.toFixed(1)}m ago, waiting...`);
          return NextResponse.json({
            success: true,
            status: "waiting",
            competitionId: SHOWCASE_ID,
          });
        }
      }
    }

    // Create new showcase competition
    console.log("[SHOWCASE] Creating new competition...");

    // Cleanup stale events from previous showcase runs
    const oldEvents = await db.collection("competitions").doc(SHOWCASE_ID).collection("events").get();
    if (!oldEvents.empty) {
      const batch = db.batch();
      oldEvents.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    // Validate API keys are configured
    const missingKeys = SHOWCASE_PARTICIPANTS.filter(p => !p.apiKeyId);
    if (missingKeys.length > 0) {
      console.warn("[SHOWCASE] Missing API keys:", missingKeys.map(p => p.modelName));
      // For demo purposes, we'll still create the competition but log the warning
      // In production, you'd want to fail here
    }

    // Create competition with isShowcase flag
    const competitionId = await createCompetitionSession(
      "showcase", // Special user ID for showcase
      SHOWCASE_CONFIG,
      SHOWCASE_PARTICIPANTS,
      SHOWCASE_ID
    );

    // Mark as showcase (public)
    await db.collection("competitions").doc(SHOWCASE_ID).set({
      isShowcase: true,
      showcaseName: "BTC/USDT Battle — Casa vs Invitados",
    }, { merge: true });

    console.log(`[SHOWCASE] Created competition ${competitionId}`);

    // Start the competition runner in background
    runCompetitionSession(SHOWCASE_ID).catch((err) => {
      console.error(`[SHOWCASE] Runner error:`, err);
    });

    return NextResponse.json({
      success: true,
      status: "started",
      competitionId,
    });

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
