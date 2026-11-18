# Operadores e funções numéricas {#numeric-operators-and-functions}

Os operadores e funções numéricas realizam cálculos aritméticos, de arredondamento, trigonométricos e logarítmicos.

!!! note "Sobre os exemplos"
    Os exemplos são executados sobre a entidade `Countries` do esquema de exemplo de países. Cada um mostra a consulta, o resultado que ela retornou no banco de dados de teste e a sentença SQL que o λORM gerou para MySQL. Os demais mecanismos de banco de dados recebem sua própria tradução; para ver a sentença gerada para a sua fonte de dados, use [`orm.plan`](../Metadata.md).

## Resumo {#summary}

### Operadores {#operators}

| Operador | Descrição |
|---|---|
| `-` | Negação (`-a`) ou subtração (`a - b`) |
| `+` | Adição |
| `*` | Multiplicação |
| `/` | Divisão |
| `**` | Exponenciação: `a` elevado à potência `b` |
| `//` | Raiz: a raiz `b`-ésima de `a` |
| `%` | Módulo: resto de `a / b` |

### Funções {#functions}

| Função | Descrição |
|---|---|
| `abs` | Valor absoluto |
| `acos` | Arco cosseno |
| `asin` | Arco seno |
| `atan` | Arco tangente |
| `atan2` | Arco tangente de `y / x` |
| `ceil` | Menor inteiro maior ou igual a um número |
| `cos` | Cosseno |
| `cosh` | Cosseno hiperbólico |
| `exp` | *e* elevado a uma potência |
| `floor` | Maior inteiro menor ou igual a um número |
| `ln` | Logaritmo natural |
| `log` | Logaritmo em uma base indicada |
| `log10` | Logaritmo na base 10 |
| `remainder` | Resto de uma divisão |
| `round` | Arredonda para um número de casas decimais |
| `sign` | Sinal de um número |
| `sin` | Seno |
| `sinh` | Seno hiperbólico |
| `tan` | Tangente |
| `tanh` | Tangente hiperbólica |
| `trunc` | Trunca para um número de casas decimais |
| `toNumber` | Converte um valor em número |

## Operadores aritméticos {#arithmetic-operators}

Os operadores aritméticos recebem números e retornam um número. A precedência segue as regras aritméticas usuais (`**` antes de `*` e `/`, que vêm antes de `+` e `-`); use parênteses para alterá-la. Em SQL, `**` é traduzido para `POWER(a,b)`, `//` para `POWER(a,(1/b))` e `%` para `MOD(a,b)`.

**Sintaxe:**

- `-a`, `a - b`
- `a + b`
- `a * b`
- `a / b`
- `a ** b`
- `a // b`
- `a % b`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 3+2-1 })
```

**Resultado:** `[{"result":4}]`

**SQL gerado (MySQL):**

```sql
SELECT ((3 + 2) - 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 3*4-1})
```

**Resultado:** `[{"result":11}]`

**SQL gerado (MySQL):**

```sql
SELECT ((3 * 4) - 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1-2-5})
```

**Resultado:** `[{"result":-6}]`

**SQL gerado (MySQL):**

```sql
SELECT ((1 - 2) - 5) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: (2+3)*2})
```

**Resultado:** `[{"result":10}]`

**SQL gerado (MySQL):**

```sql
SELECT ((2 + 3) * 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 2*(3+2)})
```

**Resultado:** `[{"result":10}]`

**SQL gerado (MySQL):**

```sql
SELECT (2 * (3 + 2)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1+2*3*4})
```

**Resultado:** `[{"result":25}]`

**SQL gerado (MySQL):**

```sql
SELECT (1 + ((2 * 3) * 4)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: (1+(2**3)*4)})
```

**Resultado:** `[{"result":33}]`

**SQL gerado (MySQL):**

```sql
SELECT (1 + (POWER(2,3) * 4)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: 1+2**(3*4)})
```

**Resultado:** `[{"result":4097}]`

**SQL gerado (MySQL):**

```sql
SELECT (1 + POWER(2,(3 * 4))) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## abs {#abs}

