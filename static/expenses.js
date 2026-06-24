// ==================== EXPENSES ====================

function openAddExpense() {
    openModal("addExpenseModal");
}

function saveExpense() {
    var title = document.getElementById("expTitle").value.trim();
    var amount = parseFloat(document.getElementById("expAmount").value);
    var category = document.getElementById("expCategory").value;
    var note = document.getElementById("expNote").value.trim();

    if (!title || isNaN(amount) || amount <= 0) {
        showToast("Enter a valid title and amount", "warning");
        return;
    }

    apiPost("/api/expenses", {
        family_id: window.currentFamilyId,
        title: title,
        amount: amount,
        category: category,
        note: note
    }).then(function(data) {
        showToast("Expense added!", "success");
        closeModal("addExpenseModal");
        document.getElementById("expTitle").value = "";
        document.getElementById("expAmount").value = "";
        document.getElementById("expNote").value = "";
        loadExpenses();
    }).catch(function(err) {
        showToast("Failed to add expense", "error");
    });
}

function loadExpenses() {
    if (!window.currentFamilyId) return;

    // Load summary
    apiGet("/api/expenses/" + window.currentFamilyId + "/summary").then(function(summary) {
        document.getElementById("totalExpenses").textContent = "₹" + formatNumber(summary.total);
        renderTopCategories(summary.categories);
    }).catch(function(err) {
        console.log("Summary load error:", err);
    });

    // Load list
    apiGet("/api/expenses/" + window.currentFamilyId).then(function(expenses) {
        renderExpenseList(expenses);
    }).catch(function(err) {
        console.log("Expenses load error:", err);
    });
}

function renderTopCategories(categories) {
    var container = document.getElementById("topCategories");
    if (!container) return;

    if (!categories || categories.length === 0) {
        container.innerHTML = "";
        return;
    }

    var categoryIcons = {
        "Food & Dining": "🍔",
        "Groceries": "🛒",
        "Transport": "🚗",
        "Utilities": "⚡",
        "Healthcare": "🏥",
        "Education": "📚",
        "Shopping": "🛍️",
        "Entertainment": "🎬",
        "Rent": "🏠",
        "Other": "📦"
    };

    var html = "";
    for (var i = 0; i < Math.min(categories.length, 4); i++) {
        var c = categories[i];
        var icon = categoryIcons[c.name] || "📦";
        html += '<div class="cat-card">';
        html += '<div class="cat-icon">' + icon + '</div>';
        html += '<div class="cat-name">' + escapeHtml(c.name) + '</div>';
        html += '<div class="cat-total">₹' + formatNumber(c.total) + '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function renderExpenseList(expenses) {
    var container = document.getElementById("expenseList");
    if (!container) return;

    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💰</div><h3>No expenses</h3><p>Add your first expense</p></div>';
        return;
    }

    var categoryIcons = {
        "Food & Dining": "🍔",
        "Groceries": "🛒",
        "Transport": "🚗",
        "Utilities": "⚡",
        "Healthcare": "🏥",
        "Education": "📚",
        "Shopping": "🛍️",
        "Entertainment": "🎬",
        "Rent": "🏠",
        "Other": "📦"
    };

    var html = "";
    for (var i = 0; i < expenses.length; i++) {
        var e = expenses[i];
        var icon = categoryIcons[e.category] || "📦";
        html += '<div class="expense-item">';
        html += '<div class="expense-item-left">';
        html += '<div class="expense-item-icon">' + icon + '</div>';
        html += '<div class="expense-item-info">';
        html += '<div class="expense-item-title">' + escapeHtml(e.title) + '</div>';
        html += '<div class="expense-item-meta">' + escapeHtml(e.category) + ' · ' + e.date + ' · ' + escapeHtml(e.added_by) + '</div>';
        html += '</div></div>';
        html += '<div class="expense-item-amount">-₹' + formatNumber(e.amount) + '</div>';
        html += '<button class="expense-item-delete" onclick="deleteExpense(' + e.id + ')">🗑️</button>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function deleteExpense(expenseId) {
    apiDelete("/api/expenses/delete/" + expenseId).then(function() {
        showToast("Expense deleted", "info");
        loadExpenses();
    }).catch(function(err) {
        showToast("Failed to delete", "error");
    });
}