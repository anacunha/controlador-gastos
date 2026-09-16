# Controlador de Gastos

Aplicação web simples para cadastrar e acompanhar gastos pessoais.

## MVP atual

O primeiro requisito já está implementado: **cadastro de gastos** com

- Valor
- Categoria
- Descrição
- Método de pagamento

Os gastos aparecem em uma lista com o total somado e podem ser removidos.
Os dados ficam salvos no navegador via `localStorage`, então continuam
disponíveis mesmo depois de fechar a aba.

## Como rodar

Não há build nem dependências. Abra o arquivo `index.html` no navegador:

- Clique duas vezes em `index.html`, ou
- Sirva a pasta localmente, por exemplo:

  ```bash
  python3 -m http.server 8000
  ```

  e acesse http://localhost:8000

## Estrutura

- `index.html` — formulário de cadastro e lista de gastos
- `styles.css` — estilos da interface
- `app.js` — lógica de cadastro, listagem, remoção e persistência

## Próximos passos (visão do produto)

- Busca
- Ordenar por data, tipo de gasto, etc
- Dashboard
- Limite de gastos, alerta de avisos
- Gastos fixos
- Controle de acesso
- Cadastro automático de gastos ligados a aplicativos
- Organização de gastos pessoais vs. empresariais
- Integração de gastos de cartões de crédito diferentes
- Segurança
