# Auditoría técnica core, Brokiax

Fecha: 2026-04-10
Proyecto: `/home/ge/Coding/Brokiax`

## Objetivo

Evaluar el núcleo técnico de Brokiax con criterio de producto serio, no de demo bonita.

## Veredicto corto

Brokiax ya tiene un core real. No está en fase de maqueta. Pero ese core todavía necesita consolidación para soportar crecimiento, confianza y narrativa pública fuerte.

## Qué sí está a favor del proyecto

### 1. Hay un engine real
Existe una capa de ejecución real con:
- engine
- performance
- execution
- indicators
- dashboard API
- strategy types

Eso ya te saca de la zona de “UI con humo”.

### 2. La arquitectura tiene dirección de plataforma
No parece un hack puntual. Se nota intención de construir:
- producto con varias superficies
- capa de trading reutilizable
- dashboard con estado del sistema
- runtime plan para evolucionar arquitectura

### 3. El proyecto compila
La build sigue levantando, lo cual es una señal mínima pero importante en un proyecto con tanta superficie.

## Riesgos técnicos principales

### 1. El core está muy cargado de responsabilidades
El patrón que sigo viendo es que el núcleo hace demasiado a la vez:
- contexto de mercado
- decisiones
- estado de traders
- risk/execution
- métricas
- dashboard

Eso da velocidad al principio, pero si no se modulariza mejor, crece la fragilidad.

### 2. Métricas, equity y performance siguen siendo una línea roja
Aunque ya existe una capa de `performance`, este sigue siendo uno de los puntos donde más fácilmente puedes perder credibilidad.

Para Brokiax, la diferencia entre “interesante” y “serio” pasa por:
- PnL correcto
- equity trazable
- realized vs unrealized claro
- drawdown serio
- separación limpia de live/paper/backtest

### 3. Backtest y execution siguen siendo riesgo reputacional
El problema no es tenerlos. El problema es venderlos antes de que estén blindados.

Si el backtest es visualmente potente pero cuantitativamente flojo, el producto se vuelve vulnerable.

### 4. Strategy contract
Sigo viendo que la estrategia es un punto de alto acoplamiento y posible inestabilidad si no se protege bien el contrato entre:
- UI
- persistencia
- engine
- validación

## Qué haría ya en el núcleo

## Prioridad 1. Strategy contract único
Una única fuente de verdad para estrategia.

### Qué resuelve
- bugs silenciosos
- inconsistencias UI/API
- deuda de evolución
- más facilidad para plantillas, validación y backtest

## Prioridad 2. Endurecer performance
Esta es probablemente la mayor palanca de credibilidad técnica.

### Qué resuelve
- confianza de usuario
- coherencia del dashboard
- base para backtest serio
- reporting y comparativas fiables

## Prioridad 3. Separar mejor engine y servicios
Hay que poder pensar el core como piezas:
- market context
- decision orchestration
- risk gate
- execution
- metrics update
- persistence

## Prioridad 4. Trazabilidad
En un producto así, cada decisión importante debería poder responder:
- qué vio el sistema
- qué decidió la IA
- qué bloqueó el sistema
- qué se ejecutó de verdad

## Conclusión técnica

Brokiax no necesita otra capa de features locas ahora mismo.
Necesita consolidar el motor y hacer defendible lo que ya promete.

Ese es el camino correcto.
