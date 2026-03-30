"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Bot, Building2, FlaskConical, Swords, BarChart3, ShieldCheck,
  ArrowRight, CheckCircle2, Zap, Lock, TrendingUp, Globe, Network, Cpu, Terminal
} from "lucide-react";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";

const EXCHANGES = ["Binance", "Bybit", "OKX", "Bitget", "KuCoin", "Gate", "Hyperliquid"];
const MODELS = ["GPT-4o", "Claude 3.5", "DeepSeek V3", "Gemini Pro", "Grok", "Qwen"];

function GridBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[var(--bg-primary)]">
      <div
        className="absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(circle at center, black 0%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 0%, transparent 80%)",
        }}
      />
    </div>
  );
}

function TerminalMockup() {
  return (
    <div className="w-full max-w-3xl mx-auto mt-12 mb-8 bg-[#09090b] border border-[var(--border-primary)] rounded-md overflow-hidden shadow-2xl font-mono text-xs text-left">
      <div className="flex items-center px-4 py-2 border-b border-[var(--border-secondary)] bg-[#111113]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
        </div>
        <div className="mx-auto text-[10px] text-zinc-500 font-medium">~/brokiax/execution-engine</div>
      </div>
      <div className="p-4 space-y-2 text-zinc-300">
        <div className="flex gap-3"><span className="text-zinc-400">14:23:05.102</span><span className="text-blue-400">[SYSTEM]</span><span>RAG Context injected. Evaluated Tokens: 4,092.</span></div>
        <div className="flex gap-3"><span className="text-zinc-400">14:23:05.150</span><span className="text-purple-400">[DEBATE]</span><span>Initiating Multi-LLM consensus (GPT-4o, Claude 3.5, DeepSeek)</span></div>
        <div className="flex gap-3"><span className="text-zinc-400">14:23:06.891</span><span className="text-purple-400">[DEBATE]</span><span className="text-zinc-100">Consensus reached: <span className="text-emerald-400 font-bold">STRONG BUY</span> (Confidence: 89%)</span></div>
        <div className="flex gap-3"><span className="text-zinc-400">14:23:06.901</span><span className="text-amber-400">[RISK]</span><span>Evaluating constraints... Exposure: 12% &lt; Max: 20%. Status: OK</span></div>
        <div className="flex gap-3"><span className="text-zinc-400">14:23:06.905</span><span className="text-emerald-400">[CCXT]</span><span>AES-256 decrypted. Routing order to Binance...</span></div>
        <div className="flex gap-3"><span className="text-zinc-400">14:23:07.012</span><span className="text-emerald-400">[CCXT]</span><span className="text-white">Order Filled. Market BUY 1.45 BTC @ $64,230.10. Latency: 107ms</span></div>
        <div className="flex gap-3 animate-pulse"><span className="text-zinc-400">14:23:07.100</span><span className="text-zinc-500">Awaiting next tick...</span></div>
      </div>
    </div>
  );
}

