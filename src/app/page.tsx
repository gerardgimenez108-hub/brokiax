"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const FEATURES = [
  {
    icon: "🤖",
    title: "Multi-LLM",
    description:
      "Elige entre GPT-4o, Claude, DeepSeek, Gemini, Grok y más. Cada trader usa el modelo que tú prefieras.",
  },
  {
    icon: "🏦",
    title: "Multi-Exchange",
    description:
      "Conecta Binance, Bybit, OKX, Bitget, KuCoin, Gate, Hyperliquid y más. CEX y DEX en una plataforma.",
  },
  {
    icon: "🧪",
    title: "Strategy Studio",
    description:
      "Configura indicadores (RSI, MACD, EMA, ATR), timeframes, selección de monedas y prompts personalizados visualmente.",
  },
  {
    icon: "⚔️",
    title: "Debate Arena",
    description:
      "Hasta 4 LLMs analizan el mercado de forma independiente y un moderador sintetiza la decisión óptima.",
  },
  {
    icon: "📊",
    title: "Backtest Lab",
    description:
      "Prueba tu estrategia con datos históricos. Visualiza equity curves, Sharpe ratio, drawdown y win rate.",
  },
  {
    icon: "🛡️",
    title: "Risk Manager",
    description:
      "Circuit breaker automático, stop-loss, take-profit, límites de apalancamiento y control de exposición por posición.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "0",
    features: [
      "1 Agente IA Activo",
      "Paper Trading",
      "Modelos LLM Base (GPT-4o mini, DeepSeek Lite)",
      "Strategy Studio básico",
      "BYOK (Bring Your Own Key)",
    ],
    cta: "Comenzar Gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: "29",
    features: [
      "5 Agentes IA Activos",
      "Paper + Trading real",
      "Todos los modelos LLM (GPT-4o, Claude 3.5, etc)",
      "Debate Arena (Múltiples Modelos)",
      "Backtest Lab Integral",
      "BYOK (Bring Your Own Key)",
    ],
    cta: "Mejorar a Pro",
    popular: true,
  },
  {
    name: "Elite",
    price: "79",
    features: [
      "Agentes Ilimitados",
      "Paper + Trading real",
      "Todos los modelos LLM",
      "Debate Arena Avanzado",
      "Backtest Lab Premium",
      "Datos Quant Avanzados",
      "Soporte Prioritario",
      "BYOK (Bring Your Own Key)",
    ],
    cta: "Obtener Elite",
    popular: false,
  },
];

const EXCHANGES = [
  "Binance",
  "Bybit",
  "OKX",
  "Bitget",
  "KuCoin",
  "Gate",
  "Hyperliquid",
];

const MODELS = [
  "GPT-4o",
  "Claude 3.5",
  "DeepSeek V3",
  "Gemini Pro",
  "Grok",
  "Qwen",
];

function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
          top: "-200px",
          right: "-100px",
          animation: "float 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)",
          bottom: "-150px",
          left: "-100px",
          animation: "float 25s ease-in-out infinite reverse",
        }}
      />
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>
    </div>
  );
}

