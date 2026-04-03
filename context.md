# Brokiax — Documentación Técnica Completa

> **Brokiax** es una Progressive Web App (PWA) SaaS de trading con inteligencia artificial. Permite a los usuarios crear agentes de trading autónomos que operan en exchanges de criptomonedas, usando múltiples modelos de IA (LLMs) para analizar el mercado y tomar decisiones de compra/venta.

---

## 1. Visión General del Producto

### 1.1 Qué es Brokiax

Brokiax es una plataforma donde los usuarios pueden:

1. **Crear Traders IA autónomos**: Cada trader combina un modelo de IA + un exchange + una estrategia personalizada (11 estrategias nativas integradas).
2. **Operar en múltiples exchanges** (Binance, Bybit, OKX, Bitget, Hyperliquid, etc.) simultáneamente mediante un adaptador unificado.
3. **Usar múltiples LLMs** (GPT-4o, Claude 3.5, DeepSeek V3, Gemini 2.5, Qwen, Grok, Kimi, MiniMax) para análisis y decisiones.
4. **Protocolo x402**: Soporte dual de Auth (API Key clásico y pagos flash/x402 en Web3).
5. **Personalizar estrategias** con un editor visual (Strategy Studio) que configura indicadores técnicos, selección de monedas, control de riesgo (trailing stops, partial TP, max drawdown) y prompts.
6. **Debatir con múltiples IAs especializadas** (Debate Arena) usando un patrón de "Hedge Fund" (Technical, Sentiment, Risk Manager y Moderator).
7. **AI Arena PvP**: Un leaderboard en tiempo real donde diferentes LLMs compiten gestionando operaciones de forma autónoma.
8. **Backtest Lab**: Simular con datos históricos antes de operar con dinero real.
9. **Monitorizar en tiempo real** el rendimiento de todos los traders desde un dashboard unificado.

### 1.2 Modelo de Negocio (SaaS con suscripciones)

| Feature                  | Starter (Gratis) | Pro ($29/mes)       | Elite ($99/mes)     |
| ------------------------ | ----------------- | ------------------- | ------------------- |
| Traders simultáneos      | 1                 | 5                   | Ilimitado           |
| Exchanges conectados     | 1                 | 3                   | Ilimitado           |
| Modelos IA               | GPT-4o, DeepSeek  | Todos               | Todos               |
| Strategy Studio          | Básico            | Avanzado            | Avanzado            |
| Backtest Lab             | ❌                | ✅                  | ✅                  |
| Debate Arena             | ❌                | 2 LLMs              | 4 LLMs              |
| Datos cuantitativos      | ❌                | ❌                  | ✅                  |
| Historial                | 30 días           | 90 días             | Ilimitado           |

### 1.3 Repositorios de Referencia

El proyecto se basa en la adaptación de código de estos repositorios open-source:

| Repositorio | URL | Uso |
|---|---|---|
| **nofx** | https://github.com/gerardgimenez108-hub/nofx | Repo principal de referencia. Backend en Go + frontend en React/Vite. Adaptamos: Strategy Studio, tipos de estrategia, dashboard, componentes de edición (CoinSourceEditor, IndicatorEditor, RiskControlEditor, PromptSectionsEditor). |
| **open-nof1.ai** | https://github.com/gerardgimenez108-hub/open-nof1.ai | Multi-agent trading framework. |
| **OpenNof1** | https://github.com/gerardgimenez108-hub/OpenNof1 | Implementación alternativa del framework de trading. |

Los repos están clonados localmente en `.refs/nofx`, `.refs/open-nof1`, `.refs/OpenNof1`.

---

## 2. Stack Tecnológico

