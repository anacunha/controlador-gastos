(function () {
  "use strict";

  const STORAGE_KEY = "controlador-gastos:expenses";

  const form = document.getElementById("expense-form");
  const listEl = document.getElementById("expense-list");
  const emptyStateEl = document.getElementById("empty-state");
  const totalEl = document.getElementById("total");
  const categorySelect = document.getElementById("category");

  const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  // Cor específica por categoria: { fundo, texto } da tag.
  const CATEGORY_COLORS = {
    Alimentação: { bg: "#fef3c7", text: "#92400e" },
    Transporte: { bg: "#dbeafe", text: "#1e40af" },
    Moradia: { bg: "#e0e7ff", text: "#3730a3" },
    Lazer: { bg: "#fce7f3", text: "#9d174d" },
    Saúde: { bg: "#dcfce7", text: "#166534" },
    Educação: { bg: "#ede9fe", text: "#5b21b6" },
    Outros: { bg: "#e2e8f0", text: "#334155" },
  };

  const DEFAULT_CATEGORY_COLOR = { bg: "#e2e8f0", text: "#334155" };

  function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || DEFAULT_CATEGORY_COLOR;
  }

  function updateCategorySelectColor() {
    const value = categorySelect.value;
    if (value) {
      const color = getCategoryColor(value);
      categorySelect.style.backgroundColor = color.bg;
      categorySelect.style.color = color.text;
      categorySelect.style.fontWeight = "600";
    } else {
      categorySelect.style.backgroundColor = "";
      categorySelect.style.color = "";
      categorySelect.style.fontWeight = "";
    }
  }

  /** @type {Array<{id: string, amount: number, category: string, description: string, paymentMethod: string, createdAt: string}>} */
  let expenses = loadExpenses();

  function loadExpenses() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Falha ao ler os gastos salvos:", err);
      return [];
    }
  }

  function saveExpenses() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (err) {
      console.error("Falha ao salvar os gastos:", err);
    }
  }

  function formatCurrency(value) {
    return currencyFormatter.format(value);
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR");
  }

  function clearErrors() {
    document.querySelectorAll(".error").forEach((el) => {
      el.textContent = "";
    });
  }

  function setError(fieldName, message) {
    const el = document.querySelector(`.error[data-error-for="${fieldName}"]`);
    if (el) el.textContent = message;
  }

  function validate(data) {
    let valid = true;

    if (!data.amount || Number.isNaN(data.amount) || data.amount <= 0) {
      setError("amount", "Informe um valor maior que zero.");
      valid = false;
    }
    if (!data.category) {
      setError("category", "Selecione uma categoria.");
      valid = false;
    }
    if (!data.description) {
      setError("description", "Informe uma descrição.");
      valid = false;
    }
    if (!data.paymentMethod) {
      setError("paymentMethod", "Selecione um método de pagamento.");
      valid = false;
    }

    return valid;
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function render() {
    listEl.innerHTML = "";

    if (expenses.length === 0) {
      emptyStateEl.style.display = "block";
    } else {
      emptyStateEl.style.display = "none";
    }

    // Mais recentes primeiro
    const ordered = [...expenses].reverse();

    for (const expense of ordered) {
      const li = document.createElement("li");
      li.className = "expense-item";
      const itemColor = getCategoryColor(expense.category);
      li.style.borderLeftColor = itemColor.text;

      const info = document.createElement("div");
      info.className = "expense-info";

      const desc = document.createElement("span");
      desc.className = "expense-desc";
      desc.textContent = expense.description;

      const meta = document.createElement("span");
      meta.className = "expense-meta";

      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = expense.category;
      const color = getCategoryColor(expense.category);
      tag.style.backgroundColor = color.bg;
      tag.style.color = color.text;

      meta.appendChild(tag);
      meta.appendChild(
        document.createTextNode(
          ` · ${expense.paymentMethod} · ${formatDate(expense.createdAt)}`,
        ),
      );

      info.appendChild(desc);
      info.appendChild(meta);

      const right = document.createElement("div");
      right.className = "expense-right";

      const amount = document.createElement("span");
      amount.className = "expense-amount";
      amount.textContent = formatCurrency(expense.amount);

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-delete";
      deleteBtn.textContent = "Remover";
      deleteBtn.setAttribute(
        "aria-label",
        `Remover gasto: ${expense.description}`,
      );
      deleteBtn.addEventListener("click", () => removeExpense(expense.id));

      right.appendChild(amount);
      right.appendChild(deleteBtn);

      li.appendChild(info);
      li.appendChild(right);
      listEl.appendChild(li);
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    totalEl.textContent = formatCurrency(total);
  }

  function addExpense(data) {
    expenses.push({
      id: createId(),
      amount: data.amount,
      category: data.category,
      description: data.description,
      paymentMethod: data.paymentMethod,
      createdAt: new Date().toISOString(),
    });
    saveExpenses();
    render();
  }

  function removeExpense(id) {
    expenses = expenses.filter((e) => e.id !== id);
    saveExpenses();
    render();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();

    const data = {
      amount: parseFloat(form.amount.value),
      category: form.category.value,
      description: form.description.value.trim(),
      paymentMethod: form.paymentMethod.value,
    };

    if (!validate(data)) return;

    addExpense(data);
    form.reset();
    updateCategorySelectColor();
    form.amount.focus();
  });

  categorySelect.addEventListener("change", updateCategorySelectColor);

  updateCategorySelectColor();
  render();
})();
