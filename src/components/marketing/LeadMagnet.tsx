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
    <section className="w-full py-20 px-4">
      <div className="max-w-4xl mx-auto relative group">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative glassmorphism rounded-2xl p-8 md:p-12 overflow-hidden bg-zinc-950/80 border border-zinc-800/50">
          {/* Subtle background element */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-zinc-800/20 blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
            
            {/* Value Proposition */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-300 mb-6">
                <Sparkles className="w-4 h-4 text-zinc-400" />
                <span>Recurso Institucional Gratuito</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight text-white mb-4">
                La Guía Maestra de Prompts Financieros
              </h3>
              <p className="text-zinc-400 text-lg mb-6 leading-relaxed">
                ¿Aún no estás listo para el plan PRO? Descarga nuestra guía exclusiva con 
                los comandos exactos que usan los fondos de cobertura para analizar 
                mercados con IA.
              </p>
              
              <ul className="flex flex-col gap-3 text-sm text-zinc-500 mb-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                  15 Prompts de análisis técnico y fundamental.
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                  Estrategias de RAG para eventos macroeconómicos.
                </li>
              </ul>
            </div>

            {/* Email Form */}
            <div className="w-full md:w-[400px] p-6 rounded-xl bg-black/40 border border-zinc-800 backdrop-blur-sm">
              {status === "success" ? (
                <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4 border border-zinc-800">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">¡Guía enviada!</h4>
                  <p className="text-zinc-400 text-sm">
                    Revisa tu bandeja de entrada en los próximos minutos.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                      Recibe la guía gratuita en tu correo
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tucorreo@empresa.com"
                      disabled={status === "loading"}
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-700 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  {status === "error" && (
                    <p className="text-red-400 text-xs">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading" || !email}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {status === "loading" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Descargar Guía Ahora</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <p className="text-xs text-center text-zinc-600 mt-2">
                    Cero spam. Te enviaremos valor. Podrás desuscribirte cuando quieras.
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
