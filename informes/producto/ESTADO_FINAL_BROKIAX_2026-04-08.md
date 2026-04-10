# Estado Final de Brokiax

Fecha: 2026-04-08
Proyecto: `/home/ge/Coding/Brokiax`

## 1. Verificación real

Estado verificado sobre el código actual:

- `npm run typecheck`: OK
- `npm run lint`: OK
- `npm run build`: OK

## 2. Qué está listo

### Núcleo técnico

- Build de producción funcional con Next.js 16.
- Contrato de estrategias endurecido con validación y compatibilidad legacy.
- Creación de traders con validación de plan, modelo, estrategia y credenciales.
- Métricas reconstruidas desde ledger de trades: `equity`, `cash`, `allocated capital`, `realized/unrealized PnL`, `win rate`, `drawdown`.
- Capa de indicadores separada y reutilizable.
- Dashboard con datos agregados reales por usuario.
- Stripe conectado en rutas, billing y webhook.
- x402 implementado para uso de modelos sin API key del proveedor LLM.
- Runtime preparado para migración a worker persistente con leases distribuidas y orquestación compartida.
- Heartbeat y estado operativo del runtime persistidos en Firestore y visibles en dashboard.
- Worker puente HTTP listo para despliegue en Cloud Run con `Dockerfile.worker` y guía operativa.
- Cron/auth endurecido en producción (sin `CRON_SECRET` no queda abierto).
- Stripe endurecido (sin `STRIPE_SECRET_KEY` las rutas fallan explícitamente; sin fallback inseguro).
- Validación de API keys endurecida (proveedor estricto y validación de private key x402).

### Producto y UX

- Pricing unificado en una única fuente de verdad: `src/lib/billing/plans.ts`.
- Landing más sobria y alineada con el producto real.
- Disclaimer legal visible y página dedicada en `/legal/disclaimer`.
- Navegación del dashboard reorganizada por bloques operativos.
- Identidad visual más consistente con `BrandMark`.

### Showcase / arena live

- La arena pública ya no depende obligatoriamente de `SHOWCASE_API_KEY_*`.
- Si faltan claves showcase, entra en modo `demo`.
- Si existen claves showcase, usa modo `llm`.
- La API pública ya expone correctamente `showcaseMode`.

## 3. Qué sigue sin estar cerrado

### Trading live wallet-native

No está implementado. A día de hoy:

- `paper`: sí funciona sin exchange key.
- `live`: sigue requiriendo credenciales autenticadas del exchange.
- x402 resuelve acceso a modelos LLM, no ejecución live sin exchange keys.

### Showcase autónomo 24/7

La arena pública ya no depende solo de scheduler externo si despliegas el worker puente incluido:

- `scripts/runtime-worker.mjs`
- `docs/deployment/cloud-run-worker.md`

Si no despliegas ese worker, entonces sí necesita que un scheduler llame a:

- `/api/cron/showcase-trader`

Sin worker o sin scheduler, la showcase no se mantiene sola aunque la UI y el fallback demo estén listos.

### Stripe

La integración está bien planteada, pero falta corregir el entorno:

- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_ELITE`
- `STRIPE_PRICE_ID_ENTERPRISE`

Ahora mismo deben contener `price_...`, no `prod_...`.

## 4. Credenciales que conviene rotar

Si alguna vez se subieron, compartieron o expusieron fuera del entorno local, conviene rotar:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `ADMIN_PRIVATE_KEY`
- `ADMIN_CLIENT_EMAIL`
- `ENCRYPTION_KEY`
- `RESEND_API_KEY`
- `TAVILY_API_KEY`

Notas:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` no es secreta por diseño.
- La configuración pública cliente de Firebase no es una credencial secreta en el mismo sentido que una clave admin.

## 5. Estado PWA

Implementado actualmente:

- `manifest.json`
- `public/sw.js`
- `public/offline.html`
- registro automático del service worker
- botón de instalación desde la UI cuando el navegador lo permite

Conclusión:

La PWA ya está implementada de forma funcional y coherente con el producto actual.

## 6. Deuda prioritaria restante

Orden recomendado:

1. Configurar Stripe con `price_...` reales y probar checkout + webhook end-to-end.
2. Activar scheduler real para `cron/tick` y `cron/showcase-trader`.
3. Mover engine/showcase desde worker puente HTTP a ejecución directa interna en el worker.
4. Añadir observabilidad operativa más profunda: logs estructurados, health checks y alertas.
5. Endurecer más el motor live con tests y simulaciones de error por exchange/provider.
6. Completar rediseño visual de más superficies internas si se quiere una capa enterprise más marcada.

## 7. Veredicto

Brokiax ya no está en estado de demo frágil. Tampoco está todavía en “producción institucional cerrada”.

La situación real es esta:

- sólida para seguir desplegando y probar paper trading de forma seria
- preparada para cerrar Stripe y showcase operativa
- todavía pendiente de más endurecimiento en live ops, observabilidad y pruebas de regresión
