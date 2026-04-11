import { NextRequest, NextResponse } from "next/server";
import { processQueuedCompetitions } from "@/lib/trading/competition";
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
import { isAuthorizedCronRequest } from "@/lib/runtime/showcase";

const COMPETITION_RUNNER_JOB_KEY = "competition-runner";
const COMPETITION_RUNNER_HEARTBEAT_MS = 15 * 1000;
const COMPETITION_RUNNER_LEASE_MS = 45 * 1000;

export async function runCompetitionRunner(ownerId: string) {
  const lease = await acquireJobLease({
    key: COMPETITION_RUNNER_JOB_KEY,
    ttlMs: COMPETITION_RUNNER_LEASE_MS,
    ownerId,
  });

  if (!lease) {
    await markRuntimeSkipped(
      COMPETITION_RUNNER_JOB_KEY,
      ownerId,
      "Competition runner skipped because another worker owns the runner lease.",
      COMPETITION_RUNNER_HEARTBEAT_MS
    );

    return NextResponse.json({
      success: true,
      status: "locked",
      leaseAcquired: false,
      processed: 0,
      skipped: 0,
      message: "Competition runner skipped because another worker already owns the lease.",
    });
  }

  const leaseAutoRenewal = startJobLeaseAutoRenewal({
    key: COMPETITION_RUNNER_JOB_KEY,
    ttlMs: COMPETITION_RUNNER_LEASE_MS,
    ownerId,
  });

  try {
    await markRuntimeStarted(
      COMPETITION_RUNNER_JOB_KEY,
      ownerId,
      "Competition runner cycle started.",
      COMPETITION_RUNNER_HEARTBEAT_MS
    );

    const result = await processQueuedCompetitions(ownerId);

    if (result.processed === 0) {
      await markRuntimeSkipped(
        COMPETITION_RUNNER_JOB_KEY,
        ownerId,
        "No competitions were ready to advance.",
        COMPETITION_RUNNER_HEARTBEAT_MS
      );
    } else {
      await markRuntimeHealthy(
        COMPETITION_RUNNER_JOB_KEY,
        ownerId,
        `Competition runner advanced ${result.processed} session(s).`,
        {
          processed: result.processed,
          skipped: result.skipped,
          nextExpectedHeartbeatMs: COMPETITION_RUNNER_HEARTBEAT_MS,
        }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.processed > 0 ? "advanced" : "idle",
      leaseAcquired: true,
      processed: result.processed,
      skipped: result.skipped,
      message:
        result.processed > 0
          ? `Competition runner advanced ${result.processed} session(s).`
          : "No competitions were ready to advance.",
    });
  } catch (error) {
    await markRuntimeErrored(
      COMPETITION_RUNNER_JOB_KEY,
      ownerId,
      error,
      COMPETITION_RUNNER_HEARTBEAT_MS
    );
    throw error;
  } finally {
    await leaseAutoRenewal.stop();
    await releaseJobLease(COMPETITION_RUNNER_JOB_KEY, ownerId);
  }
}

export async function handleCompetitionRunnerCron(req: Request | NextRequest) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runCompetitionRunner(`competition:${process.env.VERCEL_REGION || "local"}`);
}
