/*
 * app.js
 * Main brain with notifications, reminders, speech, and mobile menu.
 */
var currentFamilyId = null;
var currentPage = 'dashboard';

document.addEventListener('DOMContentLoaded', function() {
    var token = API.getToken();
    if (token) {
        loadFamiliesAndShowApp();
    }
    window.addEventListener('popstate', function() { closeMobileMenu(); });
});

function showApp() {
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-screen').classList.add('active');
    var user = API.getUser();
    if (user) {
        document.getElementById('user-name').textContent = user.full_name;
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('user-avatar').textContent = user.full_name.charAt(0).toUpperCase();
        document.getElementById('mobile-user-avatar').textContent = user.full_name.charAt(0).toUpperCase();
        document.getElementById('menu-avatar').textContent = user.full_name.charAt(0).toUpperCase();
        document.getElementById('menu-user-name').textContent = user.full_name;
        document.getElementById('menu-user-email').textContent = user.email;
    }
    navigateTo('dashboard');
    startNotificationSystem();
}

function showAuth() {
    document.getElementById('auth-screen').classList.add('active');
    document.getElementById('app-screen').classList.remove('active');
    stopNotificationSystem();
}

function loadFamiliesAndShowApp() {
    API.get('/families')
        .then(function(families) {
            if (families.length > 0) {
                currentFamilyId = families[0].id;
                showApp();
            } else {
                showAuth();
                showFamilySetup();
            }
        })
        .catch(function() { showAuth(); });
}

// ==================== NAVIGATION ====================

function navigateTo(page) {
    currentPage = page;
    closeMobileMenu();
    window.scrollTo(0, 0);
    var links = document.querySelectorAll('.nav-link');
    for (var i = 0; i < links.length; i++) {
        links[i].classList.toggle('active', links[i].getAttribute('data-page') === page);
    }
    var btns = document.querySelectorAll('.bottom-nav-btn');
    for (var j = 0; j < btns.length; j++) {
        btns[j].classList.toggle('active', btns[j].getAttribute('data-page') === page);
    }
    var container = document.getElementById('page-container');
    container.innerHTML = '<div class="spinner"></div>';
    if (page === 'dashboard') renderDashboard(container);
    else if (page === 'expenses') renderExpenses(container);
    else if (page === 'shopping') renderShopping(container);
    else if (page === 'tasks') renderTasks(container);
    else if (page === 'medicines') renderMedicines(container);
    else if (page === 'goals') renderGoals(container);
    else if (page === 'family') renderFamily(container);
}

// ==================== MOBILE MENU ====================

function showMobileMenu() {
    document.getElementById('mobile-menu-overlay').classList.remove('hidden');
    document.getElementById('mobile-menu').classList.remove('hidden');
}

function closeMobileMenu() {
    document.getElementById('mobile-menu-overlay').classList.add('hidden');
    document.getElementById('mobile-menu').classList.add('hidden');
}

// ==================== MODALS ====================

function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.body.style.overflow = '';
}

document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === e.currentTarget) closeModal();
});

// ==================== TOAST ====================

function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toast-container');
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
}

function handleLogout() {
    API.clearToken();
    currentFamilyId = null;
    closeMobileMenu();
    stopNotificationSystem();
    showAuth();
    showToast('Signed out', 'info');
}

function formatMoney(amount) {
    return '\u20B9' + Number(amount).toLocaleString('en-IN');
}

function getRelativeDate(dateStr) {
    var d = new Date(dateStr);
    var now = new Date();
    var diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return diff + ' days ago';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

var categoryColors = {
    'Food & Dining': '#FF6B6B', 'Groceries': '#4ECDC4', 'Transport': '#45B7D1',
    'Utilities': '#96CEB4', 'Healthcare': '#FF8A5C', 'Education': '#A78BFA',
    'Shopping': '#34D399', 'Entertainment': '#F472B6', 'Rent': '#FBBF24', 'Other': '#9CA3AF'
};
var categoryIcons = {
    'Food & Dining': '\uD83C\uDF55', 'Groceries': '\uD83D\uDED2', 'Transport': '\uD83D\uDE97',
    'Utilities': '\uD83D\uDCA1', 'Healthcare': '\uD83C\uDFE5', 'Education': '\uD83D\uDCDA',
    'Shopping': '\uD83D\uDECD\uFE0F', 'Entertainment': '\uD83C\uDFAC', 'Rent': '\uD83C\uDFE0', 'Other': '\uD83D\uDCE6'
};

// ==================== NOTIFICATION INTEGRATION ====================

function startNotificationSystem() {
    if (!currentFamilyId) return;
    NotificationSystem.checkPermission();
    NotificationSystem.startPolling(currentFamilyId);
}

function stopNotificationSystem() {
    NotificationSystem.stopPolling();
}

function requestNotificationPermission() {
    NotificationSystem.requestPermission();
}

function showNotificationPanel() {
    NotificationSystem.clearBadge();
    showToast('Notifications cleared', 'info');
}

function dismissReminderAlert() {
    document.getElementById('reminder-alert-overlay').classList.add('hidden');
    document.body.style.overflow = '';
    if ('speechSynthesis' in window) { speechSynthesis.cancel(); }
    var speakingDiv = document.getElementById('reminder-speaking');
    if (speakingDiv) speakingDiv.classList.add('hidden');
}

function showNotificationSettings() {
    var status = 'Not supported';
    if ('Notification' in window) {
        if (Notification.permission === 'granted') status = 'Enabled';
        else if (Notification.permission === 'denied') status = 'Blocked';
        else status = 'Not set';
    }
    var statusColor = status === 'Enabled' ? 'var(--emerald)' : 'var(--amber)';
    var btnHtml = status !== 'Enabled' ? '<button class="btn btn-primary" onclick="requestNotificationPermission(); closeModal();">Enable Notifications</button>' : '';
    showModal(
        '<h3>Notification Settings</h3>' +
        '<div style="margin-bottom:20px;">' +
        '<p style="color:var(--text-secondary);font-size:14px;margin-bottom:12px;">Status: <strong style="color:' + statusColor + '">' + status + '</strong></p>' +
        '<p style="color:var(--text-secondary);font-size:13px;line-height:1.6;">Notifications alert you when family members add items to the shopping list. Voice reminders speak aloud at your set time.</p>' +
        '</div>' +
        '<div class="modal-actions">' +
        btnHtml +
        '<button class="btn btn-secondary" onclick="closeModal()">Close</button>' +
        '</div>'
    );
}