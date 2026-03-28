"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Copy, Terminal, ExternalLink, Settings, ShieldCheck } from "lucide-react";
import { useNotificationStore } from "@/stores/notifications";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";

export default function ApiAccessPage() {
  const { user } = useAuth();
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const addToast = useNotificationStore((state) => state.addToast);

  const isEnterprise = user?.plan === "enterprise" || user?.plan === "elite";

  const fetchToken = async () => {
    if (!auth.currentUser) return;
    const t = await auth.currentUser.getIdToken();
    setToken(t);
    setShowToken(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({ type: "success", title: "Copiado", message: "Al portapapeles" });
  };

  if (!isEnterprise) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-10 text-center max-w-lg shadow-2xl border border-[var(--warning)]/20">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--warning)]/10 flex items-center justify-center text-3xl mb-4 border border-[var(--warning)]/30">
            🔒
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso API Restringido</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
            El servidor de MCP y el acceso vía API están reservados para usuarios con plan **Enterprise**. 
            Conecta Brokiax con Claude Desktop, Cursor o tus propios agentes IA.
          </p>
          <Link href="/settings/billing" className="btn-primary inline-flex items-center gap-2">
            Mejorar Plan <ExternalLink size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const mcpUrl = typeof window !== "undefined" ? `${window.location.origin}/api/mcp` : "https://brokiax.com/api/mcp";

  return (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">API & MCP Access</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Conecta la inteligencia de Brokiax con tus herramientas de desarrollo externas.
        </p>
      </div>

      {/* Endpoint Card */}
      <div className="glass-card p-6 border-l-4 border-amber-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Terminal size={20} />
            </div>
            <h3 className="font-semibold">MCP Server Endpoint</h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 uppercase tracking-wider">
            Enterprise
          </span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] font-mono text-sm group">
          <span className="text-[var(--text-primary)] truncate flex-1">{mcpUrl}</span>
          <button 
            onClick={() => copyToClipboard(mcpUrl)}
            className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-tertiary)] hover:text-white transition-colors"
            title="Copiar URL"
          >
            <Copy size={16} />
          </button>
        </div>
      </div>

      {/* Authentication Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck size={20} className="text-[var(--success)]" />
          Autentificación
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          El servidor MCP utiliza autentificación **Bearer Token**. Para conectar tus agentes, utiliza tu Firebase ID Token actual.
        </p>
        
        {!showToken ? (
          <button onClick={fetchToken} className="btn-secondary text-sm">
            Generar Token de Acceso Temporal
          </button>
        ) : (
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] font-mono text-xs break-all relative group">
              <div className="pr-10">{token}</div>
              <button 
                onClick={() => copyToClipboard(token || "")}
                className="absolute top-3 right-3 p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-tertiary)] hover:text-white transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
            <p className="text-[10px] text-[var(--warning)]">
              ⚠️ Este token caduca en 1 hora. Para aplicaciones de largo plazo, contacta con soporte para una API Key permanente.
            </p>
          </div>
        )}
      </section>

      {/* Documentation / Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 border border-[var(--border-primary)] hover:border-[var(--brand-500)]/30 transition-colors">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Settings size={18} className="text-[var(--brand-400)]" />
            Claude Desktop Setup
          </h4>
          <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
            Añade esta configuración a tu archivo `claude_desktop_config.json` para darle a Claude control sobre tus traders.
          </p>
          <pre className="p-3 rounded bg-black/30 text-[10px] text-[var(--text-secondary)] font-mono overflow-x-auto">
{`{
  "mcpServers": {
    "brokiax": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Authorization: Bearer YOUR_ID_TOKEN",
        "-H", "Content-Type: application/json",
        "-d", "{\\"jsonrpc\\":\\"2.0\\",\\"id\\":1,\\"method\\":\\"initialize\\",\\"params\\":{\\"protocolVersion\\":\\"2024-11-05\\",\\"capabilities\\":{},\\"clientInfo\\":{\\"name\\":\\"claude-desktop\\",\\"version\\":\\"1.0.0\\"}}}",
        "${mcpUrl}"
      ]
    }
  }
}`}
          </pre>
        </div>

        <div className="glass-card p-6 border border-[var(--border-primary)] hover:border-[var(--brand-500)]/30 transition-colors">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Terminal size={18} className="text-[var(--brand-400)]" />
            Capacidades Disponibles
          </h4>
          <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
            <li className="flex items-center gap-2">✅ Listar Traders activos</li>
            <li className="flex items-center gap-2">✅ Ejecutar análisis en tiempo real</li>
            <li className="flex items-center gap-2">✅ Lanzar debates en la Arena</li>
            <li className="flex items-center gap-2">✅ Consultar logs de operaciones</li>
            <li className="flex items-center gap-2">✅ Obtener precios multicurrency</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
