# Expressões no esquema {#expressions-on-schema}

Esta página lista as funções que o λORM adiciona às expressões usadas no esquema (valores padrão, valores de leitura e gravação, restrições, condições, tarefas e listeners).

Todas essas expressões são avaliadas pelo mecanismo de expressões [3xpr](https://www.npmjs.com/package/3xpr).
Além dos operadores e funções do 3xpr, o λORM adiciona as seguintes funções.

## Funções gerais {#general-functions}

| Função                                    | Descrição                       |
|-------------------------------------------|---------------------------------|
| toBase64(value:string):string             | Codifica uma string em base64.  |
| getBase64(value:string):string            | Decodifica uma string base64.   |
| encrypt(value:string,key:string):string   | Criptografa uma string com uma chave.   |
| decrypt(value:string,key:string):string   | Descriptografa uma string com uma chave. |

### Exemplo {#example}

Neste exemplo, **encrypt** armazena o e-mail criptografado no banco de dados, e **decrypt** o retorna descriptografado nos resultados.

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

## Funções do Orm {#orm-functions}

Essas funções chamam os métodos da classe `Orm`, de modo que uma expressão pode executar ou inspecionar outra consulta.

| Função                                               | Descrição                                |
|------------------------------------------------------|------------------------------------------|
| orm.execute(query:string,data:any,options:any):any   | Executa uma consulta e retorna o resultado. |
| orm.plan(query:string,options:any):any               | Retorna o plano de execução de uma consulta. |
| orm.metadata(query:string):any                       | Retorna os metadados de uma consulta.    |
| orm.model(query:string):any                          | Retorna o modelo de uma consulta.        |
| orm.parameters(query:string):any                     | Retorna os parâmetros de uma consulta.   |
| orm.constraints(query:string):any                    | Retorna as restrições de uma consulta.   |

### Exemplo {#example_1}

Neste exemplo, um listener usa **orm.execute** para executar, no stage `insights`, a mesma consulta que acabou de ser executada no stage `default` ou `cqrs`.
Esta é uma forma de implementar o padrão CQRS. Veja [Listener](SchemaExample-Listener.md).

```yaml
application:
  listeners:
    - name: syncInsights
      on: [insert, update, delete]
      condition: options.stage.in("default","cqrs")
      after: orm.execute(query,data,{stage:"insights"})
```

Veja o [CLI - laboratório northwind CQRS](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs).
