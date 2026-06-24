// ==================== FAMILY ====================

function openCreateFamily() {
    openModal("createFamilyModal");
}

function openJoinFamily() {
    openModal("joinFamilyModal");
}

function createFamily() {
    var name = document.getElementById("familyName").value.trim();

    if (!name) {
        showToast("Enter a family name", "warning");
        return;
    }

    apiPost("/api/families", { name: name }).then(function(data) {
        showToast("Family created!", "success");
        closeModal("createFamilyModal");
        document.getElementById("familyName").value = "";
        loadFamilies();
    }).catch(function(err) {
        showToast("Failed to create family", "error");
    });
}

function joinFamily() {
    var code = document.getElementById("joinCode").value.trim();

    if (!code) {
        showToast("Enter an invite code", "warning");
        return;
    }

    apiPost("/api/families/join", { invite_code: code }).then(function(data) {
        showToast(data.message || "Joined!", "success");
        closeModal("joinFamilyModal");
        document.getElementById("joinCode").value = "";
        loadFamilies();
    }).catch(function(err) {
        showToast("Invalid invite code", "error");
    });
}

function loadFamilyPage() {
    if (!window.currentFamilyId) return;

    // Load members
    apiGet("/api/families/" + window.currentFamilyId + "/members").then(function(members) {
        renderMembersList(members);
    }).catch(function(err) {
        console.log("Members load error:", err);
    });

    // Find current family info
    var currentFamily = null;
    for (var i = 0; i < window.families.length; i++) {
        if (window.families[i].id === window.currentFamilyId) {
            currentFamily = window.families[i];
            break;
        }
    }

    if (currentFamily) {
        renderFamilyInfo(currentFamily);
    }
}

function renderFamilyInfo(family) {
    var container = document.getElementById("familyInfo");
    if (!container) return;

    var html = '<h2>' + escapeHtml(family.name) + '</h2>';
    html += '<p>Invite Code:</p>';
    html += '<div class="invite-code">' + escapeHtml(family.invite_code) + '</div>';
    html += '<br><button class="copy-btn" onclick="copyInviteCode(\'' + escapeHtml(family.invite_code) + '\')">📋 Copy Code</button>';
    container.innerHTML = html;
}

function renderMembersList(members) {
    var container = document.getElementById("membersList");
    if (!container) return;

    if (!members || members.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No members yet</p></div>';
        return;
    }

    var colors = ["#6366f1", "#10b981", "#f59e0b", "#f43f5e", "#0ea5e9", "#a78bfa"];

    var html = "";
    for (var i = 0; i < members.length; i++) {
        var m = members[i];
        var color = colors[i % colors.length];
        var initial = m.name.charAt(0).toUpperCase();

        html += '<div class="member-item">';
        html += '<div class="member-avatar" style="background:' + color + '">' + initial + '</div>';
        html += '<div class="member-info">';
        html += '<div class="member-name">' + escapeHtml(m.name) + '</div>';
        html += '<div class="member-role">' + escapeHtml(m.role) + ' · ' + escapeHtml(m.email) + '</div>';
        html += '</div></div>';
    }
    container.innerHTML = html;
}

function copyInviteCode(code) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code).then(function() {
            showToast("Invite code copied!", "success");
        });
    } else {
        var textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showToast("Invite code copied!", "success");
    }
}