### 2.1 Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| **Next.js** | 16.2.1 | Framework principal (App Router, SSR, API Routes) |
| **React** | 19.2.4 | Librería de UI |
| **TypeScript** | 5.x | Tipado estático |
| **Tailwind CSS** | 4.x | Utility-first CSS con PostCSS |
| **shadcn/ui** | 4.1.0 | Componentes de UI base (Button, Card, Input, Avatar, Tabs, etc.) |
| **Recharts** | 3.8.1 | Gráficos (complemento a SVG custom) |
| **Lucide React** | 1.7.0 | Iconos SVG |
| **Zustand** | 5.0.12 | Estado global (planificado) |
| **tw-animate-css** | 1.4.0 | Animaciones CSS |
| **next-pwa** | 5.6.0 | Service Worker y manifest PWA |

### 2.2 Backend / Servicios

| Tecnología | Uso |
|---|---|
| **Firebase Auth** | Autenticación (Google OAuth, Email/Password, Anónimo) |
| **Cloud Firestore** | Base de datos NoSQL (usuarios, traders, keys, estrategias, trades) |
| **Firebase Hosting** | Hosting con Web Frameworks (SSR via Cloud Functions) |
| **Firebase Analytics** | Métricas de uso |
| **Next.js API Routes** | Endpoints REST para CRUD de datos |
| **MCP Server** | Context Protocol Server (Claude/Cursor external connection) |

### 2.3 Trading Engine (en desarrollo)

| Tecnología | Versión | Uso |
|---|---|---|
| **CCXT** | 4.5.45 | Wrapper unificado para exchanges de criptomonedas |
| **Vercel AI SDK** | 6.0.138 | Interfaz unificada para llamadas a LLMs |
| **OpenRouter** | 2.3.3 | Provider de IA multi-modelo |
| **Stripe** | 20.4.1 | Pagos y suscripciones |

### 2.4 Seguridad

| Componente | Implementación |
|---|---|
| **Cifrado de API Keys** | AES-256-GCM (`lib/crypto/keys.ts`) |
| **Multi-tenant** | Subcolecciones de Firestore por UID |
| **Auth Guard** | Componente React que protege rutas (`AuthGuard.tsx`) |
| **Fallback resiliente** | `useAuth.tsx` con fallback en memoria si Firestore falla |

---

## 3. Arquitectura del Proyecto

### 3.1 Estructura de Directorios

