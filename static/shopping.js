// ==================== SHOPPING LIST ====================

var shopItems = [];
var shopImages = [];
var shopReminders = [];
var cameraStream = null;
var lastNotifiedId = 0;

// ==================== LOAD SHOPPING DATA ====================

function loadShoppingData() {
    if (!window.currentFamilyId) return;

    // Load items
    apiGet("/api/shopping/" + window.currentFamilyId).then(function(items) {
        shopItems = items || [];
        renderShopItems();
    }).catch(function(err) {
        console.log("Failed to load shopping items:", err);
    });

    // Load images
    apiGet("/api/images/shopping/" + window.currentFamilyId).then(function(images) {
        shopImages = images || [];
        renderShopImages();
    }).catch(function(err) {
        console.log("Failed to load images:", err);
    });

    // Load reminders
    apiGet("/api/reminders/" + window.currentFamilyId).then(function(reminders) {
        shopReminders = reminders || [];
        renderReminders();
    }).catch(function(err) {
        console.log("Failed to load reminders:", err);
    });
}

// ==================== ADD SHOPPING ITEM ====================

function addShopItem() {
    var nameInput = document.getElementById("shopItemName");
    var qtyInput = document.getElementById("shopItemQty");

    var name = nameInput.value.trim();
    var qty = qtyInput.value.trim() || "1";

    if (!name) {
        showToast("Enter an item name", "warning");
        nameInput.focus();
        return;
    }

    apiPost("/api/shopping", {
        family_id: window.currentFamilyId,
        name: name,
        quantity: qty,
        category: "General"
    }).then(function(data) {
        nameInput.value = "";
        qtyInput.value = "1";
        showToast("Added: " + name, "success");
        loadShoppingData();
    }).catch(function(err) {
        showToast("Failed to add item", "error");
    });
}

// ==================== RENDER SHOPPING ITEMS ====================

function renderShopItems() {
    var toBuyList = document.getElementById("shopToBuyList");
    var boughtList = document.getElementById("shopBoughtList");

    if (!toBuyList || !boughtList) return;

    var toBuy = [];
    var bought = [];

    for (var i = 0; i < shopItems.length; i++) {
        if (shopItems[i].is_bought) {
            bought.push(shopItems[i]);
        } else {
            toBuy.push(shopItems[i]);
        }
    }

    // Render To Buy
    if (toBuy.length === 0) {
        toBuyList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🛒</div><h3>Nothing to buy</h3><p>Add items above</p></div>';
    } else {
        var html = "";
        for (var j = 0; j < toBuy.length; j++) {
            var item = toBuy[j];
            html += '<div class="shop-item">';
            html += '<button class="shop-item-check" onclick="toggleBought(' + item.id + ', true)"></button>';
            html += '<div class="shop-item-info">';
            html += '<div class="shop-item-name">' + escapeHtml(item.name) + '</div>';
            html += '<div class="shop-item-qty">Qty: ' + escapeHtml(item.quantity) + '</div>';
            html += '</div>';
            html += '<button class="shop-item-delete" onclick="deleteShopItem(' + item.id + ')">🗑️</button>';
            html += '</div>';
        }
        toBuyList.innerHTML = html;
    }

    // Render Bought
    if (bought.length === 0) {
        boughtList.innerHTML = '<div class="empty-state" style="padding:20px;"><p>No items bought yet</p></div>';
    } else {
        var html2 = "";
        for (var k = 0; k < bought.length; k++) {
            var item2 = bought[k];
            html2 += '<div class="shop-item bought">';
            html2 += '<button class="shop-item-check checked" onclick="toggleBought(' + item2.id + ', false)">✓</button>';
            html2 += '<div class="shop-item-info">';
            html2 += '<div class="shop-item-name">' + escapeHtml(item2.name) + '</div>';
            html2 += '<div class="shop-item-qty">Qty: ' + escapeHtml(item2.quantity) + '</div>';
            html2 += '</div>';
            html2 += '<button class="shop-item-delete" onclick="deleteShopItem(' + item2.id + ')">🗑️</button>';
            html2 += '</div>';
        }
        boughtList.innerHTML = html2;
    }
}

// ==================== TOGGLE BOUGHT ====================

function toggleBought(itemId, isBought) {
    apiPut("/api/shopping/" + itemId, {
        is_bought: isBought
    }).then(function() {
        loadShoppingData();
    }).catch(function(err) {
        showToast("Failed to update", "error");
    });
}

// ==================== DELETE SHOPPING ITEM ====================

function deleteShopItem(itemId) {
    apiDelete("/api/shopping/" + itemId).then(function() {
        showToast("Item deleted", "info");
        loadShoppingData();
    }).catch(function(err) {
        showToast("Failed to delete", "error");
    });
}

