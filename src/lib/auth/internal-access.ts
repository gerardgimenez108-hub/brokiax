import type { InternalRole, PlanTier, SubscriptionStatus } from "@/lib/types";

const DEFAULT_INTERNAL_ADMIN_EMAILS = ["gerardgimenez108@gmail.com"];

export const INTERNAL_ADMIN_ACCESS_PATCH: {
  plan: PlanTier;
  subscriptionStatus: SubscriptionStatus;
  internalRole: InternalRole;
} = {
  plan: "enterprise",
  subscriptionStatus: "active",
  internalRole: "internal_admin",
};

export function normalizeEmail(email?: string | null): string {
  return email?.trim().toLowerCase() || "";
}

export function isDefaultInternalAdminEmail(email?: string | null): boolean {
  const normalizedEmail = normalizeEmail(email);
  return Boolean(normalizedEmail) && DEFAULT_INTERNAL_ADMIN_EMAILS.includes(normalizedEmail);
}

export function getDefaultInternalAdminAccess(email?: string | null) {
  return isDefaultInternalAdminEmail(email) ? INTERNAL_ADMIN_ACCESS_PATCH : null;
}