Retorna o valor absoluto de `value`.

**Assinatura:** `abs(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: abs(-9)})
```

**Resultado:** `[{"result":9}]`

**SQL gerado (MySQL):**

```sql
SELECT ABS(-9) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## acos {#acos}

Retorna o arco cosseno de `value`, em radianos.

**Assinatura:** `acos(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: acos(0.434)})
```

**Resultado:** `[{"result":1.121868332427735}]`

**SQL gerado (MySQL):**

```sql
SELECT ACOS(0.434) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## asin {#asin}

Retorna o arco seno de `value`, em radianos.

**Assinatura:** `asin(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: asin(0.434)})
```

**Resultado:** `[{"result":0.44892799436716174}]`

**SQL gerado (MySQL):**

```sql
SELECT ASIN(0.434) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## atan {#atan}

Retorna o arco tangente de `value`, em radianos.

**Assinatura:** `atan(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: atan(2)})
```

**Resultado:** `[{"result":1.1071487177940904}]`

**SQL gerado (MySQL):**

```sql
SELECT ATAN(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## atan2 {#atan2}

Retorna o arco tangente de `y / x`, em radianos, usando os sinais dos dois argumentos para escolher o quadrante.

**Assinatura:** `atan2(y: number, x: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: atan2(90, 15)})
```

**Resultado:** `[{"result":1.4056476493802699}]`

**SQL gerado (MySQL):**

```sql
SELECT ATAN(90,15) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ceil {#ceil}

Retorna o menor inteiro maior ou igual a `value`.

**Assinatura:** `ceil(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ceil(2)})
```

**Resultado:** `[{"result":2}]`

**SQL gerado (MySQL):**

```sql
SELECT CEIL(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## cos {#cos}

Retorna o cosseno de `value` (em radianos).

**Assinatura:** `cos(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: cos(2)})
```

**Resultado:** `[{"result":-0.4161468365471424}]`

**SQL gerado (MySQL):**

```sql
SELECT COS(2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## cosh {#cosh}

Retorna o cosseno hiperbólico de `value`.

**Assinatura:** `cosh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: cosh(2)})
```

**Resultado:** `[{"result":3.7621956910836314}]`

**SQL gerado (MySQL):**

```sql
SELECT ((EXP(2) + EXP(-2)) / 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## exp {#exp}

Retorna *e* elevado à potência `value`.

**Assinatura:** `exp(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: exp(7)})
```

**Resultado:** `[{"result":1096.6331584284585}]`

**SQL gerado (MySQL):**

```sql
SELECT EXP(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## floor {#floor}

Retorna o maior inteiro menor ou igual a `value`.

**Assinatura:** `floor(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: floor(7)})
```

**Resultado:** `[{"result":7}]`

**SQL gerado (MySQL):**

```sql
SELECT FLOOR(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ln {#ln}

Retorna o logaritmo natural (base *e*) de `value`.

**Assinatura:** `ln(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ln(7)})
```

**Resultado:** `[{"result":1.9459101490553132}]`

**SQL gerado (MySQL):**

```sql
SELECT LN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## log {#log}

Retorna o logaritmo de `value` na base `base`. Por exemplo, `log(7,10)` é o logaritmo na base 7 de 10.

**Assinatura:** `log(base: number, value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: log(7,10)})
```

**Resultado:** `[{"result":1.1832946624549385}]`

**SQL gerado (MySQL):**

```sql
SELECT LOG(7,10) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## log10 {#log10}

Retorna o logaritmo na base 10 de `value`.

**Assinatura:** `log10(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: log10(7)})
```

**Resultado:** `[{"result":0.8450980400142568}]`

**SQL gerado (MySQL):**

```sql
SELECT LOG10(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## remainder {#remainder}

Retorna o resto da divisão de `n1` por `n2`. No MySQL, MariaDB e SQLite é calculado como `n1 - n2 * ROUND(n1 / n2)`, por isso o resultado pode ser negativo (veja o exemplo); no PostgreSQL é traduzido para `MOD(n1,n2)`, que retorna 1 para o mesmo exemplo.

**Assinatura:** `remainder(n1: number, n2: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: remainder(7,2)})
```

**Resultado:** `[{"result":-1}]`

**SQL gerado (MySQL):**

```sql
SELECT (7 - 2*ROUND(7/2)) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## round {#round}

