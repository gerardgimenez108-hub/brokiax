"use client";

import { useState } from "react";
import { Send, CheckCircle2, Loader2, Sparkles } from "lucide-react";

export function LeadMagnet() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Error al suscribirse. Intenta nuevamente.");
      }

      setStatus("success");
      setEmail("");
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message || "Ocurrió un error inesperado.");
    }
  };

  return (
    <section className="w-full py-24 px-4 overflow-hidden">
      <div className="max-w-5xl mx-auto relative group">
        {/* Animated Background Gradients */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--brand-500)] via-purple-500 to-[var(--brand-300)] rounded-[2rem] blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-500 animate-pulse-slow"></div>
        
        <div className="relative glassmorphism rounded-[2rem] p-8 md:p-14 overflow-hidden bg-zinc-950/90 border border-zinc-800/60 shadow-2xl">
          {/* Subtle background element */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[var(--brand-500)]/10 blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 relative z-10">
            
            {/* Value Proposition */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-700/50 text-xs font-semibold uppercase tracking-wider text-[var(--brand-400)] mb-6 shadow-inner">
                <Sparkles className="w-4 h-4" />
                <span>Recurso Exclusivo Gratuito</span>
              </div>
              <h3 className="text-4xl font-extrabold tracking-tight text-white mb-5 leading-tight">
                Domina Brokiax: Guía de Trading con IA
              </h3>
              <p className="text-zinc-300 text-lg mb-8 leading-relaxed">
                Aprende a exprimir al máximo tu cuenta de Brokiax. Descarga nuestra guía oficial con estrategias de Backtesting, configuración de DEX Wallets y los prompts que usan los profesionales para ganar en los mercados.
              </p>
              
              <ul className="flex flex-col gap-4 text-sm text-zinc-400 mb-4">
                <li className="flex items-center gap-3">
                  <div className="bg-[var(--brand-500)]/20 p-1.5 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-[var(--brand-400)]" />
                  </div>
                  <span className="font-medium text-zinc-200">Setups rentables en Strategy Studio</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="bg-[var(--brand-500)]/20 p-1.5 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-[var(--brand-400)]" />
                  </div>
                  <span className="font-medium text-zinc-200">Seguridad: Trading sin APIs con Hyperliquid</span>
                </li>
              </ul>
            </div>

            {/* Email Form */}
            <div className="w-full md:w-[420px] p-8 rounded-2xl bg-black/60 border border-zinc-800/80 backdrop-blur-md shadow-inner relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--brand-500)] to-transparent opacity-50"></div>
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-3">¡Guía enviada!</h4>
                  <p className="text-zinc-400 text-sm mb-6">
                    Hemos enviado el recurso a tu correo. También puedes descargarlo directamente aquí:
                  </p>
                  <a href="/Guia_Brokiax.pdf" target="_blank" className="inline-flex items-center justify-center w-full px-6 py-3 bg-[var(--brand-600)] hover:bg-[var(--brand-500)] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[var(--brand-500)]/20">
                    Descargar PDF
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-zinc-300">
                      Envíanos tu correo para recibir la guía
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@ejemplo.com"
                      disabled={status === "loading"}
                      className="w-full px-4 py-4 bg-zinc-900/80 border border-zinc-700/50 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent transition-all shadow-inner text-base"
                    />
                  </div>
                  
                  {status === "error" && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading" || !email}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black font-bold text-base rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  >
                    {status === "loading" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>Obtener Guía Gratuita</span>
                        <Send className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-zinc-500 mt-2 font-medium">
                    Cero spam. Solo valor. Podrás desuscribirte en cualquier momento.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
