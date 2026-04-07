"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Server } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { WalletConnect } from "@/components/x402/WalletConnect";
import { X402_AVAILABLE_MODELS } from "@/lib/x402/types";

interface X402WalletEntry {
  id: string;
  name: string;
  walletAddress?: string | null;
  chainId?: number | null;
}

export default function X402Settings() {
  const [wallets, setWallets] = useState<X402WalletEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWallets = async () => {
      if (!auth.currentUser) return;

      try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch("/api/user/api-keys", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (data.success) {
          setWallets(data.data.filter((key: { provider: string }) => key.provider === "x402"));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadWallets();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-zinc-400">Loading x402 settings...</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Server className="text-indigo-400 h-6 w-6" />
          Autonomous x402 Payments
        </h1>
        <p className="text-[var(--text-secondary)] mb-6">
          Configura un wallet x402 con USDC en Base para pagar llamadas a modelos sin API keys del proveedor.
          Brokiax ejecutará el flujo HTTP 402 a través de Claw402.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            Wallets configurados
          </h3>

          {wallets.length === 0 ? (
            <>
              <p className="text-sm text-[var(--text-secondary)]">
                Aún no tienes ningún wallet x402 configurado en Brokiax.
              </p>
              <Link href="/settings/api-keys" className="btn-primary inline-flex items-center gap-2">
                Añadir wallet x402
              </Link>
            </>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div key={wallet.id} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">{wallet.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">Base / USDC / Claw402</div>
                    </div>
                    {wallet.walletAddress && (
                      <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(wallet.walletAddress || "")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {wallet.walletAddress && (
                    <code className="block mt-3 text-xs text-indigo-400 break-all">{wallet.walletAddress}</code>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
            Flujo recomendado
          </h3>
          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <p>1. Usa un wallet EVM en Base.</p>
            <p>2. Fóndalo con USDC.</p>
            <p>3. Guarda su private key cifrada como proveedor `x402` en Ajustes &gt; API Keys.</p>
            <p>4. Selecciona ese proveedor al crear traders, debates o backtests.</p>
          </div>
          <div className="pt-2">
            <WalletConnect />
          </div>
          <a href="https://claw402.ai" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-[var(--brand-400)] hover:underline">
            Ver Claw402
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl p-6">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
          Modelos x402 disponibles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {X402_AVAILABLE_MODELS.map((model) => (
            <div key={model.id} className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4">
              <div className="font-medium text-white">{model.name}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">{model.provider}</div>
              <div className="text-xs text-indigo-400 font-mono mt-2">{model.id}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
