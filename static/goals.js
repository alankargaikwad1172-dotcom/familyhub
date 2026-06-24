/*
 * goals.js
 * Mobile-optimized savings goals.
 */
function renderGoals(container) {
    API.get('/goals/' + currentFamilyId)
        .then(function(goals) {
            var html = '';
            html += '<div class="page-header"><div><h1 class="page-title">Family Goals</h1><p class="page-subtitle">' + goals.length + ' active goals</p></div><button class="btn btn-primary" onclick="openAddGoal()">+ New Goal</button></div>';

            if (goals.length > 0) {
                for (var i = 0; i < goals.length; i++) {
                    var g = goals[i];
                    html += '<div class="goal-card" style="animation-delay:' + (i * 0.08) + 's">';
                    html += '<div class="goal-header"><div class="goal-title"><span style="font-size:28px;">\u{1F3AF}</span><div><div style="font-size:15px;">' + g.title + '</div><div style="font-size:12px;color:var(--text-secondary);">' + g.progress + '% complete</div></div></div>';
                    html += '<button class="btn-delete" onclick="deleteGoal(' + g.id + ')">&#128465;</button></div>';
                    html += '<div class="progress-bar"><div class="progress-fill emerald" style="width:' + Math.min(g.progress, 100) + '%"></div></div>';
                    html += '<div class="goal-amounts"><span>' + formatMoney(g.saved_amount) + ' saved</span><span>of ' + formatMoney(g.target_amount) + '</span></div>';
                    html += '<div style="margin-top:12px;display:flex;gap:8px;">';
                    html += '<input type="number" id="contrib-' + g.id + '" placeholder="Amount" inputmode="decimal" style="flex:1;padding:10px 12px;background:rgba(255,255,255,0.06);border:1px solid var(--glass-border);border-radius:var(--radius-sm);color:var(--text-primary);font-size:16px;font-family:Inter,sans-serif;outline:none;min-height:44px;">';
                    html += '<button class="btn btn-primary btn-sm" onclick="contributeGoal(' + g.id + ')">+ Add</button>';
                    html += '</div>';
                    html += '</div>';
                }
            } else {
                html += '<div class="empty-state"><p>Set a goal and start saving together!</p><button class="btn btn-primary" onclick="openAddGoal()">Create Goal</button></div>';
            }
            container.innerHTML = html;
        })
        .catch(function() { container.innerHTML = '<div class="empty-state"><p>Failed to load</p></div>'; });
}

function openAddGoal() {
    showModal(
        '<h3>New Savings Goal</h3>' +
        '<div class="form-group"><label>Goal Name</label><input type="text" id="goal-title" placeholder="e.g., Family Vacation"></div>' +
        '<div class="form-group"><label>Target Amount (\u20B9)</label><input type="number" id="goal-amount" placeholder="100000" min="1" inputmode="decimal"></div>' +
        '<div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitGoal()">Create</button></div>'
    );
}

function submitGoal() {
    var title = document.getElementById('goal-title').value.trim();
    var amount = parseFloat(document.getElementById('goal-amount').value);
    if (!title || isNaN(amount) || amount <= 0) { showToast('Fill in all fields', 'error'); return; }
    API.post('/goals', { family_id: currentFamilyId, title: title, target_amount: amount, icon: 'target' })
        .then(function() { closeModal(); showToast('Goal created!'); navigateTo('goals'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function contributeGoal(goalId) {
    var input = document.getElementById('contrib-' + goalId);
    var amount = parseFloat(input.value);
    if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
    API.put('/goals/' + goalId + '/contribute', { amount: amount })
        .then(function(result) { showToast('Added ' + formatMoney(amount) + '!'); navigateTo('goals'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function deleteGoal(id) {
    if (!confirm('Delete this goal?')) return;
    API.del('/goals/' + id)
        .then(function() { showToast('Deleted'); navigateTo('goals'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}