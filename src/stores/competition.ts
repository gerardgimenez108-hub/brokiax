// Competition Mode — Zustand store with Firestore real-time subscriptions
import { create } from "zustand";
import { doc, collection, query, orderBy, limit, onSnapshot, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import {
  CompetitionSession,
  CompetitionEvent,
} from "@/lib/types";

interface CompetitionState {
  // Session state
  session: CompetitionSession | null;
  events: CompetitionEvent[];
  isConnecting: boolean;
  isRunning: boolean;
  error: string | null;

  // Firestore unsubscribe functions
  _unsubSession: (() => void) | null;
  _unsubEvents: (() => void) | null;

  // Actions
  startCompetition: (
    config: { pair: string; strategyId: string; intervalSeconds: number; maxCycles: number; maxAllocation: number },
    participants: Array<{ apiKeyId: string; modelId: string; modelName: string; provider: string }>
  ) => Promise<string>;

  stopCompetition: (competitionId: string) => Promise<void>;

  subscribeToSession: (competitionId: string) => () => void;
  subscribeToEvents: (competitionId: string) => () => void;

  clearSession: () => void;
}

export const useCompetitionStore = create<CompetitionState>((set, get) => ({
  session: null,
  events: [],
  isConnecting: false,
  isRunning: false,
  error: null,
  _unsubSession: null,
  _unsubEvents: null,

  startCompetition: async (config, participants) => {
    if (!auth.currentUser) throw new Error("No authenticated user");

    set({ isConnecting: true, error: null });

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/engine/competition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ config, participants }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to start competition");

      const competitionId = data.competitionId;

      // Subscribe to session and events
      get().subscribeToSession(competitionId);
      get().subscribeToEvents(competitionId);

      set({ isConnecting: false, isRunning: true });

      return competitionId;
    } catch (err: any) {
      set({ isConnecting: false, error: err.message });
      throw err;
    }
  },

  stopCompetition: async (competitionId) => {
    if (!auth.currentUser) return;

    const token = await auth.currentUser.getIdToken();
    await fetch(`/api/engine/competition/${competitionId}/stop`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    get().clearSession();
  },

  subscribeToSession: (competitionId) => {
    if (!db) return () => {};

    // Clean up previous subscription
    const prev = get()._unsubSession;
    if (prev) prev();

    const unsub = onSnapshot(
      doc(db, "competitions", competitionId),
      (snapshot) => {
        if (!snapshot.exists) return;
        const data = snapshot.data() as CompetitionSession;
        set({ session: data });
      },
      (err) => {
        console.error("[COMPETITION] Session subscription error:", err);
        set({ error: err.message });
      }
    );

    set({ _unsubSession: unsub });
    return () => {
      unsub();
      set({ _unsubSession: null });
    };
  },

  subscribeToEvents: (competitionId) => {
    if (!db) return () => {};

    const prev = get()._unsubEvents;
    if (prev) prev();

    // Initial load of last 50 events
    const eventsCol = collection(db, "competitions", competitionId, "events");
    getDocs(query(eventsCol, orderBy("timestamp", "asc"), limit(50))).then((snap) => {
      if (!snap.empty) {
        const initialEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as CompetitionEvent[];
        set({ events: initialEvents });
      }
    });

    // Subscribe to new events (descending, watching the "top" new one)
    const unsub = onSnapshot(
      query(eventsCol, orderBy("timestamp", "desc"), limit(1)),
      (snapshot) => {
        if (snapshot.empty) return;
        const newEvent = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CompetitionEvent;
        set((state) => ({
          events: [...state.events, newEvent].slice(-200),
        }));
      }
    );

    set({ _unsubEvents: unsub });
    return () => {
      unsub();
      set({ _unsubEvents: null });
    };
  },

  clearSession: () => {
    const { _unsubSession, _unsubEvents } = get();
    if (_unsubSession) _unsubSession();
    if (_unsubEvents) _unsubEvents();
    set({
      session: null,
      events: [],
      isRunning: false,
      error: null,
      _unsubSession: null,
      _unsubEvents: null,
    });
  },
}));