function TickerBar() {
  const items = [...EXCHANGES, ...MODELS, ...EXCHANGES, ...MODELS];
  return (
    <div className="w-full overflow-hidden py-4 border-y border-[var(--border-secondary)]">
      <div className="flex gap-8 animate-scroll whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="text-[var(--text-tertiary)] text-sm font-medium flex-shrink-0 tracking-wide">
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
    { icon: Bot, title: t("featureMultiLLM"), description: t("featureMultiLLMDesc") },
    { icon: Building2, title: t("featureMultiExchange"), description: t("featureMultiExchangeDesc") },
    { icon: FlaskConical, title: t("featureStrategyStudio"), description: t("featureStrategyStudioDesc") },
    { icon: Swords, title: t("featureDebateArena"), description: t("featureDebateArenaDesc") },
    { icon: BarChart3, title: t("featureBacktestLab"), description: t("featureBacktestLabDesc") },
    { icon: ShieldCheck, title: t("featureRiskManager"), description: t("featureRiskManagerDesc") },
  ];

  const PLANS = [
    {
      name: t("planFree"),
      price: "0",
      features: [tp("free_1"), tp("free_2"), tp("free_3"), tp("free_4"), tp("free_5")],
      cta: t("planFreeCta"),
      popular: false,
    },
    {
      name: t("planPro"),
      price: "29",
      features: [tp("pro_1"), tp("pro_2"), tp("pro_3"), tp("pro_4"), tp("pro_5"), tp("pro_6")],
      cta: t("planProCta"),
      popular: true,
    },
    {
      name: t("planElite"),
      price: "79",
      features: [tp("elite_1"), tp("elite_2"), tp("elite_3"), tp("elite_4"), tp("elite_5"), tp("elite_6"), tp("elite_7"), tp("elite_8")],
      cta: t("planEliteCta"),
      popular: false,
    },
    {
      name: t("planEnterprise"),
      price: "199",
      features: [tp("enterprise_1"), tp("enterprise_2"), tp("enterprise_3"), tp("enterprise_4"), tp("enterprise_5"), tp("enterprise_6")],
      cta: t("planEnterpriseCta"),
      popular: false,
      enterprise: true,
    },
  ];

  const HOW_STEPS = [
    { step: "01", title: t("howStep1Title"), desc: t("howStep1Desc"), icon: Network },
    { step: "02", title: t("howStep2Title"), desc: t("howStep2Desc"), icon: Cpu },
    { step: "03", title: t("howStep3Title"), desc: t("howStep3Desc"), icon: Terminal },
    { step: "04", title: t("howStep4Title"), desc: t("howStep4Desc"), icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen relative">
      <GridBackground />

      {/* ─── Navbar ─── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all ${
          scrolled
            ? "bg-[var(--bg-primary)]/90 backdrop-blur-xl border-b border-[var(--border-primary)] shadow-sm"
            : "bg-transparent"
        }`}
        style={{ transitionDuration: "var(--transition-base)" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
              Brokiax
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--text-secondary)]">
            <a href="#features" className="hover:text-white transition-colors">{tn("features")}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{tn("pricing")}</a>
            <a href="#how" className="hover:text-white transition-colors">{tn("howItWorks")}</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <div className="flex items-center gap-4 ml-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-zinc-400">
                        {(user.displayName?.charAt(0) || user.email?.charAt(0) || "U").toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col">
                    <span className="text-sm font-medium text-emerald-400 leading-none">
                      {user.displayName || user.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-0.5">
                      {user.plan || "Starter"}
                    </span>
                  </div>
                </div>
                <Link href="/dashboard" className="btn-primary text-sm px-4 py-1.5 ml-2">
                  Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-secondary text-sm">{tc("login")}</Link>
                <Link href="/register" className="btn-primary text-sm">{tc("register")}</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-amber-500 pulse-live" />
            {t("badge")}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] mb-6 animate-fade-in tracking-tight">
            {t("heroTitle")}{" "}
            <span className="gradient-text">{t("heroHighlight")}</span>
          </h1>

          <p
            className="text-lg md:text-xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-10 animate-fade-in leading-relaxed"
            style={{ animationDelay: "0.1s" }}
          >
            {t("heroDescription")}
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in mb-8"
            style={{ animationDelay: "0.2s" }}
          >
            <Link href={user ? "/dashboard" : "/register"} className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 justify-center">
              {user ? "Dashboard" : t("ctaPrimary")} <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#how" className="btn-secondary text-base px-8 py-3.5">
              {t("ctaSecondary")}
            </a>
          </div>
          
          <div className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <TerminalMockup />
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mt-12 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            {[
              { value: "9+", label: t("statExchanges"), icon: Globe },
              { value: "7+", label: t("statModels"), icon: Bot },
              { value: "24/7", label: t("statTrading"), icon: Zap },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-[var(--brand-400)]" />
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-[var(--text-tertiary)] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Ticker ─── */}
      <TickerBar />

      {/* ─── Features ─── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              {t("featuresTitle")}{" "}
              <span className="text-zinc-400">{t("featuresHighlight")}</span>
            </h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
              {t("featuresSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="glass-card p-6 group rounded-md border-zinc-800">
                <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-zinc-300" />
                </div>
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

      {/* ─── How it works ─── */}
      <section id="how" className="py-24 px-6 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">
            {t("howTitle")}
          </h2>

          <div className="space-y-12">
            {HOW_STEPS.map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-zinc-300" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{t("pricingTitle")}</h2>
            <p className="text-[var(--text-secondary)]">{t("pricingSubtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`glass-card p-8 relative rounded-md border ${
                  plan.popular ? "border-zinc-500" : "border-zinc-800"
                } ${plan.enterprise ? "border-amber-600" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-sm bg-zinc-100 text-zinc-900 text-xs font-bold uppercase tracking-wider">
                    {t("planMostPopular")}
                  </div>
                )}
                {plan.enterprise && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-600 to-orange-500 text-white text-xs font-semibold">
                    {t("planInstitutional")}
                  </div>
                )}

                <h3 className="text-xl font-semibold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">€{plan.price}</span>
                  <span className="text-[var(--text-tertiary)]">{tc("perMonth")}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm text-[var(--text-secondary)]">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.enterprise ? "text-amber-400" : "text-[var(--success)]"}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.enterprise ? "mailto:enterprise@brokiax.com?subject=Brokiax Enterprise" : (user ? "/settings/billing" : "/register")}
                  className={`block w-full text-center py-3 rounded-md font-semibold text-sm transition-all ${
                    plan.popular ? "bg-white text-black hover:bg-zinc-200" : plan.enterprise ? "bg-amber-600 text-white hover:bg-amber-700" : "btn-secondary"
                  }`}
                >
                  {user && !plan.enterprise ? "Upgrade" : plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
      <section className="py-12 px-6 border-t border-[var(--border-secondary)]">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-[var(--text-tertiary)] text-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>AES-256-GCM</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>SOC 2 Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <span>99.9% Uptime</span>
          </div>
        </div>
      </section>

      {/* ─── CTA Final ─── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center glass-card p-12 relative overflow-hidden rounded-md border-zinc-800">
          <div className="absolute inset-0 bg-zinc-900/40" />
          <h2 className="text-3xl font-bold mb-4 relative z-10 tracking-tight">{t("ctaTitle")}</h2>
          <p className="text-[var(--text-secondary)] mb-8 relative z-10">{t("ctaSubtitle")}</p>
          <Link href={user ? "/dashboard" : "/register"} className="btn-primary text-base px-10 py-4 relative z-10 inline-flex items-center gap-2">
            {user ? "Dashboard" : t("ctaButton")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--border-secondary)] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-bold text-xs">
              B
            </div>
            <span className="font-semibold tracking-tight">Brokiax</span>
          </div>
          <p className="text-sm text-[var(--text-tertiary)]">
            © {new Date().getFullYear()} Brokiax. {t("footerRights")}
          </p>
          <p className="text-xs text-[var(--text-muted)] max-w-md text-center md:text-right">
            {t("footerDisclaimer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
