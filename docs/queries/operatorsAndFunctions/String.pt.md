# Funções de string {#string-functions}

As funções de string transformam valores de texto: alteram maiúsculas e minúsculas, preenchem, removem espaços, substituem ou extraem parte de uma string, e convertem valores em strings.

!!! note "Sobre os exemplos"
    Os exemplos são executados sobre a entidade `Countries` do esquema de exemplo de países. Cada um mostra a consulta, o resultado que ela retornou no banco de dados de teste e a sentença SQL que o λORM gerou para MySQL. Os demais mecanismos de banco de dados recebem sua própria tradução; para ver a sentença gerada para a sua fonte de dados, use [`orm.plan`](../Metadata.md).

## Resumo {#summary}

| Função | Descrição |
|---|---|
| `chr` | Caractere de um código ASCII |
| `concat` | Concatena strings |
| `lower` | Converte para minúsculas |
| `upper` | Converte para maiúsculas |
| `lpad` | Preenche o lado esquerdo de uma string |
| `rpad` | Preenche o lado direito de uma string |
| `ltrim` | Remove os espaços iniciais |
| `rtrim` | Remove os espaços finais |
| `trim` | Remove os espaços iniciais e finais |
| `replace` | Substitui todas as ocorrências de um valor |
| `mask` | Oculta o meio de uma string |
| `maskLeft` | Oculta tudo menos os últimos caracteres |
| `maskRight` | Oculta tudo menos os primeiros caracteres |
| `maskEmail` | Oculta o usuário de um email |
| `hash` | Token SHA-256 ou HMAC-SHA256 de um valor |
| `substr`, `substring` | Extrai parte de uma string |
| `strCount` | Conta as ocorrências de um valor |
| `length` | Número de caracteres |
| `left` | Primeiros caracteres de uma string |
| `right` | Últimos caracteres de uma string |
| `like` | Corresponde a um padrão SQL |
| `startsWith` | Começa com um texto |
| `includes` | Contém um texto |
| `toString` | Converte um valor em string |

## chr {#chr}

Retorna o caractere cujo código ASCII é `ascii`.

**Assinatura:** `chr(ascii: number): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: chr(68)})
```

**Resultado:** `[{"result":"D"}]`

**SQL gerado (MySQL):**

```sql
SELECT CHAR(68 USING ASCII) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## concat {#concat}

Concatena todos os seus argumentos em uma única string.

**Assinatura:** `concat(...values: any): string`

Região e sub-região do Brasil, separadas por um espaço:

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: concat(p.region," ",p.subregion) })
```

**Resultado:** `[{"result":"Americas South America"}]`

**SQL gerado (MySQL):**

```sql
SELECT CONCAT(CONCAT(c.region,' '),c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## lower {#lower}

Converte `value` para minúsculas.

**Assinatura:** `lower(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: lower(p.subregion) })
```

**Resultado:** `[{"result":"south america"}]`

**SQL gerado (MySQL):**

```sql
SELECT LOWER(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## upper {#upper}

Converte `value` para maiúsculas.

**Assinatura:** `upper(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: upper(p.subregion) })
```

**Resultado:** `[{"result":"SOUTH AMERICA"}]`

**SQL gerado (MySQL):**

```sql
SELECT UPPER(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## lpad {#lpad}

Preenche o lado esquerdo de `value` com `pad` até que tenha `len` caracteres.

**Assinatura:** `lpad(value: string, len: number, pad: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: lpad(p.region,12,"_") })
```

**Resultado:** `[{"result":"____Americas"}]`

**SQL gerado (MySQL):**

```sql
SELECT LPAD(c.region,12,'_') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## rpad {#rpad}

Preenche o lado direito de `value` com `pad` até que tenha `len` caracteres.

**Assinatura:** `rpad(value: string, len: number, pad: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: rpad(p.region,12,"_") })
```

**Resultado:** `[{"result":"Americas____"}]`

**SQL gerado (MySQL):**

```sql
SELECT RPAD(c.region,12,'_') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## ltrim {#ltrim}

Remove os espaços iniciais de `value`.

**Assinatura:** `ltrim(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: ltrim("  a  ")})
```

**Resultado:** `[{"result":"a  "}]`

**SQL gerado (MySQL):**

```sql
SELECT LTRIM(' a ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## rtrim {#rtrim}

Remove os espaços finais de `value`.

**Assinatura:** `rtrim(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: rtrim("  a  ")})
```

**Resultado:** `[{"result":"  a"}]`

**SQL gerado (MySQL):**

```sql
SELECT RTRIM(' a ') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## trim {#trim}

Remove os espaços iniciais e finais de `value`. É traduzida para `TRIM(value)` em SQL.

**Assinatura:** `trim(value: string): string`

## replace {#replace}

Retorna `value` com todas as ocorrências de `source` substituídas por `target`.

**Assinatura:** `replace(value: string, source: string, target: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: replace(p.region,"a","*")})
```

**Resultado:** `[{"result":"Americ*s"}]`

**SQL gerado (MySQL):**

```sql
SELECT REPLACE(c.region,'a','*') AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## mask {#mask}

