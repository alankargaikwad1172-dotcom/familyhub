// ==================== DASHBOARD ====================

var categoryChart = null;

function loadDashboard() {
    if (!window.currentFamilyId) return;

    apiGet("/api/dashboard/" + window.currentFamilyId).then(function(data) {
        // Update stat cards
        document.getElementById("statExpenses").textContent = "₹" + formatNumber(data.monthly_expenses);
        document.getElementById("statShopping").textContent = data.shopping_items;
        document.getElementById("statTasks").textContent = data.pending_tasks;
        document.getElementById("statMeds").textContent = data.active_medicines;

        // Render chart
        renderCategoryChart(data.categories);

        // Render recent expenses
        renderRecentExpenses(data.recent_expenses);

        // Render goals
        renderDashboardGoals(data.goals);
    }).catch(function(err) {
        console.log("Dashboard load error:", err);
    });
}

function renderCategoryChart(categories) {
    var canvas = document.getElementById("categoryChart");
    if (!canvas) return;

    var ctx = canvas.getContext("2d");

    if (categoryChart) {
        categoryChart.destroy();
    }

    if (!categories || categories.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#7a7570";
        ctx.font = "14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("No expenses this month", canvas.width / 2, canvas.height / 2);
        return;
    }

    var labels = [];
    var values = [];
    var colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FF8A5C", "#A78BFA", "#34D399", "#F472B6", "#FBBF24", "#9CA3AF"];

    for (var i = 0; i < categories.length; i++) {
        labels.push(categories[i].name);
        values.push(categories[i].total);
    }

    if (typeof Chart !== "undefined") {
        categoryChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, categories.length),
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#a0a0a0",
                            padding: 12,
                            usePointStyle: true,
                            font: { size: 11 }
                        }
                    }
                },
                cutout: "65%"
            }
        });
    }
}

function renderRecentExpenses(expenses) {
    var container = document.getElementById("recentExpenses");
    if (!container) return;

    if (!expenses || expenses.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No recent expenses</p></div>';
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
        html += '<div class="expense-item-meta">' + escapeHtml(e.category) + ' · ' + e.date + '</div>';
        html += '</div></div>';
        html += '<div class="expense-item-amount">-₹' + formatNumber(e.amount) + '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function renderDashboardGoals(goals) {
    var container = document.getElementById("dashboardGoals");
    if (!container) return;

    if (!goals || goals.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No goals yet</p></div>';
        return;
    }

    var html = "";
    for (var i = 0; i < goals.length; i++) {
        var g = goals[i];
        html += '<div class="goal-card">';
        html += '<div class="goal-header"><h3>' + escapeHtml(g.title) + '</h3></div>';
        html += '<div class="goal-progress-bar"><div class="goal-progress-fill" style="width:' + Math.min(g.progress, 100) + '%"></div></div>';
        html += '<div class="goal-stats"><span>₹' + formatNumber(g.saved) + ' saved</span><strong>' + g.progress + '%</strong><span>₹' + formatNumber(g.target) + ' target</span></div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function formatNumber(num) {
    if (num === undefined || num === null) return "0";
    return parseFloat(num).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}