function TickerBar() {
  const items = [...EXCHANGES, ...MODELS, ...EXCHANGES, ...MODELS];
  return (
    <div className="w-full overflow-hidden py-4 border-y border-[var(--border-secondary)]">
      <div className="flex gap-8 animate-scroll whitespace-nowrap">
        {items.map((item, i) => (
          <span
            key={i}
            className="text-[var(--text-tertiary)] text-sm font-medium flex-shrink-0"
          >
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
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />

      {/* ─── Navbar ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all ${
          scrolled
            ? "bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-[var(--border-primary)] shadow-lg"
            : "bg-transparent"
        }`}
        style={{ transitionDuration: "var(--transition-base)" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent-500)] flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)]">
              Brokiax
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Precios
            </a>
            <a href="#how" className="hover:text-white transition-colors">
              Cómo funciona
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">
              Iniciar sesión
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Empezar ahora
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--brand-900)]/30 border border-[var(--brand-700)]/30 text-[var(--brand-300)] text-sm mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[var(--brand-400)] pulse-live" />
            Plataforma de trading autónomo con IA
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 animate-fade-in">
            Trading autónomo con{" "}
            <span className="gradient-text">inteligencia artificial</span>
          </h1>

          <p
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-10 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Crea traders que combinan el LLM, exchange y estrategia que
            prefieras. Desde GPT-4o a DeepSeek, de Binance a Hyperliquid.
            Paper trading y trading real en una sola plataforma.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <Link
              href="/register"
              className="btn-primary text-base px-8 py-3.5"
            >
              Empezar a operar →
            </Link>
            <a href="#how" className="btn-secondary text-base px-8 py-3.5">
              Ver cómo funciona
            </a>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-16 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            {[
              { value: "9+", label: "Exchanges" },
              { value: "7+", label: "Modelos LLM" },
              { value: "24/7", label: "Trading autónomo" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-[var(--text-tertiary)] mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Ticker ─── */}
      <TickerBar />

      {/* Elementos de fondo */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--brand-700)]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[var(--accent-500)]/10 rounded-full blur-[150px]" />
      </div>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas para{" "}
              <span className="gradient-text">operar con IA</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              Herramientas profesionales de trading potenciadas por
              inteligencia artificial, accesibles desde cualquier dispositivo.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="glass-card p-6 group">
                <div className="text-3xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text-primary)] group-hover:text-[var(--brand-300)] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cómo funciona ─── */}
      <section id="how" className="py-24 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Cómo funciona
          </h2>

          <div className="space-y-12">
            {[
              {
                step: "01",
                title: "Conecta tus claves",
                desc: "Añade tu API key del LLM (OpenRouter, OpenAI, etc.) y del exchange (Binance, Bybit, etc.). Todo cifrado con AES-256.",
              },
              {
                step: "02",
                title: "Configura tu estrategia",
                desc: "Usa el Strategy Studio para seleccionar monedas, indicadores técnicos, timeframes y parámetros de riesgo.",
              },
              {
                step: "03",
                title: "Crea tu trader",
                desc: "Combina LLM + Exchange + Estrategia en un trader. Empieza con paper trading o directamente en real.",
              },
              {
                step: "04",
                title: "Opera 24/7",
                desc: "Tu trader analiza el mercado, toma decisiones y ejecuta órdenes de forma autónoma. Tú solo supervisas.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-700)] to-[var(--accent-600)] flex items-center justify-center text-white font-bold text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-[var(--text-secondary)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planes y precios
            </h2>
            <p className="text-[var(--text-secondary)]">
              Elige el plan que mejor se adapte a tu operativa. Cancela cuando
              quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 stagger-children">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`glass-card p-8 relative ${
                  plan.popular ? "border-[var(--brand-500)]/50" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[var(--brand-600)] to-[var(--accent-500)] text-white text-xs font-semibold">
                    Más popular
                  </div>
                )}

                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">€{plan.price}</span>
                  <span className="text-[var(--text-tertiary)]">/mes</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"
                    >
                      <svg
                        className="w-4 h-4 text-[var(--success)] flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block w-full text-center py-3 rounded-lg font-semibold text-sm transition-all ${
                    plan.popular
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center glass-card p-12">
          <h2 className="text-3xl font-bold mb-4">
            Empieza a operar con IA hoy
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Accede a la plataforma completa con traders autónomos, multi-LLM
            y análisis avanzado.
          </p>
          <Link href="/register" className="btn-primary text-base px-10 py-4">
            Crear cuenta →
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--border-secondary)] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent-500)] flex items-center justify-center text-white font-bold text-xs">
              B
            </div>
            <span className="font-semibold">Brokiax</span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">
            © {new Date().getFullYear()} Brokiax. Todos los derechos reservados.
          </p>
          <p className="text-xs text-[var(--text-muted)] max-w-md text-center md:text-right">
            ⚠️ Aviso: El trading con IA conlleva riesgos significativos. Recomendado
            para aprendizaje/investigación o cantidades pequeñas.
          </p>
        </div>
      </footer>
    </div>
  );
}
