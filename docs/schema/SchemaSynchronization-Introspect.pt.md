# Introspect {#introspect}

Esta página explica o introspect, que atualiza o esquema a partir da estrutura de um arquivo de dados JSON e depois envia as alterações para as fontes (bancos de dados): o comando da CLI `lambdaorm introspect` e o método `orm.stage.introspect()`.

O introspect:

1. Deduz as entidades, propriedades e relações a partir dos dados e as adiciona ao arquivo do esquema.
2. Executa um [push](SchemaSynchronization-Push.md), para que os bancos de dados do stage recebam as novas tabelas e colunas.

Os dados não são importados; para importá-los também, use [incorporate](SchemaSynchronization-Incorporate.md).

## CLI {#cli}

```sh
lambdaorm introspect -d countries.json -n countries
```

| Opção | Descrição |
|--------|-------------|
| `-d`, `--data` | Arquivo de dados JSON (ou os dados como JSON inline). Obrigatório. |
| `-n`, `--name` | Nome da entidade raiz (padrão: o nome do arquivo). |
| `-w`, `--workspace` | Pasta do projeto (padrão: a pasta atual). |
| `-s`, `--stage` | Nome do stage (padrão: o primeiro stage). |
| `-e`, `--envfile` | Arquivo de variáveis de ambiente a ser lido. |

Este comando atualiza `lambdaORM.yaml` com a estrutura dos dados em `countries.json`, com `Countries` como entidade raiz, e envia as alterações.
Assim como o push, ele grava o modelo do stage e o DDL aplicado a cada fonte na pasta `orm_state`:

```sh
├── countries.json
├── lambdaORM.yaml
└── orm_state
    ├── default-model.json
    └── <source>
        └── V<yyMMddHHmmss>__push.sql
```

DDL aplicado (MySQL):

```sql
CREATE TABLE CountriesLanguages (id INTEGER  AUTO_INCREMENT,languageCode VARCHAR(4) NOT NULL ,countryName VARCHAR(32) NOT NULL ,CONSTRAINT CountriesLanguages_PK PRIMARY KEY (id));
ALTER TABLE CountriesLanguages ADD CONSTRAINT CountriesLanguages_UK UNIQUE (countryName,languageCode);
CREATE TABLE Languages (code VARCHAR(4) NOT NULL ,name VARCHAR(16) NOT NULL ,CONSTRAINT Languages_PK PRIMARY KEY (code));
CREATE TABLE Regions (code VARCHAR(2) NOT NULL ,name VARCHAR(32) NOT NULL ,CONSTRAINT Regions_PK PRIMARY KEY (code));
CREATE TABLE Positions (lat DECIMAL(10,4) NOT NULL ,`long` DECIMAL(10,4) NOT NULL ,CONSTRAINT Positions_PK PRIMARY KEY (lat));
ALTER TABLE Positions ADD CONSTRAINT Positions_UK UNIQUE (`long`);
CREATE TABLE Timezones (GmtOffset INTEGER  ,name VARCHAR(32) NOT NULL ,positionLat DECIMAL(10,4) NOT NULL ,countryName VARCHAR(32) NOT NULL ,CONSTRAINT Timezones_PK PRIMARY KEY (name));
CREATE TABLE Countries (name VARCHAR(32) NOT NULL ,phoneCode INTEGER NOT NULL ,priority INTEGER NOT NULL ,regionCode VARCHAR(2) NOT NULL ,CONSTRAINT Countries_PK PRIMARY KEY (name));
ALTER TABLE Countries ADD CONSTRAINT Countries_UK UNIQUE (phoneCode);
ALTER TABLE CountriesLanguages ADD CONSTRAINT CountriesLanguages_countries_FK FOREIGN KEY (countryName) REFERENCES Countries (name);
ALTER TABLE CountriesLanguages ADD CONSTRAINT CountriesLanguages_languages_FK FOREIGN KEY (languageCode) REFERENCES Languages (code);
ALTER TABLE Timezones ADD CONSTRAINT Timezones_position_FK FOREIGN KEY (positionLat) REFERENCES Positions (lat);
ALTER TABLE Timezones ADD CONSTRAINT Timezones_countries_FK FOREIGN KEY (countryName) REFERENCES Countries (name);
ALTER TABLE Countries ADD CONSTRAINT Countries_region_FK FOREIGN KEY (regionCode) REFERENCES Regions (code);
```

Veja o [laboratório da CLI](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/12-introspect).

## Node {#node}

`orm.stage.introspect(data, name, options)` recebe os dados, o nome da entidade raiz e, opcionalmente, as opções da consulta (por exemplo, o stage):

```typescript
import { Orm } from '@lambdaorm/lib'
(async () => {
	const workspace = process.cwd()
	const orm = new Orm()
	try {
		const data = JSON.parse(await orm.helper.fs.read(workspace + '/countries.json') || '{}')
		await orm.init(workspace + '/lambdaORM.yaml')
		await orm.stage.introspect(data, 'countries', { stage: 'default' })
	} catch (e) {
		console.log(e)
	} finally {
		await orm.end()
	}
})()
```

Como resultado:

- O arquivo `lambdaORM.yaml` é atualizado com a estrutura deduzida dos dados.
- Os bancos de dados do stage são atualizados com o novo esquema.
- O modelo do stage e o DDL aplicado são gravados na pasta `orm_state`.

Veja o [laboratório de Node](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/12-introspect).