```
/home/ge/Coding/Atrhrade/
├── public/                         # Assets estáticos (iconos PWA, manifest)
├── informes/                       # Documentación del proyecto
│   ├── Arthrade_prompt_inicial.md  # Prompt original del proyecto
│   ├── task.md                     # Lista de tareas
│   └── context.md                  # ESTE DOCUMENTO
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fuentes, metadata, PWA)
│   │   ├── page.tsx                # Landing page pública
│   │   ├── globals.css             # Design system CSS completo
│   │   ├── (auth)/                 # Grupo de rutas de autenticación
│   │   │   ├── login/page.tsx      # Página de login
│   │   │   └── register/page.tsx   # Página de registro
│   │   ├── (dashboard)/            # Grupo de rutas protegidas
│   │   │   ├── layout.tsx          # Layout con Sidebar + Topbar + AuthGuard
│   │   │   ├── dashboard/page.tsx  # Dashboard principal
│   │   │   ├── traders/
│   │   │   │   ├── page.tsx        # Lista de traders
│   │   │   │   ├── new/page.tsx    # Crear nuevo trader
│   │   │   │   └── [id]/page.tsx   # Detalle de trader individual
│   │   │   ├── strategy/page.tsx   # Strategy Studio (editor visual)
│   │   │   ├── debate/page.tsx     # Debate Arena (multi-LLM consensus)
│   │   │   ├── backtest/page.tsx   # Backtest Lab (simulación histórica)
│   │   │   ├── data/page.tsx       # Market Data (datos en tiempo real)
│   │   │   └── settings/
│   │   │       ├── api-keys/page.tsx       # Gestión de API keys LLM
│   │   │       ├── exchange-keys/page.tsx  # Gestión de exchange keys
│   │   │       └── billing/page.tsx        # Suscripción y planes
│   │   └── api/                    # API Routes (Next.js)
│   │       └── user/
│   │           ├── api-keys/
│   │           │   ├── route.ts          # GET/POST API keys
│   │           │   └── [id]/route.ts     # PUT/DELETE API key
│   │           ├── exchange-keys/
│   │           │   ├── route.ts          # GET/POST exchange keys
│   │           │   └── [id]/route.ts     # PUT/DELETE exchange key
│   │           └── traders/
│   │               ├── route.ts          # GET/POST traders
│   │               └── [id]/route.ts     # PUT/DELETE trader
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx         # Sidebar de navegación principal
│   │   │   ├── Topbar.tsx          # Barra superior con usuario
│   │   │   └── AuthGuard.tsx       # Protección de rutas autenticadas
│   │   └── ui/                     # Componentes shadcn/ui
│   │       ├── avatar.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── tabs.tsx
│   ├── hooks/
│   │   └── useAuth.tsx             # Hook de autenticación con Firebase
│   └── lib/
│       ├── crypto/
│       │   └── keys.ts             # Cifrado AES-256-GCM para API keys
│       ├── firebase/
│       │   ├── client.ts           # Firebase Client SDK (Auth, Firestore, Analytics)
│       │   └── admin.ts            # Firebase Admin SDK (server-side)
│       ├── types/
│       │   ├── types/
│       │   ├── index.ts            # Tipos principales del dominio
│       │   └── strategy.ts         # Tipos de Strategy (adaptados de nofx)
│       ├── x402/
│       │   └── client.ts           # Implementación del cliente x402 (Web3 payments)
│       ├── strategies/
│       │   └── index.ts            # Implementación de las 11 estrategias algorítmicas
│       ├── mcp/
│       │   └── server.ts           # Servidor MCP para integración de IAs externas
│       └── utils.ts                # Utilidades (cn, etc.)
├── .refs/                          # Repos de referencia clonados (gitignored)
│   ├── nofx/                       # nofx repo completo
│   ├── open-nof1/                  # open-nof1.ai repo
│   └── OpenNof1/                   # OpenNof1 repo
├── firebase.json                   # Config de Firebase Hosting
├── .firebaserc                     # Alias de proyecto Firebase
├── package.json                    # Dependencias npm
├── tsconfig.json                   # Config TypeScript
└── next.config.ts                  # Config Next.js
```

### 3.2 Grupos de Rutas (Next.js App Router)

Usamos **Route Groups** de Next.js para organizar las rutas:

- **`(auth)/`** — Rutas públicas de autenticación (`/login`, `/register`). Sin sidebar ni topbar.
- **`(dashboard)/`** — Todas las rutas protegidas. Comparten un layout con `AuthGuard` + `Sidebar` + `Topbar`.
- **`api/`** — API Routes del servidor.

### 3.3 Navegación

La sidebar tiene dos secciones:

**Trading:**
| Ruta | Página | Descripción |
|---|---|---|
| `/dashboard` | Dashboard | Resumen general: equity chart, stats, traders activos, trades recientes |
| `/traders` | Traders | Lista de agentes IA, crear/configurar/start/stop |
| `/strategy` | Strategy Studio | Editor visual de estrategias (monedas, indicadores, riesgo, prompts) |
| `/debate` | Debate Arena | Multi-LLM debate con roles especializados (Technical, Sentiment, Risk) |
| `/arena` | AI Arena PvP | Leaderboard (Premium) de LLMs compitiendo en PnL y Operaciones |
| `/backtest` | Backtest Lab | Simulación con datos históricos |
| `/data` | Market Data | Datos de mercado en tiempo real |

**Configuración:**
| Ruta | Página | Descripción |
|---|---|---|
| `/settings/api-keys` | API Keys | Gestión de claves de proveedores LLM |
| `/settings/exchange-keys` | Exchange Keys | Gestión de claves de exchanges |
| `/settings/billing` | Suscripción | Planes y facturación Stripe |

---

## 4. Sistema de Tipos (TypeScript)

### 4.1 Tipos Principales (`lib/types/index.ts`)

#### Usuarios y Planes
```typescript
type PlanTier = "starter" | "pro" | "elite";

interface User {
  uid: string;
  email: string;
  displayName: string;
  plan: PlanTier;
  stripeCustomerId?: string;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: Timestamp;
}

// Cada plan tiene límites definidos en PLAN_LIMITS
// ej: starter.maxTraders = 1, pro.maxTraders = 5, elite = Infinity
```

