# Documento de Design

## Visão Geral

Este design descreve a implementação do **Dashboard** (Painel de Gráficos) do Controlador de Gastos: um único cartão (`.card`) contendo dois gráficos complementares — o **Gráfico de Evolução** (total de gastos agregado por mês, ao longo do tempo) e o **Gráfico de Categorias** (distribuição do total por categoria).

O recurso é implementado em JavaScript puro (vanilla JS), sem qualquer ferramenta de build. A única dependência externa é a biblioteca **Chart.js**, carregada via CDN por uma tag `<script>`. O restante da aplicação permanece com zero dependências.

O Dashboard integra-se ao Ciclo_de_Renderização existente (`render`, `addExpense`, `removeExpense`): a atualização dos gráficos é acionada a partir de `render()`, garantindo que os dados exibidos sempre reflitam o estado atual dos Gastos, tanto na carga inicial quanto após adições e remoções.

Toda a interface e todos os textos são apresentados em português do Brasil (pt-BR).

### Princípios de Design

- **Reaproveitamento**: reutilizar `formatCurrency`, `CATEGORY_COLORS` e `getCategoryColor` já existentes em `app.js`, sem duplicar lógica.
- **Degradação controlada**: se `window.Chart` for indefinido (por exemplo, sem internet), o Dashboard exibe uma mensagem de falha e a aplicação continua funcionando (cadastro, listagem e remoção).
- **Sem vazamento de instâncias**: as instâncias de gráfico são criadas uma única vez e reaproveitadas via `update()`; recriação só ocorre com destruição prévia da instância anterior.
- **Consistência visual**: o cartão do Dashboard usa as variáveis CSS de tema existentes e segue o padrão de `.card`, respeitando a largura máxima de 640px do `.container`.

## Arquitetura

A solução é dividida em três camadas, todas no navegador:

```
index.html
  ├── <script src="CDN/chart.js">   (carrega Chart.js; window.Chart)
  ├── <section class="card"> Dashboard
  │     ├── <p id="dashboard-message">  (estado vazio / falha de carga)
  │     ├── <canvas id="evolution-chart">
  │     └── <canvas id="category-chart">
  └── <script src="app.js">          (lógica + integração)

app.js (IIFE existente)
  ├── Agregação        aggregateByMonth() / aggregateByCategory()
  ├── Rótulos          monthKeyOf() / formatMonthLabel()
  ├── Renderização     renderDashboard()  (cria/atualiza charts, estados)
  └── Integração       render() → chama renderDashboard()
```

### Fluxo de Dados

1. `render()` é chamado na carga inicial e após cada `addExpense` / `removeExpense`.
2. `render()` continua atualizando lista e total, e ao final chama `renderDashboard(expenses)`.
3. `renderDashboard`:
   - Verifica disponibilidade de `window.Chart`. Se indisponível → exibe mensagem de falha, oculta canvases e retorna (sem lançar exceção).
   - Se não houver Gastos → exibe mensagem de estado vazio, oculta canvases, destrói instâncias existentes (se houver) e retorna.
   - Caso contrário → oculta a mensagem, exibe os canvases, calcula as agregações e cria/atualiza as duas instâncias de gráfico.

### Diagrama de Sequência (adição de gasto)

```
Usuário → form(submit) → addExpense() → saveExpenses() → render()
render() → atualiza lista/total → renderDashboard(expenses)
renderDashboard() → aggregateByMonth() / aggregateByCategory()
                  → chart.update() (ou create na 1ª vez)
```

## Componentes e Interfaces

### 1. Carregamento da biblioteca (index.html)

A tag `<script>` do Chart.js é adicionada **antes** de `app.js`, para que `window.Chart` esteja disponível quando `app.js` executar. Recomenda-se usar uma versão fixada da CDN.

```html
  <!-- ...conteúdo existente do .container... -->

  <!-- Chart.js via CDN (dependência externa, versão fixada) -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  <script src="app.js"></script>
```

