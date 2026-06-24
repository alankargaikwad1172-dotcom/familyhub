// ==================== API CONFIGURATION ====================

var API_BASE = "https://familyhub-1u10.onrender.com";

// ==================== API FUNCTIONS ====================

function getToken() {
    return localStorage.getItem("token");
}

function apiGet(endpoint) {
    var token = getToken();
    var url = API_BASE + endpoint;

    return fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? "Bearer " + token : ""
        }
    }).then(function(response) {
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.reload();
            }
            throw new Error("Request failed: " + response.status);
        }
        return response.json();
    });
}

function apiPost(endpoint, data) {
    var token = getToken();
    var url = API_BASE + endpoint;

    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? "Bearer " + token : ""
        },
        body: JSON.stringify(data)
    }).then(function(response) {
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("token");
                window.location.reload();
            }
            throw new Error("Request failed: " + response.status);
        }
        return response.json();
    });
}

function apiPut(endpoint, data) {
    var token = getToken();
    var url = API_BASE + endpoint;

    return fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? "Bearer " + token : ""
        },
        body: JSON.stringify(data)
    }).then(function(response) {
        if (!response.ok) {
            throw new Error("Request failed: " + response.status);
        }
        return response.json();
    });
}

function apiDelete(endpoint) {
    var token = getToken();
    var url = API_BASE + endpoint;

    return fetch(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? "Bearer " + token : ""
        }
    }).then(function(response) {
        if (!response.ok) {
            throw new Error("Request failed: " + response.status);
        }
        return response.json();
    });
}

function apiUpload(endpoint, formData) {
    var token = getToken();
    var url = API_BASE + endpoint;

    return fetch(url, {
        method: "POST",
        headers: {
            "Authorization": token ? "Bearer " + token : ""
        },
        body: formData
    }).then(function(response) {
        if (!response.ok) {
            throw new Error("Upload failed: " + response.status);
        }
        return response.json();
    });
}

// ==================== IMAGE URL HELPER ====================

function getImageUrl(path) {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return API_BASE + path;
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type) {
    type = type || "info";
    var container = document.getElementById("toastContainer");
    if (!container) return;

    var icons = {
        success: "✅",
        error: "❌",
        info: "ℹ️",
        warning: "⚠️"
    };

    var toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span><span class="toast-message">' + message + '</span>';

    container.appendChild(toast);

    setTimeout(function() {
        toast.style.animation = "toastOut 0.3s ease forwards";
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}