#### API Keys (cifradas)
```typescript
type LLMProvider = "openrouter" | "openai" | "anthropic" | "deepseek" | "gemini" | "grok" | "qwen";

interface ApiKey {
  id: string;
  name: string;
  provider: LLMProvider;
  encryptedKey: string;  // Cifrado AES-256-GCM
  iv: string;            // Vector de inicialización
}
```

#### Exchange Keys (cifradas)
```typescript
type ExchangeId = "binance" | "bybit" | "okx" | "bitget" | "kucoin" | "gate" | "hyperliquid" | "aster" | "lighter";

interface ExchangeKey {
  id: string;
  name: string;
  exchange: ExchangeId;
  encryptedApiKey: string;
  encryptedApiSecret: string;
  iv: string;
  sandbox: boolean;
}
```

#### Traders (agentes IA)
```typescript
type TraderStatus = "active" | "stopped" | "error" | "paused";

interface Trader {
  id: string;
  name: string;
  status: TraderStatus;
  mode: "live" | "paper";       // Paper trading vs real
  llmProviderId: string;        // Ref a ApiKey
  exchangeKeyId: string;        // Ref a ExchangeKey
  strategyId: string;           // Ref a StrategyConfig
  pairs: string[];              // Ej: ["BTC/USDT", "ETH/USDT"]
  intervalMinutes: number;      // Ciclo de ejecución (ej: 15 min)
  totalPnl?: number;
  openPositions: number;
}
```

### 4.2 Tipos de Estrategia (`lib/types/strategy.ts`, adaptados de nofx)

```typescript
interface StrategyConfig {
  strategyType: 'ai_trading' | 'grid_trading';
  coinSource: CoinSourceConfig;        // Qué monedas operar
  indicators: IndicatorConfig;         // Qué datos técnicos recibir
  riskControl: RiskControlConfig;      // Límites de riesgo
  promptSections?: PromptSectionsConfig; // Instrucciones para la IA
  customPrompt?: string;               // Prompt personalizado adicional
  gridConfig?: GridStrategyConfig;     // Config para grid trading
}

interface CoinSourceConfig {
  sourceType: 'static' | 'ranking' | 'mixed';
  staticCoins: string[];       // Ej: ["BTC/USDT", "ETH/USDT"]
  excludedCoins: string[];
}

interface IndicatorConfig {
  klines: KlineConfig;         // Timeframes y velas
  enableEma: boolean;          // Media Móvil Exponencial
  enableMacd: boolean;         // MACD
  enableRsi: boolean;          // RSI
  enableAtr: boolean;          // ATR
  enableBoll: boolean;         // Bollinger Bands
  enableVolume: boolean;       // Volumen
  enableOi: boolean;           // Open Interest
  enableFundingRate: boolean;  // Funding Rate
  emaPeriods: number[];        // Ej: [20, 50]
  rsiPeriods: number[];        // Ej: [14]
}

interface RiskControlConfig {
  maxPositions: number;               // Max posiciones simultáneas
  btcEthMaxLeverage: number;          // Apalancamiento BTC/ETH
  altcoinMaxLeverage: number;         // Apalancamiento altcoins
  maxMarginUsage: number;             // Uso máximo de margen (0-1)
  minPositionSize: number;            // Min tamaño posición en USDT
  minRiskRewardRatio: number;         // Min ratio riesgo/beneficio
  minConfidence: number;              // Min confianza IA (0-1)
}

interface PromptSectionsConfig {
  roleDefinition?: string;        // "Eres un agente de trading experto..."
  tradingFrequency?: string;      // "Opera de forma moderada..."
  entryStandards?: string;        // "Solo abre posiciones cuando..."
  decisionProcess?: string;        // "1. Analiza tendencia general..."
}
```

---

## 5. Páginas y Features en Detalle

### 5.1 Landing Page (`/`)