**Observações:**
- O atributo `src` é apenas ilustrativo; a versão exata deve ser fixada no momento da implementação.
- Não se usa `async`/`defer` de forma que quebre a ordem: a garantia necessária é que Chart.js seja avaliado antes de `app.js`. Como ambos são scripts clássicos sem `defer`, a ordem de declaração é respeitada.
- Se o download falhar (offline), o navegador simplesmente não define `window.Chart`; `app.js` trata esse caso.

### 2. Marcação do Dashboard (index.html)

Um novo `.card` é inserido dentro do `.container`, posicionado entre o cartão "Novo gasto" e o cartão "Meus gastos" (ou logo após "Meus gastos"; a ordem exata é decisão de layout, mantendo-se dentro do `.container`).

```html
    <section class="card" id="dashboard">
      <h2>Painel de gastos</h2>

      <p id="dashboard-message" class="dashboard-message">
        Ainda não há dados para exibir nos gráficos.
      </p>

      <div class="chart-block">
        <h3 class="chart-title">Evolução por mês</h3>
        <canvas id="evolution-chart" height="220" aria-label="Gráfico de evolução dos gastos por mês" role="img"></canvas>
      </div>

      <div class="chart-block">
        <h3 class="chart-title">Gastos por categoria</h3>
        <canvas id="category-chart" height="220" aria-label="Gráfico de gastos por categoria" role="img"></canvas>
      </div>
    </section>
```

**Elemento de mensagem (`#dashboard-message`)** cobre dois estados textuais:
- Estado vazio (sem Gastos): "Ainda não há dados para exibir nos gráficos."
- Falha de carga (Chart.js indisponível): "Não foi possível carregar os gráficos. Verifique sua conexão."

O mesmo elemento é reutilizado, apenas alterando o texto e a visibilidade, mantendo a marcação simples.

### 3. Estilos (styles.css)

Adições mínimas, reutilizando as variáveis de tema existentes:

```css
.dashboard-message {
  color: var(--muted);
  text-align: center;
  padding: 24px 0;
  font-style: italic;
}

.chart-block {
  margin-top: 12px;
}

.chart-block + .chart-block {
  margin-top: 24px;
}

.chart-title {
  margin: 0 0 8px;
  font-size: 0.95rem;
  color: var(--muted);
  font-weight: 600;
}
```

Os canvases têm largura fluida (100% do cartão) via responsividade do Chart.js (`responsive: true`, `maintainAspectRatio: false` ou altura fixa via atributo `height`), respeitando o `.card` dentro do `.container` de 640px.

### 4. Módulo de agregação (app.js)

Todas as funções vivem dentro da IIFE existente, reaproveitando `expenses`, `formatCurrency` e `getCategoryColor`.

```javascript
// Rótulos de mês abreviados em pt-BR, indexados por mês (0 = Jan).
const MONTH_LABELS_PT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

// Chave ordenável de mês no formato "AAAA-MM" a partir de createdAt.
function monthKeyOf(iso) {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// Rótulo pt-BR abreviado a partir de uma chave "AAAA-MM".
function formatMonthLabel(monthKey) {
  const monthIndex = Number(monthKey.slice(5, 7)) - 1;
  return MONTH_LABELS_PT[monthIndex];
}

// Agrega totais por Mês_de_Referência, em ordem cronológica crescente.
// Retorna { keys: string[], labels: string[], totals: number[] }
function aggregateByMonth(list) {
  const totalsByKey = new Map();
  for (const e of list) {
    const key = monthKeyOf(e.createdAt);
    totalsByKey.set(key, (totalsByKey.get(key) || 0) + e.amount);
  }
  const keys = [...totalsByKey.keys()].sort(); // "AAAA-MM" ordena cronologicamente
  return {
    keys,
    labels: keys.map(formatMonthLabel),
    totals: keys.map((k) => totalsByKey.get(k)),
  };
}

// Agrega totais por Categoria, incluindo apenas categorias com ao menos um Gasto.
// Retorna { categories: string[], totals: number[], colors: string[] }
function aggregateByCategory(list) {
  const totalsByCategory = new Map();
  for (const e of list) {
    totalsByCategory.set(
      e.category,
      (totalsByCategory.get(e.category) || 0) + e.amount,
    );
  }
  const categories = [...totalsByCategory.keys()];
  return {
    categories,
    totals: categories.map((c) => totalsByCategory.get(c)),
    // Usa a cor de texto da categoria como cor de preenchimento do gráfico.
    colors: categories.map((c) => getCategoryColor(c).text),
  };
}
```

