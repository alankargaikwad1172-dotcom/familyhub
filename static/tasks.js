// ==================== TASKS ====================

function openAddTask() {
    openModal("addTaskModal");
}

function saveTask() {
    var title = document.getElementById("taskTitle").value.trim();
    var priority = document.getElementById("taskPriority").value;
    var dueDate = document.getElementById("taskDue").value;

    if (!title) {
        showToast("Enter a task title", "warning");
        return;
    }

    apiPost("/api/tasks", {
        family_id: window.currentFamilyId,
        title: title,
        priority: priority,
        due_date: dueDate || null
    }).then(function(data) {
        showToast("Task created!", "success");
        closeModal("addTaskModal");
        document.getElementById("taskTitle").value = "";
        document.getElementById("taskDue").value = "";
        loadTasks();
    }).catch(function(err) {
        showToast("Failed to create task", "error");
    });
}

function loadTasks() {
    if (!window.currentFamilyId) return;

    apiGet("/api/tasks/" + window.currentFamilyId).then(function(tasks) {
        renderTaskList(tasks);
    }).catch(function(err) {
        console.log("Tasks load error:", err);
    });
}

function renderTaskList(tasks) {
    var container = document.getElementById("taskList");
    if (!container) return;

    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✅</div><h3>No tasks</h3><p>Create your first task</p></div>';
        return;
    }

    var pending = [];
    var done = [];

    for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].status === "done") {
            done.push(tasks[i]);
        } else {
            pending.push(tasks[i]);
        }
    }

    var html = "";

    // Pending tasks
    for (var j = 0; j < pending.length; j++) {
        var t = pending[j];
        html += '<div class="task-item">';
        html += '<div class="task-priority ' + t.priority + '"></div>';
        html += '<div class="task-item-info">';
        html += '<div class="task-item-title">' + escapeHtml(t.title) + '</div>';
        html += '<div class="task-item-meta">';
        html += t.priority.charAt(0).toUpperCase() + t.priority.slice(1) + ' priority';
        if (t.due_date) html += ' · Due: ' + t.due_date;
        if (t.assigned_to) html += ' · ' + escapeHtml(t.assigned_to);
        html += '</div></div>';
        html += '<div class="task-item-actions">';
        html += '<button class="task-btn" onclick="toggleTask(' + t.id + ', \'done\')">✅</button>';
        html += '<button class="task-btn" onclick="deleteTask(' + t.id + ')">🗑️</button>';
        html += '</div></div>';
    }

    // Done tasks
    for (var k = 0; k < done.length; k++) {
        var d = done[k];
        html += '<div class="task-item done">';
        html += '<div class="task-priority low"></div>';
        html += '<div class="task-item-info">';
        html += '<div class="task-item-title">' + escapeHtml(d.title) + '</div>';
        html += '<div class="task-item-meta">Completed</div>';
        html += '</div>';
        html += '<div class="task-item-actions">';
        html += '<button class="task-btn" onclick="toggleTask(' + d.id + ', \'pending\')">↩️</button>';
        html += '<button class="task-btn" onclick="deleteTask(' + d.id + ')">🗑️</button>';
        html += '</div></div>';
    }

    container.innerHTML = html;
}

function toggleTask(taskId, status) {
    apiPut("/api/tasks/" + taskId, { status: status }).then(function() {
        loadTasks();
    }).catch(function(err) {
        showToast("Failed to update task", "error");
    });
}

function deleteTask(taskId) {
    apiDelete("/api/tasks/" + taskId).then(function() {
        showToast("Task deleted", "info");
        loadTasks();
    }).catch(function(err) {
        showToast("Failed to delete", "error");
    });
}