// ==================== RENDER SHOPPING IMAGES ====================

function renderShopImages() {
    var grid = document.getElementById("photoGrid");
    if (!grid) return;

    if (shopImages.length === 0) {
        grid.innerHTML = "";
        return;
    }

    var html = "";
    for (var i = 0; i < shopImages.length; i++) {
        var img = shopImages[i];
        var imgUrl = getImageUrl(img.url);
        html += '<div class="photo-thumb">';
        html += '<img src="' + imgUrl + '" alt="' + escapeHtml(img.caption || "Photo") + '" onclick="viewPhoto(\'' + imgUrl + '\', \'' + escapeHtml(img.caption || "Photo") + '\')">';
        html += '<button class="photo-thumb-delete" onclick="deleteImage(' + img.id + ')">✕</button>';
        html += '</div>';
    }
    grid.innerHTML = html;
}

// ==================== CAMERA ====================

function openCamera() {
    var modal = document.getElementById("cameraModal");
    modal.classList.add("open");

    var video = document.getElementById("cameraVideo");

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 960 }
            }
        }).then(function(stream) {
            cameraStream = stream;
            video.srcObject = stream;
        }).catch(function(err) {
            console.log("Camera error:", err);
            showToast("Cannot access camera", "error");
            closeCamera();
        });
    } else {
        showToast("Camera not supported", "error");
        closeCamera();
    }
}

function closeCamera() {
    var modal = document.getElementById("cameraModal");
    modal.classList.remove("open");

    if (cameraStream) {
        var tracks = cameraStream.getTracks();
        for (var i = 0; i < tracks.length; i++) {
            tracks[i].stop();
        }
        cameraStream = null;
    }

    var video = document.getElementById("cameraVideo");
    video.srcObject = null;
}

function capturePhoto() {
    var video = document.getElementById("cameraVideo");
    var canvas = document.getElementById("cameraCanvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    var ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(function(blob) {
        if (!blob) {
            showToast("Failed to capture", "error");
            return;
        }

        var file = new File([blob], "camera_" + Date.now() + ".jpg", { type: "image/jpeg" });
        uploadImage(file);
        closeCamera();
    }, "image/jpeg", 0.8);
}

// ==================== GALLERY UPLOAD ====================

function openGallery() {
    var input = document.getElementById("galleryInput");
    input.click();
}

function handleGallerySelect(event) {
    var file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        showToast("File too large (max 10MB)", "error");
        return;
    }

    uploadImage(file);
    event.target.value = "";
}

// ==================== UPLOAD IMAGE ====================

function uploadImage(file) {
    var formData = new FormData();
    formData.append("file", file);
    formData.append("caption", file.name);

    showToast("Uploading photo...", "info");

    apiUpload("/api/images/shopping/" + window.currentFamilyId, formData).then(function(data) {
        showToast("Photo uploaded!", "success");
        loadShoppingData();
    }).catch(function(err) {
        showToast("Upload failed", "error");
    });
}

// ==================== VIEW PHOTO ====================

function viewPhoto(url, caption) {
    var modal = document.getElementById("photoViewer");
    var img = document.getElementById("photoViewerImg");
    var title = document.getElementById("photoViewerTitle");

    img.src = url;
    title.textContent = caption || "Photo";

    modal.classList.add("open");
}

// ==================== DELETE IMAGE ====================

function deleteImage(imageId) {
    apiDelete("/api/images/" + imageId).then(function() {
        showToast("Photo deleted", "info");
        loadShoppingData();
    }).catch(function(err) {
        showToast("Failed to delete", "error");
    });
}

// ==================== REMINDERS ====================

function openAddReminder() {
    var modal = document.getElementById("addReminderModal");
    modal.classList.add("open");

    // Set default time to 1 hour from now
    var now = new Date();
    now.setHours(now.getHours() + 1);
    var dateStr = now.toISOString().slice(0, 16);
    document.getElementById("remTime").value = dateStr;
}

function saveReminder() {
    var title = document.getElementById("remTitle").value.trim();
    var message = document.getElementById("remMessage").value.trim();
    var remindAt = document.getElementById("remTime").value;
    var speak = document.getElementById("remSpeak").checked;

    if (!title || !remindAt) {
        showToast("Fill in title and time", "warning");
        return;
    }

    apiPost("/api/reminders", {
        family_id: window.currentFamilyId,
        title: title,
        message: message,
        remind_at: remindAt,
        speak: speak
    }).then(function(data) {
        showToast("Reminder set!", "success");
        closeModal("addReminderModal");
        loadShoppingData();
    }).catch(function(err) {
        showToast("Failed to set reminder", "error");
    });
}

