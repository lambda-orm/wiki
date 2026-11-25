# Expressões no esquema {#expressions-on-schema}

Esta página lista as funções que o λORM adiciona às expressões usadas no esquema (valores padrão, valores de leitura e gravação, restrições, condições, tarefas e listeners).

Todas essas expressões são escritas na linguagem do mecanismo de expressões [3xpr](https://www.npmjs.com/package/3xpr), a mesma das consultas. Onde elas são executadas depende da chave:

| Avaliadas pelo λORM, no Node | Traduzidas para a fonte (SQL, agregação do MongoDB) |
| --- | --- |
| `default`, `readValue`, `writeValue`, `constraints`, condições dos stages, tarefas e listeners | `readExp`, `readMappingExp`, o `filter` dos mapeamentos e das visões |

Uma expressão executada no Node pode usar todas as funções do 3xpr e as listadas abaixo. Uma expressão traduzida para a fonte só pode usar as funções que o λORM traduz para esse mecanismo (veja [Operadores e funções](../queries/operatorsAndFunctions/OperatorsAndFunctions.md)); ela é validada quando o esquema é carregado.

Além dos operadores e funções do 3xpr, o λORM adiciona as seguintes funções e variáveis.

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
| orm.metadata(query:string,options:any):any           | Retorna os metadados de uma consulta.    |
| orm.model(query:string,options:any):any              | Retorna o modelo de uma consulta.        |
| orm.parameters(query:string,options:any):any         | Retorna os parâmetros de uma consulta.   |
| orm.constraints(query:string,options:any):any        | Retorna as restrições de uma consulta.   |

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

## Funções de máscara {#mask-functions}

Elas mascaram dados pessoais; também são traduzidas para cada mecanismo, de modo que podem ser usadas em um `readExp` de uma [visão](Views.md#mask-functions).

| Função                                    | Descrição                                                                     |
|-------------------------------------------|-------------------------------------------------------------------------------|
| mask(value:string):string                 | Um quarto de cada lado visível (no máximo 3), o resto `*`.                    |
| maskLeft(value:string,n:integer):string   | Tudo menos os últimos `n` caracteres como `*`.                                |
| maskRight(value:string,n:integer):string  | Tudo menos os primeiros `n` caracteres como `*`.                              |
| maskEmail(value:string):string            | O primeiro caractere do usuário e o domínio: `f*****@x.com`.                  |
| hash(value:string,key?:string):string     | SHA-256 em hexadecimal; com uma chave, HMAC-SHA256.                           |

## Funções de JSON, vetores e geo {#json-vector-and-geo-functions}

Elas trabalham sobre propriedades do tipo `json`, `vector` e `point` (veja [JSON, vetores e pontos](../queries/JsonVectorsPoints.md)).

| Função                                         | Descrição                                                         |
|------------------------------------------------|-------------------------------------------------------------------|
| jsonHas(value:any,path:string):boolean         | O caminho existe no json.                                         |
| jsonIncludes(value:any,path:string,item:any):boolean | A lista no caminho contém o item.                           |
| jsonSet(value:any,path:string,item:any):any    | O json com o item no caminho.                                     |
| cosineDistance(a,b), l2Distance(a,b), innerProduct(a,b) | Distâncias entre dois vetores.                           |
| point(longitude,latitude)                      | Um ponto GeoJSON.                                                 |
| distance(a,b)                                  | A distância em metros entre dois pontos.                          |
| within(p,minLongitude,minLatitude,maxLongitude,maxLatitude) | O ponto está dentro do retângulo.                    |
| inside(p,area)                                 | O ponto está dentro do polígono GeoJSON `area`.                   |

## O contexto {#the-context}

`context` é uma variável reservada: o [contexto](Context.md) de quem executa a consulta (`context.user`, `context.tenant`, `context.roles`). Ela pode ser lida em filtros, `default`, `writeValue`, `constraints`, `readExp` e nas condições dos listeners, mas não nas condições das fontes de um stage.

```yaml
domain:
  entities:
    - name: Orders
      properties:
        - name: createdBy
          default: context.user
```
