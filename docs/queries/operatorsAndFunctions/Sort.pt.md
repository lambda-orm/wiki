# Funções de ordenação {#sort-functions}

O método `sort` ordena as linhas de uma consulta (`ORDER BY` em SQL). Seu predicado retorna o campo pelo qual ordenar, opcionalmente envolvido em `asc` ou `desc` para definir a direção. Sem `asc` ou `desc`, as linhas são ordenadas em ordem ascendente.

!!! note "Sobre os exemplos"
    Os exemplos são executados sobre a entidade `Countries` do esquema de exemplo de países. Cada um mostra a consulta, o resultado que ela retornou no banco de dados de teste e a sentença SQL que o λORM gerou para MySQL. Os demais mecanismos de banco de dados recebem sua própria tradução; para ver a sentença gerada para a sua fonte de dados, use [`orm.plan`](../Metadata.md).

## Resumo {#summary}

| Função | Descrição |
|---|---|
| `asc` | Ordena em ordem ascendente (o padrão) |
| `desc` | Ordena em ordem descendente |

## Ordem padrão {#default-order}

Quando o predicado retorna um campo sem `asc` ou `desc`, as linhas são ordenadas em ordem ascendente.

Número de países de cada região, do menor para o maior:

```typescript
Countries.map(p=> {region:p.region,countries:count(1)}).sort(p=> p.countries)
```

**Resultado:**

```json
[{"region":"Polar","countries":1}
,{"region":"","countries":2}
,{"region":"Oceania","countries":27}
,{"region":"Asia","countries":50}
,{"region":"Europe","countries":53}
,{"region":"Americas","countries":57}
,{"region":"Africa","countries":60}
]
```

**SQL gerado (MySQL):**

```sql
SELECT c.region AS region, COUNT(1) AS countries
FROM Countries c
GROUP BY c.region
ORDER BY countries asc
```

## asc {#asc}

Ordena as linhas por `value` em ordem ascendente.

**Assinatura:** `asc(value: any): void`

Latitude máxima de cada região, ordenada por esse máximo:

```typescript
Countries.map(p=> {region:p.region,max:max(p.latitude)}).sort(p=> asc(p.max))
```

**Resultado:**

```json
[{"region":"Polar","max":-74.65}
,{"region":"","max":-53.1}
,{"region":"Oceania","max":15.2}
,{"region":"Africa","max":34}
,{"region":"Asia","max":48}
,{"region":"Americas","max":72}
,{"region":"Europe","max":78}
]
```

**SQL gerado (MySQL):**

```sql
SELECT c.region AS region, MAX(c.latitude) AS max
FROM Countries c
GROUP BY c.region
ORDER BY max asc
```

## desc {#desc}

Ordena as linhas por `value` em ordem descendente.

**Assinatura:** `desc(value: any): void`

Códigos ISO 3 dos países da América do Sul em ordem descendente:

```typescript
Countries.filter(p=> p.subregion == "South America").map(p=> p.iso3).sort(p=> desc(p.iso3))
```

**Resultado:**

```json
[{"iso3":"VEN"}
,{"iso3":"URY"}
,{"iso3":"SUR"}
,{"iso3":"SGS"}
,{"iso3":"PRY"}
,{"iso3":"PER"}
,{"iso3":"GUY"}
,{"iso3":"GUF"}
,{"iso3":"FLK"}
,{"iso3":"ECU"}
,{"iso3":"COL"}
,{"iso3":"CHL"}
,{"iso3":"BRA"}
,{"iso3":"BOL"}
,{"iso3":"ARG"}
]
```

**SQL gerado (MySQL):**

```sql
SELECT c.iso3 AS iso3
FROM Countries c
WHERE c.subregion = 'South America'
ORDER BY c.iso3 desc
```

!!! warning "Referencie os campos através do parâmetro da lambda"
    Escreva `desc(p.iso3)`, não `desc(iso3)`. Um nome que não é acessado através do parâmetro da lambda (`p`) é lido como um parâmetro da consulta: `sort(p=> desc(iso3))` gera `ORDER BY ? desc`, e as linhas não são ordenadas pelo campo.
