// ==================== GOALS ====================

function openAddGoal() {
    openModal("addGoalModal");
}

function saveGoal() {
    var title = document.getElementById("goalTitle").value.trim();
    var amount = parseFloat(document.getElementById("goalAmount").value);

    if (!title || isNaN(amount) || amount <= 0) {
        showToast("Enter a valid goal name and amount", "warning");
        return;
    }

    apiPost("/api/goals", {
        family_id: window.currentFamilyId,
        title: title,
        target_amount: amount
    }).then(function(data) {
        showToast("Goal created!", "success");
        closeModal("addGoalModal");
        document.getElementById("goalTitle").value = "";
        document.getElementById("goalAmount").value = "";
        loadGoals();
    }).catch(function(err) {
        showToast("Failed to create goal", "error");
    });
}

function loadGoals() {
    if (!window.currentFamilyId) return;

    apiGet("/api/goals/" + window.currentFamilyId).then(function(goals) {
        renderGoalsList(goals);
    }).catch(function(err) {
        console.log("Goals load error:", err);
    });
}

function renderGoalsList(goals) {
    var container = document.getElementById("goalsList");
    if (!container) return;

    if (!goals || goals.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎯</div><h3>No goals</h3><p>Create a savings goal</p></div>';
        return;
    }

    var html = "";
    for (var i = 0; i < goals.length; i++) {
        var g = goals[i];
        html += '<div class="goal-card">';
        html += '<div class="goal-header">';
        html += '<h3>' + escapeHtml(g.title) + '</h3>';
        html += '<button class="goal-delete-btn" onclick="deleteGoal(' + g.id + ')">🗑️</button>';
        html += '</div>';
        html += '<div class="goal-progress-bar"><div class="goal-progress-fill" style="width:' + Math.min(g.progress, 100) + '%"></div></div>';
        html += '<div class="goal-stats">';
        html += '<span>₹' + formatNumber(g.saved_amount) + ' saved</span>';
        html += '<strong>' + g.progress + '%</strong>';
        html += '<span>₹' + formatNumber(g.target_amount) + ' target</span>';
        html += '</div>';
        html += '<div class="goal-contribute">';
        html += '<input type="number" id="goalAdd' + g.id + '" placeholder="Add amount" inputmode="decimal">';
        html += '<button class="btn btn-sm btn-accent" onclick="contributeGoal(' + g.id + ')">Add</button>';
        html += '</div>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function contributeGoal(goalId) {
    var input = document.getElementById("goalAdd" + goalId);
    var amount = parseFloat(input.value);

    if (isNaN(amount) || amount <= 0) {
        showToast("Enter a valid amount", "warning");
        return;
    }

    apiPut("/api/goals/" + goalId + "/contribute", {
        amount: amount
    }).then(function(data) {
        showToast("₹" + formatNumber(amount) + " added!", "success");
        input.value = "";
        loadGoals();
    }).catch(function(err) {
        showToast("Failed to add money", "error");
    });
}

function deleteGoal(goalId) {
    apiDelete("/api/goals/" + goalId).then(function() {
        showToast("Goal deleted", "info");
        loadGoals();
    }).catch(function(err) {
        showToast("Failed to delete", "error");
    });
}