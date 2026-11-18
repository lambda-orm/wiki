# Esquema {#schema}

Esta seção explica o esquema do λORM: o que ele contém, como é definido e usado, e como é sincronizado com os bancos de dados.

O esquema contém toda a configuração de que o ORM precisa. Ele separa o modelo de negócio (**domain**) da persistência dos dados (**infrastructure**):

- No domínio, as entidades e os enums que representam o modelo de negócio são completamente limpos, sem nenhum atributo que os acople à persistência.
- Todas as consultas são escritas sobre o modelo de negócio, de modo que ficam desacopladas do modelo físico dos dados.
- Na infraestrutura, define-se tudo o que é necessário para armazenar e ler os dados nas diferentes fontes (bancos de dados).

O esquema pode ser escrito em um arquivo YAML ou JSON (normalmente `lambdaORM.yaml`), ou passado como um objeto quando o ORM é inicializado.

Todas as expressões usadas para definir condições e ações são avaliadas pelo mecanismo de expressões [3xpr](https://www.npmjs.com/package/3xpr).

## Exemplo {#example}

Este exemplo mostra um stage que usa duas fontes: a fonte 1 é MySQL e contém a tabela `Countries`, e a fonte 2 é PostgreSQL e contém a tabela `States`.

Para a entidade `Countries`, os nomes da tabela e de suas colunas são os mesmos que os nomes da entidade e de suas propriedades, portanto nenhum mapeamento precisa ser escrito.
Para a entidade `States`, os nomes da tabela e de suas colunas são diferentes, então o mapeamento os define.

![diagrama](images/schema5.svg)

## Nesta seção {#in-this-section}

- [Definição](SchemaDefinition.md): todas as chaves do esquema.
- [Expressões](SchemaDefinition-Expressions.md), [Variáveis de ambiente](SchemaDefinition-EnvironmentVariables.md) e [Entidades compostas](SchemaDefinition-Composite.md).
- [Uso do esquema](Schema-Use.md): como carregar o esquema e gerar o modelo.
- Exemplos: [Básico](SchemaExample-Basic.md), [Extend](SchemaExample-Extend.md), [Múltiplos stages](SchemaExample-MultiplesStages.md), [Stage com múltiplas fontes](SchemaExample-StageMultiplesSources.md), [Composto](SchemaExample-Composite.md) e [Listener](SchemaExample-Listener.md).
- [Sincronização](SchemaSynchronization.md): push, pull, fetch, introspect e incorporate.
- [Mecanismos de banco de dados](Engines.md): diferenças entre os mecanismos de banco de dados.

O [Data Gateway](../data-gateway/index.md) publica um esquema pela rede; suas próprias configurações estão em um [arquivo de configuração](../data-gateway/Configuration.md) separado.
