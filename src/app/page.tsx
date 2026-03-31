"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Bot, Building2, FlaskConical, Swords, BarChart3, ShieldCheck,
  ArrowRight, CheckCircle2, Zap, Lock, Globe, Network, Cpu, Terminal, ChevronDown, ChevronUp, BrainCircuit, Activity
} from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { LeadMagnet } from "@/components/marketing/LeadMagnet";

const EXCHANGES = ["Binance", "Bybit", "OKX", "Bitget", "KuCoin", "Gate", "Hyperliquid"];
const MODELS = ["GPT-4o", "Claude 3.5", "DeepSeek V3", "Gemini Pro", "Grok", "Qwen"];

function GridBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[var(--bg-primary)]">
      <div
        className="absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(161, 161, 170, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(161, 161, 170, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at center, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 0%, transparent 80%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-primary)]/80 to-[var(--bg-primary)]" />
    </div>
  );
}

function TerminalMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto mt-12 mb-8 group">
      <div className="absolute -inset-1 bg-gradient-to-r from-[var(--brand-500)] to-[var(--accent-500)] rounded-xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
      <div className="relative bg-[#09090b] border border-[var(--glass-border)] rounded-xl overflow-hidden shadow-2xl font-mono text-xs text-left">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f23] bg-[#0f0f11]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">brokiax/execution-engine</div>
          <div className="w-16" />
        </div>
        <div className="p-6 space-y-3 text-zinc-300 bg-[#09090b]/90 backdrop-blur-xl">
          <div className="flex gap-4"><span className="text-zinc-500">14:23:05</span><span className="text-blue-400 font-semibold">[SYSTEM]</span><span>RAG Context injected. Evaluated Tokens: 4,092.</span></div>
          <div className="flex gap-4"><span className="text-zinc-500">14:23:05</span><span className="text-purple-400 font-semibold">[DEBATE]</span><span>Initiating Multi-LLM consensus (GPT-4o, Claude 3.5, DeepSeek)</span></div>
          <div className="flex gap-4"><span className="text-zinc-500">14:23:06</span><span className="text-purple-400 font-semibold">[DEBATE]</span><span className="text-zinc-100">Consensus reached: <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">STRONG BUY</span> (Confidence: 89%)</span></div>
          <div className="flex gap-4"><span className="text-zinc-500">14:23:06</span><span className="text-amber-400 font-semibold">[RISK]</span><span>Evaluating constraints... Exposure: 12% &lt; Max: 20%. Status: OK</span></div>
          <div className="flex gap-4"><span className="text-zinc-500">14:23:06</span><span className="text-emerald-400 font-semibold">[CCXT]</span><span>AES-256 decrypted. Routing order to Binance...</span></div>
          <div className="flex gap-4"><span className="text-zinc-500">14:23:07</span><span className="text-emerald-400 font-semibold">[CCXT]</span><span className="text-white">Order Filled. Market BUY 1.45 BTC @ $64,230.10. Latency: 107ms</span></div>
          <div className="flex gap-4 animate-pulse"><span className="text-zinc-500">14:23:07</span><span className="text-zinc-600">Awaiting next tick_</span></div>
        </div>
      </div>
    </div>
  );
}

