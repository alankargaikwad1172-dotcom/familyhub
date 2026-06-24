/*
 * tasks.js
 * Mobile-optimized task list.
 */
function renderTasks(container) {
    API.get('/tasks/' + currentFamilyId)
        .then(function(tasks) {
            var pending = [], done = [];
            for (var x = 0; x < tasks.length; x++) {
                if (tasks[x].status === 'done') done.push(tasks[x]);
                else pending.push(tasks[x]);
            }
            var html = '';
            html += '<div class="page-header"><div><h1 class="page-title">Tasks</h1><p class="page-subtitle">' + pending.length + ' pending, ' + done.length + ' done</p></div><button class="btn btn-primary" onclick="openAddTask()">+ New Task</button></div>';

            html += '<div class="list-card" style="margin-bottom:16px;"><h3>\u{1F4CC} Pending (' + pending.length + ')</h3>';
            if (pending.length > 0) {
                for (var i = 0; i < pending.length; i++) {
                    var t = pending[i];
                    var meta = '';
                    if (t.assigned_to) meta += '\u{1F464} ' + t.assigned_to;
                    if (t.due_date && t.due_date !== 'None') meta += (meta ? ' &bull; ' : '') + '\u{1F4C5} ' + t.due_date;
                    html += '<div class="list-item" style="animation-delay:' + (i * 0.04) + 's">';
                    html += '<button class="item-check" onclick="markTaskDone(' + t.id + ')">&#10003;</button>';
                    html += '<div class="item-info"><div class="item-title">' + t.title + '</div>';
                    if (meta) html += '<div class="item-meta">' + meta + '</div>';
                    html += '</div>';
                    html += '<span class="badge badge-' + t.priority + '">' + t.priority + '</span>';
                    html += '<button class="btn-delete" onclick="deleteTask(' + t.id + ')">&#128465;</button>';
                    html += '</div>';
                }
            } else {
                html += '<div class="empty-state"><p>No pending tasks!</p></div>';
            }
            html += '</div>';

            if (done.length > 0) {
                html += '<div class="list-card"><h3>\u2705 Done (' + done.length + ')</h3>';
                for (var j = 0; j < done.length; j++) {
                    var d = done[j];
                    html += '<div class="list-item" style="opacity:0.5;">';
                    html += '<button class="item-check checked" onclick="markTaskPending(' + d.id + ')">&#10003;</button>';
                    html += '<div class="item-info"><div class="item-title" style="text-decoration:line-through;">' + d.title + '</div></div>';
                    html += '<button class="btn-delete" onclick="deleteTask(' + d.id + ')">&#128465;</button>';
                    html += '</div>';
                }
                html += '</div>';
            }
            container.innerHTML = html;
        })
        .catch(function() { container.innerHTML = '<div class="empty-state"><p>Failed to load</p></div>'; });
}

function openAddTask() {
    showModal(
        '<h3>New Task</h3>' +
        '<div class="form-group"><label>What needs to be done?</label><input type="text" id="task-title" placeholder="e.g., Pay electricity bill"></div>' +
        '<div class="form-group"><label>Priority</label><select id="task-priority"><option value="low">Low</option><option value="medium" selected>Medium</option><option value="high">High</option></select></div>' +
        '<div class="form-group"><label>Due Date (optional)</label><input type="date" id="task-due"></div>' +
        '<div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitTask()">Create</button></div>'
    );
}

function submitTask() {
    var title = document.getElementById('task-title').value.trim();
    var priority = document.getElementById('task-priority').value;
    var due = document.getElementById('task-due').value;
    if (!title) { showToast('Enter a task title', 'error'); return; }
    API.post('/tasks', { family_id: currentFamilyId, title: title, priority: priority, due_date: due || null })
        .then(function() { closeModal(); showToast('Task created!'); navigateTo('tasks'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function markTaskDone(id) {
    API.put('/tasks/' + id, { status: 'done' })
        .then(function() { showToast('Done!'); navigateTo('tasks'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function markTaskPending(id) {
    API.put('/tasks/' + id, { status: 'pending' })
        .then(function() { navigateTo('tasks'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function deleteTask(id) {
    if (!confirm('Delete?')) return;
    API.del('/tasks/' + id)
        .then(function() { showToast('Deleted'); navigateTo('tasks'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}