**Notas de decisão:**
- A chave `"AAAA-MM"` é escolhida porque sua ordenação lexicográfica coincide com a ordem cronológica, satisfazendo o Requisito 2.2 sem comparações de data adicionais.
- Meses sem nenhum Gasto simplesmente não aparecem no `Map`, satisfazendo o Requisito 2.4 (apenas meses com ao menos um Gasto). O design não preenche lacunas entre meses; representa somente os meses presentes nos dados.
- Categorias sem Gastos não entram no `Map`, satisfazendo o Requisito 3.2.
- A cor do gráfico de categorias usa `getCategoryColor(c).text` (a cor de destaque), atendendo ao Requisito 3.3.

### 5. Renderização do Dashboard (app.js)

```javascript
const dashboardMessageEl = document.getElementById("dashboard-message");
const evolutionCanvas = document.getElementById("evolution-chart");
const categoryCanvas = document.getElementById("category-chart");

let evolutionChart = null;
let categoryChart = null;

const MSG_EMPTY = "Ainda não há dados para exibir nos gráficos.";
const MSG_NO_LIB = "Não foi possível carregar os gráficos. Verifique sua conexão.";

function showDashboardMessage(text) {
  dashboardMessageEl.textContent = text;
  dashboardMessageEl.style.display = "block";
  evolutionCanvas.style.display = "none";
  categoryCanvas.style.display = "none";
}

function hideDashboardMessage() {
  dashboardMessageEl.style.display = "none";
  evolutionCanvas.style.display = "block";
  categoryCanvas.style.display = "block";
}

function destroyCharts() {
  if (evolutionChart) { evolutionChart.destroy(); evolutionChart = null; }
  if (categoryChart) { categoryChart.destroy(); categoryChart = null; }
}

function renderDashboard(list) {
  // Requisito 6.2 / 6.3: sem a biblioteca, mostra mensagem e não quebra o app.
  if (typeof window.Chart === "undefined") {
    showDashboardMessage(MSG_NO_LIB);
    return;
  }

  // Requisito 5.1 / 5.2: sem gastos, mostra mensagem e oculta canvases.
  if (!list || list.length === 0) {
    destroyCharts();
    showDashboardMessage(MSG_EMPTY);
    return;
  }

  hideDashboardMessage();

  const byMonth = aggregateByMonth(list);
  const byCategory = aggregateByCategory(list);

  renderEvolutionChart(byMonth);
  renderCategoryChart(byCategory);
}
```

`renderEvolutionChart` e `renderCategoryChart` criam a instância na primeira chamada e apenas atualizam os dados nas chamadas seguintes (evitando vazamento):

