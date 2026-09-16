# Plano de Implementação: Dashboard de Gastos

## Visão Geral

A implementação adiciona um Dashboard (Painel de Gráficos) ao Controlador de Gastos em JavaScript puro, com Chart.js carregado via CDN. As tarefas seguem uma ordem incremental: primeiro a estrutura (HTML/CSS), depois a lógica pura de agregação (testável isoladamente), em seguida a renderização dos gráficos e, por fim, a integração ao Ciclo de Renderização existente. Cada etapa constrói sobre a anterior e termina integrada, sem código órfão.

As funções puras de agregação (`aggregateByMonth`, `aggregateByCategory`, `monthKeyOf`, `formatMonthLabel`) são a base para os testes baseados em propriedades definidos na seção Correctness Properties do design.

## Tarefas

- [ ] 1. Preparar carregamento da biblioteca e marcação do Dashboard no index.html
  - [ ] 1.1 Adicionar a tag `<script>` do Chart.js via CDN antes de `app.js`
    - Inserir `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>` imediatamente antes de `<script src="app.js"></script>`
    - Usar versão fixada da CDN, sem `async`/`defer`, garantindo que `window.Chart` esteja disponível quando `app.js` executar
    - _Requirements: 6.1_

  - [ ] 1.2 Adicionar a marcação do cartão do Dashboard dentro do `.container`
    - Criar `<section class="card" id="dashboard">` com `<h2>Painel de gastos</h2>`
    - Incluir `<p id="dashboard-message" class="dashboard-message">` para os estados de mensagem
    - Incluir dois blocos `.chart-block`, cada um com título e um `<canvas>`: `#evolution-chart` ("Evolução por mês") e `#category-chart` ("Gastos por categoria"), com atributos `height`, `aria-label` e `role="img"`
    - Posicionar o cartão dentro do `.container`, respeitando a largura máxima de 640px e mantendo os textos em pt-BR
    - _Requirements: 1.1, 1.2, 1.4_

- [ ] 2. Adicionar estilos do Dashboard no styles.css
  - [ ] 2.1 Adicionar regras `.dashboard-message`, `.chart-block`, `.chart-block + .chart-block` e `.chart-title`
    - Reutilizar as variáveis CSS de tema existentes (ex.: `var(--muted)`) para cor, espaçamento e tipografia
    - Garantir largura fluida dos canvases dentro do `.card`
    - _Requirements: 1.2, 1.3_

- [ ] 3. Implementar as funções puras de agregação em app.js
  - [ ] 3.1 Implementar `MONTH_LABELS_PT`, `monthKeyOf` e `formatMonthLabel`
    - Definir o array de rótulos abreviados em pt-BR (`Jan`..`Dez`), indexado por mês (0 = Jan)
    - `monthKeyOf(iso)` deriva a chave ordenável `"AAAA-MM"` a partir de `createdAt`
    - `formatMonthLabel(monthKey)` retorna o rótulo abreviado em pt-BR correspondente
    - Colocar as funções dentro da IIFE existente
    - _Requirements: 2.3_

  - [ ]* 3.2 Escrever teste de propriedade para `formatMonthLabel`
    - **Feature: expense-dashboard, Property 3: Rótulo de mês abreviado em pt-BR**
    - **Validates: Requirements 2.3**
    - Mínimo de 100 iterações

  - [ ] 3.3 Implementar `aggregateByMonth`
    - Somar `amount` por chave de mês (`monthKeyOf`), ordenar as chaves lexicograficamente (equivalente a cronológica) e mapear rótulos com `formatMonthLabel`
    - Retornar `{ keys, labels, totals }`, incluindo apenas meses com ao menos um Gasto
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 3.4 Escrever testes de propriedade para `aggregateByMonth`
    - **Feature: expense-dashboard, Property 1: Conservação do total na agregação por mês** — **Validates: Requirements 2.1**
    - **Feature: expense-dashboard, Property 2: Ordenação cronológica dos meses** — **Validates: Requirements 2.2**
    - **Feature: expense-dashboard, Property 4: Exatidão do conjunto de meses** — **Validates: Requirements 2.4**
    - Mínimo de 100 iterações por propriedade

  - [ ] 3.5 Implementar `aggregateByCategory` reutilizando `getCategoryColor`
    - Somar `amount` por categoria, incluindo apenas categorias com ao menos um Gasto
    - Retornar `{ categories, totals, colors }`, usando `getCategoryColor(c).text` como cor de cada categoria
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 3.6 Escrever testes de propriedade para `aggregateByCategory`
    - **Feature: expense-dashboard, Property 5: Agregação por categoria correta e apenas categorias com gastos** — **Validates: Requirements 3.1, 3.2**
    - **Feature: expense-dashboard, Property 6: Cor da categoria via getCategoryColor** — **Validates: Requirements 3.3**
    - Mínimo de 100 iterações por propriedade