As funções de máscara ocultam parte de um dado pessoal. O λORM as traduz para cada motor com o mesmo resultado que em memória, então um valor mascarado pelo banco de dados e um mascarado pela aplicação ficam iguais. Uma [view](../../schema/Views.md#personal-data-pii) pode aplicá-las a cada propriedade marcada como dado pessoal (`pii`) sem nomeá-la.

Mascara um valor: um quarto dos caracteres de cada lado fica visível (no máximo 3) e o resto é substituído por `*`, um por caractere. Um valor com menos de 4 caracteres vira todo `*`. Um valor nulo continua nulo.

**Assinatura:** `mask(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: mask(p.subregion)})
```

**Resultado:** `[{"result":"Sou*******ica"}]`

**SQL gerado (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.subregion) < 4 THEN REPEAT('*', CHAR_LENGTH(c.subregion))
  ELSE CONCAT(LEFT(c.subregion, LEAST(3, CHAR_LENGTH(c.subregion) DIV 4)), REPEAT('*', CHAR_LENGTH(c.subregion) - 2 * LEAST(3, CHAR_LENGTH(c.subregion) DIV 4)), RIGHT(c.subregion, LEAST(3, CHAR_LENGTH(c.subregion) DIV 4))) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskLeft {#maskleft}

Mascara todos os caracteres menos os últimos `n` (um cartão ou um telefone). Um valor com `n` caracteres ou menos vira todo `*`.

**Assinatura:** `maskLeft(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskLeft(p.name, 2)})
```

**Resultado:** `[{"result":"****il"}]`

**SQL gerado (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.name) <= 2 THEN REPEAT('*', CHAR_LENGTH(c.name))
  ELSE CONCAT(REPEAT('*', CHAR_LENGTH(c.name) - 2), RIGHT(c.name, 2)) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskRight {#maskright}

Mascara todos os caracteres menos os primeiros `n` (um sobrenome). Um valor com `n` caracteres ou menos vira todo `*`.

**Assinatura:** `maskRight(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskRight(p.name, 2)})
```

**Resultado:** `[{"result":"Br****"}]`

**SQL gerado (MySQL):**

```sql
SELECT CASE WHEN CHAR_LENGTH(c.name) <= 2 THEN REPEAT('*', CHAR_LENGTH(c.name))
  ELSE CONCAT(LEFT(c.name, 2), REPEAT('*', CHAR_LENGTH(c.name) - 2)) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## maskEmail {#maskemail}

Mascara um email: mantém o primeiro caractere do usuário e o domínio. Um valor sem usuário antes de `@` vira todo `*`.

**Assinatura:** `maskEmail(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: maskEmail("ana.lopez@example.com")})
```

**Resultado:** `[{"result":"a********@example.com"}]`

**SQL gerado (MySQL):**

```sql
SELECT CASE WHEN LOCATE('@', 'ana.lopez@example.com') < 2 THEN REPEAT('*', CHAR_LENGTH('ana.lopez@example.com'))
  ELSE CONCAT(LEFT('ana.lopez@example.com', 1), REPEAT('*', LOCATE('@', 'ana.lopez@example.com') - 2),
    SUBSTRING('ana.lopez@example.com', LOCATE('@', 'ana.lopez@example.com'))) END AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## hash {#hash}

Devolve um token do valor: seu SHA-256 em hexadecimal ou, com uma `key`, seu HMAC-SHA256. O mesmo valor sempre gera o mesmo token, então o resultado ainda pode ser agrupado ou unido. Sem chave é traduzido em PostgreSQL, MySQL, MariaDB, SQL Server e Oracle; com chave só no PostgreSQL (que precisa da extensão `pgcrypto`). No MongoDB e no SQLite falha com `Function hash is not supported by <dialect>`.

**Assinatura:** `hash(value: string, key?: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: hash(p.iso3)})
```

**Resultado:** `[{"result":"b437fc1d678d9524fcaf93312f07f0fc9338283110a81edc0233bd0fb7932f69"}]`

**SQL gerado (MySQL):**

```sql
SELECT SHA2(c.iso3, 256) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## substr, substring {#substr-substring}

Retorna a parte de `value` que começa na posição `from` (o primeiro caractere é a posição 1 em SQL) e tem `count` caracteres. `substr` e `substring` são equivalentes.

**Assinatura:**

- `substr(value: string, from: number, count: number): string`
- `substring(value: string, from: number, count: number): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: substr(p.subregion,1,3)})
```

**Resultado:** `[{"result":"Sou"}]`

**SQL gerado (MySQL):**

```sql
SELECT SUBSTR(c.subregion,1,3) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: substring(p.subregion,1,3)})
```

**Resultado:** `[{"result":"Sou"}]`

**SQL gerado (MySQL):**

```sql
SELECT SUBSTR(c.subregion,1,3) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## strCount {#strcount}

