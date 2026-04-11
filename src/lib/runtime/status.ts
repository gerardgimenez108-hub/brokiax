import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase/admin";

export type RuntimeJobKey =
  | "trading-engine"
  | "showcase-scheduler"
  | "competition-runner";

const COLLECTION = "runtimeStatus";
const EVENTS_SUBCOLLECTION = "events";
const MAX_EVENT_HISTORY = 25;

const LABELS: Record<RuntimeJobKey, string> = {
  "trading-engine": "Trading Engine",
  "showcase-scheduler": "Arena Showcase",
  "competition-runner": "Competition Runner",
};

function basePayload(key: RuntimeJobKey, ownerId: string) {
  return {
    key,
    label: LABELS[key],
    ownerId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastHeartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function writeRuntimeEvent(
  key: RuntimeJobKey,
  ownerId: string,
  payload: Record<string, unknown>
) {
  const db = getAdminDb();
  const eventsRef = db.collection(COLLECTION).doc(key).collection(EVENTS_SUBCOLLECTION);
  const existingEvents = await eventsRef.orderBy("createdAt", "desc").get();
  const overflow = existingEvents.docs.slice(MAX_EVENT_HISTORY - 1);

  const batch = db.batch();
  batch.set(eventsRef.doc(), {
    key,
    label: LABELS[key],
    ownerId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    ...payload,
  });

  for (const doc of overflow) {
    batch.delete(doc.ref);
  }

  await batch.commit();
}

async function updateRuntimeStatus(
  key: RuntimeJobKey,
  ownerId: string,
  payload: Record<string, unknown>,
  eventPayload?: Record<string, unknown>
) {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(key).set(
    {
      ...basePayload(key, ownerId),
      ...payload,
    },
    { merge: true }
  );

  if (eventPayload) {
    await writeRuntimeEvent(key, ownerId, eventPayload);
  }
}

export async function markRuntimeStarted(
  key: RuntimeJobKey,
  ownerId: string,
  message: string,
  nextExpectedHeartbeatMs?: number
) {
  await updateRuntimeStatus(
    key,
    ownerId,
    {
      state: "running",
      lastMessage: message,
      lastStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      nextExpectedHeartbeatAt:
        typeof nextExpectedHeartbeatMs === "number"
          ? new Date(Date.now() + nextExpectedHeartbeatMs)
          : null,
    },
    {
      state: "running",
      message,
    }
  );
}

export async function markRuntimeHealthy(
  key: RuntimeJobKey,
  ownerId: string,
  message: string,
  options?: {
    durationMs?: number;
    processed?: number;
    skipped?: number;
    nextExpectedHeartbeatMs?: number;
  }
) {
  await updateRuntimeStatus(
    key,
    ownerId,
    {
      state: "healthy",
      lastMessage: message,
      lastFinishedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSuccessAt: admin.firestore.FieldValue.serverTimestamp(),
      lastDurationMs: options?.durationMs ?? null,
      lastProcessed: options?.processed ?? null,
      lastSkipped: options?.skipped ?? null,
      nextExpectedHeartbeatAt:
        typeof options?.nextExpectedHeartbeatMs === "number"
          ? new Date(Date.now() + options.nextExpectedHeartbeatMs)
          : null,
    },
    {
      state: "healthy",
      message,
      durationMs: options?.durationMs ?? null,
      processed: options?.processed ?? null,
      skipped: options?.skipped ?? null,
    }
  );
}

export async function markRuntimeSkipped(
  key: RuntimeJobKey,
  ownerId: string,
  message: string,
  nextExpectedHeartbeatMs?: number
) {
  await updateRuntimeStatus(
    key,
    ownerId,
    {
      state: "degraded",
      lastMessage: message,
      lastFinishedAt: admin.firestore.FieldValue.serverTimestamp(),
      nextExpectedHeartbeatAt:
        typeof nextExpectedHeartbeatMs === "number"
          ? new Date(Date.now() + nextExpectedHeartbeatMs)
          : null,
    },
    {
      state: "degraded",
      message,
    }
  );
}

export async function markRuntimeErrored(
  key: RuntimeJobKey,
  ownerId: string,
  error: unknown,
  nextExpectedHeartbeatMs?: number
) {
  const message = error instanceof Error ? error.message : "Unknown runtime error";

  await updateRuntimeStatus(
    key,
    ownerId,
    {
      state: "error",
      lastMessage: message,
      lastFinishedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastErrorAt: admin.firestore.FieldValue.serverTimestamp(),
      nextExpectedHeartbeatAt:
        typeof nextExpectedHeartbeatMs === "number"
          ? new Date(Date.now() + nextExpectedHeartbeatMs)
          : null,
    },
    {
      state: "error",
      message,
    }
  );
}
