import { create } from "zustand";

export type NotificationType = "success" | "error" | "warning" | "info" | "trade";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  /** Auto-dismiss after ms. 0 = persistent */
  duration?: number;
  /** Optional link to navigate to */
  href?: string;
}

interface NotificationState {
  notifications: Notification[];
  toasts: Notification[];
  unreadCount: number;

  /** Push a new notification (appears as toast + saved to bell center) */
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;

  /** Push a toast-only message (not saved to notification center) */
  addToast: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;

  /** Remove a toast from the visible stack */
  dismissToast: (id: string) => void;

  /** Mark a specific notification as read */
  markAsRead: (id: string) => void;

  /** Mark all notifications as read */
  markAllAsRead: () => void;

  /** Clear all notifications */
  clearAll: () => void;
}

let counter = 0;
const genId = () => `notif-${Date.now()}-${++counter}`;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  toasts: [],
  unreadCount: 0,

  addNotification: (n) => {
    const notification: Notification = {
      ...n,
      id: genId(),
      timestamp: Date.now(),
      read: false,
      duration: n.duration ?? 5000,
    };
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      toasts: [...state.toasts, notification],
      unreadCount: state.unreadCount + 1,
    }));

    // Auto-dismiss toast
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => get().dismissToast(notification.id), notification.duration);
    }
  },

  addToast: (n) => {
    const toast: Notification = {
      ...n,
      id: genId(),
      timestamp: Date.now(),
      read: true,
      duration: n.duration ?? 4000,
    };
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => get().dismissToast(toast.id), toast.duration);
    }
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
