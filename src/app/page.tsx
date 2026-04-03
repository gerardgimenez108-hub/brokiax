"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Bot, Building2, FlaskConical, Swords, BarChart3, ShieldCheck,
  ArrowRight, CheckCircle2, Zap, Lock, Globe, Network, Cpu, Terminal,
  ChevronDown, ChevronUp, BrainCircuit, Activity, Star, Users,
  TrendingUp, ExternalLink
} from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import CompetitionDemo from "@/components/marketing/CompetitionDemo";
import { useAuth } from "@/hooks/useAuth";

const EXCHANGES = ["Binance", "Bybit", "OKX", "Bitget", "KuCoin", "Gate", "Hyperliquid"];
const MODELS = ["GPT-4o", "Claude 3.5", "DeepSeek V3", "Gemini Pro", "Grok", "Qwen"];

function GridBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[var(--bg-primary)]">
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(161, 161, 170, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(161, 161, 170, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(circle at center, black 0%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 0%, transparent 75%)",
        }}
      />
      {/* Subtle color accents */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/[0.03] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.02] rounded-full blur-[100px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--bg-primary)]/80 to-[var(--bg-primary)]" />
    </div>
  );
}

function TerminalMockup() {
  return (
    <div className="relative w-full max-w-4xl mx-auto mt-12 mb-8 group">
      <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative bg-[#09090b] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 font-mono text-xs text-left">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-[#0c0c0e]">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="text-[10px] text-zinc-600 font-medium tracking-[0.2em] uppercase">brokiax · execution-engine</div>
          <div className="w-16" />
        </div>
        <div className="p-6 space-y-2.5 text-zinc-400 bg-[#09090b]">
          <div className="flex gap-4"><span className="text-zinc-600 tabular-nums">14:23:05</span><span className="text-indigo-400 font-semibold">[SYSTEM]</span><span>RAG Context injected. Evaluated Tokens: 4,092.</span></div>
          <div className="flex gap-4"><span className="text-zinc-600 tabular-nums">14:23:05</span><span className="text-violet-400 font-semibold">[DEBATE]</span><span>Initiating Multi-LLM consensus (GPT-4o, Claude 3.5, DeepSeek)</span></div>
          <div className="flex gap-4"><span className="text-zinc-600 tabular-nums">14:23:06</span><span className="text-violet-400 font-semibold">[DEBATE]</span><span className="text-zinc-200">Consensus reached: <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">STRONG BUY</span> (Confidence: 89%)</span></div>
          <div className="flex gap-4"><span className="text-zinc-600 tabular-nums">14:23:06</span><span className="text-amber-400 font-semibold">[RISK]</span><span>Evaluating constraints... Exposure: 12% &lt; Max: 20%. Status: <span className="text-emerald-400">OK</span></span></div>
          <div className="flex gap-4"><span className="text-zinc-600 tabular-nums">14:23:06</span><span className="text-emerald-400 font-semibold">[CCXT]</span><span>AES-256 decrypted. Routing order to Binance...</span></div>
          <div className="flex gap-4"><span className="text-zinc-600 tabular-nums">14:23:07</span><span className="text-emerald-400 font-semibold">[CCXT]</span><span className="text-white">Order Filled. Market BUY 1.45 BTC @ $64,230.10. <span className="text-zinc-500">Latency: 107ms</span></span></div>
          <div className="flex gap-4 animate-pulse"><span className="text-zinc-600 tabular-nums">14:23:07</span><span className="text-zinc-700">Awaiting next tick_</span></div>
        </div>
      </div>
    </div>
  );
}

function TickerBar() {
  const items = [...EXCHANGES, ...MODELS, ...EXCHANGES, ...MODELS];
  return (
    <div className="w-full overflow-hidden py-4 border-y border-[var(--border-secondary)] bg-[var(--bg-secondary)]/30 backdrop-blur-sm z-10 relative">
      <div className="flex gap-12 animate-scroll whitespace-nowrap items-center">
        {items.map((item, i) => (
          <span key={i} className="text-[var(--text-muted)] text-xs font-semibold tracking-[0.15em] uppercase flex items-center gap-2.5">
            <div className="w-1 h-1 rounded-full bg-[var(--text-muted)] opacity-40" />
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
          animation: scroll 45s linear infinite;
        }
      `}</style>
    </div>
  );
}

function Accordion({ title, children }: { title: string, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[var(--border-primary)] rounded-xl bg-[var(--bg-secondary)]/50 overflow-hidden transition-all duration-300">
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

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{count.toLocaleString()}{suffix}</span>;
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
    { icon: Bot, title: "Multi-LLM Debate Arena", description: "No dependas de una sola IA. Brokiax enfrenta a GPT-4, Claude y DeepSeek en tiempo real para generar un consenso institucional sobre cada trade.", tag: "Core" },
    { icon: Building2, title: "Ejecución Multi-Exchange", description: "Conecta Binance, Bybit, OKX y DEX como Hyperliquid. El motor CCXT enruta tus órdenes con cifrado AES-256 de grado militar.", tag: "Infra" },
    { icon: FlaskConical, title: "Backtest Lab Avanzado", description: "Prueba tus prompts y estrategias contra años de datos históricos en segundos. Asegura tu rentabilidad antes de arriesgar capital real.", tag: "Validación" },
    { icon: BrainCircuit, title: "RAG & Sentimiento", description: "La IA analiza noticias, reportes macro y sentimiento de mercado en tiempo real mediante Retrieval-Augmented Generation.", tag: "Inteligencia" },
    { icon: ShieldCheck, title: "Gestor de Riesgo Autónomo", description: "Drawdown máximo, trailing stops, exposición por activo. El motor bloquea cualquier decisión que viole tus reglas de riesgo.", tag: "Seguridad" },
    { icon: Activity, title: "Infraestructura Cloud 24/7", description: "Cero mantenimiento. Tu agente opera de forma continua en la nube sin que necesites dejar un ordenador encendido ni gestionar VPS.", tag: "Cloud" },
  ];

  const HOW_STEPS = [
    { step: "01", title: "Conecta tus Claves", desc: "Introduce de forma segura tus API keys de Exchange y LLMs. Todo cifrado con AES-256-GCM.", icon: Network },
    { step: "02", title: "Diseña la Estrategia", desc: "Usa lenguaje natural para definir bajo qué condiciones técnicas, macro o de sentimiento debe actuar tu agente.", icon: Cpu },
    { step: "03", title: "Valida con Backtest", desc: "Comprueba cómo se habría comportado tu IA en los últimos años de mercado. Ajusta prompts según el resultado.", icon: Terminal },
    { step: "04", title: "Despliega Automático", desc: "Un clic. El motor RAG opera mientras duermes, respetando estrictamente tu gestión de riesgo.", icon: ShieldCheck },
  ];

  const SOCIAL_STATS = [
    { value: 12400, suffix: "+", label: "Trades Ejecutados", icon: TrendingUp },
    { value: 340, suffix: "+", label: "Agentes Activos", icon: Bot },
    { value: 10, suffix: "+", label: "Exchanges Integrados", icon: Globe },
  ];

  const TESTIMONIALS = [
    { name: "Carlos M.", role: "Swing Trader · Madrid", text: "He probado 5 plataformas de trading algorítmico. Brokiax es la primera donde pude crear una estrategia rentable sin escribir una sola línea de código.", rating: 5 },
    { name: "Sofia R.", role: "Day Trader · Buenos Aires", text: "El Debate Arena es un game-changer. Antes dependía de un solo modelo, ahora tengo 3 IAs validando cada decisión. Mi drawdown bajó un 40%.", rating: 5 },
    { name: "James W.", role: "Crypto Fund · NYC", text: "La integración DEX sin API keys es brillante. Opero en Hyperliquid con wallets de agente sin exponer mis fondos principales.", rating: 5 },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden selection:bg-indigo-500/30 selection:text-white">
      <GridBackground />

      {/* ─── Navbar ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-primary)] shadow-sm"
            : "bg-transparent py-2"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
              B
            </div>
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Brokiax
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">{tn("features")}</a>
            <a href="#how" className="hover:text-[var(--text-primary)] transition-colors">{tn("howItWorks")}</a>
            <a href="#proof" className="hover:text-[var(--text-primary)] transition-colors">Resultados</a>
            <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">{tn("pricing")}</a>
            <Link href="/arena/live" className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-live" />Arena en Vivo</Link>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link href="/dashboard" className="btn-primary text-sm px-5 py-2">
                Panel de Control
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline-flex font-medium text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  {tc("login")}
                </Link>
                <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-5 py-2.5 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5">
                  Comenzar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-40 pb-20 px-6 z-10 flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-widest mb-8 animate-fade-in backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-live" />
            Infraestructura Quant · Powered by AI
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.08] mb-6 animate-fade-in tracking-tight text-[var(--text-primary)]">
            Trading Algorítmico <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-400">
              Reinventado por la IA
            </span>
          </h1>

          <p
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 animate-fade-in leading-relaxed"
            style={{ animationDelay: "0.1s" }}
          >
            Construye, valida y ejecuta agentes de trading autónomos usando lenguaje natural. Sin código, operando 24/7, con consenso multi-LLM.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in mb-6"
            style={{ animationDelay: "0.2s" }}
          >
            <Link href={user ? "/dashboard" : "/register"} className="bg-indigo-600 hover:bg-indigo-700 text-white text-base px-8 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 hover:-translate-y-0.5 transition-all">
              {user ? "Ir al Dashboard" : "Comenzar Gratis"} <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how" className="btn-secondary text-base px-8 py-3.5 flex items-center justify-center rounded-xl">
              Ver cómo funciona
            </a>
          </div>

          {/* Trust micro-indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-muted)] animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> AES-256 Encrypted</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> No requiere tarjeta</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Cancela en cualquier momento</span>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <TerminalMockup />
          </div>
        </div>
      </section>

      {/* ─── Ticker ─── */}
      <TickerBar />

      {/* ─── The Problem ─── */}
      <section id="problem" className="py-28 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                El problema actual
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight leading-tight">
                El trading manual es obsoleto. El algorítmico, inaccesible.
              </h2>
              <p className="text-lg text-[var(--text-secondary)] mb-6 leading-relaxed">
                Hasta ahora, para automatizar estrategias necesitabas VPS costosos, Python avanzado, y gestionar APIs expuestas constantemente.
              </p>
              <p className="text-lg text-[var(--text-primary)] font-medium mb-8">
                Brokiax democratiza la infraestructura institucional. Traduce tus reglas a texto y deja que los LLMs operen el mercado por ti.
              </p>
              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">98%</span>
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">Ahorro en Código</span>
                </div>
                <div className="w-px bg-[var(--border-primary)]" />
                <div className="flex flex-col">
                  <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">&lt;150ms</span>
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold mt-1">Latencia Media</span>
                </div>
              </div>
            </div>
            <div className="glass-card p-8 rounded-2xl relative border border-[var(--border-primary)]">
               <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-[80px]" />
               <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                      <span className="text-red-400 font-bold text-lg">✕</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)]">Bots de Parrilla Clásicos</h4>
                      <p className="text-sm text-[var(--text-secondary)]">Ciegos ante noticias, solo siguen precio. Sin razonamiento.</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-[var(--border-primary)]" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                      <ShieldCheck className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] text-lg">Brokiax AI Agent</h4>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">Razona mercado, lee sentimiento RAG, debate con otros LLMs antes de actuar.</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-28 px-6 bg-[var(--bg-secondary)]/30 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 tracking-tight">
              Arsenal Institucional a tu Disposición
            </h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              No es solo un bot. Es una terminal de grado profesional conectada a Inteligencia Artificial Autónoma.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children mb-16">
            {FEATURES.map((feature, i) => (
              <div key={i} className="group relative bg-[var(--bg-primary)] border border-[var(--border-primary)] p-7 rounded-2xl hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/15 transition-colors">
                    <feature.icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-secondary)] px-2.5 py-1 rounded-full">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2.5 text-[var(--text-primary)]">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            <Accordion title="¿Cómo funciona el Consenso Multi-LLM?">
              Brokiax invoca simultáneamente a distintos modelos (por ejemplo, Claude 3.5 para análisis técnico y GPT-4o para sentimiento). Si no hay consenso claro, el motor se abstiene de operar, reduciendo significativamente los drawdowns.
            </Accordion>
            <Accordion title="¿Mis API Keys están seguras?">
              Absolutamente. Todas las credenciales se encriptan con AES-256-GCM del lado del servidor. El sistema accede en memoria solo cuando tu agente necesita ejecutar una orden. Nosotros nunca accedemos a tus fondos.
            </Accordion>
            <Accordion title="¿Necesito saber programar?">
              No. Defines tu estrategia como si hablaras con un analista: &ldquo;Si BTC rompe EMA50 en 4h y hay noticias positivas, compra con 5% del balance. Stop Loss 2%.&rdquo; Brokiax traduce eso a ejecución autónoma.
            </Accordion>
          </div>
        </div>
      </section>

      {/* ─── Competition Demo ─── */}
      <CompetitionDemo />

      {/* ─── How it works ─── */}
      <section id="how" className="py-28 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-4xl font-bold tracking-tight mb-4">
               Pasa a Producción en 4 Pasos
             </h2>
             <p className="text-[var(--text-secondary)]">El flujo de trabajo automatizado más sencillo del mercado Quant.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {HOW_STEPS.map((item, i) => (
              <div key={item.step} className="relative">
                {i < HOW_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-[2px] bg-gradient-to-r from-[var(--border-primary)] to-transparent z-0" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center mb-5 shadow-sm">
                    <item.icon className="w-7 h-7 text-indigo-400" />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70 mb-2">Paso {item.step}</div>
                  <h3 className="text-base font-bold mb-2.5">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section id="proof" className="py-28 px-6 bg-[var(--bg-secondary)]/30 relative z-10 border-y border-[var(--border-secondary)]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              Avalado por Traders Globales
            </h2>
            <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
              Profesionales de todo el mundo confían en Brokiax para automatizar su operativa.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mb-16">
            {SOCIAL_STATS.map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-primary)]">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                  <stat.icon className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)] mb-1">
                  <CountUp target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-7 flex flex-col hover:border-indigo-500/20 transition-colors">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.rating).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 mb-5 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <div className="font-semibold text-sm text-[var(--text-primary)]">{t.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-28 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight mb-4 text-[var(--text-primary)]">Planes y Precios</h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
              Escala tu operativa algorítmica sin comisiones ocultas. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-8 flex flex-col hover:border-[var(--text-muted)]/30 transition-all duration-300">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Starter</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Para empezar a explorar agentes IA.</p>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-[var(--text-primary)]">Gratis</span>
              </div>
              <ul className="space-y-3.5 mb-8 flex-1">
                <li className="flex items-center text-sm text-[var(--text-secondary)]"><CheckCircle2 className="w-5 h-5 text-zinc-400 mr-3 shrink-0" /> 1 Trader IA</li>
                <li className="flex items-center text-sm text-[var(--text-secondary)]"><CheckCircle2 className="w-5 h-5 text-zinc-400 mr-3 shrink-0" /> 1 Exchange (Spot)</li>
                <li className="flex items-center text-sm text-[var(--text-secondary)]"><CheckCircle2 className="w-5 h-5 text-zinc-400 mr-3 shrink-0" /> GPT-4o & DeepSeek</li>
                <li className="flex items-center text-sm text-[var(--text-secondary)]"><CheckCircle2 className="w-5 h-5 text-zinc-400 mr-3 shrink-0" /> Strategy Studio Básico</li>
              </ul>
              <Link href="/register" className="btn-secondary w-full text-center py-3 rounded-xl">Comenzar Gratis</Link>
            </div>

            {/* Pro Plan */}
            <div className="relative bg-[var(--bg-primary)] rounded-2xl p-8 flex flex-col border-2 border-indigo-500 shadow-[0_0_60px_rgba(99,102,241,0.1)] transform md:-translate-y-3">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg">
                Más Popular
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Pro</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Operativa continua, DEX y RAG Chat.</p>
              <div className="mb-8 flex items-baseline">
                <span className="text-5xl font-extrabold text-[var(--text-primary)]">$29</span>
                <span className="text-[var(--text-muted)] ml-2">/mes</span>
              </div>
              <ul className="space-y-3.5 mb-8 flex-1">
                <li className="flex items-center text-sm text-[var(--text-primary)] font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-400 mr-3 shrink-0" /> 5 Traders Simultáneos</li>
                <li className="flex items-center text-sm text-[var(--text-primary)] font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-400 mr-3 shrink-0" /> DEX Trading (Sin API key) <span className="ml-2 text-[9px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full font-bold">NUEVO</span></li>
                <li className="flex items-center text-sm text-[var(--text-primary)] font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-400 mr-3 shrink-0" /> RAG Chat Histórico <span className="ml-2 text-[9px] bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded-full font-bold">NUEVO</span></li>
                <li className="flex items-center text-sm text-[var(--text-primary)] font-medium"><CheckCircle2 className="w-5 h-5 text-indigo-400 mr-3 shrink-0" /> Backtest Lab + Debate Arena</li>
                <li className="flex items-center text-sm text-[var(--text-secondary)]"><CheckCircle2 className="w-5 h-5 text-indigo-400/50 mr-3 shrink-0" /> Todos los LLMs</li>
              </ul>
              <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white w-full text-center py-3 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20">Actualizar a Pro</Link>
            </div>

            {/* Elite Plan */}
            <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-2xl p-8 flex flex-col hover:border-[var(--text-muted)]/30 transition-all duration-300">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Elite</h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Inversores institucionales y alta frecuencia.</p>
              <div className="mb-8 flex items-baseline">
                <span className="text-5xl font-extrabold text-[var(--text-primary)]">$99</span>
                <span className="text-[var(--text-muted)] ml-2">/mes</span>
              </div>
              <ul className="space-y-3.5 mb-8 flex-1">
                <li className="flex items-center text-sm text-[var(--text-secondary)]"><CheckCircle2 className="w-5 h-5 text-zinc-400 mr-3 shrink-0" /> Traders Ilimitados</li>
                <li className="flex items-center text-sm text-[var(--text-secondary)]"><CheckCircle2 className="w-5 h-5 text-zinc-400 mr-3 shrink-0" /> Datos cuantitativos en vivo</li>
                <li className="flex items-center text-sm text-[var(--text-secondary)]"><CheckCircle2 className="w-5 h-5 text-zinc-400 mr-3 shrink-0" /> 4 LLMs en Debate Arena</li>
                <li className="flex items-center text-sm text-[var(--text-secondary)]"><CheckCircle2 className="w-5 h-5 text-zinc-400 mr-3 shrink-0" /> Prioridad de ejecución</li>
              </ul>
              <Link href="/register" className="btn-secondary w-full text-center py-3 rounded-xl">Obtener Elite</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="py-32 px-6 relative z-10 flex justify-center">
        <div className="w-full max-w-4xl relative overflow-hidden rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-700" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="relative p-12 md:p-16 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
              El Momento de Escalar es Ahora.
            </h2>
            <p className="text-lg text-indigo-100/80 mb-10 max-w-2xl mx-auto">
              Deja de perder oportunidades por tener que dormir. Inicia hoy, realiza tus primeros backtests gratis y evoluciona tu trading.
            </p>
            <Link href="/register" className="bg-white text-indigo-700 text-lg px-12 py-4 rounded-xl inline-flex items-center gap-3 font-bold shadow-2xl hover:bg-indigo-50 hover:-translate-y-0.5 transition-all">
              Crear Cuenta Gratuita <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-6 text-xs text-indigo-200/60 uppercase tracking-widest font-semibold">
              No requiere tarjeta de crédito para iniciar.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
      <section className="py-6 px-6 bg-[var(--bg-secondary)]/30 border-y border-[var(--border-secondary)] relative z-10">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-10 text-[var(--text-muted)] text-xs font-semibold uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" /> <span>AES-256-GCM</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> <span>SOC 2 Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" /> <span>99.9% Uptime</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5" /> <span>GDPR Ready</span>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-16 px-6 relative z-10 bg-[var(--bg-primary)]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
          <div className="flex flex-col gap-4 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
                B
              </div>
              <span className="font-bold text-xl tracking-tight">Brokiax</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              La plataforma Quant liderada por Inteligencia Artificial. Ejecución autónoma, gestión de riesgo y consenso multi-LLM en la nube.
            </p>
            <div className="flex items-center gap-3 mt-2">
              <a href="#" className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z"/></svg>
              </a>
            </div>
          </div>

          <div className="flex gap-16">
            <div className="flex flex-col gap-3">
              <h5 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-2">Producto</h5>
              <a href="#features" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</a>
              <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Precios</a>
              <a href="#how" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Cómo funciona</a>
              <Link href="/arena/live" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Arena en Vivo</Link>
            </div>
            <div className="flex flex-col gap-3">
              <h5 className="font-bold text-[var(--text-primary)] text-xs uppercase tracking-wider mb-2">Legal</h5>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Términos</a>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Privacidad</a>
              <a href="#" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Contacto</a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-[var(--border-primary)] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Brokiax Technologies. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-live" />
            Todos los sistemas operativos
          </div>
          <div className="text-xs text-[var(--text-muted)] max-w-md text-center md:text-right">
             El trading algorítmico conlleva riesgos. Los rendimientos pasados no garantizan resultados futuros.
          </div>
        </div>
      </footer>
    </div>
  );
}
