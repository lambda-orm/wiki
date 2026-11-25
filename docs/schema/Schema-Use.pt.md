# Uso do esquema {#schema-use}

Esta página mostra como escrever um esquema simples em YAML ou JSON, como gerar a partir dele o modelo e os repositórios com a CLI, e como carregá-lo em uma aplicação.

## Exemplo de configuração simples {#simple-configuration-example}

O mesmo esquema, com uma entidade mapeada para a tabela `TBL_COUNTRIES` de um banco de dados MySQL, escrito em YAML e em JSON.

**Configuração em YAML:**

```yaml
domain:
  entities:
    - name: Countries
      primaryKey: ["iso3"]
      uniqueKey: ["name"]
      properties:
        - name: name
          required: true
        - name: iso3
          length: 3
          required: true
infrastructure:
  mappings:
    - name: mapping1
      entities:
        - name: Countries
          mapping: TBL_COUNTRIES
          properties:
            - name: iso3
              mapping: ISO3
            - name: name
              mapping: NAME
  sources:
    - name: source1
      dialect: MySQL
      mapping: mapping1
      connection: ${CNN_MYSQL}
```

**Configuração em JSON:**

```json
{
  "domain": {
    "entities": [
      {
        "name": "Countries",
        "primaryKey": ["iso3"],
        "uniqueKey": ["name"],
        "properties": [
          { "name": "iso3", "required": true, "type": "string", "length": 3 },
          { "name": "name", "required": true, "type": "string" }
        ]
      }
    ]
  },
  "infrastructure": {
    "mappings": [
      {
        "name": "mapping1",
        "entities": [
          {
            "name": "Countries",
            "mapping": "TBL_COUNTRIES",
            "properties": [
              { "name": "iso3", "mapping": "ISO3" },
              { "name": "name", "mapping": "NAME" }
            ]
          }
        ]
      }
    ],
    "sources": [
      {
        "name": "source1",
        "mapping": "mapping1",
        "dialect": "MySQL",
        "connection": "${CNN_MYSQL}"
      }
    ]
  }
}
```

## Gerar o código-fonte {#build-source-code}

Quando o esquema é criado ou alterado, o modelo e os repositórios são gerados com o comando `build` da CLI ([@lambdaorm/cli](https://www.npmjs.com/package/@lambdaorm/cli)):

```sh
lambdaorm build -l node
```

`-m` gera apenas o modelo e `-r` apenas os repositórios; por padrão, ambos são gerados.
Os arquivos são gravados na pasta `domain` dentro da pasta `src` (veja [Paths](SchemaDefinition.md#paths)). Veja também [Build](../cli/Commands/Build.md).

O arquivo do modelo, `model.ts`, tem uma classe, uma interface de consulta e um queryable para cada entidade:

```typescript
export class Country {
	iso3?: string
	name?: string
}
export interface QryCountry {
	iso3: string
	name: string
}
export let Countries: Queryable<QryCountry>
```

Um arquivo de repositório é gerado para cada entidade, por exemplo `repositoryCountry.ts`. Ele é criado apenas uma vez, então você pode adicionar seu próprio código a ele:

```typescript
import { Repository, IOrm } from '@lambdaorm/lib'
import { Country, QryCountry } from './model'
export class CountryRepository extends Repository<Country, QryCountry> {
	constructor (stage?: string, orm?:IOrm, view?: string) {
		super('Countries', stage, orm, view)
	}
	// Add your code here
}
```

Com `--view <name>`, o `build` gera o modelo e os repositórios dessa [view](Views.md): apenas suas entidades e propriedades, e repositórios que a usam.
Quando o esquema tem [consultas nomeadas](SchemaDefinition.md#named-query) (`application.queries`), o `build` também escreve `queries.ts`, com o tipo do resultado de cada consulta e uma função que a executa (veja [Consultas tipadas](../usage/TypedQueries.md)).

## Definir o esquema {#set-schema}

`orm.init()` inicializa o ORM com o esquema. O esquema pode ser informado de três formas:

- Sem argumentos: o arquivo do esquema é procurado na pasta atual. É usado um arquivo `.yaml`, `.yml` ou `.json` cujo nome contém `lambdaorm` (por exemplo `lambdaORM.yaml`); se não houver nenhum, um cujo nome contém `orm`, `schema` ou `lambda`.
- Com o caminho do arquivo do esquema, incluindo sua extensão (`.yaml`, `.yml` ou `.json`), que indica como lê-lo. Também é possível informar uma pasta.
- Com o esquema como um objeto.

Neste exemplo, o caminho do arquivo do esquema é informado e uma consulta é executada:

```typescript
import { orm } from '@lambdaorm/lib'
(async () => {
	await orm.init('/home/my/app1/lambdaORM.yaml')
	try {
		const countries = await orm.execute(`Countries.map(p=>{name:p.name,code:p.iso3})
                                                  .sort(p=> desc(p.name))
                                                  .page(1,10)`)
		console.log(countries)
	} catch (error) {
		console.log(error)
	} finally {
		await orm.end()
	}
})()
```
