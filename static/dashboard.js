/*
 * dashboard.js
 * Shows the family overview: stats, charts, recent activity, goals.
 */
function renderDashboard(container) {
    if (!currentFamilyId) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128104;</div><p>Create or join a family first</p></div>';
        return;
    }
    API.get('/dashboard/' + currentFamilyId)
        .then(function(data) {
            var html = '';
            html += '<div class="page-header"><div><h1 class="page-title">Dashboard</h1><p class="page-subtitle">Your family at a glance</p></div></div>';

            html += '<div class="stats-grid">';
            html += makeStatCard('\u{1F4B0}', 'rgba(99,102,241,0.15)', 'Monthly Expenses', formatMoney(data.monthly_expenses));
            html += makeStatCard('\u{1F6D2}', 'rgba(16,185,129,0.15)', 'Shopping Items', data.shopping_items);
            html += makeStatCard('\u2705', 'rgba(245,158,11,0.15)', 'Pending Tasks', data.pending_tasks);
            html += makeStatCard('\u{1F48A}', 'rgba(244,63,94,0.15)', 'Active Medicines', data.active_medicines);
            html += '</div>';

            html += '<div class="content-grid">';
            html += '<div class="chart-card"><h3>\u{1F4CA} Spending by Category</h3><canvas id="expense-chart" height="250"></canvas></div>';

            html += '<div class="list-card"><h3>\u{1F550} Recent Expenses</h3>';
            if (data.recent_expenses.length > 0) {
                for (var i = 0; i < data.recent_expenses.length; i++) {
                    var e = data.recent_expenses[i];
                    var c = categoryColors[e.category] || '#9CA3AF';
                    var ic = categoryIcons[e.category] || '\u{1F4E6}';
                    html += '<div class="list-item"><div class="item-icon" style="background:' + c + '22;">' + ic + '</div><div class="item-info"><div class="item-title">' + e.title + '</div><div class="item-meta">' + e.category + ' &bull; ' + getRelativeDate(e.date) + '</div></div><div class="item-value" style="color:' + c + '">' + formatMoney(e.amount) + '</div></div>';
                }
            } else {
                html += '<div class="empty-state"><p>No expenses yet</p></div>';
            }
            html += '</div>';

            html += '<div class="list-card full-width"><h3>\u{1F3AF} Family Goals</h3>';
            if (data.goals.length > 0) {
                for (var j = 0; j < data.goals.length; j++) {
                    var g = data.goals[j];
                    html += '<div class="goal-card"><div class="goal-header"><div class="goal-title"><span style="font-size:24px;">\u{1F3AF}</span><span>' + g.title + '</span></div><span class="badge badge-pending">' + g.progress + '%</span></div><div class="progress-bar"><div class="progress-fill emerald" style="width:' + Math.min(g.progress, 100) + '%"></div></div><div class="goal-amounts"><span>' + formatMoney(g.saved) + ' saved</span><span>Target: ' + formatMoney(g.target) + '</span></div></div>';
                }
            } else {
                html += '<div class="empty-state"><p>No goals yet</p></div>';
            }
            html += '</div></div>';

            container.innerHTML = html;

            if (data.categories.length > 0) {
                var canvas = document.getElementById('expense-chart');
                if (canvas) {
                    var labels = [], values = [], colors = [];
                    for (var k = 0; k < data.categories.length; k++) {
                        labels.push(data.categories[k].name);
                        values.push(data.categories[k].total);
                        colors.push(categoryColors[data.categories[k].name] || '#9CA3AF');
                    }
                    new Chart(canvas, {
                        type: 'doughnut',
                        data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, spacing: 3, borderRadius: 6 }] },
                        options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 16, usePointStyle: true, font: { family: 'Inter', size: 12 } } } } }
                    });
                }
            }
        })
        .catch(function() {
            container.innerHTML = '<div class="empty-state"><p>Could not load dashboard</p></div>';
        });
}

function makeStatCard(icon, bg, label, value) {
    return '<div class="stat-card"><div class="stat-icon" style="background:' + bg + ';">' + icon + '</div><div class="stat-label">' + label + '</div><div class="stat-value">' + value + '</div></div>';
}