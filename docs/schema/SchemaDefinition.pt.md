# Definição {#definition}

Esta página é a referência do arquivo do esquema (`lambdaORM.yaml`): sua estrutura e todas as chaves de suas seções `domain`, `application` e `infrastructure`, com um exemplo para cada uma.
Use-a quando escrever ou revisar um esquema; para um primeiro contato, comece com [Uso do esquema](Schema-Use.md) e o [exemplo básico](SchemaExample-Basic.md).

O esquema contém toda a configuração de que o ORM precisa. Ele separa o modelo de negócio (**domain**) da persistência dos dados (**infrastructure**):

- No domínio, as entidades e os enums que representam o modelo de negócio são completamente limpos, sem nenhum atributo que os acople à persistência.
- Todas as consultas são escritas sobre o modelo de negócio, de modo que ficam desacopladas do modelo físico dos dados.
- Na infraestrutura, define-se tudo o que é necessário para armazenar e ler os dados nas diferentes fontes.

O esquema pode ser escrito em um arquivo YAML ou JSON, ou passado como um objeto quando o ORM é inicializado (veja [Uso do esquema](Schema-Use.md)).

Todas as expressões usadas para definir condições e ações são avaliadas pelo mecanismo de expressões [3xpr](https://www.npmjs.com/package/3xpr) (veja [Expressões no esquema](SchemaDefinition-Expressions.md)), e qualquer valor pode vir de uma variável de ambiente (veja [Variáveis de ambiente](SchemaDefinition-EnvironmentVariables.md)).

## Estrutura {#structure}

```yaml
name: string
description: string
version: string
domain:
  enums:
    - name: string
      extends: string
      abstract: boolean
      values:
        - name: string
          value: any
  entities:
    - name: string
      abstract: boolean
      extends: string
      singular: string
      view: boolean
      primaryKey: string[]
      uniqueKey: string[]
      required: string[]
      properties:
        - name: string
          type: string | integer | decimal | boolean | dateTime | date | time | json | point | vector
          length: number
          required: boolean
          autoIncrement: boolean
          view: boolean
          enum: string
          key: string
          pii: email | phone | card | id | name | string
          default: expression
          readExp: expression
          readValue: expression
          writeValue: expression
      indexes:
        - name: string
          fields: string[]
          type: string
          distance: cosine | l2 | ip
      relations:
        - name: string
          type: oneToMany | manyToOne | oneToOne
          from: string | string[]
          entity: string
          to: string | string[]
          composite: boolean
          weak: boolean
          target: string
      constraints:
        - message: string
          condition: expression
      observability:
        trace: expression
application:
  start:
    - name: string
      condition: expression
      expression: expression
  end:
    - name: string
      condition: expression
      expression: expression
  listeners:
    - name: string
      on: [select | insert | upsert | update | delete]
      condition: expression
      before: expression
      after: expression
      error: expression
      transactional: boolean
  queries:
    - name: string
      description: string
      query: expression
infrastructure:
  mappings:
    - name: string
      extends: string
      entities:
        - name: string
          mapping: string
          abstract: boolean
          extends: string
          sequence: string
          filter: expression
          http: object
          properties:
            - name: string
              mapping: string
              readMappingExp: expression
              dbType: string
              previousMapping: string
  sources:
    - name: string
      dialect: MySQL | MariaDB | PostgreSQL | Oracle | SqlServer | MongoDB | SQLjs | Http
      mapping: string
      connection: object | string | environment variable
  stages:
    - name: string
      sources:
        - name: string
          condition: expression
      seed: string[]
  views:
    - name: string
      pii: mask | hash | exclude
      entities:
        - name: string
          exclude: boolean
          filter: expression
          properties:
            - name: string
              exclude: boolean
              readExp: expression
              default: expression
              type: string
              length: number
              description: string
  paths:
    src: string
    state: string
    domain: string
    logs: string
  outbox:
    entities: string[]
    actions: string[]
    condition: expression
    maxAttempts: number
  migrations: {}
  crossSource:
    maxRows: number
  observability: object
  queue:
    config: object
    consumers:
      - name: string
        config: object
        subscribe: object
        execute: expression
```

## Seções principais {#main-sections}

| Chave          | Descrição                                                                                    |
|:---------------|:---------------------------------------------------------------------------------------------|
| name           | Um nome para pessoas (o λORM não o usa).                                                     |
| description    | Para que serve o esquema (o λORM não o usa).                                                 |
| version        | A versão do esquema.                                                                         |
| domain         | O modelo de negócio: enums e entidades.                                                      |
| application    | Tarefas executadas quando o ORM inicia e termina, listeners e consultas nomeadas.            |
| infrastructure | Como e onde os dados são armazenados: mapeamentos, fontes, stages, views, e os serviços opcionais (outbox, migrações, observabilidade). |

## Domínio {#domain}

| Chave      | Descrição                      |
|----------|--------------------------------|
| enums    | Os enums do modelo.            |
| entities | As entidades do modelo.        |

- Um **enum** pode ser usado como tipo de uma propriedade.
- Uma **entidade** é definida com suas propriedades, relações, chaves, índices e restrições.

### Enum {#enum}

Um enum define um conjunto de valores que pode então ser usado como tipo de uma propriedade.

| Chave      | Descrição                                                   | Obrigatória |
|----------|-------------------------------------------------------------|:--------:|
| name     | Nome do enum.                                               | sim      |
| values   | Valores do enum (`name` e `value`).                         | sim      |
| extends  | Nome de outro enum cujos valores este enum herda.           |          |
| abstract | O enum é usado apenas como base para outros enums.          |          |

Quando um valor não tem `value`, seu `name` é usado.

#### Exemplo de enum {#enum-example}

Neste exemplo, o enum **DeviceType** é definido e usado como tipo da propriedade **type** da entidade **Devices**.

```yaml
domain:
  enums:
    - name: DeviceType
      values:
        - name: phone
          value: phone
        - name: computer
          value: computer
        - name: robot
          value: robot
  entities:
    ...
    - name: Devices
      extends: Products
      primaryKey: ["id"]
      uniqueKey: ["name"]
      properties:
        - name: id
          length: 32
          required: true
          default: 'concat(type,"-",switch(type){case"phone":imei;default:mac;})'
        - name: type
          length: 16
          required: true
          enum: DeviceType
        - name: name
          length: 32
          required: true
    ...
```

### Entidade {#entity}

Uma entidade é definida com suas propriedades, relações e restrições.

| Chave         | Descrição                                                                                         | Obrigatória |
|-------------|---------------------------------------------------------------------------------------------------|:--------:|
| name        | Nome da entidade. Um nome com ponto (`Orders.details`) define uma [entidade composta](SchemaDefinition-Composite.md). | sim |
| properties  | Propriedades da entidade.                                                                         | sim      |
| abstract    | A entidade é usada apenas como base para outras entidades (nenhuma tabela é criada para ela).     |          |
| extends     | Nome da entidade cujas propriedades, chave primária e relações esta entidade herda.              |          |
| singular    | Nome no singular, usado nas classes geradas por `lambdaorm build` (por padrão, é deduzido do nome). |  |
| view        | A entidade é uma view: o push não cria tabela para ela (veja abaixo).                             |          |
| primaryKey  | Propriedades da chave primária.                                                                   |          |
| uniqueKey   | Propriedades da chave única.                                                                      |          |
| required    | Propriedades obrigatórias (o mesmo que `required: true` em cada uma delas).                       |          |
| indexes     | Índices (veja [Índice](#index)).                                                                  |          |
| relations   | Relações com outras entidades.                                                                    |          |
| constraints | Restrições validadas quando um registro é gravado.                                                |          |
| observability | `trace`: uma condição que decide quais das suas sentenças são rastreadas, em vez das regras de traces (veja [Observabilidade](Observability.md)). |  |

As propriedades da chave primária e da chave única são obrigatórias, a menos que indiquem o contrário; uma propriedade `autoIncrement` nunca é obrigatória (o banco de dados fornece o seu valor).

#### Abstract e extends na entidade {#abstract-and-extends-in-entity}

Neste exemplo, a entidade abstrata **Positions** é definida, e a entidade **Countries** a estende: Countries recebe as propriedades `latitude` e `longitude`.

```yaml
domain:
  entities:
    - name: Positions
      abstract: true
      properties:
        - name: latitude
          length: 16
        - name: longitude
          length: 16
    - name: Countries
      extends: Positions
      primaryKey: ["iso3"]
      uniqueKey: ["name"]
      properties:
        - name: name
          required: true
        - name: iso3
          length: 3
          required: true
```

Uma entidade não precisa ser abstrata para ser estendida. Veja [Extend](SchemaExample-Extend.md).

#### Definir a entidade como view {#set-entity-as-view}

Este exemplo define a entidade **Users** como view, porque sua tabela é gerenciada por um sistema externo.
O push não cria tabela para uma entidade view, e os comandos de stage não a alteram.
(Isto é uma tabela ou view do banco de dados; as [views do esquema](Views.md), `infrastructure.views`, são outra coisa.)

```yaml
domain:
  entities:
    ...
    - name: Users
      view: true
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
    ...
```

### Propriedade {#property}

| Chave           | Descrição                                                                           | Obrigatória | Padrão     |
|---------------|-------------------------------------------------------------------------------------|:--------:|:----------:|
| name          | Nome da propriedade.                                                                | sim      |            |
| type          | Tipo da propriedade (veja [Tipos de propriedade](#property-types)).                 |          | string     |
| length        | Comprimento de uma propriedade string, ou as dimensões de um `vector`.              |          | veja abaixo |
| required      | A propriedade não pode ser nula.                                                    |          | false      |
| autoIncrement | O valor é gerado pelo banco de dados (ou pela API, em uma fonte Http).              |          | false      |
| enum          | Nome do enum ao qual o valor deve pertencer.                                        |          |            |
| view          | A propriedade não é armazenada: seu valor vem de `readExp`.                         |          | false      |
| default       | Expressão avaliada pelo λORM para definir o valor quando um registro é inserido.    |          |            |
| readExp       | Expressão de leitura, resolvida na fonte (banco de dados).                          |          |            |
| readValue     | Expressão avaliada pelo λORM sobre o valor lido da fonte.                           |          |            |
| writeValue    | Expressão avaliada pelo λORM sobre o valor antes de ser gravado.                    |          |            |
| key           | Valor fixo usado para filtrar leituras e atualizações, e atribuído na inserção.     |          |            |
| pii           | O tipo de dado pessoal que ela contém (`email`, `phone`, `card`, `id`, `name` ou outra palavra), para que uma view possa mascará-lo, aplicar hash ou excluí-lo (veja [Dados pessoais](Views.md#personal-data-pii)). |  |  |

#### Tipos de propriedade {#property-types}

| Tipo      | Valor em Node            | Coluna criada pelo push (por padrão)                                                       |
|-----------|--------------------------|--------------------------------------------------------------------------------------------|
| string    | string                   | `VARCHAR(length)`; sem `length`: `TEXT` no PostgreSQL, `VARCHAR(80)` nos demais mecanismos (Oracle `VARCHAR2`) |
| integer   | number                   | `INTEGER` (Oracle `NUMBER(10)`)                                                            |
| decimal   | number                   | `DECIMAL(10,4)` (Oracle `NUMBER(19,4)`)                                                    |
| boolean   | boolean                  | `BOOLEAN` (SqlServer `BIT`, Oracle `CHAR(1)`)                                              |
| dateTime  | Date                     | `TIMESTAMP` (PostgreSQL), `DATETIME` (MySQL, MariaDB, SqlServer, SQLite), `DATE` (Oracle)  |
| date      | Date                     | `DATE` (SqlServer `SMALLDATETIME`)                                                         |
| time      | Date                     | `TIME` (Oracle `DATE`)                                                                     |
| json      | objeto ou lista          | `JSONB` (PostgreSQL), `JSON` (MySQL, MariaDB, SQLite), `NVARCHAR(MAX)` (SqlServer), `CLOB` (Oracle) |
| point     | GeoJSON `Point`          | `geography(Point, 4326)` (PostgreSQL com PostGIS), `POINT SRID 4326` (MySQL), `POINT` (MariaDB), `geography` (SqlServer), `SDO_GEOMETRY` (Oracle com Spatial), `TEXT` (SQLite, sem as funções geo) |
| vector    | number[]                 | `vector(length)` (PostgreSQL com pgvector), `VECTOR(length)` (MariaDB 11.7, SQL Server 2025), `VECTOR(length, FLOAT32)` (Oracle 23ai); não no MySQL, SQLite nem MongoDB |

No MongoDB, cada valor é armazenado como um campo do documento (um `point` como GeoJSON).

- **json**: objetos e listas são gravados e lidos como tais (não é necessário chamar `JSON.stringify` nem `JSON.parse`). Uma consulta pode ler e gravar um caminho dentro dele (`p.meta.address.city`); veja [JSON, vetores e pontos](../queries/JsonVectorsPoints.md).
- **point**: um ponto GeoJSON, `{ "type": "Point", "coordinates": [longitude, latitude] }`, gravado e lido como tal; é usado com `distance`, `within` e `inside`.
- **vector**: uma lista de números cujas dimensões são o seu `length` (por exemplo, as 1536 de um embedding); é usado com `cosineDistance`, `l2Distance` e `innerProduct`.
- **dateTime**: no PostgreSQL, o valor é gravado com milissegundos e seu deslocamento, de modo que uma coluna `timestamptz` (veja `dbType` em [Mapeamento de propriedade](#property-mapping)) preserva o instante exato.
- **string sem comprimento**: no PostgreSQL é ilimitada (`TEXT`); nos demais mecanismos é `VARCHAR(80)`, então defina `length` quando um valor puder ser mais longo.
- `''`, `0` e `false` são valores, nunca NULL (o Oracle é a exceção: ele armazena `''` como NULL).

Veja também [Mecanismos de banco de dados](Engines.md) para as diferenças entre os mecanismos.

Neste exemplo, `name` não tem comprimento, `settings` é um objeto JSON, `createdAt` uma data e hora, `location` um ponto e `embedding` um vetor de 1536 dimensões:

```yaml
domain:
  entities:
    - name: Products
      primaryKey: ["id"]
      properties:
        - name: id
          length: 36
          required: true
        - name: name                # TEXT on PostgreSQL, VARCHAR(80) elsewhere
          required: true
        - name: settings
          type: json                # { "color": "red", "tags": ["a", "b"] } in and out as an object
        - name: createdAt
          type: dateTime
        - name: location
          type: point               # { "type": "Point", "coordinates": [-58.38, -34.6] }
        - name: embedding
          type: vector
          length: 1536
```

#### Definir a propriedade como view e readExp {#set-property-as-view-and-readexp}

Uma propriedade view não é armazenada no banco de dados (o push não cria coluna para ela): seu valor é calculado na leitura, com a expressão em **readExp**.
Neste exemplo, `fullName` é construída a partir de `lastname` e `firstname`.

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
        - name: fullName
          view: true
          readExp: concat(lastname,", ",firstname)
    ...
```

**readExp** também pode ser definida em uma propriedade armazenada: a expressão é aplicada na leitura, e nada muda na gravação.
Como é traduzida para a linguagem da fonte, ela só pode usar funções que o λORM traduz (`concat`, `substring`, `upper`, `iif`…).

#### Valor padrão na propriedade {#default-value-in-property}

Quando um registro é inserido sem valor para a propriedade, a expressão em **default** é avaliada pelo λORM (não pelo banco de dados) e seu resultado é gravado.
Neste exemplo, o `id` de um grupo é construído a partir de seu nome.

```yaml
domain:
  entities:
    - name: Groups
      extends: Basics
      primaryKey: ["id"]
      uniqueKey: ["name"]
      properties:
        - name: id
          length: 32
          default: lower(substring(replace(name," ","-"),0,32))
          required: true
        - name: name
          length: 32
          required: true
```

Um `default` também pode ler o [contexto](Context.md) de quem executa a consulta, por exemplo `default: context.tenant`.

#### Valor de leitura e gravação na propriedade {#read-and-write-value-in-property}

**readValue** e **writeValue** são avaliadas pelo λORM: **writeValue** transforma o valor antes de ser gravado, e **readValue** transforma o valor lido do banco de dados.
Neste exemplo, o e-mail é armazenado criptografado e retornado descriptografado; a chave vem de uma variável de ambiente.

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
        - name: email
          required: true
          length: 255
          writeValue: encrypt(lower(email),"${USERS_SECRET_KEY}")
          readValue: decrypt(email,"${USERS_SECRET_KEY}")
    ...
```

#### Valor de chave na propriedade {#key-value-in-property}

O valor definido em **key** é usado como filtro nas consultas de leitura, atualização e exclusão, e é atribuído à propriedade quando um registro é inserido.

Isso é útil para definir várias entidades sobre a mesma tabela ou coleção.
Neste exemplo, uma tabela **Locations** armazena países, estados e cidades, e cada um é tratado como uma entidade separada:

```yaml
domain:
  entities:
    - name: Locations
      abstract: true
      primaryKey: ["type","code"]
      uniqueKey: ["type","name"]
      properties:
        - name: code
          required: true
          length: 16
        - name: type
          required: true
          length: 16
        - name: name
          required: true
    - name: Countries
      extends: Locations
      properties:
        - name: type
          key: 'country'
    - name: States
      extends: Locations
      properties:
        - name: type
          key: 'state'
    - name: Cities
      extends: Locations
      properties:
        - name: type
          key: 'city'
infrastructure:
  mappings:
    - name: default
      entities:
        - name: Locations
          abstract: true
          mapping: TBL_LOCATIONS
          properties:
            - name: code
              mapping: CODE
            - name: type
              mapping: TYPE
            - name: name
              mapping: NAME
        - name: Countries
          extends: Locations
        - name: States
          extends: Locations
        - name: Cities
          extends: Locations
```

### Índice {#index}

| Chave    | Descrição                                                                                         | Obrigatória |
|----------|---------------------------------------------------------------------------------------------------|:--------:|
| name     | Nome do índice.                                                                                   | sim      |
| fields   | Propriedades do índice.                                                                           | sim      |
| type     | Um tipo de índice do mecanismo: `hnsw` ou `ivfflat` para um vetor, `spatial` para um ponto.       |          |
| distance | A distância de um índice vetorial: `cosine`, `l2` ou `ip`.                                        |          |

O push cria cada índice com o template do dialeto para o seu `type` (e `distance`); um dialeto sem esse template não o suporta. Hoje `hnsw` existe no PostgreSQL, MariaDB e Oracle, `ivfflat` apenas no PostgreSQL, e `spatial` no PostgreSQL (GIST), MySQL, MariaDB e SQL Server.

```yaml
domain:
  entities:
    - name: Documents
      primaryKey: ["id"]
      indexes:
        - { name: ix_title, fields: [title] }
        - { name: ix_embedding, fields: [embedding], type: hnsw, distance: cosine }
      properties:
        - { name: id, type: integer, autoIncrement: true }
        - { name: title, length: 200 }
        - { name: embedding, type: vector, length: 1536 }
    - name: Stores
      primaryKey: ["id"]
      indexes:
        - { name: ix_location, fields: [location], type: spatial }
      properties:
        - { name: id, type: integer, autoIncrement: true }
        - { name: location, type: point, required: true }
```

### Relação {#relation}

| Chave       | Descrição                                                                                           | Obrigatória | Padrão    |
|-----------|-----------------------------------------------------------------------------------------------------|:--------:|:---------:|
| name      | Nome da relação.                                                                                    | sim      |           |
| from      | Propriedade desta entidade, ou uma lista de propriedades para uma relação de vários campos.         | sim      |           |
| entity    | Entidade relacionada.                                                                               | sim      |           |
| to        | Propriedade da entidade relacionada, ou uma lista com tantas propriedades quanto `from`.            | sim      |           |
| type      | Tipo da relação (veja abaixo).                                                                      |          | oneToMany |
| composite | Os registros relacionados fazem parte desta entidade (veja [Entidade composta](SchemaDefinition-Composite.md)). |  | false |
| weak      | O push não cria chave estrangeira para a relação (por exemplo, entre entidades em fontes diferentes). |        | false     |
| target    | Nome da relação inversa criada na entidade relacionada.                                             |          |           |

O tipo da relação determina o que ela retorna:

| Tipo      | Significado                                                          | Retorna         |
|-----------|----------------------------------------------------------------------|-----------------|
| oneToMany | Muitos registros desta entidade referenciam um registro de `entity`. | um objeto       |
| manyToOne | Muitos registros de `entity` referenciam este registro.              | uma lista       |
| oneToOne  | Um registro desta entidade se relaciona com um registro de `entity`. | um objeto       |

Observe que os nomes dizem quantos registros **desta** entidade existem para cada registro de `entity`: um pedido tem uma relação `oneToMany` com o seu cliente (muitos pedidos, um cliente), e o cliente uma relação `manyToOne` com os seus pedidos.
Relações `manyToOne` são sempre fracas (weak).

#### Relação de vários campos {#relation-of-several-fields}

Quando a chave da entidade relacionada tem mais de um campo, `from` e `to` são listas do mesmo comprimento, emparelhadas em ordem:

```yaml
relations:
  - name: area
    from: [locationId, areaId]
    entity: Areas
    to: [locationId, code]
```

#### Relação target {#target-relation}

Com **target**, a relação inversa é criada na entidade relacionada.
Por exemplo, se a entidade **DeviceStatuses** tem uma relação com **Devices** com `target: statuses`, uma relação chamada **statuses** é criada em **Devices**.
O tipo da relação target depende do tipo da relação de origem:

| Origem    | Target    |
|-----------|-----------|
| oneToMany | manyToOne |
| oneToOne  | oneToOne  |

```yaml
domain:
  entities:
    - name: DeviceStatuses
      extends: Basics
      primaryKey: ["id"]
      indexes:
        - name: time
          fields: ["time"]
      properties:
        - name: id
          type: integer
          required: true
          autoIncrement: true
        - name: deviceId
          length: 32
          required: true
        - name: time
          type: dateTime
      relations:
        - name: device
          from: deviceId
          entity: Devices
          to: id
          target: statuses
```

### Restrição {#constraint}

| Chave       | Descrição                           | Obrigatória |
|-----------|-------------------------------------|:--------:|
| message   | Mensagem retornada quando falha.    | sim      |
| condition | Expressão booleana a avaliar.       | sim      |

As restrições são expressões avaliadas pelo λORM quando um registro é inserido ou atualizado.
O ORM também cria restrições a partir de outras definições, por exemplo:

- Uma propriedade obrigatória recebe uma restrição que verifica que ela não é nula.
- Uma propriedade cujo tipo é um **enum** recebe uma restrição que verifica que o valor pertence ao enum.

Você pode adicionar suas próprias restrições com uma **message** e uma **condition**: quando a condição não é atendida, a gravação falha com a mensagem.
Neste exemplo, são validados o formato do e-mail e a ordem de duas datas:

```yaml
domain:
  entities:
    - name: Users
      properties:
        ...
        - name: email
          required: true
          length: 255
          writeValue: encrypt(lower(email),"${USERS_SECRET_KEY}")
          readValue: decrypt(email,"${USERS_SECRET_KEY}")
      constraints:
        - message: invalid email
          condition: test(email,"^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$")
    - name: Files
      properties:
        - name: id
          length: 255
          required: true
        - name: type
          length: 16
          required: true
          enum: FileType
        - name: deviceId
          length: 32
          required: true
        - name: startDate
          type: dateTime
          required: true
        - name: endDate
          type: dateTime
          required: true
      constraints:
        - message: endDate cannot be less than startDate
          condition: startDate<=endDate
```

## Aplicação {#application}

| Chave       | Descrição                                                         |
|:----------|:------------------------------------------------------------------|
| start     | Tarefas executadas quando o ORM é inicializado (`orm.init()`).    |
| end       | Tarefas executadas quando o ORM é encerrado (`orm.end()`).        |
| listeners | Expressões executadas antes ou depois de uma consulta, ou quando ela falha. |
| queries   | Consultas nomeadas da aplicação, cujos tipos e funções o `lambdaorm build` gera. |

### Tarefa {#task}

Cada tarefa de `start` e `end` tem:

| Chave        | Descrição                                           | Obrigatória |
|------------|-----------------------------------------------------|:--------:|
| name       | Nome da tarefa.                                     | sim      |
| expression | Expressão a executar.                               | sim      |
| condition  | A tarefa só é executada quando esta expressão é verdadeira. |   |

### Listener {#listener}

| Chave           | Descrição                                                                                     | Obrigatória | Padrão  |
|---------------|-----------------------------------------------------------------------------------------------|:--------:|:-------:|
| name          | Nome do listener.                                                                             | sim      |         |
| on            | Categorias de consulta que o disparam: `select`, `insert`, `upsert`, `update`, `delete`.      | sim      |         |
| condition     | O listener só é executado quando esta expressão é verdadeira.                                 |          |         |
| before        | Expressão executada antes da consulta.                                                        |          |         |
| after         | Expressão executada depois da consulta.                                                       |          |         |
| error         | Expressão executada quando a consulta falha.                                                  |          |         |
| transactional | `false` executa o listener fora da transação da consulta.                                     |          | true    |

Veja [Listener](SchemaExample-Listener.md) para saber como os listeners são executados e os argumentos que recebem.

### Consulta nomeada {#named-query}

| Chave       | Descrição                                                        | Obrigatória |
|-------------|------------------------------------------------------------------|:--------:|
| name        | Nome da consulta: um identificador, único no esquema.            | sim      |
| query       | A expressão da consulta; suas variáveis são os seus parâmetros.  | sim      |
| description | O que a consulta retorna; vai para o comentário do seu tipo.     |          |

As consultas são validadas quando o esquema é carregado (uma consulta que não compila é um erro), e o `lambdaorm build` grava `queries.ts` ao lado de `model.ts`, com o tipo do resultado de cada consulta, o tipo dos seus parâmetros e uma função que a executa. Veja [Consultas tipadas](../usage/TypedQueries.md).

```yaml
application:
  queries:
    - name: deviceWithType
      description: a device with its type and category
      query: 'Devices.filter(p => p.code == code).include(p => p.deviceType.include(t => t.category))'
```

## Infraestrutura {#infrastructure}

| Chave         | Descrição                                                                   |
|---------------|-----------------------------------------------------------------------------|
| mappings      | Como as entidades são mapeadas para as tabelas ou coleções dos bancos de dados (ou para as rotas de uma API). |
| sources       | Os bancos de dados (ou APIs REST) e suas conexões.                          |
| stages        | Cenários que decidem de qual fonte cada entidade é lida e em qual é gravada, e os dados com que começam. |
| views         | Formas de ver o domínio: apenas algumas entidades e propriedades, propriedades mascaradas ou calculadas, linhas filtradas. |
| paths         | Pastas onde os arquivos gerados, o estado do ORM e os logs são gravados.    |
| outbox        | As alterações dos dados gravadas na mesma transação, para que um dispatcher as entregue. |
| migrations    | O histórico das migrações no banco de dados, para o `lambdaorm migrate`.    |
| crossSource   | O limite de linhas de uma consulta cujos campos vêm de várias fontes.       |
| observability | Logs, métricas e traces com OpenTelemetry (veja [Observabilidade](Observability.md)). |
| queue         | Fila Kafka, usada pelo [Data Gateway](../data-gateway/index.md).            |

Quando algumas delas são omitidas, o λORM as completa:

- Sem `mappings`, é criado um mapeamento vazio (com o nome da fonte quando há apenas uma fonte).
- Uma fonte sem `mapping` usa o primeiro mapeamento.
- Sem `stages`, é criado um stage chamado `default` com a primeira fonte.
- A view `default`, que é o domínio sem restrições, sempre existe.

### Mapeamento {#mapping}

Um mapeamento define como as entidades são armazenadas nas tabelas ou coleções de um banco de dados.
Entidades e propriedades que não estão listadas são mapeadas para uma tabela ou coluna com o mesmo nome.

| Chave      | Descrição                                                  | Obrigatória |
|----------|------------------------------------------------------------|:--------:|
| name     | Nome do mapeamento.                                        | sim      |
| entities | Mapeamentos de entidade.                                   |          |
| extends  | Nome de um mapeamento cujos mapeamentos de entidade este herda. |     |

#### Mapeamento de entidade {#entity-mapping}

| Chave        | Descrição                                                    | Obrigatória | Padrão          |
|------------|--------------------------------------------------------------|:--------:|:---------------:|
| name       | Nome da entidade.                                            | sim      |                 |
| mapping    | Nome da tabela ou coleção no banco de dados; em uma fonte Http, a sua rota (`/invoices`). |  | o nome da entidade |
| abstract   | O mapeamento de entidade é usado apenas como base para outros. |        |                 |
| extends    | Nome do mapeamento de entidade do qual este herda.           |          |                 |
| sequence   | Nome da sequência usada para gerar os valores.               |          |                 |
| filter     | Expressão que filtra os registros da tabela, para todas as views. Pode ler o [contexto](Context.md). |  |  |
| http       | Em uma fonte Http, o que difere da convenção REST (veja [Uma API REST como fonte](HttpSource.md)). |  |  |
| properties | Mapeamentos de propriedade.                                  |          |                 |

##### Abstract e extends no mapeamento de entidade {#abstract-and-extends-in-entity-mapping}

Mapeamentos de entidade abstratos são úteis como base para outros mapeamentos de entidade.
Este exemplo define o mapeamento de entidade abstrato **Locations**, e as entidades concretas o estendem, de modo que as três são armazenadas na tabela `TBL_LOCATIONS`.

```yaml
...
infrastructure:
  mappings:
    - name: default
      entities:
        - name: Locations
          abstract: true
          mapping: TBL_LOCATIONS
          properties:
            - name: code
              mapping: CODE
            - name: type
              mapping: TYPE
            - name: name
              mapping: NAME
        - name: Countries
          extends: Locations
        - name: States
          extends: Locations
        - name: Cities
          extends: Locations
...
```

##### Filtro no mapeamento de entidade {#filter-in-entity-mapping}

O filtro de um mapeamento de entidade é adicionado a cada select, update e delete da entidade, aos joins por uma relação e aos includes.
Este exemplo lê os usuários da tabela **user_entity** que pertencem a um determinado **realmId**.

```yaml
...
infrastructure:
  mappings:
    - name: default
    - name: keycloak
      entities:
        - name: Users
          mapping: user_entity
          filter: realmId == "${REALM_ID}"
          properties:
            - name: username
              mapping: username
            - name: firstname
              mapping: first_name
            - name: lastname
              mapping: last_name
            - name: email
              mapping: email
            - name: created
              mapping: created_timestamp
              readMappingExp: millisecondToDate(created/1000)
            - name: realmId
              length: 255
              mapping: realm_id
...
```

`${REALM_ID}` é substituído uma única vez, quando o esquema é carregado. Para filtrar por quem executa cada consulta, use `context` (`filter: realmId == context.realm`); veja [Contexto e filtros de linhas](Context.md).

#### Mapeamento de propriedade {#property-mapping}

| Chave             | Descrição                                                                           | Obrigatória | Padrão            |
|-----------------|-------------------------------------------------------------------------------------|:--------:|:-----------------:|
| name            | Nome da propriedade.                                                                | sim      |                   |
| mapping         | Nome da coluna no banco de dados (ou do campo na API).                              |          | o nome da propriedade |
| readMappingExp  | Expressão de leitura, resolvida na fonte.                                           |          |                   |
| dbType          | Tipo de coluna usado pelo push (DDL), em vez do deduzido a partir do tipo da propriedade. |    |                   |
| previousMapping | Nome anterior da coluna: o push renomeia a coluna em vez de adicionar uma nova.     |          |                   |

##### Tipo de coluna no mapeamento de propriedade {#column-type-in-property-mapping}

**dbType** define o tipo de coluna usado por todo DDL que cria ou altera a coluna (`push`, `push -o`).
Use-o para escolher um tipo que o tipo da propriedade sozinho não fornece, por exemplo um instante com milissegundos ou um JSON binário no PostgreSQL:

```yaml
infrastructure:
  mappings:
    - name: catalog
      entities:
        - name: Products
          mapping: products
          properties:
            - name: settings
              mapping: settings
              dbType: jsonb
            - name: createdAt
              mapping: created_at
              dbType: timestamptz(3)
```

##### Renomear uma coluna com previousMapping {#rename-a-column-with-previousmapping}

Para renomear uma coluna sem perder seus dados, defina o novo nome em **mapping** e o atual em **previousMapping**.
O push então gera `ALTER TABLE … RENAME COLUMN icon TO icon_name` (SqlServer `sp_rename`) em vez de adicionar uma nova coluna.

```yaml
infrastructure:
  mappings:
    - name: catalog
      entities:
        - name: Categories
          mapping: categories
          properties:
            - name: icon
              mapping: icon_name
              previousMapping: icon
```

Remova **previousMapping** quando a renomeação tiver sido aplicada em todos os bancos de dados. Renomear uma tabela não é suportado.

##### Expressão de leitura no mapeamento de propriedade {#read-expression-in-property-mapping}

A expressão em **readMappingExp** é resolvida na fonte, e seu resultado é retornado nas consultas de leitura.
Neste exemplo, a coluna `created_timestamp`, armazenada em milissegundos, é retornada como data:

```yaml
infrastructure:
  mappings:
    - name: default
    - name: keycloak
      entities:
        - name: Users
          mapping: user_entity
          filter: realmId == "${REALM_ID}"
          properties:
            ...
            - name: created
              mapping: created_timestamp
              readMappingExp: millisecondToDate(created/1000)
            - name: realmId
              length: 255
              mapping: realm_id
...
```

### Fonte {#source}

Uma fonte é um banco de dados (ou uma API REST) e sua conexão.

| Chave        | Descrição                                                                | Obrigatória | Padrão            |
|------------|--------------------------------------------------------------------------|:--------:|:-----------------:|
| name       | Nome da fonte.                                                           | sim      |                   |
| dialect    | Dialeto: `MySQL`, `MariaDB`, `PostgreSQL`, `Oracle`, `SqlServer`, `MongoDB`, `SQLjs` (SQLite) ou `Http` (uma API REST). | sim |  |
| mapping    | Nome do mapeamento usado pela fonte.                                     |          | o primeiro mapeamento |
| connection | Conexão: um objeto, um texto JSON ou uma variável de ambiente que a contém. | sim   |                   |

A conexão é a do driver de cada mecanismo:

| Dialeto          | Conexão                                                                                          |
|------------------|--------------------------------------------------------------------------------------------------|
| MySQL, MariaDB   | `{ host, port, user, password, database }` (opções do [mysql2](https://www.npmjs.com/package/mysql2), como `multipleStatements`) |
| PostgreSQL       | `{ host, port, user, password, database }` (opções do [pg](https://www.npmjs.com/package/pg))    |
| SqlServer        | `{ server, authentication: { type: default, options: { userName, password } }, options: { port, database, encrypt } }` ([tedious](https://www.npmjs.com/package/tedious)) |
| Oracle           | `{ connectString, user, password }` ([oracledb](https://www.npmjs.com/package/oracledb))          |
| MongoDB          | `{ url, database }`                                                                              |
| SQLjs (SQLite)   | O caminho do arquivo, ou `{ file }`; `{}` ou `":memory:"` para um banco de dados em memória      |
| Http             | `{ url, headers, timeout, auth, forward }` (veja [Uma API REST como fonte](HttpSource.md))       |

O SQLite é executado dentro do processo com [sql.js](https://www.npmjs.com/package/sql.js), sem servidor: o arquivo é lido quando a primeira conexão é aberta (um arquivo inexistente começa vazio) e gravado quando o ORM termina (`orm.end()`).

#### Definir a conexão na fonte {#set-connection-in-source}

A conexão pode ser definida com uma variável de ambiente ou diretamente no esquema.
Escrevê-la no esquema não é recomendado, por questões de segurança e porque a conexão normalmente muda de um ambiente para outro; faça isso apenas em um teste local temporário.

Usando uma variável de ambiente:

```yaml
...
infrastructure:
  sources:
    - name: test
      dialect: MySQL
      mapping: test
      connection: ${CNN_MYSQL}
...
```

No esquema:

```yaml
...
infrastructure:
  sources:
    - name: test
      dialect: MySQL
      mapping: test
      connection:
        host: localhost
        port: 3306
        user: test
        password: test
        database: test
...
```

Um arquivo SQLite:

```yaml
infrastructure:
  sources:
    - name: main
      dialect: SQLjs
      connection: data/shop.sqlite
```

### Stage {#stage}

Um stage é um cenário: suas regras decidem qual fonte cada entidade usa.
Uma consulta é executada no stage indicado em suas opções; sem ele, é executada no primeiro stage.

| Chave   | Descrição                                                                    | Obrigatória |
|---------|------------------------------------------------------------------------------|:--------:|
| name    | Nome do stage.                                                               | sim      |
| sources | Regras de fonte.                                                             | sim      |
| seed    | Arquivos de dados com que o stage começa, relativos ao esquema, aplicados em ordem (veja [Seed](SchemaSynchronization-Seed.md)). |  |

#### Regra de fonte {#source-rule}

| Chave       | Descrição                                      | Obrigatória | Padrão  |
|-----------|------------------------------------------------|:--------:|:-------:|
| name      | Nome da fonte.                                 | sim      |         |
| condition | Expressão booleana que seleciona a fonte.      |          | true    |

#### Condição na regra de fonte {#condition-on-source-rule}

**condition** decide em qual fonte uma consulta ou uma sentença DDL é executada.
As variáveis disponíveis na expressão são:

| Variável | Descrição                                      | Valor                                                                  |
|----------|------------------------------------------------|------------------------------------------------------------------------|
| entity   | Entidade da sentença                           | nome da entidade                                                       |
| action   | Ação da sentença                               | `select`, `insert`, `bulkInsert`, `update`, `upsert`, `delete`, `createEntity`, … |
| category | Categoria da sentença                          | `select`, `insert`, `upsert`, `update`, `delete`, `create`, `alter`, `drop`, … |
| type     | Tipo da sentença                               | `dql`, `dml`, `ddl`                                                    |
| read     | A sentença lê                                  | booleano                                                               |
| write    | A sentença grava                               | booleano                                                               |
| dml      | A sentença é uma consulta (DQL ou DML)         | booleano                                                               |
| ddl      | A sentença é DDL                               | booleano                                                               |

As regras são avaliadas na ordem em que são definidas, e é usada a primeira fonte cuja condição seja verdadeira.
A condição não pode ler o [contexto](Context.md): a rota é decidida quando a consulta é compilada, e fica em cache.

No exemplo a seguir, a entidade **Users** usa a fonte **keycloak**, e todas as outras entidades usam a fonte **main**.

```yaml
...
infrastructure:
  stages:
    - name: default
      sources:
        - name: main
          condition: entity != "Users"
        - name: keycloak
          condition: entity == "Users"
```

#### Fonte coringa {#catch-all-source}

Uma regra de fonte sem **condition** é uma fonte coringa (catch-all): como prevalece a primeira fonte que corresponde, ela recebe apenas as entidades que nenhuma fonte anterior recebeu.
Isso se aplica tanto às consultas (DML) quanto ao push e aos demais comandos de stage (DDL), de modo que a fonte coringa não recebe as tabelas das entidades atribuídas a outras fontes.
Coloque-a por último.

```yaml
infrastructure:
  stages:
    - name: default
      sources:
        - name: keycloak
          condition: entity == "Users"
        - name: main
```

### View {#view}

Uma view é uma forma de ver o domínio: apenas algumas entidades e propriedades, propriedades mascaradas ou calculadas, e linhas filtradas.
Uma consulta usa a view indicada na opção `view`; sem ela, usa a view `default`, que é o domínio e não pode ser alterada.
As entidades que uma view não lista são vistas como estão no domínio.
[Visões](Views.md) as explica em profundidade.

| Chave    | Descrição                                                                   | Obrigatória |
|----------|-----------------------------------------------------------------------------|:--------:|
| name     | Nome da view.                                                               | sim      |
| pii      | O que a view faz com cada propriedade do domínio que tem `pii`: `mask`, `hash` ou `exclude`. |  |
| entities | Views de entidade.                                                          |          |

No exemplo a seguir, a view **support** mascara `apiKey`, mostra `created` sem a hora e oculta `email`, a view **collector** não pode acessar usuários e grupos, e a view **admin**, sem entidades, vê o domínio inteiro.

```yaml
infrastructure:
  views:
    - name: default
      entities:
        - name: Devices
          properties:
            - name: apiKey
              readExp: '"***"'
        - name: Users
          properties:
            - name: created
              readExp: date(created)
            - name: email
              exclude: true
    - name: collector
      entities:
        - name: Users
          exclude: true
        - name: Groups
          exclude: true
        - name: GroupUsers
          exclude: true
    - name: admin
```

#### View de entidade {#entity-view}

| Chave      | Descrição                                                                          | Obrigatória |
|------------|------------------------------------------------------------------------------------|:--------:|
| name       | Nome da entidade.                                                                  | sim      |
| exclude    | A entidade não existe nesta view: qualquer sentença sobre ela é um `ViewError`.    |          |
| filter     | As linhas da entidade na view: uma condição sobre as suas propriedades e o [contexto](Context.md), adicionada a cada sentença sobre ela. |  |
| properties | Views de propriedade.                                                              |          |

##### Exclude na view de entidade {#exclude-in-entity-view}

Uma entidade com **exclude** não pode ser acessada quando esta view é usada.

```yaml
infrastructure:
  views:
    ...
    - name: collector
      entities:
        - name: Users
          exclude: true
        - name: Groups
          exclude: true
        - name: GroupUsers
          exclude: true
    ...
```

#### View de propriedade {#property-view}

| Chave       | Descrição                                                                                   | Obrigatória |
|-------------|---------------------------------------------------------------------------------------------|:--------:|
| name        | Nome de uma propriedade do domínio, ou de uma propriedade nova.                             | sim      |
| exclude     | A propriedade não existe nesta view.                                                        |          |
| default     | Com `exclude`: o valor que cada insert na view grava na propriedade oculta.                 |          |
| readExp     | Expressão de leitura, resolvida na fonte: mascara uma propriedade do domínio, ou calcula uma nova. |  |
| type        | Tipo de uma propriedade nova (`string` por padrão).                                         |          |
| length      | Comprimento de uma propriedade nova.                                                        |          |
| description | Descrição de uma propriedade nova, para os metadados.                                       |          |

A chave primária e as propriedades das relações que a view mantém não podem ser excluídas.

##### Exclude na view de propriedade {#exclude-in-property-view}

Uma propriedade com **exclude** não pode ser acessada quando esta view é usada.

```yaml
infrastructure:
  views:
    - name: support
      entities:
        ...
        - name: Users
          properties:
            - name: created
              readExp: date(created)
            - name: email
              exclude: true
      ...
```

##### Expressão de leitura na view de propriedade {#read-expression-in-property-view}

Com **readExp**, o resultado da expressão é retornado nas consultas de leitura em vez do valor armazenado, e os filtros e as ordenações também o usam.
Neste exemplo, `created` é retornada como data, sem a hora:

```yaml
infrastructure:
  views:
    - name: support
      entities:
        ...
        - name: Users
          properties:
            - name: created
              readExp: date(created)
      ...
```

### Paths {#paths}

Pastas, relativas à pasta do esquema, onde os arquivos gerados, o estado do ORM e os logs são gravados.

| Chave    | Descrição                                                                           | Padrão      |
|--------|-------------------------------------------------------------------------------------|:-----------:|
| src    | Pasta do código-fonte.                                                              | `src`       |
| domain | Pasta, dentro de `src`, onde `lambdaorm build` grava o modelo e os repositórios.   | `domain`    |
| state  | Pasta do estado do ORM (modelo de cada stage, scripts DDL aplicados pelo push e seu desfazer). | `orm_state` |
| logs   | Pasta dos logs gravados em arquivos, como o histórico do esquema.                   | `logs`      |

```yaml
infrastructure:
  paths:
    src: src
    domain: domain
    state: orm_state
    logs: logs
```

### Outbox {#outbox}

Com `outbox`, cada gravação que ele cobre deixa um evento (entidade, ação, chaves, quem e a transação, sem os dados gravados) na entidade `LambdaOrmOutbox`, **na mesma transação** que a alteração, de modo que um dispatcher pode entregá-lo mesmo que o processo pare antes de notificar alguém.
O λORM adiciona a entidade ao domínio e o `push` cria a sua tabela.

| Chave       | Descrição                                                                                       | Padrão  |
|-------------|-------------------------------------------------------------------------------------------------|:-------:|
| entities    | As entidades cujas gravações vão para o outbox.                                                 | todas   |
| actions     | As ações: `insert`, `update`, `delete`, `upsert`, `bulkInsert`, `bulkMerge`, `bulkDelete`.      | todas   |
| condition   | Uma condição sobre a alteração (`entity`, `action`, `keys`, `source`, `actor`…).                |         |
| maxAttempts | As tentativas de um dispatcher antes que um evento seja marcado como `dead`.                    | 10      |

```yaml
infrastructure:
  outbox:
    entities: [Orders, Customers]
    actions: [insert, update, delete]
    condition: 'action != "delete" || entity == "Orders"'
    maxAttempts: 10
```

Os eventos são lidos e entregues com `orm.outbox` (`pending`, `done`, `failed`, `dispatch`); veja [Alterações dos dados e outbox](../usage/DataEvents.md).

### Migrações {#migrations}

Com `migrations: {}`, o λORM adiciona a entidade `LambdaOrmMigrations` ao domínio, e cada `push` registra nela, por fonte, o que fez e como desfazê-lo. Esse histórico é o que o `lambdaorm migrate` usa para voltar a uma versão. Veja [Migrações](SchemaSynchronization-Migrations.md).

```yaml
infrastructure:
  migrations: {}
```

### Entre fontes {#cross-source}

Uma consulta cujo `map`, `sort` ou `having` lê campos de uma entidade em outra fonte é resolvida em parte em memória. Para ordenar, agrupar ou paginar em memória, ela traz no máximo `maxRows` linhas (10000 por padrão), e falha com um `CrossSourceError` quando há mais, em vez de retornar um resultado parcial. `options.maxRows` o altera para uma consulta. Veja [Consultas entre fontes](../queries/CrossSource.md).

```yaml
infrastructure:
  crossSource:
    maxRows: 50000
```

### Observabilidade {#observability}

`observability` configura logs, métricas e traces com OpenTelemetry. Veja [Observabilidade](Observability.md).

### Queue {#queue}

`infrastructure.queue` configura uma fila Kafka. Ela não é usada pelo próprio `@lambdaorm/lib`: é lida pelo [Data Gateway](../data-gateway/index.md) para execuções enfileiradas, e adiciona a função `queue.send(topic, messages)` às expressões.

| Chave       | Descrição                                                                                    |
|-----------|----------------------------------------------------------------------------------------------|
| config    | Configuração do cliente Kafka ([kafkajs](https://kafka.js.org/docs/configuration)).          |
| consumers | Consumidores: cada um tem um `name`, uma `config` de consumidor, um `subscribe` (tópico) e uma expressão `execute` executada para cada mensagem, com as variáveis `message`, `topic` e `partition`. |

Neste exemplo, cada mensagem do tópico `insights-sync` é executada no stage `insights`:

```yaml
infrastructure:
  queue:
    config: $QUEUE_CONFIG
    consumers:
      - name: syncInsights
        config:
          groupId: group1
        subscribe:
          topic: insights-sync
          fromBeginning: true
        execute: orm.execute(message.query, message.data, {stage:"insights"})
```
