# Primeiros passos {#getting-started}

Do nada a uma consulta, uma consulta escrita pelo assistente e um diagrama, no Northwind. Cerca de 10 minutos, com
Docker e um navegador (ou o [aplicativo de desktop](Download.md)).

## 1. Um gateway com o Northwind {#1-a-gateway-with-northwind}

Siga os passos 1 a 4 dos [Primeiros passos](../data-gateway/GettingStarted.md) do Data Gateway: o seu compose inicia o
Postgres, um gateway com o Northwind e a IDE web, cria as tabelas e importa os dados. O gateway tem sua porta
`management`, a porta da IDE, na 9090, alcançada apenas pela IDE dentro do compose.

Com o [aplicativo de desktop](Download.md) em vez da IDE web, publique essa porta apenas na sua máquina, no serviço
`data-gateway` do compose:

```yaml
    ports:
      - "127.0.0.1:9090:9090"   # management, para a IDE de desktop
```

## 2. A conexão {#2-the-connection}

Abra a IDE: a web em `http://localhost:8090`, ou o aplicativo de desktop. Na primeira vez ela abre em uma **Nova
conexão**:

| Campo | Valor |
| --- | --- |
| **Nome** | `northwind` |
| **Protocolo** | `REST · http` |
| **Endereço do management** | `data-gateway:9090` na IDE web (como a IDE o alcança no compose); `localhost:9090` no aplicativo de desktop |
| **Autenticação** | **API key**, **Header** `X-Api-Key`, **Chave** `reader-demo-key` |
| **Lembrar a chave neste navegador** | marcado, para que não seja pedida de novo |

**Testar** diz quem é a chave e a versão do gateway; **Conectar** adiciona a conexão.

![Nova conexão](images/ide-new-connection.png)

A página da conexão se abre. Sua aba **Papéis** mostra o que `reader` pode fazer: `read`, nada mais. Com ela você lê
e consulta; o que você salva fica no seu navegador ([Workbench](Projects.md#where-it-is-saved)).

## 3. O explorador {#3-the-explorer}

À esquerda, a conexão e o seu esquema (`/`, o único deste gateway). Expanda **Metadados → domain →
Entidades**: as entidades do Northwind. Um clique em `Orders` abre a sua vista: suas propriedades, suas relações,
suas chaves, suas linhas e seu diagrama ([Entidades](Entities.md)).

![A vista de Orders](images/ide-entity-properties.png)

## 4. Uma consulta {#4-a-query}

O botão **Consultar** de `Orders` abre uma aba de consulta com `Orders.page(1, 10)`. Substitua-a por:

```ts
Customers
	.filter(p => p.country == 'Germany')
	.map(p => ({ id: p.id, name: p.name, city: p.city, country: p.country }))
	.sort(p => p.name)
	.page(1, 10)
```

O editor sugere enquanto você digita: depois de `Customers.` as cláusulas, depois de `p.` os campos e as relações.
**execute** (Ctrl+Enter) a executa; **table** mostra as linhas como uma tabela.

![Uma consulta e seu resultado](images/ide-query.png)

## 5. Uma consulta do assistente {#5-a-query-of-the-wizard}

Uma nova aba (**+**), depois **assistente**:

1. **partir de** `Orders`;
2. o **+** de `Orders`: marque `Customers` e `Orders.details`, **adicionar (2)**; o **+** de `Orders.details`: `Products`;
3. os campos: todos os campos de uma tabela começam marcados. Desmarque o check no título de `Orders` (só fica a sua
   chave, `id`) e marque `orderDate`; faça o mesmo em `Customers` e marque `name` e `country`, e em `Products` e marque
   `name`. Deixe as linhas (`Orders.details`) com todos os seus campos;
4. **filtro:** `p.customer.country == 'Germany'`;
5. **+ adicionar uma ordem:** `orderDate`, **decrescente**; **linhas por página:** `20`;
6. **criar a consulta**, depois **execute**.

Cada pedido vem com o seu cliente e as suas linhas, cada linha com o seu produto. A página
[Assistente de consultas](QueryWizard.md) explica cada passo.

![O assistente](images/ide-wizard.png)

## 6. Salve-a {#6-save-it}

**Salvar** (Ctrl+S) pede um nome, uma descrição e uma pasta. Uma pasta é criada antes com o **+** de
**Workbench** → **Novo projeto**. A consulta salva mantém o seu assistente: o botão **assistente** o abre como foi
deixado.

![Salvar a consulta](images/ide-save-query.png)

## 7. Um diagrama {#7-a-diagram}

O **+** da pasta → **Novo diagrama**: um nome, marque `Orders` e **Adicionar as vizinhas** (o seu cliente e as suas
linhas), **Criar**. As caixas se organizam sozinhas; arraste-as e **Salvar** as mantém onde foram deixadas
([Diagramas](Diagrams.md)).

![Um diagrama](images/ide-diagram.png)

## Próximos passos {#next}

- A página da conexão: suas sessões, e a API REST, o WebSocket e o MCP do gateway em abas
  ([Conexões](Connections.md)).
- Administrar os esquemas a partir da IDE precisa de uma credencial com `schemaRead` e `schemaWrite`
  ([Administração](Administration.md)).
- Uma IDE web para uma equipe, junto aos gateways ([Implantação](Deploying.md)).
