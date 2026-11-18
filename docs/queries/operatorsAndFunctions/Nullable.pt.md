# Funções para nulos {#nullable-functions}

As funções para nulos verificam se um valor é nulo ou substituem valores nulos por outro valor.

!!! note "Sobre os exemplos"
    Os exemplos são executados sobre as entidades `Countries` e `States` do esquema de exemplo de países. Cada um mostra a consulta, o resultado que ela retornou no banco de dados de teste e a sentença SQL que o λORM gerou. No esquema de teste, `Countries` é armazenada em MySQL e `States` em PostgreSQL (mapeada para a tabela `TBL_STATES`), por isso o SQL de cada exemplo é mostrado no dialeto da sua fonte de dados. Para ver a sentença gerada para a sua fonte de dados, use [`orm.plan`](../Metadata.md).

## Resumo {#summary}

| Função | Descrição |
|---|---|
| `nvl` | Retorna um valor padrão quando o valor é nulo |
| `nvl2` | Retorna um valor quando o valor não é nulo e outro quando é nulo |
| `isNull` | Verifica se um valor é nulo |
| `isNotNull` | Verifica se um valor não é nulo |

## nvl {#nvl}

Retorna `value` quando não é nulo; caso contrário, retorna `default`.

**Assinatura:** `nvl(value: T, default: T): T`

Número de estados cuja latitude é nula (o nulo é substituído por -100, então a condição o atende):

```typescript
States.filter(p=> nvl(p.latitude,-100)== -100).map(p=> count(1))
```

**Resultado:** `[{"count":68}]`

**SQL gerado (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (CASE WHEN s.LATITUDE IS NOT NULL THEN s.LATITUDE ELSE -100 END) = -100
```

Nome nativo do país com código ISO 3 "CIV", ou "???" quando é nulo:

```typescript
Countries.filter(p=> p.iso3 == "CIV" ).map(p=> {native: nvl(p.native,"???")})
```

**Resultado:** `[{"native":"???"}]`

**SQL gerado (MySQL):**

```sql
SELECT IFNULL(c.native,'???') AS native
FROM Countries c
WHERE c.iso3 = 'CIV'
```

## nvl2 {#nvl2}

Retorna `a` quando `value` não é nulo, e `b` quando é nulo.

**Assinatura:** `nvl2(value: any, a: T, b: T): T`

```typescript
Countries.filter(p=> p.iso3 == "CIV" ).map(p=> {native: nvl2(p.native,"is not null","is null")})
```

**Resultado:** `[{"native":"is null"}]`

**SQL gerado (MySQL):**

```sql
SELECT (CASE WHEN c.native IS NOT NULL THEN 'is not null' ELSE 'is null' END) AS native
FROM Countries c
WHERE c.iso3 = 'CIV'
```

## isNull {#isnull}

Retorna `true` quando `value` é nulo.

**Assinatura:** `isNull(value: any): boolean`

Número de estados cuja latitude é nula:

```typescript
States.filter(p=> isNull(p.latitude)).map(p=> count(1))
```

**Resultado:** `[{"count":68}]`

**SQL gerado (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (s.LATITUDE IS NULL)
```

## isNotNull {#isnotnull}

Retorna `true` quando `value` não é nulo.

**Assinatura:** `isNotNull(value: any): boolean`

Número de estados cuja latitude não é nula:

```typescript
States.filter(p=> isNotNull(p.latitude)).map(p=> count(1))
```

**Resultado:** `[{"count":4813}]`

**SQL gerado (PostgreSQL):**

```sql
SELECT COUNT(1)
FROM TBL_STATES s
WHERE (s.LATITUDE IS NOT NULL)
```

## Suporte nos bancos de dados {#database-support}

!!! warning "MongoDB"
    Na versão atual, `nvl`, `nvl2`, `isNull` e `isNotNull` não podem ser traduzidas para consultas MongoDB.
