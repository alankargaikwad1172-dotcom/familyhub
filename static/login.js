// ==================== PASSWORD TOGGLE ====================

function togglePassword(inputId, btn) {
    var input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = "🙈";
    } else {
        input.type = "password";
        btn.innerHTML = "👁️";
    }
}

// ==================== SHOW/HIDE FORMS ====================

function showRegister() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
}

function showLogin() {
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
}

// ==================== LOGIN ====================

function handleLogin() {
    var email = document.getElementById("loginEmail").value.trim();
    var password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        showToast("Please fill in all fields", "error");
        return;
    }

    var btn = document.getElementById("loginBtn");
    btn.disabled = true;
    btn.textContent = "Signing In...";

    apiPost("/api/auth/login", {
        email: email,
        password: password
    }).then(function(data) {
        if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            showToast("Welcome back!", "success");
            loadUserInfo();
        } else {
            showToast("Login failed", "error");
            btn.disabled = false;
            btn.textContent = "Sign In";
        }
    }).catch(function(err) {
        showToast("Invalid email or password", "error");
        btn.disabled = false;
        btn.textContent = "Sign In";
    });
}

// ==================== REGISTER ====================

function handleRegister() {
    var name = document.getElementById("regName").value.trim();
    var email = document.getElementById("regEmail").value.trim();
    var password = document.getElementById("regPassword").value;

    if (!name || !email || !password) {
        showToast("Please fill in all fields", "error");
        return;
    }

    if (password.length < 6) {
        showToast("Password must be at least 6 characters", "error");
        return;
    }

    var btn = document.getElementById("registerBtn");
    btn.disabled = true;
    btn.textContent = "Creating Account...";

    apiPost("/api/auth/register", {
        full_name: name,
        email: email,
        password: password
    }).then(function(data) {
        if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            showToast("Account created!", "success");
            loadUserInfo();
        } else {
            showToast("Registration failed", "error");
            btn.disabled = false;
            btn.textContent = "Create Account";
        }
    }).catch(function(err) {
        showToast("Email already registered or server error", "error");
        btn.disabled = false;
        btn.textContent = "Create Account";
    });
}

// ==================== LOAD USER INFO ====================

function loadUserInfo() {
    apiGet("/api/auth/me").then(function(user) {
        if (user && user.id) {
            window.currentUser = user;
            document.getElementById("avatarLetter").textContent = user.full_name.charAt(0).toUpperCase();
            document.getElementById("menuAvatarLetter").textContent = user.full_name.charAt(0).toUpperCase();
            document.getElementById("menuUserName").textContent = user.full_name;
            document.getElementById("menuUserEmail").textContent = user.email;

            document.getElementById("authScreen").style.display = "none";
            document.getElementById("appScreen").style.display = "block";

            loadFamilies();
        }
    }).catch(function() {
        localStorage.removeItem("token");
        document.getElementById("authScreen").style.display = "block";
        document.getElementById("appScreen").style.display = "none";
    });
}

// ==================== LOGOUT ====================

function logout() {
    localStorage.removeItem("token");
    window.currentUser = null;
    window.currentFamilyId = null;
    window.families = [];

    document.getElementById("authScreen").style.display = "block";
    document.getElementById("appScreen").style.display = "none";

    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";

    showToast("Signed out", "info");
}