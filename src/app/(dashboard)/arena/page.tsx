"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArenaPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/arena/competition");
  }, [router]);

  return (
    <div className="glass-card p-12 text-center">
      <div className="w-10 h-10 mx-auto mb-3 border-2 border-[var(--brand-500)]/30 border-t-[var(--brand-500)] rounded-full animate-spin" />
      <p className="text-[var(--text-secondary)]">Redirigiendo a Modo Competencia...</p>
    </div>
  );
}
