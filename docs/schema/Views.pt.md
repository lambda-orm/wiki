# Visões {#views}

Uma **visão** (view) é uma forma de ver o domínio: o mesmo esquema, as mesmas fontes e stages, com apenas algumas
entidades, apenas algumas propriedades, propriedades novas calculadas por uma expressão e propriedades lidas através de
uma máscara. Uma expressão com `options.view` é compilada contra **o domínio da sua visão**, como se fosse o único. O
banco de dados não muda.

```yaml
infrastructure:
  views:
    - name: support
      entities:
        - name: Customers
          properties:
            - { name: email, readExp: 'maskEmail(email)' }                 # masked
            - { name: taxId, exclude: true }                                # not in the view
            - { name: segment, exclude: true, default: '"retail"' }        # hidden, an insert writes it
            - { name: label, type: string, readExp: 'name + " <" + email + ">"' }   # new, read only
        - { name: Invoices, exclude: true }                                 # the entity doesn't exist in the view
```

```ts
await orm.execute('Customers.map(p => [p.label, p.email])', {}, { view: 'support' })
await orm.execute('Invoices', {}, { view: 'support' })   // ViewError: the entity Invoices is not in the view support
```

## A visão `default` {#the-view-default}

`default` **é o domínio**: a visão de uma consulta sem `options.view`. Ela sempre existe (o λORM a adiciona quando o
esquema não a escreve) e não pode alterar entidades.

## Entidades e propriedades {#entities-and-properties}

| Na visão | Efeito |
| --- | --- |
| Uma entidade com `exclude: true` | Não existe: qualquer sentença sobre ela, um `include` dela ou uma relação para ela é um `ViewError` |
| Uma propriedade com `exclude: true` | Fora de "todos os campos"; nomeá-la é o erro de uma propriedade que não existe |
| Uma propriedade com `exclude: true` e `default` | Oculta, e cada insert na visão a grava com esse valor (ou o default do domínio), seja o que for que os dados tragam |
| Uma propriedade do domínio com `readExp` | **Mascarada**: lida através da expressão, também em filtros e ordenações ("o que se vê é o que se filtra"); gravada com seu valor real |
| Uma propriedade nova com `readExp` (e `type`) | Calculada na fonte; somente leitura |

A chave primária e as chaves das relações que a visão mantém não podem ser excluídas. Uma visão que nomeia o que não
existe, um `readExp` que não compila ou um `type` inválido é um `SchemaError` quando o esquema é carregado.

## Dados pessoais (PII) {#personal-data-pii}

Uma propriedade do domínio diz que tipo de dado pessoal ela é, e uma visão mascara, aplica hash ou exclui **todos eles**
sem nomeá-los:

```yaml
domain:
  entities:
    - name: Customers
      properties:
        - { name: email, pii: email }      # maskEmail
        - { name: cardNumber, pii: card }  # maskLeft(x, 4)
        - { name: lastname, pii: name }    # maskRight(x, 1)
infrastructure:
  views:
    - { name: support, pii: mask }
    - { name: analytics, pii: hash }       # with LAMBDAORM_HASH_KEY when it is defined
    - { name: public, pii: exclude }
```

O que a visão diz de uma propriedade prevalece sobre o seu `pii`; as chaves permanecem.

## Funções de máscara {#mask-functions}

São funções da linguagem de consulta, traduzidas para cada banco de dados com o mesmo resultado que dão em memória:

| Função | Resultado |
| --- | --- |
| `mask(x)` | Um quarto de cada lado visível (no máximo 3), o resto `*`; com menos de 4 caracteres, tudo `*` |
| `maskLeft(x, n)` / `maskRight(x, n)` | Tudo menos os últimos / os primeiros `n` |
| `maskEmail(x)` | O primeiro caractere do usuário e o domínio: `f*****@x.com` |
| `hash(x, key?)` | SHA-256 em hexadecimal; com uma chave, HMAC-SHA256 (PostgreSQL com `pgcrypto`). Não no MongoDB |

## Toda a API {#the-whole-api}

`orm.metadata`, `model`, `parameters`, `constraints` e `plan` aceitam `options.view`; `orm.state.getSchemaDomain(view)`
dá o domínio da visão; uma transação, seus scripts e listeners herdam a sua visão; um repositório aceita uma
(`new CustomersRepository(stage, orm, view)`), e `lambdaorm build --view` gera o modelo e os repositórios de uma visão.

As linhas que uma visão vê são limitadas pelo seu [filtro](Context.md). Quem escolhe a visão decide o que se vê: no Data
Gateway, o gateway.
