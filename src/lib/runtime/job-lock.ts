import * as admin from "firebase-admin";
import { getAdminDb } from "@/lib/firebase/admin";

export interface JobLease {
  key: string;
  ownerId: string;
  leaseUntilMs: number;
}

export interface AcquireJobLeaseOptions {
  key: string;
  ttlMs: number;
  ownerId: string;
}

export interface RenewJobLeaseOptions {
  key: string;
  ttlMs: number;
  ownerId: string;
}

export interface StartJobLeaseAutoRenewalOptions extends RenewJobLeaseOptions {
  intervalMs?: number;
}

const COLLECTION = "runtimeLocks";

export async function acquireJobLease({
  key,
  ttlMs,
  ownerId,
}: AcquireJobLeaseOptions): Promise<JobLease | null> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(key);
  const now = Date.now();
  const leaseUntilMs = now + ttlMs;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.data() as { leaseUntilMs?: number } | undefined;

    if (current?.leaseUntilMs && current.leaseUntilMs > now) {
      return null;
    }

    tx.set(
      ref,
      {
        key,
        ownerId,
        leaseUntilMs,
        acquiredAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      key,
      ownerId,
      leaseUntilMs,
    };
  });
}

export async function releaseJobLease(key: string, ownerId: string) {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(key);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      return;
    }

    const current = snap.data() as { ownerId?: string } | undefined;
    if (current?.ownerId !== ownerId) {
      return;
    }

    tx.set(
      ref,
      {
        leaseUntilMs: 0,
        releasedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function renewJobLease({
  key,
  ttlMs,
  ownerId,
}: RenewJobLeaseOptions): Promise<JobLease | null> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(key);
  const now = Date.now();
  const leaseUntilMs = now + ttlMs;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      return null;
    }

    const current = snap.data() as { ownerId?: string; leaseUntilMs?: number } | undefined;
    if (current?.ownerId !== ownerId) {
      return null;
    }

    if (!current?.leaseUntilMs || current.leaseUntilMs <= now) {
      return null;
    }

    tx.set(
      ref,
      {
        leaseUntilMs,
        renewedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      key,
      ownerId,
      leaseUntilMs,
    };
  });
}

function getLeaseRenewIntervalMs(ttlMs: number) {
  return Math.max(1_000, Math.floor(ttlMs / 2));
}

export function startJobLeaseAutoRenewal({
  key,
  ttlMs,
  ownerId,
  intervalMs = getLeaseRenewIntervalMs(ttlMs),
}: StartJobLeaseAutoRenewalOptions) {
  let stopped = false;
  let inFlightRenewal: Promise<void> | null = null;

  const runRenewal = async () => {
    if (stopped || inFlightRenewal) {
      return;
    }

    inFlightRenewal = renewJobLease({ key, ttlMs, ownerId })
      .then((lease) => {
        if (!lease) {
          stopped = true;
          clearInterval(timer);
          console.warn(
            `[RUNTIME] Lease auto-renewal stopped for ${key}; ownership changed or the lease expired before it could be renewed.`
          );
        }
      })
      .catch((error) => {
        console.error(`[RUNTIME] Failed to auto-renew lease for ${key}.`, error);
      })
      .finally(() => {
        inFlightRenewal = null;
      });

    await inFlightRenewal;
  };

  const timer = setInterval(() => {
    void runRenewal();
  }, intervalMs);

  return {
    async stop() {
      stopped = true;
      clearInterval(timer);
      await inFlightRenewal;
    },
  };
}
