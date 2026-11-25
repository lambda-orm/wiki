# Fetch {#fetch}

Esta página explica o fetch, que mostra as diferenças entre as fontes (bancos de dados) de um stage e o esquema sem aplicar nenhuma alteração: o que ele compara, o comando da CLI `lambdaorm fetch` e o método `orm.stage.fetch()`.
Use-o antes de um push, para ver o que ele alteraria, ou na CI, para detectar um banco de dados que se afastou do modelo.

## O que o fetch compara {#what-fetch-compares}

O fetch lê os bancos de dados do stage e os compara com o modelo (drift). O resultado tem uma entrada por mapeamento, com as entidades que diferem:

- tabelas ausentes no banco de dados ou ausentes no modelo,
- colunas ausentes em um dos lados,
- colunas com outro tipo, comprimento ou nulabilidade,
- uma chave primária diferente.

Cada entidade tem suas `differences`, em texto legível. **Quando os bancos de dados estão sincronizados com o modelo, nenhum mapeamento tem entidades.**

Relações (chaves estrangeiras) e índices não são comparados.
No MongoDB, que não tem esquema, o fetch apenas verifica se cada coleção existe.
No SQLite ele lê a estrutura de `sqlite_master`; no PostgreSQL ele lê as colunas `geography` e `vector` com seu tipo, de modo que não mostram nenhuma diferença falsa.

Exemplo de resultado, depois de adicionar a propriedade `phone` a `Customers` no modelo:

```yaml
- name: default
  entities:
    - name: Customers
      mapping: customers
      differences:
        - column phone missing in the database
```

Resultado quando o banco de dados está sincronizado com o modelo:

```yaml
- name: default
  entities: []
```

## CLI {#cli}

```sh
lambdaorm fetch -s default -o yaml
```

| Opção | Descrição |
|--------|-------------|
| `-w`, `--workspace` | Pasta do projeto (padrão: a pasta atual). |
| `-s`, `--stage` | Nome do stage (padrão: o primeiro stage). |
| `-e`, `--envfile` | Arquivo de variáveis de ambiente a ser lido. |
| `-o`, `--output` | Formato de saída: `json`, `beautiful`, `light` ou `yaml`. |

**O comando termina com código 1 quando há diferenças** (e 0 quando os bancos de dados estão sincronizados), então pode ser usado em CI para detectar drift:

```sh
lambdaorm fetch -s default || echo "the database differs from the model"
```

Veja o [laboratório da CLI](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/cli/10-fetch).

## Node {#node}

`orm.stage.fetch()` retorna as diferenças. Para ler os mapeamentos dos bancos de dados como eles são (todas as tabelas e colunas), use `orm.stage.read()`.

```typescript
import { Orm } from '@lambdaorm/lib'
(async () => {
	const orm = new Orm()
	try {
		await orm.init('./lambdaORM.yaml')
		const mappings = await orm.stage.fetch({ stage: 'default' })
		const differing: any[] = mappings.flatMap(p => p.entities || [])
		for (const entity of differing) {
			console.log(entity.name, entity.differences)
		}
		// the databases' own mappings
		const database = await orm.stage.read({ stage: 'default' })
		await orm.helper.fs.write('./mappings.yaml', orm.helper.yaml.dump(database))
	} finally {
		await orm.end()
	}
})()
```

Veja o [laboratório de Node](https://github.com/lambda-orm/lambdaorm-labs/tree/main/labs/node/10-fetch).