Arredonda `value` para `decimals` casas decimais.

**Assinatura:** `round(value: number, decimals: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: round(7.984938,2)})
```

**Resultado:** `[{"result":7.98}]`

**SQL gerado (MySQL):**

```sql
SELECT ROUND(7.984938,2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sign {#sign}

Retorna o sinal de `value`: -1 se for negativo, 0 se for zero e 1 se for positivo.

**Assinatura:** `sign(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sign(-7)})
```

**Resultado:** `[{"result":-1}]`

**SQL gerado (MySQL):**

```sql
SELECT SIGN(-7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sin {#sin}

Retorna o seno de `value` (em radianos).

**Assinatura:** `sin(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sin(7)})
```

**Resultado:** `[{"result":0.6569865987187891}]`

**SQL gerado (MySQL):**

```sql
SELECT SIN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## sinh {#sinh}

Retorna o seno hiperbólico de `value`.

**Assinatura:** `sinh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: sinh(7)})
```

**Resultado:** `[{"result":548.3161232732465}]`

**SQL gerado (MySQL):**

```sql
SELECT ((EXP(7) - EXP(-7)) / 2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## tan {#tan}

Retorna a tangente de `value` (em radianos).

**Assinatura:** `tan(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: tan(7)})
```

**Resultado:** `[{"result":0.8714479827243188}]`

**SQL gerado (MySQL):**

```sql
SELECT TAN(7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## tanh {#tanh}

Retorna a tangente hiperbólica de `value`.

**Assinatura:** `tanh(value: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: tanh(7)})
```

**Resultado:** `[{"result":0.9999983369439447}]`

**SQL gerado (MySQL):**

```sql
SELECT (EXP(2*7) - 1)/(EXP(2*7) + 1) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## trunc {#trunc}

Trunca `value` para `decimals` casas decimais, sem arredondar.

**Assinatura:** `trunc(value: number, decimals: number): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: trunc(7.984938,2)})
```

**Resultado:** `[{"result":7.98}]`

**SQL gerado (MySQL):**

```sql
SELECT TRUNCATE(7.984938,2) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## toNumber {#tonumber}

Converte `value` em número. No MySQL é traduzido para `CONVERT(value, DECIMAL)`, que não tem casas decimais, por isso o exemplo retorna 3; no PostgreSQL é traduzido para `CAST(value AS INTEGER)`.

**Assinatura:** `toNumber(value: any): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: toNumber("3.141516")})
```

**Resultado:** `[{"result":3}]`

**SQL gerado (MySQL):**

```sql
SELECT CONVERT('3.141516', DECIMAL) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Suporte nos bancos de dados {#database-support}

Algumas funções não têm equivalente direto em todos os mecanismos de banco de dados, por isso o λORM as traduz para uma expressão equivalente. Por exemplo, no MySQL, MariaDB e SQLite `cosh`, `sinh` e `tanh` são calculadas com `EXP`, e `trunc` é traduzida para `TRUNCATE`; no SQL Server `trunc` é traduzida para `ROUND(value,decimals,1)`, `ceil` para `CEILING` e `atan2` para `ATN2`.

!!! warning "MongoDB"
    - Atualmente `remainder` e `toNumber` não podem ser traduzidas para consultas MongoDB.
    - `trunc` é traduzida para `$trunc` sem o número de casas decimais, por isso o valor é truncado para um inteiro.
