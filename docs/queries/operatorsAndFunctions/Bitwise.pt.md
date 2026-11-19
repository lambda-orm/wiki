# Operadores bit a bit {#bitwise-operators}

Os operadores bit a bit trabalham sobre a representação binária de valores inteiros.

!!! note "Sobre os exemplos"
    Os exemplos são executados sobre a entidade `Countries` do esquema de exemplo de países. Cada um mostra a consulta, o resultado que ela retornou no banco de dados de teste e a sentença SQL que o λORM gerou para MySQL. Os demais mecanismos de banco de dados recebem sua própria tradução; para ver a sentença gerada para a sua fonte de dados, use [`orm.plan`](../Metadata.md).

!!! note "Resultados no MySQL"
    O MySQL avalia as operações bit a bit como inteiros sem sinal de 64 bits. A longitude do Brasil é -55, por isso vários dos resultados abaixo são números muito grandes.

## Resumo {#summary}

| Operador | Descrição |
|---|---|
| `~` | NOT bit a bit |
| `&` | AND bit a bit |
| `|` | OR bit a bit |
| `^` | XOR bit a bit (OU exclusivo); não é exponenciação, para isso use `**` |
| `<<` | Deslocamento à esquerda |
| `>>` | Deslocamento à direita |

## NOT bit a bit (`~`) {#bitwise-not}

Inverte todos os bits de `a`. Os operandos e o resultado são números.

**Sintaxe:** `~a`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: ~ p.longitude })
```

**Resultado:** `[{"result":54}]`

**SQL gerado (MySQL):**

```sql
SELECT ~ c.longitude AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## AND bit a bit (`&`) {#bitwise-and}

Cada bit do resultado é 1 quando os bits correspondentes de `a` e `b` são ambos 1. Os operandos e o resultado são números.

**Sintaxe:** `a & b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude & 1 })
```

**Resultado:** `[{"result":1}]`

**SQL gerado (MySQL):**

```sql
SELECT c.longitude & 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## OR bit a bit (`|`) {#bitwise-or}

Cada bit do resultado é 1 quando o bit correspondente de `a` ou de `b` é 1. Os operandos e o resultado são números.

**Sintaxe:** `a | b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude | 1 })
```

**Resultado:** `[{"result":18446744073709552000}]`

**SQL gerado (MySQL):**

```sql
SELECT c.longitude | 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## XOR bit a bit (`^`) {#bitwise-xor}

Cada bit do resultado é 1 quando os bits correspondentes de `a` e `b` são diferentes. Os operandos e o resultado são números.

**Sintaxe:** `a ^ b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude ^ 1 })
```

**Resultado:** `[{"result":18446744073709552000}]`

**SQL gerado (MySQL):**

```sql
SELECT c.longitude ^ 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Deslocamento à esquerda (`<<`) {#left-shift}

Desloca os bits de `a` para a esquerda em `b` posições. Os operandos e o resultado são números.

**Sintaxe:** `a << b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude << 1 })
```

**Resultado:** `[{"result":18446744073709552000}]`

**SQL gerado (MySQL):**

```sql
SELECT c.longitude << 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Deslocamento à direita (`>>`) {#right-shift}

Desloca os bits de `a` para a direita em `b` posições. Os operandos e o resultado são números.

**Sintaxe:** `a >> b`

```typescript
Countries.filter(p=> p.iso3=="BRA").first(p=> {result: p.longitude >> 1 })
```

**Resultado:** `[{"result":9223372036854776000}]`

**SQL gerado (MySQL):**

```sql
SELECT c.longitude >> 1 AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
ORDER BY result asc
LIMIT 0,1
```

## Suporte nos bancos de dados {#database-support}

!!! warning "Diferenças entre mecanismos de banco de dados"
    - **Oracle**: `&`, `|` e `^` são traduzidos para `BITAND`, `BITOR` e `BITXOR`.
    - **PostgreSQL**: `^` é traduzido para o operador `#` (XOR).
    - **MongoDB**: `&`, `|`, `^` e `~` são traduzidos para `$bitAnd`, `$bitOr`, `$bitXor` e `$bitNot` (MongoDB 6.3 ou
      posterior); os deslocamentos `<<` e `>>` ainda não podem ser traduzidos.