Retorna o número de vezes que `value` aparece em `source`. A busca diferencia maiúsculas de minúsculas.

**Assinatura:** `strCount(source: string, value: string): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: strCount(p.subregion,"a")})
```

**Resultado:** `[{"result":1}]`

**SQL gerado (MySQL):**

```sql
SELECT (LENGTH(c.subregion)-LENGTH(REPLACE(c.subregion,'a',''))) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## length {#length}

Devolve o número de caracteres de `value`.

**Assinatura:** `length(value: string): number`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: length(p.subregion)})
```

**Resultado:** `[{"result":13}]`

**SQL gerado (MySQL):**

```sql
SELECT CHAR_LENGTH(c.subregion) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## left {#left}

Devolve os primeiros `n` caracteres de `value`.

**Assinatura:** `left(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: left(p.subregion, 5)})
```

**Resultado:** `[{"result":"South"}]`

**SQL gerado (MySQL):**

```sql
SELECT LEFT(c.subregion, 5) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## right {#right}

Devolve os últimos `n` caracteres de `value`.

**Assinatura:** `right(value: string, n: integer): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: right(p.subregion, 7)})
```

**Resultado:** `[{"result":"America"}]`

**SQL gerado (MySQL):**

```sql
SELECT RIGHT(c.subregion, 7) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## like {#like}

Devolve `true` quando `value` corresponde ao padrão SQL: `%` é qualquer sequência de caracteres e `_` é um caractere. No MongoDB o padrão vira uma expressão regular.

**Assinatura:** `like(value: string, pattern: string): boolean`

```typescript
Countries.filter(p=> like(p.name, "B%l")).map(p=> p.name)
```

**SQL gerado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.name LIKE 'B%l'
```

## startsWith {#startswith}

Devolve `true` quando `value` começa com `prefix`. Pode ser escrita como função ou como método: `startsWith(p.name, "Bra")` ou `p.name.startsWith("Bra")`.

**Assinatura:** `startsWith(value: string, prefix: string): boolean`

```typescript
Countries.filter(p=> p.name.startsWith("Bra")).map(p=> p.name)
```

**SQL gerado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.name LIKE 'Bra%'
```

## includes {#includes}

Devolve `true` quando o texto `value` contém `text`; escrita como método, `p.subregion.includes("America")`. Com uma lista em vez de um texto, `includes` verifica se a lista contém um valor (veja [Comparação](Comparison.md#includes)).

**Assinatura:** `includes(value: string, text: string): boolean`

```typescript
Countries.filter(p=> p.subregion.includes("America")).map(p=> p.name)
```

**SQL gerado (MySQL):**

```sql
SELECT c.name AS name
FROM Countries c
WHERE c.subregion LIKE '%America%'
```

## toString {#tostring}

Converte `value` em string.

**Assinatura:** `toString(value: any): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: toString(p.latitude)})
```

**Resultado:** `[{"result":"-10.0000"}]`

**SQL gerado (MySQL):**

```sql
SELECT CONVERT(c.latitude, CHAR) AS result
FROM Countries c
WHERE c.iso3 = 'BRA'
```

## Constantes de texto {#text-constants}

Uma constante de texto escrita na consulta (`"O'Brien"`) entra na sentença escapada como cada dialeto exige (a partir de `@lambdaorm/lib` 3.15.0): o SQL padrão duplica a aspa, MySQL e MariaDB a escapam com uma barra invertida. O mesmo vale para as listas de um `in`. Os valores passados como parâmetros não são afetados: viajam como parâmetros da sentença.

```typescript
Customers.filter(p => p.name == "O'Brien")
```

```sql
-- PostgreSQL, SQL Server, Oracle, SQLite
WHERE c.CompanyName = 'O''Brien'
-- MySQL, MariaDB
WHERE c.CompanyName = 'O\'Brien'
```

## Suporte nos bancos de dados {#database-support}

!!! warning "MongoDB"
    `chr`, `lpad`, `rpad` e `hash` não têm equivalente no MongoDB e não podem ser traduzidos. As demais funções desta página
    estão disponíveis. `like`, `startsWith` e `includes` de um texto comparam o texto literalmente (`includes` e
    `startsWith` com `$indexOfCP`, `like` com uma expressão regular construída a partir do padrão); em um filtro ficam
    em um `$expr`.

!!! note "Funções de máscara e hash"
    `mask`, `maskLeft`, `maskRight` e `maskEmail` estão disponíveis em todos os motores, inclusive no MongoDB. `hash` não está disponível no MongoDB nem no SQLite, e `hash` com chave só no PostgreSQL.