function TickerBar() {
  const items = [...EXCHANGES, ...MODELS, ...EXCHANGES, ...MODELS];
  return (
    <div className="w-full overflow-hidden py-5 border-y border-[var(--border-secondary)] bg-[var(--bg-secondary)]/50 backdrop-blur-sm z-10 relative">
      <div className="flex gap-12 animate-scroll whitespace-nowrap items-center">
        {items.map((item, i) => (
          <span key={i} className="text-[var(--text-tertiary)] text-sm font-bold tracking-widest uppercase flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-tertiary)] opacity-50" />
            {item}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
      `}</style>
    </div>
  );
}

function Accordion({ title, children }: { title: string, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border-primary)] rounded-xl bg-[var(--bg-secondary)] overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-5 h-5 text-[var(--text-tertiary)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-tertiary)]" />}
      </button>
      <div className={`transition-all duration-300 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 pb-6 pt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const t = useTranslations("landing");
  const tp = useTranslations("landing_plans");
  const tc = useTranslations("common");
  const tn = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const FEATURES = [
    { icon: Bot, title: "Multi-LLM Debate Arena", description: "No dependas de una sola IA. Brokiax enfrenta a GPT-4, Claude y DeepSeek en tiempo real para generar un consenso institucional sobre cada trade antes de ejecutarlo." },
    { icon: Building2, title: "Ejecución Multi-Exchange", description: "Conecta Binance, Bybit, OKX y más. El motor CCXT integrado enruta tus órdenes al exchange con mejor liquidez en milisegundos y con cifrado AES-256." },
    { icon: FlaskConical, title: "Backtest Lab Avanzado", description: "Prueba tus prompts y estrategias cognitivas contra años de datos históricos en segundos. Asegura tu rentabilidad antes de arriesgar un solo dólar en real." },
    { icon: BrainCircuit, title: "RAG & Sentimiento", description: "La IA lee noticias, reportes macroeconómicos y Twitter en tiempo real mediante Retrieval-Augmented Generation para adaptar la estrategia al momento actual." },
    { icon: ShieldCheck, title: "Gestor de Riesgo Autónomo", description: "Establece tus límites diarios, Drawdown máximo y exposición por activo. El motor de ejecución bloqueará cualquier decisión de la IA que viole tus reglas." },
    { icon: Activity, title: "Infraestructura Serverless", description: "Cero mantenimiento. Tu bot se ejecuta de manera nativa en la nube, operando 24/7 sin que tengas que dejar un ordenador encendido o gestionar servidores VPS." },
  ];

  const HOW_STEPS = [
    { step: "01", title: "Conecta tus Claves", desc: "Introduce tus API keys de Exchange y de tus LLMs favoritos de forma segura y encriptada en nuestro panel.", icon: Network },
    { step: "02", title: "Diseña la Estrategia Cognitiva", desc: "Usa lenguaje natural para explicarle al agente bajo qué condiciones técnicas, matemáticas o de sentimiento debe actuar.", icon: Cpu },
    { step: "03", title: "Backtesting de Grado Institucional", desc: "Comprueba cómo habría reaccionado tu IA en los últimos 5 años de mercado, ajusta tus prompts según el resultado.", icon: Terminal },
    { step: "04", title: "Despliegue Automático 24/7", desc: "A solo un clic. Pasa a producción y permite que el motor RAG opere mientras duermes, respetando tu gestión de riesgo.", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-[var(--brand-500)] selection:text-white">
      <GridBackground />

      {/* ─── Navbar ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-primary)] shadow-sm"
            : "bg-transparent py-2"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--text-primary)] to-[var(--text-tertiary)] flex items-center justify-center text-[var(--bg-primary)] font-bold text-lg shadow-lg">
              B
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Brokiax
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[var(--text-secondary)]">
            <a href="#problem" className="hover:text-[var(--text-primary)] transition-colors">El Problema</a>
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">{tn("features")}</a>
            <a href="#how" className="hover:text-[var(--text-primary)] transition-colors">{tn("howItWorks")}</a>
            <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">{tn("pricing")}</a>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {user ? (
              <Link href="/dashboard" className="btn-primary text-sm px-5 py-2">
                Panel de Control
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex font-semibold text-sm text-[var(--text-primary)] hover:opacity-70 transition-opacity">
                  {tc("login")}
                </Link>
                <Link href="/register" className="btn-primary text-sm px-5 py-2 shadow-lg shadow-black/10">
                  Comenzar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-40 pb-20 px-6 z-10 flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-[var(--border-primary)] text-[var(--text-secondary)] text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--action-color)] pulse-live bg-emerald-500" />
            Infraestructura Quant de Nueva Generación
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6 animate-fade-in tracking-tight text-[var(--text-primary)] drop-shadow-sm">
            El Trading Algorítmico <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)]">
              Reinventado por la IA.
            </span>
          </h1>

          <p
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 animate-fade-in leading-relaxed font-medium"
            style={{ animationDelay: "0.1s" }}
          >
            Brokiax te permite construir, validar y ejecutar agentes de trading autónomos usando lenguaje natural. Sin código complejo, operando 24/7 y conectando múltiples LLMs en consenso.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in mb-12"
            style={{ animationDelay: "0.2s" }}
          >
            <Link href={user ? "/dashboard" : "/register"} className="btn-primary text-base px-8 py-3.5 flex items-center justify-center gap-2 shadow-xl shadow-black/5 hover:-translate-y-1 transition-transform">
              {user ? "Ir al Dashboard" : "Comenzar Gratis"} <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how" className="btn-secondary text-base px-8 py-3.5 flex items-center justify-center bg-[var(--bg-primary)]">
              Ver cómo funciona
            </a>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <TerminalMockup />
          </div>
        </div>
      </section>

      {/* ─── Ticker ─── */}
      <TickerBar />

      {/* ─── The Problem vs Solution (Marketing Hook) ─── */}
      <section id="problem" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
                El trading manual es obsoleto. El algorítmico, inaccesible.
              </h2>
              <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">
                Hasta ahora, para automatizar estrategias rentables necesitabas servidores VPS costosos, conocimientos avanzados en Python, y gestionar el riesgo de APIs expuestas 24/7.
              </p>
              <p className="text-lg text-[var(--text-primary)] font-semibold mb-8">
                Brokiax democratiza la infraestructura institucional, permitiéndote traducir tus reglas cognitivas a texto y dejando que los Modelos de Lenguaje operen el mercado por ti.
              </p>
              <div className="flex gap-4">
                <div className="flex flex-col">
                  <span className="text-4xl font-extrabold">98%</span>
                  <span className="text-sm text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Ahorro en Código</span>
                </div>
                <div className="w-px bg-[var(--border-primary)]" />
                <div className="flex flex-col">
                  <span className="text-4xl font-extrabold">&lt;150ms</span>
                  <span className="text-sm text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Latencia Media</span>
                </div>
              </div>
            </div>
            <div className="glass-card p-8 rounded-2xl relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--text-primary)] rounded-full blur-[80px] opacity-10" />
               <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                      <span className="text-red-500 font-bold">X</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)]">Bots de Parrilla Clásicos</h4>
                      <p className="text-sm text-[var(--text-secondary)]">Ciegos ante noticias, solo siguen precio.</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-[var(--border-primary)]" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--text-primary)] flex items-center justify-center shrink-0 shadow-lg">
                      <ShieldCheck className="text-[var(--bg-primary)] w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] text-lg">Brokiax AI Agent</h4>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">Razona el mercado, lee sentimiento RAG y debate con otros LLMs antes de actuar.</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features con Extension de Información ─── */}
      <section id="features" className="py-24 px-6 bg-[var(--bg-secondary)] relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">
              Arsenal Institucional a tu Disposición
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              No es solo un bot. Es una terminal Bloomberg conectada a Inteligencia Artificial Autónoma.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children mb-16">
            {FEATURES.map((feature, i) => (
              <div key={i} className="glass-card p-8 rounded-xl group hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-primary)] flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-[var(--text-primary)]" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            <Accordion title="¿Cómo funciona el Consenso Multi-LLM?">
              Brokiax te permite invocar simultáneamente a distintos modelos (por ejemplo, Claude 3.5 para análisis técnico y GPT-4o para sentimiento de mercado). Si no hay un consenso claro (es decir, ambos modelos no concuerdan en la acción de comprar/vender), el motor de ejecución se abstiene de operar, reduciendo significativamente tus rachas de pérdida y drawdowns.
            </Accordion>
            <Accordion title="¿Mis API Keys están seguras?">
              Por supuesto. Todas las credenciales introducidas en Brokiax son encriptadas del lado del servidor utilizando cifrado estándar AES-256-GCM. El sistema accede de forma segura en memoria solo en el instante en que tu agente necesita ejecutar una orden o chequear un balance. Nosotros no podemos extraer tus fondos.
            </Accordion>
            <Accordion title="¿Necesito saber programar?">
              Absolutamente no. Nuestra propuesta de valor principal es el diseño en lenguaje natural. Defines tu estrategia como si le hablaras a un analista jefe: "Si Bitcoin rompe EMA50 en el gráfico de 4h, y hay noticias muy positivas en theblock.co, compra usando 5% de mi balance total. Stop Loss 2%." Brokiax se encarga de todo el código de fondo.
            </Accordion>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-4xl font-bold tracking-tight mb-4">
               Pasa a Producción en 4 Pasos
             </h2>
             <p className="text-[var(--text-secondary)]">El flujo de trabajo automatizado más sencillo del mercado Quant.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {HOW_STEPS.map((item, i) => (
              <div key={item.step} className="relative">
                {i < HOW_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-[var(--border-primary)] z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mb-6 shadow-xl border border-[var(--border-brand)] text-[var(--text-primary)] font-bold text-xl">
                    <item.icon className="w-8 h-8" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Paso {item.step}</div>
                  <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="py-32 px-6 relative z-10 flex justify-center">
        <div className="w-full max-w-4xl glass-card p-12 md:p-16 rounded-3xl border border-[var(--border-brand)] relative overflow-hidden text-center shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-[var(--bg-secondary)] via-transparent to-[var(--bg-hover)] opacity-50" />
          <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10 tracking-tight text-[var(--text-primary)]">
             El Momento de Escalar es Ahora.
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-10 relative z-10 max-w-2xl mx-auto">
             Deja de perder oportunidades de mercado por tener que dormir. Inicia hoy mismo tu cuenta, realiza tus primeros backtests totalmente gratis y evoluciona tu trading.
          </p>
          <Link href="/register" className="btn-primary text-lg px-12 py-5 relative z-10 inline-flex items-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-none font-bold">
            Crear Cuenta Gratuita <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-6 text-xs text-[var(--text-tertiary)] uppercase tracking-widest relative z-10 font-bold">
            No requiere tarjeta de crédito para iniciar.
          </p>
        </div>
      </section>

      {/* ─── Lead Magnet ─── */}
      <LeadMagnet />

      {/* ─── Trust Bar ─── */}
      <section className="py-8 px-6 bg-[var(--bg-secondary)] border-y border-[var(--border-primary)] relative z-10">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-10 text-[var(--text-secondary)] text-sm font-semibold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" /> <span>AES-256-GCM SSL</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> <span>Infraestructura SOC 2</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" /> <span>Latencia Ultra-Baja</span>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-16 px-6 relative z-10 bg-[var(--bg-primary)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] flex items-center justify-center font-bold text-sm">
                B
              </div>
              <span className="font-bold text-xl tracking-tight">Brokiax</span>
            </div>
            <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
              La plataforma Quant liderada por Inteligencia Artificial. Ejecución automática y gestión de riesgo nativa en la nube.
            </p>
          </div>
          
          <div className="flex gap-16">
            <div className="flex flex-col gap-3">
              <h5 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider mb-2">Producto</h5>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Features</a>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Pricing</a>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Integraciones CCXT</a>
            </div>
            <div className="flex flex-col gap-3">
              <h5 className="font-bold text-[var(--text-primary)] text-sm uppercase tracking-wider mb-2">Legal</h5>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Términos</a>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Privacidad</a>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Contacto</a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-16 pt-8 border-t border-[var(--border-primary)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[var(--text-tertiary)]">
            © {new Date().getFullYear()} Brokiax Technologies. Todos los derechos reservados.
          </p>
          <div className="text-xs text-[var(--text-tertiary)] max-w-md text-center md:text-right">
             El trading algorítmico conlleva riesgos. Las operativas reales o backtests no aseguran retornos futuros.
          </div>
        </div>
      </footer>
    </div>
  );
}