- **Diseño premium** con glassmorphism, gradientes y animaciones
- Hero section con CTA principal
- Sección de features (Multi-LLM, Multi-Exchange, Strategy Studio, etc.)
- Tabla de precios (Starter/Pro/Elite)
- Footer con links

### 5.2 Dashboard (`/dashboard`)

- **Gráfico de equity SVG** con curva de rendimiento del portfolio
- **Stats grid**: Traders activos, Capital total, P&L, Posiciones abiertas
- **Traders activos**: Cards con estado en vivo (modelo IA, exchange, PnL)
- **Trades recientes**: Lista con razonamiento IA de cada decisión
- Selectores de período (7d/30d/90d/Todo)

### 5.3 Strategy Studio (`/strategy`)

**Inspirado directamente en nofx `StrategyStudioPage.tsx` (1158 líneas).**

Layout de 3 columnas:

1. **Navegación vertical** (izquierda): Selección de monedas, Indicadores, Control de riesgo, Prompt Builder + selector de timeframe
2. **Editor central**: Contenido según sección activa:
   - **Monedas**: Grid de 12 pares seleccionables (BTC, ETH, SOL, XRP, BNB, ADA, DOGE, AVAX, LINK, DOT, MATIC, UNI)
   - **Indicadores**: 8 toggles con parámetros (EMA, MACD, RSI, ATR, Bollinger, Volumen, OI, Funding Rate)
   - **Riesgo**: Sliders para leverage, margin usage, position size, confidence, risk/reward ratio
   - **Prompts**: Textareas para rol, frecuencia, estándares de entrada, proceso de decisión
3. **Preview** (derecha): Vista en tiempo real de cómo se verá el prompt generado

### 5.4 Debate Arena Especializado (`/debate`)

**Feature ELITE — Estructura de Hedge Fund**.

- Utiliza un patrón tipo **CrewAI**.
- El sistema inyecta datos exactos y delega el análisis simultáneo a **3 Especialistas**:
  - `Technical Analyst`: Centrado puramente en Price Action e Indicadores.
  - `Sentiment Analyst`: Analiza el contexto de mercado, macro y psicología institucional.
  - `Risk Manager`: Audita la volatilidad, drawdown y valida la gestión de capital.
- **Moderador** sintetiza las 3 opiniones y dicta un veredicto mayoritario y unificado.
- Además de interfaz gráfica, está expuesto totalmente vía protocolo **MCP** (`/api/mcp`).

### 5.4.1 AI Arena PvP (`/arena`)

**Feature PRO — Torneo de Agentes (Leaderboard)**.

- Muestra un **Ranking a Tiempo Real** que clasifica a los LLMs (GPT-4o, Claude 3.5, DeepSeek, Qwen) en función de sus resultados de trading.
- Gráficas de Top Ventas, Net P&L%, Win Rate y Operaciones Totales.
- Interface con diseño de Podio Glassmorphism.

### 5.5 Backtest Lab (`/backtest`)

**Feature PRO — No existe en nofx, diseño propio de Brokiax.**

- Selector de: estrategia, par, período (1m/3m/6m/1y), capital inicial
- Botón "Ejecutar Backtest" con spinner y simulación
- **Métricas**: Retorno total, Win Rate, Max Drawdown, Sharpe Ratio
- **Curva de equity SVG** con gradiente y puntos extremos
- **Tabla de trades**: Fecha, par, side, entrada, salida, PnL, razonamiento IA

### 5.6 Market Data (`/data`)

- **Stats globales**: Market Cap, BTC Dominance, Fear & Greed Index, 24h Volume
- **Tabla de mercado**: 10 criptomonedas principales con:
  - Precio actual, cambio 24h, volumen, market cap
  - **Sparkline SVG** (gráfico mini de 7 días)
  - Ordenación por columna
- Buscador de monedas con filtro en tiempo real

### 5.7 Traders (`/traders`)

- **Lista de traders** creados con status badges (active/stopped/error)
- **Crear trader** (`/traders/new`): Form con nombre, exchange, modelo IA, pares, modo (live/paper)
- **Detalle de trader** (`/traders/[id]`): Historial de decisiones, posiciones abiertas, métricas

