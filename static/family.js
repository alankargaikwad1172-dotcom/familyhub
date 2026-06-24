/*
 * family.js
 * View family members, invite codes, manage family.
 */
function renderFamily(container) {
    Promise.all([
        API.get('/families'),
        API.get('/families/' + currentFamilyId + '/members')
    ]).then(function(results) {
        var families = results[0];
        var members = results[1];
        var fam = null;
        for (var f = 0; f < families.length; f++) {
            if (families[f].id === currentFamilyId) { fam = families[f]; break; }
        }
        var html = '';
        html += '<div class="page-header"><div><h1 class="page-title">' + (fam ? fam.name : 'My Family') + '</h1><p class="page-subtitle">' + members.length + ' members</p></div></div>';
        html += '<div class="stat-card" style="margin-bottom:24px;text-align:center;">';
        html += '<div style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">Family Invite Code</div>';
        html += '<div style="font-family:Space Grotesk,sans-serif;font-size:36px;font-weight:700;letter-spacing:4px;color:var(--primary-light);margin-bottom:12px;">' + (fam ? fam.invite_code : '------') + '</div>';
        html += '<button class="btn btn-secondary btn-sm" onclick="copyCode()">Copy Code</button>';
        html += '<p style="font-size:12px;color:var(--text-muted);margin-top:12px;">Share this code so others can join</p>';
        html += '</div>';
        html += '<div class="list-card"><h3>Members</h3>';
        for (var i = 0; i < members.length; i++) {
            var m = members[i];
            html += '<div class="list-item" style="animation-delay:' + (i * 0.05) + 's"><div class="user-avatar" style="background:' + (m.color || '#6366F1') + '">' + m.name.charAt(0).toUpperCase() + '</div><div class="item-info"><div class="item-title">' + m.name + '</div><div class="item-meta">' + m.email + '</div></div><span class="badge badge-' + (m.role === 'admin' ? 'pending' : 'low') + '">' + m.role + '</span></div>';
        }
        html += '</div>';
        html += '<div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;">';
        html += '<button class="btn btn-secondary" onclick="showJoinFamily()">Join Another Family</button>';
        html += '<button class="btn btn-secondary" onclick="showCreateFamily()">Create New Family</button>';
        html += '</div>';
        container.innerHTML = html;
    }).catch(function() {
        container.innerHTML = '<div class="empty-state"><p>Failed to load</p></div>';
    });
}

function copyCode() {
    API.get('/families').then(function(fams) {
        for (var i = 0; i < fams.length; i++) {
            if (fams[i].id === currentFamilyId) {
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(fams[i].invite_code).then(function() { showToast('Copied!'); });
                } else {
                    showToast('Code: ' + fams[i].invite_code);
                }
                return;
            }
        }
    });
}

function showJoinFamily() {
    showModal('<h3>Join a Family</h3><div class="form-group"><label>Invite Code</label><input type="text" id="join-code" placeholder="Enter code" style="text-transform:uppercase;letter-spacing:2px;"></div><div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitJoinFamily()">Join</button></div>');
}

function submitJoinFamily() {
    var code = document.getElementById('join-code').value.trim();
    if (!code) return;
    API.post('/families/join', { invite_code: code })
        .then(function(result) { closeModal(); currentFamilyId = result.family_id; showToast(result.message); navigateTo('family'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function showCreateFamily() {
    showModal('<h3>Create a Family</h3><div class="form-group"><label>Family Name</label><input type="text" id="new-family-name" placeholder="e.g., The Johnsons"></div><div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitCreateFamily()">Create</button></div>');
}

function submitCreateFamily() {
    var name = document.getElementById('new-family-name').value.trim();
    if (!name) return;
    API.post('/families', { name: name })
        .then(function(result) { closeModal(); currentFamilyId = result.id; showToast('Created! Code: ' + result.invite_code); navigateTo('family'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}