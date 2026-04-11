import { processActiveTraders } from "@/lib/trading/engine";
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

export interface TradingEngineRunResult {
  success: boolean;
  processed: number;
  skipped: number;
  elapsedMs: number;
  leaseAcquired: boolean;
  ownerId: string;
}

export interface RunTradingEngineOptions {
  ownerId: string;
  ttlMs?: number;
}

const ENGINE_JOB_KEY = "trading-engine";
const ENGINE_HEARTBEAT_MS = 5 * 60 * 1000;

export async function runTradingEngineCycle({
  ownerId,
  ttlMs = ENGINE_HEARTBEAT_MS,
}: RunTradingEngineOptions): Promise<TradingEngineRunResult> {
  const lease = await acquireJobLease({
    key: ENGINE_JOB_KEY,
    ttlMs,
    ownerId,
  });

  if (!lease) {
    await markRuntimeSkipped(
      ENGINE_JOB_KEY,
      ownerId,
      "Tick skipped because another worker owns the execution lease.",
      ENGINE_HEARTBEAT_MS
    );

    return {
      success: true,
      processed: 0,
      skipped: 0,
      elapsedMs: 0,
      leaseAcquired: false,
      ownerId,
    };
  }

  const start = Date.now();
  const leaseAutoRenewal = startJobLeaseAutoRenewal({
    key: ENGINE_JOB_KEY,
    ttlMs,
    ownerId,
  });

  try {
    await markRuntimeStarted(
      ENGINE_JOB_KEY,
      ownerId,
      "Trading engine cycle started.",
      ENGINE_HEARTBEAT_MS
    );

    const { processed, skipped } = await processActiveTraders();
    const elapsedMs = Date.now() - start;

    await markRuntimeHealthy(
      ENGINE_JOB_KEY,
      ownerId,
      `Trading engine completed. ${processed} trader(s) processed, ${skipped} skipped.`,
      {
        durationMs: elapsedMs,
        processed,
        skipped,
        nextExpectedHeartbeatMs: ENGINE_HEARTBEAT_MS,
      }
    );

    return {
      success: true,
      processed,
      skipped,
      elapsedMs,
      leaseAcquired: true,
      ownerId,
    };
  } catch (error) {
    await markRuntimeErrored(
      ENGINE_JOB_KEY,
      ownerId,
      error,
      ENGINE_HEARTBEAT_MS
    );
    throw error;
  } finally {
    await leaseAutoRenewal.stop();
    await releaseJobLease(ENGINE_JOB_KEY, ownerId);
  }
}
