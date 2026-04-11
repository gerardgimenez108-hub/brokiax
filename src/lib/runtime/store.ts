import { getAdminDb } from "@/lib/firebase/admin";
import { RuntimeEventSnapshot, RuntimeLeaseSnapshot, RuntimeStatusSnapshot } from "@/lib/types";
import { RuntimeJobKey } from "@/lib/runtime/status";

const RUNTIME_STATUS_COLLECTION = "runtimeStatus";
const RUNTIME_EVENTS_SUBCOLLECTION = "events";
const RUNTIME_LOCKS_COLLECTION = "runtimeLocks";
const RUNTIME_JOB_KEYS: RuntimeJobKey[] = [
  "trading-engine",
  "showcase-scheduler",
  "competition-runner",
];

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

function mapRuntimeStatusDoc(data: Record<string, any>): RuntimeStatusSnapshot {
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
    lastDurationMs: typeof data.lastDurationMs === "number" ? data.lastDurationMs : undefined,
    lastProcessed: typeof data.lastProcessed === "number" ? data.lastProcessed : undefined,
    lastSkipped: typeof data.lastSkipped === "number" ? data.lastSkipped : undefined,
    nextExpectedHeartbeatAt: toIsoString(data.nextExpectedHeartbeatAt),
  };
}

function mapRuntimeEventDoc(id: string, data: Record<string, any>): RuntimeEventSnapshot {
  return {
    id,
    key: data.key,
    label: data.label,
    state: data.state,
    ownerId: data.ownerId || undefined,
    message: data.message || "No message",
    createdAt: toIsoString(data.createdAt),
    durationMs: typeof data.durationMs === "number" ? data.durationMs : undefined,
    processed: typeof data.processed === "number" ? data.processed : undefined,
    skipped: typeof data.skipped === "number" ? data.skipped : undefined,
  };
}

function mapRuntimeLeaseDoc(
  key: RuntimeJobKey,
  data?: Record<string, any>
): RuntimeLeaseSnapshot {
  const leaseUntilMs = typeof data?.leaseUntilMs === "number" ? data.leaseUntilMs : undefined;
  const leaseUntilAt = typeof leaseUntilMs === "number" && leaseUntilMs > 0
    ? new Date(leaseUntilMs).toISOString()
    : null;

  return {
    key,
    ownerId: data?.ownerId || undefined,
    leaseUntilMs,
    leaseUntilAt,
    acquiredAt: toIsoString(data?.acquiredAt),
    updatedAt: toIsoString(data?.updatedAt),
    releasedAt: toIsoString(data?.releasedAt),
    active: typeof leaseUntilMs === "number" && leaseUntilMs > Date.now(),
  };
}

export async function getRuntimeStatusSnapshots(): Promise<RuntimeStatusSnapshot[]> {
  const db = getAdminDb();
  const runtimeDocs = await db
    .collection(RUNTIME_STATUS_COLLECTION)
    .where("key", "in", RUNTIME_JOB_KEYS)
    .get();

  return runtimeDocs.docs.map((doc) => mapRuntimeStatusDoc(doc.data()));
}

export async function getRecentRuntimeEvents(limitPerJob = 5): Promise<RuntimeEventSnapshot[]> {
  const db = getAdminDb();
  const snapshots = await Promise.all(
    RUNTIME_JOB_KEYS.map((key) =>
      db
        .collection(RUNTIME_STATUS_COLLECTION)
        .doc(key)
        .collection(RUNTIME_EVENTS_SUBCOLLECTION)
        .orderBy("createdAt", "desc")
        .limit(limitPerJob)
        .get()
    )
  );

  return snapshots
    .flatMap((snapshot) => snapshot.docs.map((doc) => mapRuntimeEventDoc(doc.id, doc.data())))
    .sort((a, b) => {
      const aMs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bMs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bMs - aMs;
    });
}

export async function getRuntimeLeaseSnapshots(): Promise<RuntimeLeaseSnapshot[]> {
  const db = getAdminDb();
  const snapshots = await Promise.all(
    RUNTIME_JOB_KEYS.map((key) => db.collection(RUNTIME_LOCKS_COLLECTION).doc(key).get())
  );

  return snapshots.map((snapshot, index) =>
    mapRuntimeLeaseDoc(RUNTIME_JOB_KEYS[index], snapshot.data())
  );
}
