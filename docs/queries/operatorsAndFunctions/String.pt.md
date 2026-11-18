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
| `substr`, `substring` | Extrai parte de uma string |
| `strCount` | Conta as ocorrências de um valor |
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

Mascara um valor sensível: mantém os três primeiros e os três últimos caracteres e substitui o restante por `***`.

**Assinatura:** `mask(value: string): string`

```typescript
Countries.filter(p=> p.iso3 == "BRA").map(p=> {result: mask(p.subregion)})
```

**Resultado:** `[{"result":"Sou***ica"}]`

**SQL gerado (MySQL):**

```sql
SELECT Concat(LEFT(c.subregion,3),'***',RIGHT(c.subregion,3)) AS result
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

## Suporte nos bancos de dados {#database-support}

!!! warning "MongoDB"
    Na versão atual, `chr`, `lpad`, `rpad`, `ltrim`, `rtrim`, `trim`, `replace`, `mask`, `substr`, `substring` e `strCount` não podem ser traduzidas para consultas MongoDB. `concat`, `lower`, `upper` e `toString` são suportadas.
