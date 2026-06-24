/*
 * shopping.js
 * Shopping list with camera, gallery, notifications, and voice reminders.
 */

var capturedPhotoBlob = null;
var cameraStream = null;

function renderShopping(container) {
    Promise.all([
        API.get('/shopping/' + currentFamilyId),
        API.get('/images/shopping/' + currentFamilyId),
        API.get('/reminders/' + currentFamilyId)
    ]).then(function(results) {
        var items = results[0];
        var photos = results[1];
        var reminders = results[2];
        var unbought = [], bought = [];
        for (var x = 0; x < items.length; x++) {
            if (items[x].is_bought) bought.push(items[x]);
            else unbought.push(items[x]);
        }

        var html = '';
        html += '<div class="page-header"><div><h1 class="page-title">Shopping List</h1><p class="page-subtitle">' + unbought.length + ' items to buy &bull; ' + photos.length + ' photos</p></div></div>';

        // NOTIFICATION BANNER
        if ('Notification' in window && Notification.permission !== 'granted') {
            html += '<div class="notif-banner">';
            html += '<div class="notif-banner-icon">&#128276;</div>';
            html += '<div class="notif-banner-text"><h4>Get notified instantly</h4><p>Enable notifications to know when family members add items</p></div>';
            html += '<button class="btn btn-primary btn-sm" onclick="requestNotificationPermission(); navigateTo(\'shopping\');">Enable</button>';
            html += '</div>';
        }

        // CAMERA & GALLERY
        html += '<div class="photo-actions">';
        html += '<button class="btn btn-take-photo" onclick="openCamera()">&#128248; Take Photo</button>';
        html += '<button class="btn btn-gallery" onclick="openGalleryPicker()">&#128444; Upload Photo</button>';
        html += '<input type="file" id="gallery-file-input" class="hidden-file-input" accept="image/*" onchange="handleGallerySelect(event)">';
        html += '</div>';

        // REMINDERS
        html += '<div class="reminder-section">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
        html += '<h3 style="font-size:15px;font-weight:600;">&#128276; Reminders</h3>';
        html += '<button class="btn btn-amber btn-sm" onclick="openSetReminder()">+ Set Reminder</button>';
        html += '</div>';
        if (reminders.length > 0) {
            for (var r = 0; r < reminders.length; r++) {
                var rem = reminders[r];
                var remDate = new Date(rem.remind_at);
                var timeStr = remDate.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                html += '<div class="reminder-card" style="animation-delay:' + (r * 0.05) + 's">';
                html += '<span class="reminder-time">\u23F0 ' + timeStr + '</span>';
                html += '<span class="reminder-text">' + rem.title + '</span>';
                if (rem.speak) html += '<span class="reminder-speak-icon">\uD83D\uDD0A</span>';
                html += '<button class="btn-delete" onclick="deleteReminder(' + rem.id + ')" style="color:var(--amber);">&#10005;</button>';
                html += '</div>';
            }
        } else {
            html += '<p style="color:var(--text-muted);font-size:13px;">No upcoming reminders. Set one for a spoken alert!</p>';
        }
        html += '</div>';

        // PHOTOS
        if (photos.length > 0) {
            html += '<div class="list-card" style="margin-bottom:20px;"><h3>\u{1F4F7} Grocery Photos (' + photos.length + ')</h3>';
            html += '<div class="photo-grid">';
            for (var p = 0; p < photos.length; p++) {
                var photo = photos[p];
                html += '<div class="photo-card" onclick="viewImage(\'' + photo.url + '\',\'' + escapeHtml(photo.caption) + '\')" style="animation-delay:' + (p * 0.05) + 's">';
                html += '<img src="' + photo.url + '" alt="' + escapeHtml(photo.caption) + '" loading="lazy">';
                html += '<div class="photo-overlay"><div class="photo-caption">' + escapeHtml(photo.caption) + '</div><div class="photo-by">by ' + photo.uploaded_by + '</div></div>';
                html += '<button class="btn-delete-photo" onclick="event.stopPropagation();deletePhoto(' + photo.id + ')">&#10005;</button>';
                html += '</div>';
            }
            html += '</div></div>';
        }

        // ADD ITEM FORM
        html += '<div class="add-form"><input type="text" id="shop-item-name" placeholder="Add an item... (e.g., Rice 5kg)" onkeypress="if(event.key===\'Enter\')addShoppingItem()"><button class="btn btn-primary" onclick="addShoppingItem()">Add</button></div>';

        // UNBOUGHT
        html += '<div class="list-card" style="margin-bottom:16px;"><h3>\u{1F6D2} To Buy (' + unbought.length + ')</h3>';
        if (unbought.length > 0) {
            for (var i = 0; i < unbought.length; i++) {
                var item = unbought[i];
                html += '<div class="list-item" style="animation-delay:' + (i * 0.04) + 's">';
                html += '<button class="item-check" onclick="toggleBought(' + item.id + ',true)">&#10003;</button>';
                html += '<div class="item-info"><div class="item-title">' + item.name + '</div><div class="item-meta">' + item.quantity + ' &bull; ' + item.category + '</div></div>';
                html += '<button class="btn-delete" onclick="deleteShopItem(' + item.id + ')">&#128465;</button>';
                html += '</div>';
            }
        } else {
            html += '<div class="empty-state"><p>All done! Nothing to buy.</p></div>';
        }
        html += '</div>';

        // BOUGHT
        if (bought.length > 0) {
            html += '<div class="list-card"><h3>\u2705 Bought (' + bought.length + ')</h3>';
            for (var j = 0; j < bought.length; j++) {
                var b = bought[j];
                html += '<div class="list-item" style="opacity:0.5;">';
                html += '<button class="item-check checked" onclick="toggleBought(' + b.id + ',false)">&#10003;</button>';
                html += '<div class="item-info"><div class="item-title" style="text-decoration:line-through;">' + b.name + '</div><div class="item-meta">' + b.quantity + '</div></div>';
                html += '<button class="btn-delete" onclick="deleteShopItem(' + b.id + ')">&#128465;</button>';
                html += '</div>';
            }
            html += '</div>';
        }

        container.innerHTML = html;
    }).catch(function(err) {
        console.error(err);
        container.innerHTML = '<div class="empty-state"><p>Failed to load</p></div>';
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ==================== CAMERA ====================

function openCamera() {
    capturedPhotoBlob = null;
    document.getElementById('camera-overlay').classList.remove('hidden');
    document.getElementById('camera-video').classList.remove('hidden');
    document.getElementById('camera-preview').classList.add('hidden');
    document.getElementById('btn-capture').classList.remove('hidden');
    document.getElementById('btn-retake').classList.add('hidden');
    document.getElementById('btn-upload-cam').classList.add('hidden');
    var video = document.getElementById('camera-video');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
            .then(function(stream) { cameraStream = stream; video.srcObject = stream; })
            .catch(function(err) { console.error(err); showToast('Cannot access camera', 'error'); closeCamera(); });
    } else { showToast('Camera not supported', 'error'); closeCamera(); }
}

function capturePhoto() {
    var video = document.getElementById('camera-video');
    var canvas = document.getElementById('camera-canvas');
    var preview = document.getElementById('camera-preview');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    preview.src = canvas.toDataURL('image/jpeg', 0.85);
    preview.classList.remove('hidden');
    video.classList.add('hidden');
    canvas.toBlob(function(blob) { capturedPhotoBlob = blob; }, 'image/jpeg', 0.85);
    document.getElementById('btn-capture').classList.add('hidden');
    document.getElementById('btn-retake').classList.remove('hidden');
    document.getElementById('btn-upload-cam').classList.remove('hidden');
}

function retakePhoto() {
    capturedPhotoBlob = null;
    document.getElementById('camera-video').classList.remove('hidden');
    document.getElementById('camera-preview').classList.add('hidden');
    document.getElementById('btn-capture').classList.remove('hidden');
    document.getElementById('btn-retake').classList.add('hidden');
    document.getElementById('btn-upload-cam').classList.add('hidden');
}

function closeCamera() {
    if (cameraStream) { cameraStream.getTracks().forEach(function(t) { t.stop(); }); cameraStream = null; }
    document.getElementById('camera-video').srcObject = null;
    capturedPhotoBlob = null;
    document.getElementById('camera-overlay').classList.add('hidden');
}

function uploadCapturedPhoto() {
    if (!capturedPhotoBlob) { showToast('No photo captured', 'error'); return; }
    uploadPhotoFile(new File([capturedPhotoBlob], 'camera-photo.jpg', { type: 'image/jpeg' }), 'Photo from camera');
}

// ==================== GALLERY ====================

function openGalleryPicker() {
    document.getElementById('gallery-file-input').click();
}

function handleGallerySelect(event) {
    var file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Select an image file', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { showToast('Max 10MB', 'error'); return; }
    uploadPhotoFile(file, file.name);
    event.target.value = '';
}

// ==================== UPLOAD ====================

function uploadPhotoFile(file, caption) {
    showToast('Uploading photo...', 'info');
    var formData = new FormData();
    formData.append('file', file);
    var token = API.getToken();
    fetch('/api/images/shopping/' + currentFamilyId + '?caption=' + encodeURIComponent(caption), {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
    }).then(function(response) {
        return response.json().then(function(data) {
            if (!response.ok) throw new Error(data.detail || 'Upload failed');
            return data;
        });
    }).then(function() {
        closeCamera();
        showToast('Photo uploaded!');
        navigateTo('shopping');
    }).catch(function(error) { showToast(error.message, 'error'); });
}

// ==================== VIEW & DELETE ====================

function viewImage(url, caption) {
    document.getElementById('viewer-image').src = url;
    document.getElementById('viewer-caption').textContent = caption || '';
    document.getElementById('image-viewer-overlay').classList.remove('hidden');
}

function closeImageViewer() {
    document.getElementById('image-viewer-overlay').classList.add('hidden');
    document.getElementById('viewer-image').src = '';
}

function deletePhoto(id) {
    if (!confirm('Delete this photo?')) return;
    API.del('/images/' + id)
        .then(function() { showToast('Deleted'); navigateTo('shopping'); })
        .catch(function(e) { showToast(e.message, 'error'); });
}

// ==================== REMINDERS ====================

function openSetReminder() {
    var now = new Date();
    now.setHours(now.getHours() + 1);
    var defaultDate = now.toISOString().slice(0, 10);
    var defaultTime = now.toTimeString().slice(0, 5);

    showModal(
        '<h3>\u23F0 Set Reminder</h3>' +
        '<div class="form-group"><label>Title</label><input type="text" id="rem-title" value="Grocery Shopping" placeholder="Reminder title"></div>' +
        '<div class="form-group"><label>Message</label><input type="text" id="rem-message" value="Time for grocery shopping! Check your shopping list." placeholder="What should I say?"></div>' +
        '<div class="form-group"><label>Date</label><input type="date" id="rem-date" value="' + defaultDate + '"></div>' +
        '<div class="form-group"><label>Time</label><input type="time" id="rem-time" value="' + defaultTime + '"></div>' +
        '<div class="form-group" style="display:flex;align-items:center;gap:10px;">' +
        '<input type="checkbox" id="rem-speak" checked style="width:20px;height:20px;accent-color:var(--primary);">' +
        '<label for="rem-speak" style="margin:0;font-size:14px;">Speak reminder aloud (\uD83D\uDD0A)</label>' +
        '</div>' +
        '<div class="form-group">' +
        '<button class="btn btn-secondary btn-sm btn-full" onclick="testSpeech()" type="button">\u{1F50A} Test Voice</button>' +
        '</div>' +
        '<div class="modal-actions">' +
        '<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="submitReminder()">Set Reminder</button>' +
        '</div>'
    );
}

function testSpeech() {
    var msg = document.getElementById('rem-message').value || 'Time for grocery shopping! Check your shopping list.';
    NotificationSystem.speakTest(msg);
}

function submitReminder() {
    var title = document.getElementById('rem-title').value.trim();
    var message = document.getElementById('rem-message').value.trim();
    var date = document.getElementById('rem-date').value;
    var time = document.getElementById('rem-time').value;
    var speak = document.getElementById('rem-speak').checked;

    if (!title || !date || !time) { showToast('Fill in all fields', 'error'); return; }

    var remindAt = date + 'T' + time + ':00';
    var remindDate = new Date(remindAt);
    if (remindDate <= new Date()) { showToast('Pick a future time', 'error'); return; }

    API.post('/reminders', {
        family_id: currentFamilyId,
        title: title,
        message: message,
        remind_at: remindAt,
        speak: speak
    }).then(function() {
        closeModal();
        showToast('\u23F0 Reminder set! You will be notified at the scheduled time.');
        navigateTo('shopping');
    }).catch(function(e) { showToast(e.message, 'error'); });
}

function deleteReminder(id) {
    if (!confirm('Delete this reminder?')) return;
    API.del('/reminders/' + id)
        .then(function() { showToast('Reminder deleted'); navigateTo('shopping'); })
        .catch(function(e) { showToast(e.message, 'error'); });
}

// ==================== SHOPPING ITEMS ====================

function addShoppingItem() {
    var input = document.getElementById('shop-item-name');
    var name = input.value.trim();
    if (!name) return;
    API.post('/shopping', { family_id: currentFamilyId, name: name, quantity: '1' })
        .then(function() { input.value = ''; showToast('Added!'); navigateTo('shopping'); })
        .catch(function(e) { showToast(e.message, 'error'); });
}

function toggleBought(id, val) {
    API.put('/shopping/' + id, { is_bought: val })
        .then(function() { navigateTo('shopping'); })
        .catch(function(e) { showToast(e.message, 'error'); });
}

function deleteShopItem(id) {
    API.del('/shopping/' + id)
        .then(function() { navigateTo('shopping'); })
        .catch(function(e) { showToast(e.message, 'error'); });
}