### 5.8 Settings

- **API Keys** (`/settings/api-keys`): CRUD de API keys de proveedores LLM con cifrado AES-256-GCM
- **Exchange Keys** (`/settings/exchange-keys`): CRUD de claves de exchanges con cifrado
- **Billing** (`/settings/billing`): Cards de planes con features, badge de plan actual, botones de upgrade

---

## 6. Design System

### 6.1 Variables CSS (`globals.css`)

El design system usa CSS custom properties para un tema dark premium:

```css
:root {
  --bg-primary: #0a0a0f;       /* Fondo principal */
  --bg-secondary: #12121a;     /* Cards y superficies */
  --bg-elevated: #1a1a2e;      /* Elementos elevados */
  --bg-hover: #1f1f35;         /* Hover states */
  
  --text-primary: #e8e8f0;     /* Texto principal */
  --text-secondary: #9898b0;   /* Texto secundario */
  --text-tertiary: #5a5a78;    /* Texto terciario */
  
  --brand-300 → --brand-900;   /* Paleta de marca (azul-violeta) */
  --accent-300 → --accent-900; /* Paleta de acento (cyan-turquesa) */
  
  --success: #10b981;          /* Verde para ganancias */
  --danger: #ef4444;           /* Rojo para pérdidas */
  --warning: #f59e0b;          /* Amarillo para alertas */
  
  --border-primary: rgba(255, 255, 255, 0.06);
  --border-secondary: rgba(255, 255, 255, 0.12);
  
  --sidebar-width: 260px;
  --topbar-height: 64px;
}
```

### 6.2 Clases Utilitarias

```css
.glass-card     /* Glassmorphism card con backdrop-blur */
.btn-primary    /* Botón principal con gradiente y glow */
.btn-secondary  /* Botón secundario con borde */
.btn-danger     /* Botón de acción destructiva */
.input-field    /* Input estilizado con bordes y focus */
.animate-fade-in, .animate-slide-up, .animate-slide-in  /* Animaciones */
```

---

## 7. Firebase — Configuración

### 7.1 Proyecto Firebase

```
Project ID: brokiax
Auth Domain: brokiax.firebaseapp.com
Storage Bucket: brokiax.firebasestorage.app
Messaging Sender ID: 768878779877
App ID: 1:768878779877:web:2d12668e3082172617e30c
Measurement ID: G-36DXD05R3Z
```

### 7.2 Métodos de Autenticación Habilitados

- ✅ Google OAuth
- ✅ Email / Password
- ✅ Anónimo

### 7.3 Estructura de Firestore

```
users/{uid}
├── email, displayName, plan, stripeCustomerId, ...
├── apiKeys/{keyId}           → { name, provider, encryptedKey, iv }
├── exchangeKeys/{keyId}      → { name, exchange, encryptedApiKey, ... }
├── traders/{traderId}        → { name, status, mode, pairs, ... }
│   └── trades/{tradeId}      → { side, symbol, amount, reasoning, ... }
├── strategies/{strategyId}   → { name, coinSource, indicators, ... }
└── metrics/{metricId}        → { timestamp, totalValue, pnl, ... }
```

### 7.4 Variables de Entorno

```bash
# Firebase Client (NEXT_PUBLIC_*)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBmYv3K1dKPi_oogXtBfgv3WrMtDxLuE48
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=brokiax.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=brokiax

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=brokiax
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@brokiax.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Encryption
ENCRYPTION_KEY=<64-char-hex-string>  # 32 bytes para AES-256-GCM

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 8. API Routes

Todas las API routes usan Firebase Admin SDK (lazy-loaded) y están marcadas con `force-dynamic`:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/user/api-keys` | Listar API keys del usuario |
| `POST` | `/api/user/api-keys` | Crear nueva API key (cifrada) |
| `PUT` | `/api/user/api-keys/[id]` | Actualizar API key |
| `DELETE` | `/api/user/api-keys/[id]` | Eliminar API key |
| `GET` | `/api/user/exchange-keys` | Listar exchange keys |
| `POST` | `/api/user/exchange-keys` | Crear exchange key (cifrada) |
| `PUT` | `/api/user/exchange-keys/[id]` | Actualizar exchange key |
| `DELETE` | `/api/user/exchange-keys/[id]` | Eliminar exchange key |
| `GET` | `/api/user/traders` | Listar traders |
| `POST` | `/api/user/traders` | Crear nuevo trader |
| `PUT` | `/api/user/traders/[id]` | Actualizar trader |
| `DELETE` | `/api/user/traders/[id]` | Eliminar trader |

