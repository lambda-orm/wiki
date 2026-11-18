# Operadores lógicos {#logical-operators}

Os operadores lógicos combinam ou negam expressões booleanas, por exemplo para unir várias condições no predicado de `filter`.

!!! note "Sobre os exemplos"
    Os exemplos são executados sobre a entidade `Countries` do esquema de exemplo de países. Cada um mostra a consulta, o resultado que ela retornou no banco de dados de teste e a sentença SQL que o λORM gerou para MySQL. Os demais mecanismos de banco de dados recebem sua própria tradução; para ver a sentença gerada para a sua fonte de dados, use [`orm.plan`](../Metadata.md).

## Resumo {#summary}

| Operador | Descrição | SQL |
|---|---|---|
| `!` | NOT lógico | `NOT` |
| `&&` | AND lógico | `AND` |
| `||` | OR lógico | `OR` |

## NOT (`!`) {#not}

Nega uma expressão booleana: retorna `true` quando `value` é `false`, e `false` quando é `true`.

**Sintaxe:** `!value`

Por exemplo, `Countries.filter(p=> !(p.iso3 == "BRA"))` gera a condição `WHERE NOT c.iso3 = 'BRA'`.

## AND (`&&`) {#and}

Retorna `true` quando os dois operandos são `true`.

**Sintaxe:** `a && b`

Número de países da América do Sul cuja longitude é menor que -30:

```typescript
Countries.filter(p=> p.subregion == "South America" &&  p.longitude < -30 ).map(p=> {result:count(1)})
```

**Resultado:** `[{"result":15}]`

**SQL gerado (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.subregion = 'South America' AND c.longitude < -30)
```

## OR (`||`) {#or}

Retorna `true` quando pelo menos um dos operandos é `true`.

**Sintaxe:** `a || b`

Número de países da América do Sul ou da América Central:

```typescript
Countries.filter(p=> p.subregion == "South America" || p.subregion == "Central America" ).map(p=> {result:count(1)})
```

**Resultado:** `[{"result":23}]`

**SQL gerado (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.subregion = 'South America' OR c.subregion = 'Central America')
```

## Combinando condições {#combining-conditions}

Os operadores podem ser combinados com os operadores de comparação descritos em [Comparação](Comparison.md). Número de países da região Americas que não estão na América do Norte (Northern America):

```typescript
Countries.filter(p=> p.region == "Americas" &&  p.subregion != "Northern America" ).map(p=> {result:count(1)})
```

**Resultado:** `[{"result":51}]`

**SQL gerado (MySQL):**

```sql
SELECT COUNT(1) AS result
FROM Countries c
WHERE (c.region = 'Americas' AND c.subregion <> 'Northern America')
```