function renderReminders() {
    var list = document.getElementById("reminderList");
    if (!list) return;

    if (shopReminders.length === 0) {
        list.innerHTML = "";
        return;
    }

    var html = "";
    for (var i = 0; i < shopReminders.length; i++) {
        var r = shopReminders[i];
        html += '<div class="reminder-item">';
        html += '<span>⏰ ' + escapeHtml(r.title) + ' - ' + formatDateTime(r.remind_at) + '</span>';
        html += '<button onclick="deleteReminder(' + r.id + ')" style="background:none;border:none;color:#666;cursor:pointer;font-size:16px;">✕</button>';
        html += '</div>';
    }
    list.innerHTML = html;
}

function deleteReminder(reminderId) {
    apiDelete("/api/reminders/" + reminderId).then(function() {
        showToast("Reminder deleted", "info");
        loadShoppingData();
    }).catch(function(err) {
        showToast("Failed to delete", "error");
    });
}

// ==================== TEST VOICE ====================

function testVoice() {
    if (!("speechSynthesis" in window)) {
        showToast("Speech not supported", "error");
        return;
    }

    window.speechSynthesis.cancel();

    var msg = document.getElementById("remMessage").value || "Time for grocery shopping! Check your shopping list.";

    var utterance = new SpeechSynthesisUtterance(msg);
    utterance.lang = "en-IN";
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 1.0;

    // Try to find English voice
    var voices = window.speechSynthesis.getVoices();
    for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang.indexOf("en") === 0) {
            utterance.voice = voices[i];
            break;
        }
    }

    window.speechSynthesis.speak(utterance);
    showToast("Speaking...", "info");
}

// ==================== NOTIFICATION PERMISSION ====================

function requestNotifPermission() {
    if (!("Notification" in window)) {
        showToast("Notifications not supported", "error");
        return;
    }

    if (Notification.permission === "granted") {
        showToast("Notifications already enabled", "success");
        updateNotifBanner();
        updateNotifStatus();
        // Send test notification
        new Notification("FamilyHub", {
            body: "Notifications are working!",
            icon: "https://familyhub-1u10.onrender.com/icon-192.png"
        });
        return;
    }

    Notification.requestPermission().then(function(permission) {
        if (permission === "granted") {
            showToast("Notifications enabled!", "success");
            updateNotifBanner();
            updateNotifStatus();
            // Send test notification
            new Notification("FamilyHub", {
                body: "You will now receive alerts!",
                icon: "https://familyhub-1u10.onrender.com/icon-192.png"
            });
        } else {
            showToast("Notifications blocked. Enable in phone settings.", "warning");
        }
    });
}

function updateNotifBanner() {
    var banner = document.getElementById("notifBanner");
    if (!banner) return;

    if ("Notification" in window && Notification.permission === "granted") {
        banner.classList.add("hidden");
    } else {
        banner.classList.remove("hidden");
    }
}

function updateNotifStatus() {
    var status = document.getElementById("notifPermStatus");
    if (!status) return;

    if (!("Notification" in window)) {
        status.textContent = "Not supported";
    } else {
        status.textContent = Notification.permission;
    }
}

// ==================== NOTIFICATION POLLING ====================

function startNotificationPolling() {
    // Poll for new shopping items every 8 seconds
    setInterval(function() {
        if (!window.currentFamilyId) return;

        apiGet("/api/notifications/" + window.currentFamilyId + "/check?since_id=" + lastNotifiedId).then(function(data) {
            if (data.new_items && data.new_items.length > 0) {
                for (var i = 0; i < data.new_items.length; i++) {
                    var item = data.new_items[i];
                    showItemNotification(item.name, item.quantity);
                    showToast("🛒 " + item.name + " added to shopping list!", "info");
                }
                lastNotifiedId = data.latest_id;
                // Refresh shopping page if visible
                var shopPage = document.getElementById("page-shopping");
                if (shopPage && shopPage.classList.contains("active")) {
                    loadShoppingData();
                }
            }
        }).catch(function() {
            // Silently fail - polling should not show errors
        });
    }, 8000);

    // Poll for due reminders every 30 seconds
    setInterval(function() {
        if (!window.currentFamilyId) return;

        apiGet("/api/reminders/" + window.currentFamilyId + "/due").then(function(data) {
            if (data.reminders && data.reminders.length > 0) {
                for (var i = 0; i < data.reminders.length; i++) {
                    var reminder = data.reminders[i];
                    showReminderAlert(reminder, data.pending_items);
                }
            }
        }).catch(function() {
            // Silently fail
        });
    }, 30000);
}

// ==================== SHOW ITEM NOTIFICATION ====================

function showItemNotification(itemName, quantity) {
    // Play chime sound
    playChime();

    // Vibrate
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
    }

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🛒 New Shopping Item!", {
            body: itemName + " (Qty: " + quantity + ")",
            icon: "https://familyhub-1u10.onrender.com/icon-192.png",
            tag: "shop-" + Date.now()
        });
    }

    // Update badge
    updateNotifBadge();
}