### Patrón de autenticación en API routes:

```typescript
const authHeader = request.headers.get("Authorization");
const token = authHeader?.split("Bearer ")[1];
const decodedToken = await getAuth().verifyIdToken(token);
const uid = decodedToken.uid;
// Acceder a subcolección: users/{uid}/apiKeys/...
```

---

## 9. Seguridad

### 9.1 Cifrado de API Keys (`lib/crypto/keys.ts`)

```typescript
// Cifrado: AES-256-GCM
// Key: 32 bytes desde ENCRYPTION_KEY (hex string de 64 chars)
// IV: 12 bytes aleatorios por cada cifrado
// Output: {encrypted: base64, iv: base64}

encrypt(plaintext: string): { encrypted: string; iv: string }
decrypt(encrypted: string, iv: string): string
```

### 9.2 Multi-tenant

- Cada usuario solo puede leer/escribir sus propias subcolecciones (`users/{uid}/*`)
- Los API routes verifican el token JWT y extraen el UID
- No hay datos compartidos entre usuarios

### 9.3 Fallback Resiliente

El `useAuth.tsx` incluye un mecanismo de fallback: si Firestore devuelve un error de permisos al leer el perfil del usuario, se crea un perfil temporal en memoria para evitar bucles de redirección al login.

---

## 10. Ciclo de Ejecución de un Trader (Arquitectura)

```
[INTERVALO_MINUTOS]
    ↓
1. Obtener datos del exchange (CCXT)
   - Precio actual, posiciones abiertas, balance
   - Velas (klines) según timeframe configurado
    ↓
2. Recopilar indicadores técnicos
   - EMA, MACD, RSI, ATR, Bollinger, Volumen, OI, FR
    ↓  
3. Construir prompt del sistema + prompt del usuario
   - Usar promptSections de la estrategia
   - Inyectar datos de mercado e indicadores
    ↓
4. Enviar a LLM (OpenRouter/Direct)
   - Recibir: { action, symbol, amount_usdt, reasoning, confidence }
    ↓
5. Validar decisión contra Risk Manager
   - ¿Confianza >= minConfidence?
   - ¿Leverage <= maxLeverage?
   - ¿Posiciones < maxPositions?
   - ¿Margin usage < maxMarginUsage?
    ↓
6. Ejecutar orden (si pasa validación)
   - CCXT → exchange.createOrder(...)
   - Guardar trade en Firestore con razonamiento
    ↓
7. Actualizar métricas
   - PnL, equity, posiciones
```

---

## 11. Debate Arena Especializado — Flujo Multi-Agent

```
1. Usuario selecciona mercado (o el Bot MCP recibe el comando explícito vía run_debate)
    ↓
2. Se inyecta contexto global de mercado (Precios, Velas, Market Cap, Indicadores)
    ↓
3. Ejecución paralela de la Terna de Analistas:
   - Technical Analyst elabora su tesis de Chartismo.
   - Sentiment Analyst busca confirmaciones direccionales.
   - Risk Manager aplica reglas severas de protección monetaria.
    ↓
4. Finalización de tareas asíncronas y consolidación.
    ↓
5. Moderador (Votante Final) recibe el análisis especializado de cada uno:
   - Evalúa cada postura ponderando al Risk Manager.
   - Emite decisión final de Consenso y Racionalización unificada.
```

---

## 12. Deploy y Producción

