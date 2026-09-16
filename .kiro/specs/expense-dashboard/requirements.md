# Documento de Requisitos

## Introdução

Este documento especifica os requisitos para o recurso de Painel de Gráficos (Dashboard) do aplicativo Controlador de Gastos, uma aplicação web em JavaScript puro (vanilla JS) que registra e acompanha gastos pessoais no navegador.

O recurso adiciona um painel visual único contendo dois gráficos complementares: um gráfico de evolução dos gastos ao longo do tempo, agregados por mês, e um gráfico de distribuição dos gastos por categoria. O painel se integra ao ciclo de renderização existente, atualizando automaticamente quando gastos são adicionados ou removidos.

Os gráficos são renderizados por meio da biblioteca Chart.js, carregada via CDN por uma tag `<script>`. Esta é uma dependência externa aceita, que rompe o padrão atual de zero dependências da aplicação. O sistema deve tratar de forma controlada o cenário em que a biblioteca não é carregada (por exemplo, sem conexão com a internet).

Toda a interface e todos os textos exibidos ao usuário devem estar em português do Brasil (pt-BR).

## Glossário

- **Dashboard**: Painel visual da aplicação que reúne o Gráfico de Evolução e o Gráfico de Categorias em um único cartão (`.card`).
- **Gráfico de Evolução**: Gráfico que exibe o total de gastos agregado por mês ao longo do tempo.
- **Gráfico de Categorias**: Gráfico que exibe a distribuição do total de gastos por categoria.
- **Gasto**: Registro individual armazenado com os campos `id`, `amount`, `category`, `description`, `paymentMethod` e `createdAt` (data e hora em formato ISO 8601).
- **Categoria**: Um dos valores fixos: Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Outros.
- **Chart.js**: Biblioteca externa de gráficos carregada via CDN por tag `<script>`.
- **CATEGORY_COLORS**: Mapa existente em `app.js` que associa cada categoria a um par de cores `{ bg, text }`.
- **getCategoryColor**: Função existente em `app.js` que retorna as cores de uma categoria, com cor padrão para valores não mapeados.
- **formatCurrency**: Função existente em `app.js` que formata valores monetários em Real brasileiro (BRL) usando `Intl.NumberFormat` com localidade pt-BR.
- **Armazenamento_Local**: Chave `controlador-gastos:expenses` no `localStorage` do navegador onde os Gastos são persistidos.
- **Mês_de_Referência**: Período mensal derivado do campo `createdAt` de um Gasto, identificado por ano e mês.
- **Ciclo_de_Renderização**: Fluxo existente em `app.js` composto pelas funções `render`, `addExpense` e `removeExpense`.

## Requisitos

### Requisito 1

**User Story:** Como usuário do Controlador de Gastos, quero um painel único com dois gráficos, para visualizar minha evolução de gastos e a distribuição por categoria no mesmo lugar.

#### Acceptance Criteria

1. THE Dashboard SHALL apresentar o Gráfico de Evolução e o Gráfico de Categorias dentro de um único cartão com a classe `.card`.
2. THE Dashboard SHALL ser posicionado dentro do contêiner `.container` existente, respeitando a largura máxima de 640px do layout.
3. THE Dashboard SHALL utilizar as variáveis CSS de tema existentes para cores, espaçamento e tipografia.
4. THE Dashboard SHALL exibir todos os rótulos, títulos e textos em português do Brasil.

### Requisito 2

**User Story:** Como usuário, quero ver a evolução dos meus gastos por mês, para entender como meu consumo muda ao longo do tempo.

#### Acceptance Criteria

1. THE Gráfico_de_Evolução SHALL agregar o valor total dos Gastos por Mês_de_Referência.
2. THE Gráfico_de_Evolução SHALL exibir os meses em ordem cronológica crescente no eixo horizontal.
3. THE Gráfico_de_Evolução SHALL rotular cada Mês_de_Referência com o mês abreviado em português do Brasil (por exemplo, Jan, Fev, Mar).
4. THE Gráfico_de_Evolução SHALL representar o total mensal de cada Mês_de_Referência que contenha ao menos um Gasto.
5. THE Gráfico_de_Evolução SHALL formatar os valores monetários exibidos usando formatCurrency.

### Requisito 3

**User Story:** Como usuário, quero ver quanto gastei em cada categoria, para identificar onde meu dinheiro está indo.

#### Acceptance Criteria

1. THE Gráfico_de_Categorias SHALL agregar o valor total dos Gastos por Categoria.
2. THE Gráfico_de_Categorias SHALL exibir apenas as Categorias que contenham ao menos um Gasto.
3. THE Gráfico_de_Categorias SHALL aplicar a cor de cada Categoria obtida por getCategoryColor.
4. THE Gráfico_de_Categorias SHALL formatar os valores monetários exibidos usando formatCurrency.

### Requisito 4

**User Story:** Como usuário, quero que os gráficos reflitam sempre meus dados atuais, para que a visualização acompanhe cada gasto adicionado ou removido.

#### Acceptance Criteria

1. WHEN um Gasto é adicionado pelo Ciclo_de_Renderização, THE Dashboard SHALL atualizar o Gráfico_de_Evolução e o Gráfico_de_Categorias com os dados atualizados.
2. WHEN um Gasto é removido pelo Ciclo_de_Renderização, THE Dashboard SHALL atualizar o Gráfico_de_Evolução e o Gráfico_de_Categorias com os dados atualizados.
3. WHEN a aplicação é carregada com Gastos presentes no Armazenamento_Local, THE Dashboard SHALL renderizar os dois gráficos com os dados existentes.

### Requisito 5

**User Story:** Como usuário sem gastos cadastrados, quero uma indicação clara no painel, para saber que ainda não há dados para visualizar.

#### Acceptance Criteria

1. WHILE não houver nenhum Gasto no Armazenamento_Local, THE Dashboard SHALL exibir uma mensagem informando que não há dados para exibir nos gráficos.
2. WHILE não houver nenhum Gasto no Armazenamento_Local, THE Dashboard SHALL ocultar as áreas de desenho do Gráfico_de_Evolução e do Gráfico_de_Categorias.

### Requisito 6

**User Story:** Como usuário sem conexão com a internet, quero que a aplicação continue funcionando mesmo se a biblioteca de gráficos não carregar, para não perder o cadastro e a listagem de gastos.

#### Acceptance Criteria

1. THE Dashboard SHALL carregar a biblioteca Chart.js por meio de uma tag `<script>` apontando para uma CDN.
2. IF a biblioteca Chart.js não estiver disponível no momento da renderização do Dashboard, THEN THE Dashboard SHALL exibir uma mensagem em português do Brasil informando que os gráficos não puderam ser carregados.
3. IF a biblioteca Chart.js não estiver disponível no momento da renderização do Dashboard, THEN THE Dashboard SHALL preservar o funcionamento do cadastro, da listagem e da remoção de Gastos.
