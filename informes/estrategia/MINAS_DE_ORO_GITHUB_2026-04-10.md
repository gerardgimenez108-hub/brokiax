# Minas de oro de GitHub para Brokiax

Fecha: 2026-04-10

## Principio

GitHub debe usarse como ventaja competitiva de desarrollo.
No para copiar a lo bruto, sino para absorber piezas que nos ahorren tiempo y aumenten calidad.

## Repos clave ya conocidos

### nofx
Base conceptual muy valiosa para:
- strategy studio
- tipos de estrategia
- patterns de riesgo
- visión de producto

### open-nof1.ai
Muy útil para:
- patrones de trading con LLM
- market state
- integración de señales y decisión
- simplicidad ejecutable

### OpenNof1
Útil sobre todo como inspiración de framework multiagente y orquestación.

## Qué buscar de forma sistemática

### 1. Indicators / market state
Buscar repos que resuelvan bien:
- indicadores consistentes
- series temporales limpias
- contexto de mercado reutilizable

### 2. Performance / portfolio accounting
Aquí hay una mina enorme. Brokiax necesita piezas o patrones que ayuden a:
- realized/unrealized PnL
- account equity
- position accounting
- trade journal riguroso

### 3. Explainability / logs
Muy útil para diferenciar Brokiax en confianza.

### 4. Quant dashboards
No para copiar UI entera, sino patrones de:
- métricas
- tablas
- estado runtime
- timeline de decisiones

### 5. Backtesting engines o adapters
Aunque no se integren enteros, nos pueden ahorrar lógica y diseño conceptual.

## Regla de adopción

Antes de traer cualquier repo o módulo, responder:

1. ¿nos ahorra tiempo real?
2. ¿encaja con la arquitectura actual?
3. ¿mejora credibilidad o solo añade complejidad?
4. ¿lo podemos mantener?

## Estrategia recomendada

- no construir un Frankenstein
- no importar productos enteros
- sí importar módulos, patrones y decisiones maduras
- documentar qué tomamos de cada repo y por qué

## Criterio de socio

El objetivo no es demostrar que programamos mucho.
El objetivo es llegar antes a un producto excelente.