- [ ] 4. Checkpoint - Garantir que a lógica de agregação está correta
  - Garantir que todos os testes passem; em caso de dúvidas, perguntar ao usuário.

- [ ] 5. Implementar a renderização do Dashboard em app.js
  - [ ] 5.1 Adicionar referências de DOM, estado dos gráficos e helpers de estado
    - Obter `#dashboard-message`, `#evolution-chart`, `#category-chart`; declarar `evolutionChart`/`categoryChart` como `null`
    - Definir constantes de mensagem (`MSG_EMPTY`, `MSG_NO_LIB`) e os helpers `showDashboardMessage`, `hideDashboardMessage`, `destroyCharts`
    - _Requirements: 5.1, 5.2, 6.2_

  - [ ] 5.2 Implementar `renderEvolutionChart` com padrão criar-uma-vez/atualizar
    - Criar a instância `bar` na primeira chamada (cor `var(--primary)`), e apenas atualizar `labels`/`data` via `update()` nas chamadas seguintes
    - Formatar valores dos tooltips e ticks do eixo Y com `formatCurrency`
    - _Requirements: 2.5_

  - [ ] 5.3 Implementar `renderCategoryChart` com padrão criar-uma-vez/atualizar
    - Criar a instância `doughnut` na primeira chamada, e apenas atualizar `labels`/`data`/`backgroundColor` via `update()` nas chamadas seguintes
    - Aplicar as cores vindas de `aggregateByCategory` e formatar os tooltips com `formatCurrency`
    - _Requirements: 3.3, 3.4_

  - [ ] 5.4 Implementar `renderDashboard` com estados vazio e sem-biblioteca
    - Se `window.Chart` for indefinido → exibir `MSG_NO_LIB`, ocultar canvases e retornar sem lançar
    - Se a lista estiver vazia → destruir instâncias, exibir `MSG_EMPTY` e ocultar canvases
    - Caso contrário → ocultar mensagem, calcular agregações e chamar `renderEvolutionChart`/`renderCategoryChart`
    - _Requirements: 5.1, 5.2, 6.2_

  - [ ]* 5.5 Escrever testes de exemplo para os estados do Dashboard
    - Cobrir estado vazio (mensagem exibida, canvases ocultos) e ausência de `window.Chart` (mensagem de falha, sem exceção)
    - _Requirements: 5.1, 5.2, 6.2_

- [ ] 6. Integrar o Dashboard ao Ciclo de Renderização em app.js
  - [ ] 6.1 Chamar `renderDashboard(expenses)` ao final de `render()` com try/catch defensivo
    - Manter inalterada a lógica existente de lista e total
    - Envolver a chamada em `try/catch`: em caso de erro, registrar no console e exibir `MSG_NO_LIB`, sem interromper a atualização de lista e total
    - Cobre os gatilhos de adição, remoção e carga inicial (via `addExpense`/`removeExpense`/inicialização, que já chamam `render()`)
    - _Requirements: 4.1, 4.2, 4.3, 6.3_

  - [ ]* 6.2 Escrever teste de propriedade de reflexo do estado atual
    - **Feature: expense-dashboard, Property 7: Dashboard reflete o estado atual dos Gastos**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Mínimo de 100 iterações

  - [ ]* 6.3 Escrever teste de propriedade de robustez sem Chart.js
    - **Feature: expense-dashboard, Property 8: Aplicação permanece funcional sem Chart.js**
    - **Validates: Requirements 6.3**
    - Mínimo de 100 iterações

- [ ] 7. Checkpoint final - Garantir que todos os testes passem
  - Garantir que todos os testes passem; em caso de dúvidas, perguntar ao usuário.

## Notas

- Tarefas marcadas com `*` são opcionais (testes) e podem ser puladas para um MVP mais rápido.
- Cada tarefa referencia requisitos específicos para rastreabilidade.
- As funções puras de agregação devem ser expostas de forma testável (por exemplo, ponto de acesso opcional em `window` sob condição de teste) sem alterar o comportamento em produção.
- Os testes de propriedade usam no mínimo 100 iterações e referenciam a propriedade correspondente no documento de design.
- A renderização de canvas e o carregamento da CDN são verificados por testes de exemplo e verificação manual.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1", "3.1"] },
    { "id": 1, "tasks": ["3.2", "3.3", "3.5"] },
    { "id": 2, "tasks": ["3.4", "3.6", "5.1"] },
    { "id": 3, "tasks": ["5.2", "5.3"] },
    { "id": 4, "tasks": ["5.4"] },
    { "id": 5, "tasks": ["5.5", "6.1"] },
    { "id": 6, "tasks": ["6.2", "6.3"] }
  ]
}
```
