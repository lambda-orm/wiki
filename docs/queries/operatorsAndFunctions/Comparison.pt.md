# Operadores e funções de comparação {#comparison-operators-and-functions}

Os operadores e funções de comparação comparam dois ou mais valores e retornam um booleano. São usados principalmente no predicado de `filter` (a cláusula `WHERE` do SQL gerado), mas podem ser usados em qualquer expressão de uma consulta.

!!! note "Sobre os exemplos"
    Os exemplos são executados sobre a entidade `Countries` do esquema de exemplo de países. Cada um mostra a consulta, o resultado que ela retornou no banco de dados de teste e a sentença SQL que o λORM gerou para MySQL. Os demais mecanismos de banco de dados recebem sua própria tradução; para ver a sentença gerada para a sua fonte de dados, use [`orm.plan`](../Metadata.md).

## Resumo {#summary}

| Operador / função | Descrição |
|---|---|
| `==`, `===` | Igual a |
| `!=`, `!==`, `<>` | Diferente de |
| `>` | Maior que |
| `<` | Menor que |
| `>=` | Maior ou igual a |
| `<=` | Menor ou igual a |
| `between` | Verifica se um valor está dentro de um intervalo |
| `in` | Verifica se um valor está em uma lista de valores |
| `includes` | Verifica se uma lista contém um valor |

## Igual (`==`, `===`) {#equal}

Retorna `true` quando os dois operandos são iguais. `==` e `===` são equivalentes: ambos são traduzidos para `=` em SQL.

**Sintaxe:**

- `a == b`
- `a === b`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> p.name)
```

**Resultado:** `[{"name":"Brazil"}]`

**SQL gerado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 === "BRA").map(p=> p.name)
```

**Resultado:** `[{"name":"Brazil"}]`

**SQL gerado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Diferente (`!=`, `!==`, `<>`) {#not-equal}

Retorna `true` quando os operandos são diferentes. As três formas são equivalentes e são traduzidas para `<>` em SQL.

**Sintaxe:**

- `a != b`
- `a !== b`
- `a <> b`

Veja a página [Lógicos](Logical.md) para um exemplo que usa `!=`.

## Maior que, menor que (`>`, `<`, `>=`, `<=`) {#greater-than-less-than}

Comparam dois valores do mesmo tipo (números, strings ou datas).

- `a > b`: `a` é maior que `b`.
- `a < b`: `a` é menor que `b`.
- `a >= b`: `a` é maior ou igual a `b`.
- `a <= b`: `a` é menor ou igual a `b`.

Nome do primeiro país (ordenado por nome) cuja latitude está entre -11 e -9 (exclusive) e cuja longitude é -55:

```typescript
Countries.filter(p=> p.latitude < -9 && p.latitude > -11 && p.longitude == -55 ).first(p=> p.name)
```

**Resultado:** `[{"name":"Brazil"}]`

**SQL gerado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE (c.latitude < -9 AND (c.latitude > -11 AND c.longitude = -55))
ORDER BY c.name asc
LIMIT 0,1
```

## between {#between}

Retorna `true` quando `value` está dentro do intervalo de `from` a `to`. Em SQL é traduzido para `value BETWEEN from AND to`, que inclui os dois limites.

**Assinatura:** `between(value: T, from: T, to: T): boolean`

```typescript
Countries.filter(p=> between(p.latitude,-11,-9) && p.longitude == -55 ).first(p=> p.name)
```

**Resultado:** `[{"name":"Brazil"}]`

**SQL gerado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE (c.latitude BETWEEN -11 AND -9 AND c.longitude = -55)
ORDER BY c.name asc
LIMIT 0,1
```

## in {#in}

Retorna `true` quando `value` é igual a um dos valores de `list`. Substitui várias condições unidas com `||` e é traduzido para `value IN (...)` em SQL.

**Assinatura:** `in(value: T, list: T[]): boolean`

```typescript
Countries.filter(p=> in(p.iso3,["BRA","ARG"])).map(p=> p.name)
```

**Resultado:** `[{"name":"Argentina"},{"name":"Brazil"}]`

**SQL gerado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.iso3 IN ('BRA', 'ARG')
```

## includes {#includes}

Retorna `true` quando `list` contém `value`. É a mesma verificação que `in`, com os argumentos na ordem inversa: a lista vem primeiro. `contains` é um alias de `includes`.

**Assinatura:** `includes(list: T[], value: T): boolean`

Por exemplo, `includes(["BRA","ARG"], p.iso3)` gera a mesma condição `WHERE c.iso3 IN ('BRA', 'ARG')` que o exemplo de `in` acima no MySQL, MariaDB, PostgreSQL, Oracle e SQLite.

## Suporte nos bancos de dados {#database-support}

!!! warning "Diferenças entre mecanismos de banco de dados"
    - **MongoDB**: `between` é traduzido para `{"$gte": from, "$lt": to}`, por isso o limite superior é **excluído**, ao contrário do `BETWEEN` do SQL. Atualmente `includes` não pode ser traduzido para uma consulta MongoDB; use `in` no lugar.
    - **SQL Server**: `includes` é traduzido para um `LIKE` (busca de texto) em vez de `IN`; use `in` para verificar um valor contra uma lista.
