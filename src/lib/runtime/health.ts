import { RuntimeHealthState, RuntimeStatusSnapshot } from "@/lib/types";

export const RUNTIME_JOB_CONFIG = {
  "trading-engine": {
    label: "Trading Engine",
    staleGraceMs: 2 * 60 * 1000,
    fallbackStaleAfterMs: 10 * 60 * 1000,
  },
  "showcase-scheduler": {
    label: "Arena Showcase",
    staleGraceMs: 2 * 60 * 1000,
    fallbackStaleAfterMs: 10 * 60 * 1000,
  },
  "competition-runner": {
    label: "Competition Runner",
    staleGraceMs: 20 * 1000,
    fallbackStaleAfterMs: 60 * 1000,
  },
} as const;

export type RuntimeJobKey = keyof typeof RUNTIME_JOB_CONFIG;
export type RuntimeDerivedStatus =
  | "healthy"
  | "running"
  | "waiting"
  | "stale"
  | "error"
  | "missing";

export interface RuntimeHealthCheck extends RuntimeStatusSnapshot {
  derivedStatus: RuntimeDerivedStatus;
  healthy: boolean;
  stale: boolean;
  heartbeatAgeMs: number | null;
  staleForMs: number | null;
}

export interface RuntimeHealthSummary {
  ok: boolean;
  state: "healthy" | "degraded" | "error";
  checkedAt: string;
  checks: RuntimeHealthCheck[];
}

const RUNTIME_JOB_ORDER = Object.keys(RUNTIME_JOB_CONFIG) as RuntimeJobKey[];

function toMillis(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function getFallbackStatus(key: RuntimeJobKey): RuntimeStatusSnapshot {
  return {
    key,
    label: RUNTIME_JOB_CONFIG[key].label,
    state: "idle",
  };
}

function isStale(snapshot: RuntimeStatusSnapshot, now: number): { stale: boolean; staleForMs: number | null; heartbeatAgeMs: number | null } {
  const lastHeartbeatMs = toMillis(snapshot.lastHeartbeatAt);
  const heartbeatAgeMs = typeof lastHeartbeatMs === "number" ? Math.max(0, now - lastHeartbeatMs) : null;

  const config = RUNTIME_JOB_CONFIG[snapshot.key as RuntimeJobKey];
  const expectedHeartbeatMs = toMillis(snapshot.nextExpectedHeartbeatAt);
  const staleThresholdMs = typeof expectedHeartbeatMs === "number"
    ? expectedHeartbeatMs + config.staleGraceMs
    : typeof lastHeartbeatMs === "number"
      ? lastHeartbeatMs + config.fallbackStaleAfterMs
      : null;

  if (typeof staleThresholdMs !== "number") {
    return { stale: false, staleForMs: null, heartbeatAgeMs };
  }

  if (now <= staleThresholdMs) {
    return { stale: false, staleForMs: null, heartbeatAgeMs };
  }

  return {
    stale: true,
    staleForMs: now - staleThresholdMs,
    heartbeatAgeMs,
  };
}

function deriveStatus(state: RuntimeHealthState, stale: boolean, hasHeartbeat: boolean): RuntimeDerivedStatus {
  if (!hasHeartbeat && state === "idle") {
    return "missing";
  }

  if (state === "error") {
    return "error";
  }

  if (stale) {
    return "stale";
  }

  if (state === "running") {
    return "running";
  }

  if (state === "degraded") {
    return "waiting";
  }

  return "healthy";
}

export function buildRuntimeHealthSummary(runtimeStatus: RuntimeStatusSnapshot[], now = Date.now()): RuntimeHealthSummary {
  const byKey = new Map(runtimeStatus.map((snapshot) => [snapshot.key, snapshot]));

  const checks = RUNTIME_JOB_ORDER.map((key) => {
    const snapshot = byKey.get(key) ?? getFallbackStatus(key);
    const freshness = isStale(snapshot, now);
    const derivedStatus = deriveStatus(
      snapshot.state,
      freshness.stale,
      Boolean(snapshot.lastHeartbeatAt)
    );

    return {
      ...snapshot,
      derivedStatus,
      healthy: derivedStatus === "healthy" || derivedStatus === "running" || derivedStatus === "waiting",
      stale: freshness.stale,
      heartbeatAgeMs: freshness.heartbeatAgeMs,
      staleForMs: freshness.staleForMs,
    } satisfies RuntimeHealthCheck;
  });

  const hasError = checks.some((check) => check.derivedStatus === "error");
  const allHealthy = checks.every((check) => check.healthy);

  return {
    ok: allHealthy,
    state: hasError ? "error" : allHealthy ? "healthy" : "degraded",
    checkedAt: new Date(now).toISOString(),
    checks,
  };
}
