"use client";

import { useState, useEffect } from "react";
import { Strategy, StrategyConfig, DEFAULT_STRATEGY_CONFIG } from "@/lib/types/strategy";
import { useAuth } from "@/hooks/useAuth";

// Available coins for static selection (from nofx pattern)
const AVAILABLE_COINS = [
  { symbol: "BTC/USDT", name: "Bitcoin", icon: "₿", color: "#F7931A" },
  { symbol: "ETH/USDT", name: "Ethereum", icon: "Ξ", color: "#627EEA" },
  { symbol: "SOL/USDT", name: "Solana", icon: "◎", color: "#9945FF" },
  { symbol: "XRP/USDT", name: "Ripple", icon: "✕", color: "#23292F" },
  { symbol: "BNB/USDT", name: "BNB", icon: "◆", color: "#F0B90B" },
  { symbol: "ADA/USDT", name: "Cardano", icon: "♦", color: "#0033AD" },
  { symbol: "DOGE/USDT", name: "Dogecoin", icon: "Ð", color: "#C2A633" },
  { symbol: "AVAX/USDT", name: "Avalanche", icon: "▲", color: "#E84142" },
  { symbol: "LINK/USDT", name: "Chainlink", icon: "⬡", color: "#2A5ADA" },
  { symbol: "DOT/USDT", name: "Polkadot", icon: "●", color: "#E6007A" },
  { symbol: "MATIC/USDT", name: "Polygon", icon: "⬡", color: "#8247E5" },
  { symbol: "UNI/USDT", name: "Uniswap", icon: "🦄", color: "#FF007A" },
];

// Indicator definitions (from nofx IndicatorEditor)
const INDICATORS = [
  { id: "enableEma", name: "EMA", desc: "Media Móvil Exponencial", paramsKey: "emaPeriods", defaultParams: [20, 50], color: "#0ECB81" },
  { id: "enableMacd", name: "MACD", desc: "Convergencia/Divergencia", paramsKey: "macdPeriods", defaultParams: [12, 26, 9], color: "#F6465D" },
  { id: "enableRsi", name: "RSI", desc: "Índice de Fuerza Relativa", paramsKey: "rsiPeriods", defaultParams: [14], color: "#F0B90B" },
  { id: "enableAtr", name: "ATR", desc: "Average True Range", paramsKey: "atrPeriods", defaultParams: [14], color: "#60A5FA" },
  { id: "enableBoll", name: "Bollinger", desc: "Bandas de Bollinger", paramsKey: "bollPeriods", defaultParams: [20], color: "#A855F7" },
  { id: "enableVolume", name: "Volumen", desc: "Análisis de volumen de mercado", paramsKey: null, defaultParams: [], color: "#0ECB81" },
  { id: "enableOi", name: "Open Interest", desc: "Interés abierto en futuros", paramsKey: null, defaultParams: [], color: "#F0B90B" },
  { id: "enableFundingRate", name: "Funding Rate", desc: "Tasa de financiación", paramsKey: null, defaultParams: [], color: "#F6465D" },
] as const;

const TIMEFRAMES = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "30m", label: "30m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1D" },
];

