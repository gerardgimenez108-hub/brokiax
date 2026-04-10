# Plan de implementación, prioridad 1

Fecha: 2026-04-10
Objetivo: empezar ejecución real sobre el cuello de botella principal de Brokiax.

## Prioridad elegida

### Strategy contract + performance

Porque es el punto donde más valor se gana por unidad de esfuerzo.

## Qué significa exactamente

## Bloque A. Strategy contract

### Meta
Definir una única fuente de verdad para estrategia que use todo el sistema.

### Debe cubrir
- tipos compartidos
- validación
- defaults
- compatibilidad UI/API
- persistencia
- consumo por engine/backtest

### Resultado esperado
- menos bugs silenciosos
- menos transformaciones ad hoc
- más facilidad para plantillas y evolución

## Bloque B. Performance

### Meta
Hacer defendible la base de métricas.

### Debe cubrir
- realized PnL
- unrealized PnL
- equity
- drawdown
- consistencia de reporting base

### Resultado esperado
- dashboard más creíble
- base mejor para backtest
- menos riesgo reputacional

## Orden recomendado de ejecución

### Paso 1
Mapear todos los tipos y transforms actuales de estrategia.

### Paso 2
Definir contrato canónico único.

### Paso 3
Hacer que API, UI y engine lean/escriban ese contrato.

### Paso 4
Revisar performance y aislar cálculo de métricas clave.

### Paso 5
Añadir tests mínimos de consistencia sobre strategy contract y métricas.

## Definition of done realista

## Strategy contract listo cuando
- existe un tipo canónico único
- UI y API no divergen en campos críticos
- engine y backtest consumen la misma forma
- hay validación clara de inputs

## Performance lista cuando
- equity y PnL están separados correctamente
- dashboard no mezcla señales bonitas con cifras dudosas
- hay trazabilidad mínima del cálculo

## Qué no meter aún
- más features nuevas
- más capas multiagente
- más polish visual sin tocar verdad del sistema

## Recomendación operativa

El siguiente paso ideal es abrir esta implementación ya en el repo y atacar primero:

1. inventario de strategy types actuales
2. diseño del contrato canónico
3. revisión de performance.ts y dashboard API

## Criterio

Si al acabar este bloque Brokiax es menos espectacular pero más sólido, vamos bien.
Si es más espectacular pero igual de ambiguo, vamos mal.
