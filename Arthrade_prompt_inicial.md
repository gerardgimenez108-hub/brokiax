# AI Trading SaaS Platform

> Instrucciones completas para construir esta aplicación desde cero.
> Lee este documento entero antes de escribir una sola línea de código.

---

## 🎯 Qué estamos construyendo

Una **plataforma SaaS web** donde los usuarios pagan una suscripción mensual para que **agentes LLM** operen en mercados de criptomonedas en su nombre.

El modelo de negocio clave es **BYOK (Bring Your Own Key)**: el usuario trae su propia API key de [OpenRouter](https://openrouter.ai) (o directamente de OpenAI/Anthropic). Nosotros guardamos esa key cifrada y la usamos para ejecutar el agente. El usuario paga tokens a OpenRouter directamente — nosotros cobramos la suscripción a la plataforma.

**Inspiración y código de referencia:**
- [`open-nof1.ai`](https://github.com/gerardgimenez108-hub/open-nof1.ai) — Base principal. Next.js 15 + Vercel AI SDK + CCXT. Licencia MIT ✅
- [`OpenNof1`](https://github.com/gerardgimenez108-hub/OpenNof1) — Referencia para arquitectura backend/frontend separada
- [`nofx`](https://github.com/gerardgimenez108-hub/nofx) — Referencia para features avanzadas (Strategy Studio, Debate Arena, Backtest)

---

## 🛠️ Stack tecnológico

### Frontend
- **Next.js 15** con App Router
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **shadcn/ui** para componentes
- **Recharts** para gráficos de trading
- **Zustand** para estado global

### Backend / BaaS
- **Firebase Auth** — autenticación (Google OAuth + email/password)
- **Firestore** — base de datos principal
- **Firebase Cloud Functions** — lógica de servidor, crons, webhooks
- **Firebase Admin SDK** — en API routes de Next.js

### Pagos
- **Stripe** — suscripciones mensuales
- Webhook de Stripe → Cloud Function → actualiza plan en Firestore

### Trading
- **CCXT** — biblioteca para conectar con exchanges (Binance, Bybit, OKX...)
- **Vercel AI SDK** — orquestación de llamadas LLM

### IA
- **OpenRouter** — proxy que da acceso a 100+ modelos con una sola API
- También soporte directo para: OpenAI, Anthropic, DeepSeek, Google Gemini

---

## 📁 Estructura de carpetas

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← sidebar + navbar
│   │   ├── dashboard/page.tsx      ← P&L, posiciones abiertas, chart
│   │   ├── agents/
│   │   │   ├── page.tsx            ← lista de agentes del usuario
│   │   │   └── [id]/page.tsx       ← detalle de un agente
│   │   ├── strategy/page.tsx       ← Strategy Studio
│   │   ├── backtest/page.tsx       ← Backtest Lab
│   │   └── settings/
│   │       ├── page.tsx            ← configuración general
│   │       ├── api-keys/page.tsx   ← gestión de API keys (LLM + exchange)
│   │       └── billing/page.tsx    ← plan, facturas
│   ├── api/
│   │   ├── webhooks/stripe/route.ts
│   │   ├── agents/
│   │   │   ├── [id]/run/route.ts   ← POST: ejecuta 1 ciclo del agente
│   │   │   └── [id]/stop/route.ts
│   │   ├── market/
│   │   │   └── prices/route.ts     ← precios en tiempo real via CCXT
│   │   └── cron/
│   │       └── run-agents/route.ts ← disparado por Firebase/Vercel cron
│   └── layout.tsx
├── components/
│   ├── ui/                         ← shadcn/ui auto-generados
│   ├── dashboard/
│   │   ├── EquityChart.tsx
│   │   ├── PositionsTable.tsx
│   │   ├── TradeHistory.tsx
│   │   └── AgentStatusCard.tsx
│   ├── agents/
│   │   ├── AgentCard.tsx
│   │   ├── AgentCreateForm.tsx
│   │   └── AgentLogs.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Topbar.tsx
├── lib/
│   ├── firebase/
│   │   ├── client.ts               ← Firebase client SDK (auth, firestore)
│   │   └── admin.ts                ← Firebase Admin SDK (server-side)
│   ├── trading/
│   │   ├── agent.ts                ← lógica principal del agente LLM
│   │   ├── exchange.ts             ← wrapper CCXT
│   │   ├── market.ts               ← obtención de datos de mercado
│   │   └── risk.ts                 ← gestión de riesgo
│   ├── ai/
│   │   ├── openrouter.ts           ← cliente OpenRouter
│   │   ├── prompt.ts               ← prompts del agente
│   │   └── models.ts               ← lista de modelos disponibles
│   ├── stripe/
│   │   └── client.ts
│   ├── crypto/
│   │   └── keys.ts                 ← cifrado/descifrado de API keys
│   └── types/
│       └── index.ts                ← todos los tipos TypeScript
├── hooks/
│   ├── useAuth.ts
│   ├── useAgent.ts
│   └── useMarketData.ts
├── functions/                      ← Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts
│   │   ├── stripe-webhook.ts
│   │   └── cron-run-agents.ts
│   └── package.json
└── firestore.rules
```

---

## 🔥 Modelo de datos Firestore

### Colección `users/{userId}`
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: 'free' | 'pro' | 'elite';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Colección `users/{userId}/apiKeys/{keyId}`
```typescript
{
  id: string;
  name: string;                    // "Mi OpenRouter key"
  provider: 'openrouter' | 'openai' | 'anthropic' | 'deepseek' | 'gemini';
  encryptedKey: string;            // AES-256-GCM cifrado
  iv: string;                      // vector de inicialización
  createdAt: Timestamp;
  lastUsedAt?: Timestamp;
}
```

### Colección `users/{userId}/exchangeKeys/{keyId}`
```typescript
{
  id: string;
  name: string;                    // "Binance Futures"
  exchange: 'binance' | 'bybit' | 'okx' | 'kraken' | 'hyperliquid';
  encryptedApiKey: string;
  encryptedApiSecret: string;
  iv: string;
  sandbox: boolean;                // true = paper trading
  createdAt: Timestamp;
}
```

### Colección `users/{userId}/agents/{agentId}`
```typescript
{
  id: string;
  name: string;                    // "Mi agente BTC"
  status: 'running' | 'stopped' | 'error';
  
  // Configuración LLM
  llmKeyId: string;                // referencia a apiKeys
  model: string;                   // "openai/gpt-4o", "anthropic/claude-3-5-sonnet"
  systemPrompt?: string;           // prompt personalizado
  
  // Configuración exchange
  exchangeKeyId: string;           // referencia a exchangeKeys
  tradingPairs: string[];          // ["BTC/USDT", "ETH/USDT"]
  
  // Configuración de riesgo
  maxPositionSizePercent: number;  // % del capital por posición (ej: 10)
  stopLossPercent: number;         // ej: 5
  takeProfitPercent: number;       // ej: 15
  maxDailyLossPercent: number;     // circuit breaker
  leverage: number;                // 1 = sin apalancamiento
  
  // Estado
  initialCapital: number;          // USDT al arrancar
  currentValue: number;            // valor actual de la cuenta
  totalPnl: number;
  totalPnlPercent: number;
  
  intervalMinutes: number;         // cada cuántos minutos ejecutar (3, 5, 15)
  lastRunAt?: Timestamp;
  nextRunAt?: Timestamp;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Colección `users/{userId}/agents/{agentId}/trades/{tradeId}`
```typescript
{
  id: string;
  side: 'buy' | 'sell';
  symbol: string;               // "BTC/USDT"
  amount: number;               // en USDT
  price: number;
  reasoning: string;            // chain-of-thought del LLM
  orderId?: string;             // ID en el exchange
  status: 'pending' | 'filled' | 'failed';
  pnl?: number;                 // calculado al cerrar posición
  createdAt: Timestamp;
}
```

### Colección `users/{userId}/agents/{agentId}/metrics/{metricId}`
```typescript
{
  timestamp: Timestamp;
  totalValue: number;           // valor total cuenta en USDT
  pnl: number;
  pnlPercent: number;
  openPositions: number;
  btcPrice?: number;
  ethPrice?: number;
}
```

---

## 🔐 Seguridad de API Keys

**NUNCA guardes API keys en texto plano.** Usa AES-256-GCM con una clave maestra que vive en Firebase Secret Manager o en variables de entorno del servidor.

```typescript
// lib/crypto/keys.ts
import crypto from 'crypto';

const MASTER_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encryptKey(plaintext: string): { encrypted: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([encrypted, authTag]).toString('base64'),
    iv: iv.toString('hex'),
  };
}

export function decryptKey(encrypted: string, ivHex: string): string {
  const iv = Buffer.from(ivHex, 'hex');
  const data = Buffer.from(encrypted, 'base64');
  const authTag = data.slice(-16);
  const encryptedData = data.slice(0, -16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8');
}
```

---

## 🤖 Lógica del Agente LLM

El agente sigue este ciclo en cada ejecución:

```
1. Obtener estado del mercado (precios, OHLCV, volumen, funding rate)
2. Obtener estado de la cuenta (balance, posiciones abiertas, historial)
3. Construir prompt con todo el contexto
4. Llamar al LLM del usuario via OpenRouter
5. Parsear la decisión del LLM (BUY / SELL / HOLD + razonamiento)
6. Validar con Risk Manager (¿supera límites?)
7. Si OK: ejecutar orden via CCXT
8. Guardar trade + métricas en Firestore
```

```typescript
// lib/trading/agent.ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { getMarketState } from './market';
import { getAccountState, executeOrder } from './exchange';
import { buildTradingPrompt } from '../ai/prompt';
import { decryptKey } from '../crypto/keys';
import { validateWithRiskManager } from './risk';

export async function runAgentCycle(agentId: string, userId: string) {
  // 1. Cargar configuración del agente desde Firestore
  const agent = await getAgentFromFirestore(userId, agentId);
  
  // 2. Descifrar keys del usuario
  const llmKey = await getUserApiKey(userId, agent.llmKeyId);
  const plainLlmKey = decryptKey(llmKey.encryptedKey, llmKey.iv);
  
  const exchangeKey = await getUserExchangeKey(userId, agent.exchangeKeyId);
  const plainApiKey = decryptKey(exchangeKey.encryptedApiKey, exchangeKey.iv);
  const plainApiSecret = decryptKey(exchangeKey.encryptedApiSecret, exchangeKey.iv);
  
  // 3. Obtener datos de mercado
  const marketState = await getMarketState(agent.tradingPairs, exchangeKey.exchange, {
    apiKey: plainApiKey,
    secret: plainApiSecret,
    sandbox: exchangeKey.sandbox,
  });
  
  // 4. Obtener estado de la cuenta
  const accountState = await getAccountState({ apiKey: plainApiKey, secret: plainApiSecret });
  
  // 5. Construir prompt y llamar al LLM
  const openrouter = createOpenRouter({ apiKey: plainLlmKey });
  
  const { text } = await generateText({
    model: openrouter(agent.model),
    system: agent.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    prompt: buildTradingPrompt(marketState, accountState, agent),
  });
  
  // 6. Parsear decisión del LLM
  const decision = parseLLMDecision(text);
  
  // 7. Validar con risk manager
  const validation = validateWithRiskManager(decision, accountState, agent);
  
  if (!validation.approved) {
    await logAgentDecision(userId, agentId, { decision, blocked: true, reason: validation.reason, reasoning: text });
    return;
  }
  
  // 8. Ejecutar orden si no es HOLD
  if (decision.action !== 'HOLD') {
    const order = await executeOrder({
      exchange: exchangeKey.exchange,
      apiKey: plainApiKey,
      secret: plainApiSecret,
      symbol: decision.symbol,
      side: decision.action,
      amount: decision.amount,
      sandbox: exchangeKey.sandbox,
    });
    
    // 9. Guardar trade en Firestore
    await saveTrade(userId, agentId, {
      side: decision.action,
      symbol: decision.symbol,
      amount: decision.amount,
      price: order.price,
      reasoning: text,
      orderId: order.id,
      status: 'filled',
    });
  }
  
  // 10. Guardar métricas
  await saveMetrics(userId, agentId, accountState);
}
```

---

## 💬 Prompts del Agente

```typescript
// lib/ai/prompt.ts
export function buildTradingPrompt(market: MarketState, account: AccountState, agent: Agent): string {
  return `
## Estado actual del mercado

${agent.tradingPairs.map(pair => {
  const data = market.pairs[pair];
  return `### ${pair}
- Precio actual: $${data.price}
- Cambio 24h: ${data.change24h}%
- Volumen 24h: $${data.volume24h.toLocaleString()}
- RSI(14): ${data.rsi}
- EMA(20): $${data.ema20}
- EMA(50): $${data.ema50}
- Funding rate: ${data.fundingRate}%`;
}).join('\n\n')}

## Estado de tu cuenta

- Balance disponible: $${account.availableBalance} USDT
- Valor total: $${account.totalValue} USDT
- P&L total: $${account.totalPnl} (${account.totalPnlPercent}%)
- Posiciones abiertas: ${JSON.stringify(account.openPositions, null, 2)}

## Historial reciente (últimos 5 trades)

${account.recentTrades.map(t => `- ${t.side.toUpperCase()} ${t.symbol} a $${t.price} → PnL: $${t.pnl}`).join('\n')}

## Parámetros de riesgo configurados

- Tamaño máximo por posición: ${agent.maxPositionSizePercent}% del capital
- Stop loss: ${agent.stopLossPercent}%
- Take profit: ${agent.takeProfitPercent}%
- Apalancamiento: ${agent.leverage}x

## Tu tarea

Analiza el estado del mercado y decide tu acción. Razona paso a paso.

Responde ÚNICAMENTE en este formato JSON:
{
  "action": "BUY" | "SELL" | "HOLD",
  "symbol": "BTC/USDT",  // si action es HOLD, pon null
  "amount_usdt": 500,    // cantidad en USDT, si es HOLD pon 0
  "reasoning": "Explicación detallada de tu decisión..."
}
`;
}

export const DEFAULT_SYSTEM_PROMPT = `Eres un agente de trading de criptomonedas experto. 
Tu objetivo es maximizar el retorno ajustado al riesgo de la cartera.
Eres disciplinado, sigues tu análisis técnico y nunca sobre-operas.
Siempre priorizas la preservación del capital sobre las ganancias agresivas.
Responde siempre en JSON válido según el formato indicado.`;
```

---

## 💳 Planes de Suscripción

| Feature | FREE | PRO (€29/mes) | ELITE (€79/mes) |
|---------|------|----------------|-----------------|
| Agentes activos | 1 | 3 | Ilimitados |
| Trading real | ❌ (solo paper) | ✅ | ✅ |
| Exchanges | 1 | 3 | Todos |
| Modelos LLM | GPT-3.5 | Todos | Todos |
| Backtest Lab | ❌ | ✅ | ✅ |
| Debate Arena | ❌ | ❌ | ✅ |
| Historial | 7 días | 90 días | Ilimitado |

---

## 🚀 Variables de entorno

```bash
# .env.local

# Firebase (client-side - pueden ser públicas)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-side - NUNCA al cliente)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Cifrado de API keys de usuarios
ENCRYPTION_KEY=   # 64 hex chars = 32 bytes random. Genera con: openssl rand -hex 32

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_ELITE=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=   # secret para proteger el endpoint de cron
```

---

## 📋 Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Un usuario solo puede leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /apiKeys/{keyId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /exchangeKeys/{keyId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /agents/{agentId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        match /trades/{tradeId} {
          allow read: if request.auth != null && request.auth.uid == userId;
          allow write: if false; // Solo el servidor escribe trades
        }
        
        match /metrics/{metricId} {
          allow read: if request.auth != null && request.auth.uid == userId;
          allow write: if false; // Solo el servidor escribe métricas
        }
      }
    }
  }
}
```

---

## 🗂️ Orden de implementación recomendado

### Fase 1 — Fundamentos (Sprint 1-2)

1. `npx create-next-app@latest . --typescript --tailwind --app`
2. Instalar dependencias: `npm install firebase firebase-admin ccxt ai @openrouter/ai-sdk-provider stripe @stripe/stripe-js zustand recharts`
3. Instalar shadcn/ui: `npx shadcn@latest init`
4. Configurar Firebase (Auth + Firestore) en `lib/firebase/client.ts` y `lib/firebase/admin.ts`
5. Implementar páginas de login/register con Firebase Auth
6. Implementar hook `useAuth.ts`
7. Implementar layout del dashboard (sidebar + topbar)
8. Página de Settings > API Keys (formulario para guardar OpenRouter key cifrada)
9. Página de Settings > Exchange Keys (formulario para guardar keys de Binance en sandbox)
10. Implementar cifrado/descifrado en `lib/crypto/keys.ts`

### Fase 2 — Core Trading (Sprint 3-4)

11. Wrapper CCXT en `lib/trading/exchange.ts`
12. Módulo de market data en `lib/trading/market.ts`
13. Cliente OpenRouter en `lib/ai/openrouter.ts`
14. Prompts en `lib/ai/prompt.ts`
15. Lógica del agente en `lib/trading/agent.ts`
16. Risk manager en `lib/trading/risk.ts`
17. API route `POST /api/agents/[id]/run`
18. Página de Agentes (crear, listar, iniciar/parar)
19. Dashboard con EquityChart (usando métricas de Firestore)
20. Cron endpoint `GET /api/cron/run-agents` protegido con `CRON_SECRET`

### Fase 3 — Monetización (Sprint 5)

21. Configurar productos y precios en Stripe Dashboard
22. Webhook de Stripe en `POST /api/webhooks/stripe`
23. Página de Billing con Stripe Customer Portal
24. Enforcement de límites del plan (max agentes, features)
25. Onboarding flow para nuevos usuarios

### Fase 4 — Features Avanzadas (Sprint 6+)

26. Backtest Lab (backtesting con datos históricos de CCXT)
27. Strategy Studio visual
28. Debate Arena (múltiples LLMs debatiendo antes de ejecutar)
29. Alertas por email (Resend o Firebase Extensions)

---

## ⚠️ Notas críticas

1. **Nunca llames a CCXT ni a OpenRouter desde el cliente.** Solo desde API routes de Next.js (server-side) o Cloud Functions. Las API keys de exchange y LLM nunca deben llegar al browser.

2. **El endpoint de cron** (`/api/cron/run-agents`) debe verificar `Authorization: Bearer ${CRON_SECRET}` antes de ejecutar nada.

3. **Paper trading primero.** Por defecto, los nuevos agentes crean con `sandbox: true`. El usuario debe activar explícitamente el trading real (y estar en plan PRO o ELITE).

4. **Rate limiting.** Un usuario en plan FREE no puede ejecutar el agente más de 1 vez cada 15 minutos.

5. **Circuit breaker.** Si el P&L diario del agente supera `maxDailyLossPercent`, parar el agente automáticamente y enviar notificación.

6. **Logging completo.** Cada decisión del LLM (incluyendo el reasoning) debe guardarse en Firestore para auditoría y transparencia con el usuario.

---

## 🔗 Recursos útiles

- [OpenRouter docs](https://openrouter.ai/docs)
- [OpenRouter AI SDK Provider](https://openrouter.ai/docs/frameworks/ai-sdk)
- [CCXT docs](https://docs.ccxt.com)
- [Firebase Admin SDK Node.js](https://firebase.google.com/docs/admin/setup)
- [Stripe subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

*Creado para Claude Opus 4.6 — Empieza por la Fase 1, sigue el orden indicado, y consulta este documento antes de cada decisión de arquitectura.*