export default function StrategyStudioPage() {
  const { user, firebaseUser } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const [config, setConfig] = useState<StrategyConfig>({ ...DEFAULT_STRATEGY_CONFIG });
  const [strategyName, setStrategyName] = useState("Mi Estrategia Alpha");
  
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("coins");

  // Load user strategies on mount
  useEffect(() => {
    async function loadStrategies() {
      if (!user) return;
      try {
        const token = await firebaseUser?.getIdToken();
        const res = await fetch("/api/user/strategies", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data: Strategy[] = await res.json();
          setStrategies(data);
          
          if (data.length > 0) {
            selectStrategy(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load strategies", err);
      }
    }
    loadStrategies();
  }, [user]);

  const selectStrategy = (s: Strategy) => {
    setCurrentId(s.id);
    setStrategyName(s.name);
    // deep copy the config to avoid reference mutations
    setConfig(JSON.parse(JSON.stringify(s.config)));
  };

  const handleCreateNew = () => {
    setCurrentId(null);
    setStrategyName("Nueva Estrategia G" + Math.floor(Math.random() * 100));
    setConfig(JSON.parse(JSON.stringify(DEFAULT_STRATEGY_CONFIG)));
  };

  // Accordion sections
  const sections = [
    { id: "coins", icon: "🎯", title: "Selección de Monedas", color: "#F0B90B" },
    { id: "indicators", icon: "📊", title: "Indicadores Técnicos", color: "#0ECB81" },
    { id: "risk", icon: "🛡️", title: "Control de Riesgo", color: "#F6465D" },
    { id: "prompts", icon: "✨", title: "Prompt Builder", color: "#A855F7" },
  ];

  const toggleCoin = (symbol: string) => {
    setConfig((prev) => ({
      ...prev,
      coinSource: {
        ...prev.coinSource,
        staticCoins: prev.coinSource.staticCoins.includes(symbol)
          ? prev.coinSource.staticCoins.filter((c) => c !== symbol)
          : [...prev.coinSource.staticCoins, symbol],
      },
    }));
  };

  const toggleIndicator = (key: string) => {
    setConfig((prev) => ({
      ...prev,
      indicators: {
        ...prev.indicators,
        [key]: !(prev.indicators as any)[key],
      },
    }));
  };

  const setTimeframe = (tf: string) => {
    setConfig((prev) => ({
      ...prev,
      indicators: {
        ...prev.indicators,
        klines: { ...prev.indicators.klines, primaryTimeframe: tf },
      },
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const payload = {
        name: strategyName,
        isActive: true,
        config: config
      };

      const url = currentId 
        ? `/api/user/strategies/${currentId}` 
        : `/api/user/strategies`;
      
      const method = currentId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedData = await res.json();
        
        // Update local list
        if (currentId) {
          setStrategies(strategies.map(s => s.id === currentId ? savedData : s));
        } else {
          setStrategies([savedData, ...strategies]);
          setCurrentId(savedData.id);
        }

        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        console.error("Save failed:", await res.text());
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-primary)] mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--brand-600)] to-[var(--accent-500)] flex items-center justify-center text-xl shadow-lg shadow-[var(--brand-500)]/20">⚡</div>
          <div>
            <input
              type="text"
              value={strategyName}
              onChange={(e) => setStrategyName(e.target.value)}
              className="text-xl font-bold bg-transparent border-none outline-none text-[var(--text-primary)] w-full"
              placeholder="Nombre de la estrategia..."
            />
            <p className="text-xs text-[var(--text-tertiary)]">Configura indicadores, monedas, timeframes y prompts para tus traders</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {strategies.length > 0 && (
            <select 
              className="input-field text-sm max-w-[200px]"
              value={currentId || ""}
              onChange={(e) => {
                const s = strategies.find(x => x.id === e.target.value);
                if (s) selectStrategy(s);
              }}
            >
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          
          <button onClick={handleCreateNew} className="btn-secondary flex items-center gap-2">
            + Nuevo
          </button>
          
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={`btn-primary flex items-center gap-2 transition-all ${saved ? "bg-[var(--success)] border-[var(--success)]" : ""} ${saving ? "opacity-70 cursor-wait" : ""}`}
          >
            {saving ? (
              <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Guardando</>
            ) : saved ? (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>¡Guardada!</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Guardar</>
            )}
          </button>
        </div>
      </div>

      {/* Main Layout: 3 columns like nofx */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        
        {/* Left: Section Navigation */}
        <div className="lg:col-span-2 space-y-1 lg:border-r lg:border-[var(--border-primary)] lg:pr-4">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                activeSection === s.id
                  ? "bg-[var(--brand-500)]/10 text-[var(--brand-300)] ring-1 ring-[var(--brand-500)]/30"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              <span className="text-lg">{s.icon}</span>
              <span className="hidden lg:inline">{s.title}</span>
            </button>
          ))}

          {/* Timeframe selector compact */}
          <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
            <div className="text-xs text-[var(--text-tertiary)] mb-2 px-3 font-medium">TIMEFRAME</div>
            <div className="grid grid-cols-4 lg:grid-cols-2 gap-1 px-1">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-2 py-1.5 rounded text-xs font-mono font-bold transition-all text-center ${
                    config.indicators.klines.primaryTimeframe === tf.value
                      ? "bg-[var(--accent-500)]/20 text-[var(--accent-300)] ring-1 ring-[var(--accent-400)]/40"
                      : "text-[var(--text-tertiary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle: Config Editor */}
        <div className="lg:col-span-6 overflow-y-auto pr-2">
          {/* Coin Selection */}
          {activeSection === "coins" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Selección de Monedas</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--brand-500)]/10 text-[var(--brand-400)]">
                  {config.coinSource.staticCoins.length} seleccionadas
                </span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                Selecciona las monedas que el agente IA analizará y operará.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {AVAILABLE_COINS.map((coin) => {
                  const active = config.coinSource.staticCoins.includes(coin.symbol);
                  return (
                    <button
                      key={coin.symbol}
                      onClick={() => toggleCoin(coin.symbol)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        active
                          ? "bg-[var(--brand-500)]/10 border-[var(--brand-400)]/40 shadow-lg shadow-[var(--brand-500)]/5"
                          : "bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]"
                      }`}
                    >
                      <span className="text-2xl">{coin.icon}</span>
                      <div className="text-left">
                        <div className={`text-sm font-bold ${active ? "text-[var(--brand-300)]" : "text-[var(--text-primary)]"}`}>
                          {coin.symbol.split("/")[0]}
                        </div>
                        <div className="text-xs text-[var(--text-tertiary)]">{coin.name}</div>
                      </div>
                      {active && (
                        <svg className="w-4 h-4 ml-auto text-[var(--brand-400)]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Indicators */}
          {activeSection === "indicators" && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Indicadores Técnicos</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                  {INDICATORS.filter((ind) => (config.indicators as any)[ind.id]).length} activos
                </span>
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                El agente recibirá los datos de estos indicadores con cada ciclo de análisis.
              </p>
              {INDICATORS.map((ind) => {
                const active = (config.indicators as any)[ind.id];
                return (
                  <div key={ind.id} className={`rounded-xl border p-4 transition-all ${
                    active ? "border-[var(--brand-500)]/30 bg-[var(--bg-secondary)]" : "border-[var(--border-primary)] bg-[var(--bg-secondary)]/50"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ind.color }} />
                        <div>
                          <span className="font-semibold text-sm">{ind.name}</span>
                          <span className="text-xs text-[var(--text-tertiary)] ml-2">{ind.desc}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleIndicator(ind.id)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${active ? "bg-[var(--brand-500)]" : "bg-[var(--bg-elevated)]"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${active ? "translate-x-[22px]" : "translate-x-1"}`} />
                      </button>
                    </div>
                    {active && ind.paramsKey && (
                      <div className="mt-3 pt-3 border-t border-[var(--border-primary)]/50">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-tertiary)]">Períodos:</span>
                          <span className="text-xs font-mono text-[var(--text-secondary)]">{ind.defaultParams.join(", ")}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Risk Control */}
          {activeSection === "risk" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="text-lg font-semibold">Control de Riesgo</h3>
              <p className="text-sm text-[var(--text-tertiary)]">
                Parámetros de gestión de capital que el agente deberá respetar.
              </p>
              
              {[
                { label: "Max Posiciones Simultáneas", key: "maxPositions", min: 1, max: 20, value: config.riskControl.maxPositions, unit: "" },
                { label: "Apalancamiento BTC/ETH", key: "btcEthMaxLeverage", min: 1, max: 20, value: config.riskControl.btcEthMaxLeverage, unit: "x", color: config.riskControl.btcEthMaxLeverage > 5 ? "var(--danger)" : "var(--success)" },
                { label: "Apalancamiento Altcoins", key: "altcoinMaxLeverage", min: 1, max: 10, value: config.riskControl.altcoinMaxLeverage, unit: "x", color: config.riskControl.altcoinMaxLeverage > 3 ? "var(--danger)" : "var(--success)" },
                { label: "Uso Máximo de Margen", key: "maxMarginUsage", min: 0.1, max: 1, value: config.riskControl.maxMarginUsage, unit: "%", step: 0.05, displayValue: `${(config.riskControl.maxMarginUsage * 100).toFixed(0)}%` },
                { label: "Tamaño Mínimo Posición", key: "minPositionSize", min: 5, max: 100, value: config.riskControl.minPositionSize, unit: " USDT" },
                { label: "Min Risk/Reward Ratio", key: "minRiskRewardRatio", min: 0.5, max: 5, value: config.riskControl.minRiskRewardRatio, unit: ":1", step: 0.1 },
                { label: "Confianza Mínima IA", key: "minConfidence", min: 0.1, max: 1, value: config.riskControl.minConfidence, unit: "%", step: 0.05, displayValue: `${(config.riskControl.minConfidence * 100).toFixed(0)}%` },
              ].map((param) => (
                <div key={param.key} className="glass-card p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[var(--text-secondary)]">{param.label}</span>
                    <span className="font-bold font-mono" style={{ color: param.color }}>
                      {param.displayValue || `${param.value}${param.unit}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step || 1}
                    value={param.value}
                    onChange={(e) => setConfig((prev) => ({
                      ...prev,
                      riskControl: { ...prev.riskControl, [param.key]: Number(e.target.value) },
                    }))}
                    className="w-full accent-[var(--brand-500)]"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Prompt Builder */}
          {activeSection === "prompts" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <h3 className="text-lg font-semibold">Prompt Builder</h3>
              <p className="text-sm text-[var(--text-tertiary)]">
                Personaliza las instrucciones que el agente IA seguirá al analizar el mercado.
              </p>

              {[
                { key: "roleDefinition", label: "Definición del Rol", placeholder: "Define quién es el agente y cuál es su objetivo..." },
                { key: "tradingFrequency", label: "Frecuencia de Trading", placeholder: "Describe la frecuencia de operación deseada..." },
                { key: "entryStandards", label: "Estándares de Entrada", placeholder: "Criterios para abrir posiciones..." },
                { key: "decisionProcess", label: "Proceso de Decisión", placeholder: "Pasos que debe seguir el agente..." },
              ].map((field) => (
                <div key={field.key} className="glass-card p-4">
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">{field.label}</label>
                  <textarea
                    rows={3}
                    className="input-field text-sm resize-none font-mono"
                    placeholder={field.placeholder}
                    value={(config.promptSections as any)?.[field.key] || ""}
                    onChange={(e) => setConfig((prev) => ({
                      ...prev,
                      promptSections: { ...prev.promptSections, [field.key]: e.target.value },
                    }))}
                  />
                </div>
              ))}

              <div className="glass-card p-4">
                <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Prompt Personalizado (Opcional)</label>
                <textarea
                  rows={4}
                  className="input-field text-sm resize-none font-mono"
                  placeholder="Añade instrucciones adicionales que se inyectarán en el prompt del agente..."
                  value={config.customPrompt || ""}
                  onChange={(e) => setConfig((prev) => ({ ...prev, customPrompt: e.target.value }))}
                />
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  Variables disponibles: {"{pair}"}, {"{indicators}"}, {"{timeframe}"}, {"{balance}"}, {"{positions}"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Preview Panel */}
        <div className="lg:col-span-4 glass-card p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-sm">👁️</div>
            <div>
              <h3 className="font-semibold text-sm">Vista Previa del Prompt</h3>
              <p className="text-xs text-[var(--text-tertiary)]">Así verá el agente IA la configuración</p>
            </div>
          </div>

          <div className="space-y-3 text-xs font-mono">
            {/* Config Summary */}
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div className="text-[var(--text-tertiary)] mb-1">// CONFIGURACIÓN</div>
              <div className="text-[var(--text-secondary)]">
                <div>Monedas: <span className="text-[var(--brand-400)]">{config.coinSource.staticCoins.join(", ") || "Ninguna"}</span></div>
                <div>Timeframe: <span className="text-[var(--accent-400)]">{config.indicators.klines.primaryTimeframe}</span></div>
                <div>Indicadores: <span className="text-[var(--success)]">
                  {INDICATORS.filter((i) => (config.indicators as any)[i.id]).map((i) => i.name).join(", ") || "Ninguno"}
                </span></div>
                <div>Max Posiciones: <span className="text-[var(--warning)]">{config.riskControl.maxPositions}</span></div>
              </div>
            </div>

            {/* System Prompt Preview */}
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div className="text-[var(--text-tertiary)] mb-1">// SYSTEM PROMPT</div>
              <div className="text-[var(--text-secondary)] whitespace-pre-wrap text-[11px]">
                {config.promptSections?.roleDefinition || "Sin definir"}
              </div>
            </div>

            {/* Risk Summary */}
            <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
              <div className="text-[var(--text-tertiary)] mb-1">// RISK CONTROL</div>
              <div className="text-[var(--text-secondary)]">
                <div>BTC/ETH Leverage: <span className={config.riskControl.btcEthMaxLeverage > 5 ? "text-[var(--danger)]" : "text-[var(--success)]"}>
                  {config.riskControl.btcEthMaxLeverage}x
                </span></div>
                <div>Alt Leverage: <span className={config.riskControl.altcoinMaxLeverage > 3 ? "text-[var(--danger)]" : "text-[var(--success)]"}>
                  {config.riskControl.altcoinMaxLeverage}x
                </span></div>
                <div>Margin Usage: {(config.riskControl.maxMarginUsage * 100).toFixed(0)}%</div>
                <div>Min Confianza: {(config.riskControl.minConfidence * 100).toFixed(0)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