### 12.1 Firebase Hosting

```bash
# Build
npm run build

# Deploy (requiere firebase-tools y plan Blaze)
firebase deploy --only hosting
```

Firebase Hosting usa el soporte experimental de Web Frameworks para manejar SSR y API Routes mediante Cloud Functions automáticamente.

### 12.2 Configuración de Firebase

```json
// firebase.json
{
  "hosting": {
    "source": ".",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "frameworksBackend": {
      "region": "europe-west1"
    }
  }
}
```

```json
// .firebaserc
{
  "projects": {
    "default": "brokiax"
  }
}
```

---

## 13. Estado Actual y Pendientes

### ✅ Completado (Fases 1, 2, 3, 4 y 5)

- [x] Autenticación completa (Google + Email + Anónimo)
- [x] Layout responsivo con sidebar y topbar
- [x] Dashboard con equity chart, stats y trades recientes
- [x] Multi-Trader CRUD y UI
- [x] PWA completa (Soporte offline web manifest, Service Workers)
- [x] Strategy Studio Hub con 11 estrategias nativas integradas
- [x] Soporte Multi-Exchange Dinámico unificado (Binance, Bybit, KuCoin, OKX, Hyperliquid)
- [x] Advanced Risk Manager global (Max Drawdown, Trailing Stop, Partial TP)
- [x] Integración de 8 LLMs Top (DeepSeek, GPT-4o, Claude 3.5, MiniMax, Kimi, Qwen, Gemini, Grok)
- [x] Arquitectura Híbrida: Protocolo nativo de pagos x402 vs API Clásica
- [x] MCP Server expuesto para clientes externos (Cursor/Claude Desktop)
- [x] Debate Arena (Patrón CrewAI: Technical, Sentiment, Risk + Moderador)
- [x] AI Arena PvP (Leaderboards y rendimiento por proveedor)
- [x] Backtest Lab con métricas y curva de equity
- [x] Configuración de reglas (Firebase y Typescript build check pasados satisfactoriamente)
- [x] **Long Term Memory & RAG**: Vercel AI SDK usando histórico real nativo (`src/app/api/chat/trader`) como contexto.
- [x] **Chat-With-History**: `TraderMemoryChat` inyectado en Dashboard de Traders.
- [x] **Alarma Webhook**: Módulo Telegram Alert vinculado (`/api/webhooks/telegram`), activado.
- [x] **Integración DEX**: Trading sin API Keys, con Agent Wallets para Hyperliquid y Aster DEX.
- [x] **Sales Funnel & Landing Page**: Pricing integrado. **Lead Magnet**: el backend está 100% implementado (generación de PDF con `pdfkit` + envío automático con Resend en `/api/leads/route.ts`), pero el componente UI fue **eliminado de la landing page** porque Resend requiere verificar un dominio propio (DNS) para enviar emails. Una vez verificado el dominio, solo hay que volver a añadir el componente `<LeadMagnet />` en `page.tsx`.
- [x] **Redesign v2 — Indigo Brand System**: Rediseño completo de la plataforma con acento indigo/violet. Landing page con Social Proof, testimonios, terminal mockup, FAQ accordion, footer con status badge. Sidebar con left-border indicator en item activo, Topbar con badges de plan coloreados por tier. Auth pages con gradientes indigo.

### 🔲 Pendiente (Futuras Fases)

- [ ] **Trading Engine Crontab**: Encender la ejecución continua recurrente real e invocación.
- [ ] **Stripe Checkout**: Integrar Webhooks post-pago y limitación de SaaS reales.
- [ ] **Lead Magnet — Reactivación**: Registrar dominio propio (ej: `brokiax.com`), configurar DNS en Resend, y re-añadir `<LeadMagnet />` en la landing page (`src/app/page.tsx`). El código backend ya está listo.

---

## 14. Comandos Útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Deploy a Firebase
firebase deploy --only hosting

# Clonar repos de referencia
git clone --depth 1 https://github.com/gerardgimenez108-hub/nofx.git .refs/nofx

# Lint
npm run lint
```