```javascript
function renderEvolutionChart(byMonth) {
  if (!evolutionChart) {
    evolutionChart = new window.Chart(evolutionCanvas, {
      type: "bar", // barras para totais mensais; poderia ser "line"
      data: {
        labels: byMonth.labels,
        datasets: [{
          label: "Total do mês",
          data: byMonth.totals,
          backgroundColor: "#2563eb", // var(--primary)
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              // Requisito 2.5: valores formatados com formatCurrency.
              label: (ctx) => formatCurrency(ctx.parsed.y),
            },
          },
        },
        scales: {
          y: {
            ticks: { callback: (v) => formatCurrency(v) },
          },
        },
      },
    });
  } else {
    evolutionChart.data.labels = byMonth.labels;
    evolutionChart.data.datasets[0].data = byMonth.totals;
    evolutionChart.update();
  }
}

function renderCategoryChart(byCategory) {
  if (!categoryChart) {
    categoryChart = new window.Chart(categoryCanvas, {
      type: "doughnut",
      data: {
        labels: byCategory.categories,
        datasets: [{
          data: byCategory.totals,
          backgroundColor: byCategory.colors, // Requisito 3.3
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              // Requisito 3.4: valores formatados com formatCurrency.
              label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed)}`,
            },
          },
        },
      },
    });
  } else {
    categoryChart.data.labels = byCategory.categories;
    categoryChart.data.datasets[0].data = byCategory.totals;
    categoryChart.data.datasets[0].backgroundColor = byCategory.colors;
    categoryChart.update();
  }
}
```

### 6. Integração ao Ciclo de Renderização (app.js)

A única alteração na função `render()` existente é uma chamada ao final:

```javascript
function render() {
  // ...toda a lógica existente de lista e total permanece inalterada...

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  totalEl.textContent = formatCurrency(total);

  // Integração do Dashboard (Requisitos 4.1, 4.2, 4.3).
  renderDashboard(expenses);
}
```

Como `addExpense` e `removeExpense` já chamam `render()`, e `render()` é chamado uma vez na inicialização, os três gatilhos do Requisito 4 (adição, remoção e carga inicial) são cobertos por essa única integração.

## Modelos de Dados

Nenhuma alteração no modelo de Gasto persistido. O Dashboard consome os mesmos objetos já existentes:

```
Gasto {
  id: string,
  amount: number,        // usado nas agregações
  category: string,      // usado no Gráfico de Categorias
  description: string,
  paymentMethod: string,
  createdAt: string      // ISO 8601, usado para derivar o Mês_de_Referência
}
```

Estruturas intermediárias (não persistidas):

```
AgregacaoMes  { keys: string[], labels: string[], totals: number[] }
AgregacaoCategoria { categories: string[], totals: number[], colors: string[] }
```

## Tratamento de Erros

| Cenário | Detecção | Comportamento |
|---|---|---|
| Chart.js não carregado (offline/CDN falha) | `typeof window.Chart === "undefined"` em `renderDashboard` | Exibe `MSG_NO_LIB`, oculta canvases, retorna sem lançar. Cadastro/listagem/remoção seguem funcionando (Req. 6.2, 6.3). |
| Nenhum Gasto cadastrado | `list.length === 0` | Destrói instâncias existentes, exibe `MSG_EMPTY`, oculta canvases (Req. 5.1, 5.2). |
| `createdAt` inválido | `new Date(iso)` resultaria em `NaN` | Como todos os Gastos são criados via `addExpense` com `new Date().toISOString()`, o cenário é improvável; se ocorrer em dados corrompidos, a chave de mês fica anômala mas não quebra a renderização. Tratado defensivamente ao consumir `getFullYear()/getMonth()`. |
| Falha ao criar/atualizar gráfico | Exceção do Chart.js | A chamada a `renderDashboard` ocorre ao final de `render()`; um `try/catch` opcional em torno de `renderDashboard(expenses)` dentro de `render()` garante que uma falha de gráfico jamais impeça a atualização da lista e do total. |

Recomenda-se envolver a chamada em `render()` de forma defensiva:

```javascript
try {
  renderDashboard(expenses);
} catch (err) {
  console.error("Falha ao renderizar o dashboard:", err);
  showDashboardMessage(MSG_NO_LIB);
}
```

## Estratégia de Testes

Abordagem dupla, complementar:

- **Testes de unidade (exemplos e casos de borda):** cobrem estado vazio, ausência de Chart.js, formatação de rótulos e uso de `formatCurrency` nos callbacks.
- **Testes baseados em propriedades (PBT):** cobrem as invariantes universais de agregação, ordenação, mapeamento de rótulos/cores, consistência com o estado atual e robustez sem a biblioteca.

**Configuração de testes de propriedade:**
- Mínimo de 100 iterações por teste de propriedade.
- Cada teste de propriedade referencia sua propriedade no documento de design.
- Formato da tag: **Feature: expense-dashboard, Property {número}: {texto}**.

Como não há ferramenta de build, a lógica pura de agregação (`aggregateByMonth`, `aggregateByCategory`, `monthKeyOf`, `formatMonthLabel`) deve ser testável isoladamente. Recomenda-se expô-la de forma testável (por exemplo, um ponto de acesso opcional em `window` sob condição de teste) sem alterar o comportamento em produção, ou extrair as funções puras para um módulo compartilhado carregado por `<script>`. Os gráficos em si (renderização de canvas) e o carregamento da CDN são verificados por testes de exemplo/integração e verificação manual.

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas do sistema — essencialmente, uma afirmação formal sobre o que o sistema deve fazer. As propriedades servem de ponte entre a especificação legível por humanos e as garantias de correção verificáveis por máquina.*

### Property 1: Conservação do total na agregação por mês

*Para qualquer* lista de Gastos, a soma de todos os totais mensais produzidos por `aggregateByMonth` é igual à soma de `amount` de todos os Gastos da lista, e o total de cada Mês_de_Referência é igual à soma dos `amount` dos Gastos daquele mês.

**Validates: Requirements 2.1**

### Property 2: Ordenação cronológica dos meses

*Para qualquer* lista de Gastos, as chaves de mês retornadas por `aggregateByMonth` estão em ordem cronológica estritamente crescente.

**Validates: Requirements 2.2**

### Property 3: Rótulo de mês abreviado em pt-BR

*Para qualquer* Mês_de_Referência, o rótulo produzido por `formatMonthLabel` é exatamente a abreviação em português do Brasil correspondente ao mês (índice 0 → "Jan", 1 → "Fev", ..., 11 → "Dez").

**Validates: Requirements 2.3**

### Property 4: Exatidão do conjunto de meses

*Para qualquer* lista de Gastos, o conjunto de Meses_de_Referência produzido por `aggregateByMonth` é exatamente o conjunto de meses distintos presentes na lista — nenhum mês sem Gastos é incluído e nenhum mês com ao menos um Gasto é omitido.

**Validates: Requirements 2.4**

### Property 5: Agregação por categoria correta e apenas categorias com gastos

*Para qualquer* lista de Gastos, `aggregateByCategory` produz exatamente as categorias que possuem ao menos um Gasto, cada uma com total igual à soma dos `amount` dos Gastos daquela categoria, e a soma de todos os totais por categoria é igual à soma total dos `amount` da lista.

**Validates: Requirements 3.1, 3.2**

### Property 6: Cor da categoria via getCategoryColor

*Para qualquer* categoria presente no resultado de `aggregateByCategory`, a cor atribuída a essa categoria é igual ao valor retornado por `getCategoryColor(categoria)`.

**Validates: Requirements 3.3**

### Property 7: Dashboard reflete o estado atual dos Gastos

*Para qualquer* sequência de operações de adição e remoção de Gastos, após cada operação, os dados dos dois gráficos do Dashboard correspondem exatamente à agregação por mês e por categoria do estado atual dos Gastos.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: Aplicação permanece funcional sem Chart.js

*Para qualquer* sequência de operações de adição e remoção de Gastos executada quando `window.Chart` está indefinido, o cadastro, a listagem e a remoção continuam produzindo o estado e o total corretos, e nenhuma exceção proveniente do Dashboard interrompe o Ciclo_de_Renderização.

**Validates: Requirements 6.3**
