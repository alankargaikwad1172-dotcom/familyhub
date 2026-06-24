/*
 * expenses.js
 * Mobile-optimized expense tracking.
 */
function renderExpenses(container) {
    Promise.all([
        API.get('/expenses/' + currentFamilyId),
        API.get('/expenses/' + currentFamilyId + '/summary')
    ]).then(function(results) {
        var expenses = results[0];
        var summary = results[1];
        var html = '';

        html += '<div class="page-header"><div><h1 class="page-title">Expenses</h1><p class="page-subtitle">' + formatMoney(summary.total) + ' spent this month</p></div><button class="btn btn-primary" onclick="openAddExpense()">+ Add Expense</button></div>';

        html += '<div class="stats-grid">';
        html += '<div class="stat-card"><div class="stat-icon" style="background:rgba(99,102,241,0.15);">\u{1F4B0}</div><div class="stat-label">This Month</div><div class="stat-value">' + formatMoney(summary.total) + '</div></div>';
        var top = summary.categories.slice(0, 3);
        for (var c = 0; c < top.length; c++) {
            var tc = categoryColors[top[c].name] || '#9CA3AF';
            var ti = categoryIcons[top[c].name] || '\u{1F4E6}';
            html += '<div class="stat-card"><div class="stat-icon" style="background:' + tc + '22;">' + ti + '</div><div class="stat-label">' + top[c].name + '</div><div class="stat-value">' + formatMoney(top[c].total) + '</div></div>';
        }
        html += '</div>';

        html += '<div class="list-card"><h3>\u{1F4CB} All Expenses</h3>';
        if (expenses.length > 0) {
            for (var i = 0; i < expenses.length; i++) {
                var e = expenses[i];
                var ec = categoryColors[e.category] || '#9CA3AF';
                var ei = categoryIcons[e.category] || '\u{1F4E6}';
                html += '<div class="list-item" style="animation-delay:' + (i * 0.04) + 's">';
                html += '<div class="item-icon" style="background:' + ec + '22;">' + ei + '</div>';
                html += '<div class="item-info"><div class="item-title">' + e.title + '</div><div class="item-meta">' + e.category + ' &bull; ' + getRelativeDate(e.date) + '</div></div>';
                html += '<div class="item-value" style="color:' + ec + '">' + formatMoney(e.amount) + '</div>';
                html += '<button class="btn-delete" onclick="deleteExpense(' + e.id + ')">&#128465;</button>';
                html += '</div>';
            }
        } else {
            html += '<div class="empty-state"><p>No expenses yet</p></div>';
        }
        html += '</div>';
        container.innerHTML = html;
    }).catch(function() {
        container.innerHTML = '<div class="empty-state"><p>Failed to load expenses</p></div>';
    });
}

function openAddExpense() {
    var opts = '';
    var cats = Object.keys(categoryIcons);
    for (var i = 0; i < cats.length; i++) {
        opts += '<option value="' + cats[i] + '">' + categoryIcons[cats[i]] + ' ' + cats[i] + '</option>';
    }
    showModal(
        '<h3>Add Expense</h3>' +
        '<div class="form-group"><label>Title</label><input type="text" id="exp-title" placeholder="What did you spend on?" inputmode="text"></div>' +
        '<div class="form-group"><label>Amount (\u20B9)</label><input type="number" id="exp-amount" placeholder="0" min="0" step="0.01" inputmode="decimal"></div>' +
        '<div class="form-group"><label>Category</label><select id="exp-category">' + opts + '</select></div>' +
        '<div class="form-group"><label>Note (optional)</label><input type="text" id="exp-note" placeholder="Any details..."></div>' +
        '<div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitExpense()">Add Expense</button></div>'
    );
}

function submitExpense() {
    var title = document.getElementById('exp-title').value.trim();
    var amount = parseFloat(document.getElementById('exp-amount').value);
    var category = document.getElementById('exp-category').value;
    var note = document.getElementById('exp-note').value.trim();
    if (!title || isNaN(amount) || amount <= 0) { showToast('Fill in title and amount', 'error'); return; }
    API.post('/expenses', { family_id: currentFamilyId, title: title, amount: amount, category: category, note: note || null })
        .then(function() { closeModal(); showToast('Expense added!'); navigateTo('expenses'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function deleteExpense(id) {
    if (!confirm('Delete this expense?')) return;
    API.del('/expenses/delete/' + id)
        .then(function() { showToast('Deleted'); navigateTo('expenses'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}