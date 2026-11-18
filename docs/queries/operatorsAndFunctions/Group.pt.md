# Funções de agregação {#aggregate-functions}

As funções de agregação (de grupo) calculam um único valor a partir de um conjunto de linhas. Quando o `map` de uma consulta mistura funções de agregação com outros campos, o λORM agrupa as linhas por esses outros campos (`GROUP BY` em SQL). Veja [Agrupamento](../Grouping.md) para mais exemplos, incluindo `having`.

!!! note "Sobre os exemplos"
    Os exemplos são executados sobre a entidade `Countries` do esquema de exemplo de países. Cada um mostra a consulta, o resultado que ela retornou no banco de dados de teste e a sentença SQL que o λORM gerou para MySQL. Os demais mecanismos de banco de dados recebem sua própria tradução; para ver a sentença gerada para a sua fonte de dados, use [`orm.plan`](../Metadata.md).

## Resumo {#summary}

| Função | Descrição |
|---|---|
| `avg` | Média dos valores |
| `count` | Número de linhas |
| `first` | Primeiro valor do conjunto |
| `last` | Último valor do conjunto |
| `max` | Valor máximo |
| `min` | Valor mínimo |
| `sum` | Soma dos valores |

## count {#count}

Retorna o número de linhas do conjunto. `count(1)` conta todas as linhas.

**Assinatura:** `count(value: any): integer`

Número de países da região Americas:

```typescript
Countries.filter(p=> p.region == "Americas").map(p=> {result:count(1)})
```

**Resultado:** `[{"result":57}]`

**SQL gerado (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE c.region = 'Americas'
```

Número de países de cada região:

```typescript
Countries.map(p=> {region:p.region,countries:count(1)})
```

**Resultado:**

```json
[{"region":"","countries":2}
,{"region":"Africa","countries":60}
,{"region":"Americas","countries":57}
,{"region":"Asia","countries":50}
,{"region":"Europe","countries":53}
,{"region":"Oceania","countries":27}
,{"region":"Polar","countries":1}
]
```

**SQL gerado (MySQL):**

```sql
SELECT c.region AS region, COUNT(1) AS countries
FROM Countries c
GROUP BY c.region
```

## max {#max}

Retorna o valor máximo do conjunto.

**Assinatura:** `max(value: T): T`

Latitude máxima dos países de cada região:

```typescript
Countries.map(p=> {region:p.region,max:max(p.latitude)})
```

**Resultado:**

```json
[{"region":"","max":-53.1}
,{"region":"Africa","max":34}
,{"region":"Americas","max":72}
,{"region":"Asia","max":48}
,{"region":"Europe","max":78}
,{"region":"Oceania","max":15.2}
,{"region":"Polar","max":-74.65}
]
```

**SQL gerado (MySQL):**

```sql
SELECT c.region AS region, MAX(c.latitude) AS max
FROM Countries c
GROUP BY c.region
```

## min {#min}

Retorna o valor mínimo do conjunto.

**Assinatura:** `min(value: T): T`

Latitude mínima dos países de cada região:

```typescript
Countries.map(p=> {region:p.region,min:min(p.latitude)})
```

**Resultado:**

```json
[{"region":"","min":-54.4333}
,{"region":"Africa","min":-49.25}
,{"region":"Americas","min":-54.5}
,{"region":"Asia","min":-8.8333}
,{"region":"Europe","min":35}
,{"region":"Oceania","min":-41}
,{"region":"Polar","min":-74.65}
]
```

**SQL gerado (MySQL):**

```sql
SELECT c.region AS region, MIN(c.latitude) AS min
FROM Countries c
GROUP BY c.region
```

## avg {#avg}

Retorna a média dos valores do conjunto.

**Assinatura:** `avg(value: number): number`

Latitude média dos países de cada região:

```typescript
Countries.map(p=> {region:p.region,avg:avg(p.latitude)})
```

**Resultado:**

```json
[{"region":"","avg":-53.76665}
,{"region":"Africa","avg":1.283335}
,{"region":"Americas","avg":10.42610526}
,{"region":"Asia","avg":25.822002}
,{"region":"Europe","avg":49.35021321}
,{"region":"Oceania","avg":-10.93023704}
,{"region":"Polar","avg":-74.65}
]
```

**SQL gerado (MySQL):**

```sql
SELECT c.region AS region, AVG(c.latitude) AS avg
FROM Countries c
GROUP BY c.region
```

## sum {#sum}

Retorna a soma dos valores do conjunto. É traduzida para `SUM(...)` em SQL.

**Assinatura:** `sum(value: number): number`

## first {#first}

Retorna o primeiro valor do conjunto.

**Assinatura:** `first(value: T): T`

## last {#last}

Retorna o último valor do conjunto.

**Assinatura:** `last(value: T): T`

!!! warning "first e last em bancos de dados SQL"
    Em bancos de dados SQL, `first` e `last` usados como agregados são traduzidos para `FIRST(...)` e `LAST(...)`; verifique se o seu mecanismo de banco de dados suporta essas funções de agregação. No MongoDB eles são traduzidos para `$first` e `$last`.

    Não os confunda com os métodos de consulta `first` e `last` (por exemplo `Countries.first(p=> p.name)`), que retornam a primeira ou a última linha de uma consulta; veja [Select](../Select.md).
