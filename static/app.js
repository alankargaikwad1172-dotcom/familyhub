// ==================== GLOBAL STATE ====================

window.currentUser = null;
window.currentFamilyId = null;
window.families = [];
window.notifHistory = [];

// ==================== INIT APP ====================

document.addEventListener("DOMContentLoaded", function() {
    var token = localStorage.getItem("token");
    if (token) {
        loadUserInfo();
    }
});

// ==================== PAGE NAVIGATION ====================

function showPage(pageName) {
    // Hide all pages
    var pages = document.querySelectorAll(".page");
    for (var i = 0; i < pages.length; i++) {
        pages[i].classList.remove("active");
    }

    // Show selected page
    var target = document.getElementById("page-" + pageName);
    if (target) {
        target.classList.add("active");
    }

    // Update bottom nav
    var navItems = document.querySelectorAll(".nav-item");
    for (var j = 0; j < navItems.length; j++) {
        navItems[j].classList.remove("active");
    }

    // Find matching nav item
    var navMap = {
        "dashboard": 0,
        "expenses": 1,
        "shopping": 2,
        "tasks": 3,
        "goals": 4
    };

    if (navMap[pageName] !== undefined && navItems[navMap[pageName]]) {
        navItems[navMap[pageName]].classList.add("active");
    }

    // Load page data
    if (window.currentFamilyId) {
        if (pageName === "dashboard") loadDashboard();
        if (pageName === "expenses") loadExpenses();
        if (pageName === "shopping") {
            loadShoppingData();
            updateNotifBanner();
        }
        if (pageName === "tasks") loadTasks();
        if (pageName === "goals") loadGoals();
        if (pageName === "medicines") loadMedicines();
        if (pageName === "family") loadFamilyPage();
    }
}

// ==================== FAMILY SELECTION ====================

function onFamilyChange() {
    var select = document.getElementById("familySelect");
    window.currentFamilyId = parseInt(select.value);

    // Reload current page
    var activePage = document.querySelector(".page.active");
    if (activePage) {
        var pageName = activePage.id.replace("page-", "");
        showPage(pageName);
    }
}

// ==================== USER MENU ====================

function toggleUserMenu() {
    var menu = document.getElementById("userMenu");
    menu.classList.toggle("open");
}

// ==================== MODALS ====================

function openModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("open");
    }
}

function closeModal(modalId) {
    var modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove("open");
    }
}

// ==================== LOAD FAMILIES ====================

function loadFamilies() {
    apiGet("/api/families").then(function(families) {
        window.families = families || [];

        if (window.families.length === 0) {
            // No family yet - show family page
            showPage("family");
            return;
        }

        // Set first family as current
        window.currentFamilyId = window.families[0].id;

        // Populate family selector
        var select = document.getElementById("familySelect");
        if (select) {
            var html = "";
            for (var i = 0; i < window.families.length; i++) {
                html += '<option value="' + window.families[i].id + '">' + escapeHtml(window.families[i].name) + '</option>';
            }
            select.innerHTML = html;
        }

        // Start notification polling
        startNotificationPolling();

        // Load dashboard
        showPage("dashboard");
    }).catch(function(err) {
        console.log("Failed to load families:", err);
        showPage("family");
    });
}