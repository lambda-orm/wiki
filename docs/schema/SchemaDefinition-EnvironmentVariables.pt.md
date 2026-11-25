# Variáveis de ambiente no esquema {#environment-variables-on-schema}

Esta página mostra como usar variáveis de ambiente no esquema, para manter conexões e segredos fora do arquivo do esquema.

Qualquer valor do esquema pode ser obtido de uma variável de ambiente, com a notação `$VARIABLE` ou `${VARIABLE}`.
As variáveis são substituídas uma única vez, quando o esquema é carregado. Com a CLI, a opção `-e` as lê de um arquivo (por exemplo `-e .env`).
Um valor que, depois da substituição, é um texto JSON (como uma conexão) é lido como um objeto; uma conexão com uma variável que não está definida é informada como um aviso quando o esquema é carregado.

Como são substituídas no carregamento, as variáveis de ambiente são as mesmas para todas as consultas. Um valor que depende de quem executa cada consulta (usuário, tenant, região) vai no [contexto](Context.md).

## Exemplos {#examples}

### Conexão com o banco de dados {#connection-to-the-database}

A conexão de cada fonte é lida de uma variável de ambiente:

```yaml
infrastructure:
  sources:
    - name: source1
      dialect: MySQL
      mapping: mapping1
      connection: $CNN_MYSQL
    - name: source2
      dialect: PostgreSQL
      mapping: mapping2
      connection: $CNN_POSTGRES
```

A variável contém a conexão em JSON:

```sh
CNN_MYSQL={"host":"localhost","port":3306,"user":"test","password":"test","database":"test"}
CNN_POSTGRES={"host":"localhost","port":5433,"user":"test","password":"test","database":"test"}
```

### Chave das funções de criptografia {#key-of-the-encryption-functions}

A chave usada por `encrypt` e `decrypt` é lida de uma variável de ambiente, dentro de uma expressão:

```yaml
domain:
  entities:
    ...
    - name: Users
      extends: Basics
      primaryKey: ["username"]
      uniqueKey: ["email"]
      properties:
        - name: username
          length: 32
          required: true
        - name: firstname
          required: true
        - name: lastname
          required: true
        - name: email
          required: true
          length: 255
          writeValue: encrypt(lower(email),"${USERS_SECRET_KEY}")
          readValue: decrypt(email,"${USERS_SECRET_KEY}")
    ...
```
