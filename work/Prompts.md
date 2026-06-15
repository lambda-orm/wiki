# Prompts to execute

Orden de ejecución recomendado

Ejecutalos en este orden exacto: 1 → 5 → 2 → 3 → 4 → 6 → 7. El prompt 1 primero para entender qué existe, el 5 para definir la estructura antes de crear contenido, y el 7 siempre al final como validación.
Cada prompt es una sesión independiente de Claude Code. No los encadenés todos en uno solo — es mejor que puedas revisar el resultado de cada uno antes de continuar.

## Prompt 1 — Relevamiento inicial (ejecutar primero siempre)

```txt
Analizá la estructura completa de este proyecto de documentación MkDocs.
Leé el archivo mkdocs.yml y todos los archivos .md en /docs.
Luego dame:
1. Un mapa de la estructura actual de navegación
2. Qué páginas existen y qué cubre cada una
3. Qué links internos están rotos o apuntan a páginas inexistentes
4. Inconsistencias de estilo entre páginas (formato de código, niveles de heading, idioma)

No hagas cambios todavía. Solo el análisis.
```

## Prompt 2 — Página "Why λORM"

```txt
Creá el archivo docs/why-lambdaorm.md con la propuesta de valor de λORM.

La página debe:
- Empezar con el problema que resuelve, no con features técnicas
- Explicar en qué escenarios λORM es superior a Prisma, TypeORM y Sequelize
- Incluir una tabla comparativa con estas columnas:
  Feature | Prisma | TypeORM | Sequelize | λORM
  Las filas deben cubrir: queries cross-database, CQRS por configuración, 
  lenguaje de queries, múltiples motores simultáneos, deploy como REST API, 
  clientes multi-lenguaje
- Tener una sección "Cuándo NO usar λORM" (honestidad genera confianza)
- Terminar con links a Getting Started y a los Labs

Mantené el mismo estilo markdown que tienen las páginas existentes.
Después agregá esta página al mkdocs.yml en la posición correcta, 
antes de Features y después de Home.
```

## Prompt 3 — Página "Getting Started"

```txt
Creá el archivo docs/getting-started.md con un tutorial de cero a query 
funcionando en menos de 10 minutos.

El tutorial debe:
- Usar un caso mínimo: una sola base de datos MySQL, dos entidades simples 
  (Orders y Customers)
- Seguir estos pasos en orden:
  1. Instalación (npm install lambdaorm)
  2. Crear el schema YAML mínimo funcional
  3. Inicializar el ORM
  4. Ejecutar la primera query con include
  5. Ver el resultado esperado
- Mostrar el output exacto que el dev va a ver en su terminal en cada paso
- No mencionar features avanzadas (stages múltiples, CQRS, etc.)
  Solo un camino recto y exitoso
- Al final, links a "Next steps": Usage, Labs, CLI

Revisá la página docs/usage/Usage.md existente para tomar el estilo 
de los ejemplos de código y el formato de los bloques de resultado JSON.
Agregá la página al mkdocs.yml como segunda entrada, después de Home.
```

## Prompt 4 — Página "Architecture Overview"

```txt
Creá el archivo docs/architecture-overview.md que explique el modelo mental 
de λORM antes de entrar en documentación técnica detallada.

La página debe explicar en orden:
1. Los tres niveles: Domain (qué son tus datos), Infrastructure (dónde viven), 
   Queries (cómo los accedés)
2. Qué es un Stage y por qué existe (con un ejemplo simple: mismo dominio, 
   dos configuraciones de infra distintas)
3. Qué es un Mapping y por qué el dominio está desacoplado de las tablas físicas
4. Cómo fluye una query desde el código hasta la base de datos
5. Cómo encajan los modos de consumo (lib, CLI, REST, clients) sobre el mismo core

Para cada concepto: primero una explicación en prosa de 2-3 líneas, 
luego un snippet YAML o código mínimo que lo ilustre.

Revisá docs/schema/SchemaDefinition.md y docs/usage/Usage.md para 
entender los conceptos antes de escribir.
Agregá la página al mkdocs.yml después de Getting Started.
```

## Prompt 5 — Reorganizar la navegación del mkdocs.yml

```txt
Reorganizá el archivo mkdocs.yml para que la navegación siga esta estructura:

1. Home
2. Why λORM          (docs/why-lambdaorm.md)
3. Getting Started   (docs/getting-started.md)
4. Architecture Overview (docs/architecture-overview.md)
5. Query Language    (las páginas existentes de queries, sin cambios)
6. Schema            (las páginas existentes de schema, sin cambios)
7. Usage & Examples  (docs/usage/Usage.md primero, luego Repository y Transaction)
8. Benchmarks        (docs/benchmarks.md — crear placeholder vacío por ahora)
9. CLI               (existente)
10. REST API         (existente)
11. Clients          (existente)
12. Labs             (existente)
13. Changelog        (existente)

No muevas ni renombres archivos existentes. Solo cambiá el orden y 
la estructura en mkdocs.yml. Verificá que todos los paths de archivos 
referenciados existan realmente.
```

## Prompt 6 — Scripts de Benchmark

```txt
Creá un directorio /benchmarks con los siguientes archivos:

1. README.md explicando cómo ejecutar los benchmarks y qué miden
2. src/benchmark-simple-query.ts que mida tiempo de ejecución de:
   - Query simple con filter (1000 ejecuciones, calcular promedio, p95, p99)
   - Query con include de una relación
   - Query con include de dos niveles de relaciones
   - BulkInsert de 1000 registros
   Contra MySQL y PostgreSQL por separado.

3. src/benchmark-concurrent.ts que mida:
   - 50 queries concurrentes simples
   - 50 queries concurrentes con include
   
4. src/generate-report.ts que tome los resultados y genere 
   un archivo docs/benchmarks.md con tablas markdown listas 
   para publicar en la wiki.

Usá el schema Northwind existente en los labs como base de datos de prueba.
Los benchmarks deben poder ejecutarse con: npm run benchmark
Agregá el script al package.json si existe, o creá uno.
```

## Prompt 7 — Revisión de consistencia final

```txt
Hacé una revisión de consistencia en toda la documentación:

1. Verificá que todos los links internos entre páginas markdown funcionen
2. Verificá que todos los links a los labs de GitHub apunten a rutas que existen
3. Revisá que los bloques de código tengan siempre el lenguaje especificado 
   (```typescript, ```yaml, ```json, ```sh)
4. Verificá que los headings sigan una jerarquía correcta (no saltar de H1 a H3)
5. Identificá cualquier página que mencione features "Coming Soon" o "In Progress" 
   y listámelas para revisar si siguen siendo actuales

Dame un reporte de todo lo que encontraste y lo que corregiste.
```