// ==================== SHOW REMINDER ALERT ====================

function showReminderAlert(reminder, pendingItems) {
    var overlay = document.getElementById("alertOverlay");
    var title = document.getElementById("alertTitle");
    var message = document.getElementById("alertMessage");
    var itemCount = document.getElementById("alertItemCount");
    var speaking = document.getElementById("alertSpeaking");

    title.textContent = "🔔 " + reminder.title;
    message.textContent = reminder.message;

    if (pendingItems > 0) {
        itemCount.textContent = "You have " + pendingItems + " items to buy";
        itemCount.style.display = "block";
    } else {
        itemCount.style.display = "none";
    }

    overlay.style.display = "flex";

    // Play urgent sound
    playUrgentSound();

    // Vibrate
    if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 300]);
    }

    // Speak
    if (reminder.speak && "speechSynthesis" in window) {
        speaking.style.display = "flex";

        var speakText = reminder.message;
        if (pendingItems > 0) {
            speakText += " You have " + pendingItems + " items to buy.";
        }

        window.speechSynthesis.cancel();
        var utterance = new SpeechSynthesisUtterance(speakText);
        utterance.lang = "en-IN";
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;

        var voices = window.speechSynthesis.getVoices();
        for (var i = 0; i < voices.length; i++) {
            if (voices[i].lang.indexOf("en") === 0) {
                utterance.voice = voices[i];
                break;
            }
        }

        utterance.onend = function() {
            speaking.style.display = "none";
        };

        window.speechSynthesis.speak(utterance);
    }

    // Browser notification
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⏰ " + reminder.title, {
            body: reminder.message,
            icon: "https://familyhub-1u10.onrender.com/icon-192.png",
            tag: "reminder-" + reminder.id
        });
    }
}

function dismissAlert() {
    var overlay = document.getElementById("alertOverlay");
    overlay.style.display = "none";

    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}

// ==================== SOUND EFFECTS ====================

function playChime() {
    try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var notes = [523.25, 659.25, 783.99, 1046.50];

        for (var i = 0; i < notes.length; i++) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = notes[i];
            osc.type = "sine";

            var startTime = ctx.currentTime + (i * 0.15);
            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        }
    } catch (e) {
        console.log("Audio error:", e);
    }
}

function playUrgentSound() {
    try {
        var ctx = new (window.AudioContext || window.webkitAudioContext)();
        var pattern = [880, 660, 880, 660, 880, 660];

        for (var i = 0; i < pattern.length; i++) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.frequency.value = pattern[i];
            osc.type = "square";

            var startTime = ctx.currentTime + (i * 0.2);
            gain.gain.setValueAtTime(0.2, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            osc.start(startTime);
            osc.stop(startTime + 0.15);
        }
    } catch (e) {
        console.log("Audio error:", e);
    }
}

// ==================== NOTIFICATION BADGE ====================

function updateNotifBadge() {
    var badge = document.getElementById("notifBadge");
    if (!badge) return;

    var count = parseInt(badge.textContent) || 0;
    count++;

    badge.textContent = count;
    badge.style.display = "flex";
}

function openNotifications() {
    var badge = document.getElementById("notifBadge");
    if (badge) {
        badge.textContent = "0";
        badge.style.display = "none";
    }

    var modal = document.getElementById("notifPanel");
    var list = document.getElementById("notifList");

    if (!list) return;

    // Show recent notifications from memory
    if (!window.notifHistory) {
        window.notifHistory = [];
    }

    if (window.notifHistory.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>No notifications yet</p></div>';
    } else {
        var html = "";
        for (var i = window.notifHistory.length - 1; i >= 0; i--) {
            html += '<div class="notif-item-panel">';
            html += escapeHtml(window.notifHistory[i].message);
            html += '<div class="notif-time">' + escapeHtml(window.notifHistory[i].time) + '</div>';
            html += '</div>';
        }
        list.innerHTML = html;
    }

    modal.classList.add("open");
}

function openNotifSettings() {
    updateNotifStatus();
    var modal = document.getElementById("notifSettingsModal");
    modal.classList.add("open");
}

// ==================== HELPER FUNCTIONS ====================

function escapeHtml(text) {
    if (!text) return "";
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

function formatDateTime(dateStr) {
    if (!dateStr) return "";
    try {
        var d = new Date(dateStr);
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        var month = months[d.getMonth()];
        var day = d.getDate();
        var hours = d.getHours();
        var mins = d.getMinutes();
        var ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12;
        mins = mins < 10 ? "0" + mins : mins;
        return month + " " + day + ", " + hours + ":" + mins + " " + ampm;
    } catch (e) {
        return dateStr;
    }
}