"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent-500)] flex items-center justify-center text-white font-bold animate-pulse">
          B
        </div>
      </div>
    );
  }

  // Allow all authenticated users into the dashboard (Freemium Model)
  // We will apply feature gates inside the pages based on subscriptionStatus
  return user ? <>{children}</> : null;
}
