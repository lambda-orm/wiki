# Push {#push}

Esta página explica o push, que atualiza as fontes (bancos de dados) de um stage com o esquema: como ele funciona, o comando da CLI `lambdaorm push` e o método `orm.stage.push()`.

## Como o push funciona {#how-push-works}

O push lê os bancos de dados do stage (como faz o [fetch](SchemaSynchronization-Fetch.md)) e gera o DDL que os leva ao modelo:

- As tabelas que não existem são criadas com sua chave primária, chave única, chaves estrangeiras e índices.
- Nas tabelas existentes, as colunas que faltam são adicionadas (`ALTER TABLE … ADD`) e as colunas com outro tipo, comprimento ou nulabilidade são alteradas.
- Uma coluna declarada com `previousMapping` no mapeamento de sua propriedade é renomeada (`ALTER TABLE … RENAME COLUMN`, SqlServer `sp_rename`) em vez de ser adicionada. Veja [Renomear uma coluna](SchemaDefinition.md#rename-a-column-with-previousmapping).
- **O push nunca remove** nada que exista apenas no banco de dados (tabelas, colunas). O `fetch` o informa, para que possa ser removido à mão se necessário.
- Os tipos das colunas seguem os tipos das propriedades e o `dbType` do mapeamento da propriedade. Veja [Tipos de propriedade](SchemaDefinition.md#property-types).
- Cada entidade vai para a fonte escolhida pelas regras do stage; uma fonte sem condição recebe apenas as entidades que nenhuma outra fonte recebeu.

Como a comparação é feita com os bancos de dados, o push funciona da mesma forma em qualquer host ou job de CI: ele não precisa da pasta `orm_state` de um push anterior.
A pasta `orm_state` continua sendo gravada, como registro do que foi aplicado.

Renomear uma tabela não é suportado.

## CLI {#cli}

Aplicar as alterações:

```sh
lambdaorm push
```

| Opção | Descrição |
|--------|-------------|
| `-w`, `--workspace` | Pasta do projeto (padrão: a pasta atual). |
| `-s`, `--stage` | Nome do stage (padrão: o primeiro stage). |
| `-e`, `--envfile` | Arquivo de variáveis de ambiente a ser lido. |
| `-o`, `--output` | Gera o DDL sem aplicá-lo (veja abaixo). |
| `-f`, `--force` | Quando uma sentença falha, continua com as seguintes. |

Exemplo do DDL gerado em um banco de dados vazio:

```sql
CREATE TABLE Countries (name VARCHAR(80) NOT NULL ,iso3 VARCHAR(3) NOT NULL ,CONSTRAINT Countries_PK PRIMARY KEY (iso3));
ALTER TABLE Countries ADD CONSTRAINT Countries_UK UNIQUE (name);
CREATE TABLE States (id INTEGER NOT NULL ,name VARCHAR(80) NOT NULL ,countryCode VARCHAR(3) NOT NULL ,CONSTRAINT States_PK PRIMARY KEY (id));
ALTER TABLE States ADD CONSTRAINT States_UK UNIQUE (countryCode,name);
ALTER TABLE States ADD CONSTRAINT States_country_FK FOREIGN KEY (countryCode) REFERENCES Countries (iso3);
```

Depois de adicionar uma propriedade `phone` a `Customers` e renomear a coluna `icon` para `icon_name` (com `previousMapping: icon`), um push gera apenas essas alterações:

```sql
ALTER TABLE customers ADD phone VARCHAR(32);
ALTER TABLE categories RENAME COLUMN icon TO icon_name;
```

### Gerar o DDL sem aplicá-lo {#generate-the-ddl-without-applying-it}

Com `-o`, o push gera o DDL, mas não o aplica.

- `-o` sozinho imprime as sentenças de cada fonte.
- `-o <dir>` grava um script por fonte que muda, chamado `<stage>.<source>.sql`. Fontes sem alterações não geram arquivo, e um banco de dados sincronizado com o modelo não gera nenhum arquivo.

```sh
lambdaorm push -s default -o migrations
```

```sh
migrations
├── default.catalog.sql
└── default.accounts.sql
```

Os nomes são determinísticos, então os scripts podem ser renomeados como migrações versionadas e aplicados pelo seu próprio processo de deploy.

### Arquivos em orm_state {#files-in-orm_state}

Quando o push aplica as alterações, ele as registra na pasta `orm_state`:

```sh
├── orm_state
│   ├── default-model.json
│   └── main
│       └── V231122154351__push.sql
```

- `<stage>-model.json`: o modelo do stage no último push.
- `<source>/V<yyMMddHHmmss>__push.sql`: as sentenças executadas nessa fonte.

Laboratórios:

- [Simples](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/01-simple)
- [Dois stages](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/03-two-stages)
- [Northwind](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/05-northwind)
- [Northwind com múltiplas fontes](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/06-northwind-multiples-datasources)
- [Northwind CQRS](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/08-northwind-cqrs)

## Node {#node}

`orm.stage.push()` retorna uma ação que pode fornecer as sentenças sem aplicá-las, ou aplicá-las:

```typescript
import { Orm } from '@lambdaorm/lib'
(async () => {
	const orm = new Orm()
	try {
		await orm.init('./lambdaORM.yaml')
		// the sentences, without applying them
		const sentences = await orm.stage.push({ stage: 'default' }).sentence()
		// the sentences grouped by source: [{ source: 'accounts', sentences: ['ALTER TABLE accounts ADD phone VARCHAR(32)'] }]
		const bySource = await orm.stage.push({ stage: 'default' }).sentencesBySource()
		// apply them
		await orm.stage.push({ stage: 'default' }).execute()
	} finally {
		await orm.end()
	}
})()
```
