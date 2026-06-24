/*
 * login.js
 * Handles login, register, and family setup.
 */
function showLogin() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
}

function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

function handleLogin() {
    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;
    if (!email || !password) { showToast('Please fill in all fields', 'error'); return; }
    API.post('/auth/login', { email: email, password: password })
        .then(function(data) {
            API.setToken(data.access_token);
            return API.get('/auth/me');
        })
        .then(function(user) {
            API.setUser(user);
            loadFamiliesAndShowApp();
            showToast('Welcome back!');
        })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function handleRegister() {
    var name = document.getElementById('reg-name').value.trim();
    var email = document.getElementById('reg-email').value.trim();
    var password = document.getElementById('reg-password').value;
    if (!name || !email || !password) { showToast('Please fill in all fields', 'error'); return; }
    if (password.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
    API.post('/auth/register', { full_name: name, email: email, password: password })
        .then(function(result) {
            API.setToken(result.access_token);
            API.setUser(result.user);
            showFamilySetup();
        })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function showFamilySetup() {
    showModal(
        '<h3>Welcome to FamilyHub!</h3>' +
        '<p style="color:var(--text-secondary);margin-bottom:24px;">Create a family or join one to get started.</p>' +
        '<div class="form-group"><label>Family Name</label><input type="text" id="setup-family-name" placeholder="e.g., The Smith Family"></div>' +
        '<div class="modal-actions">' +
        '<button class="btn btn-secondary" onclick="showJoinCode()">Join with Code</button>' +
        '<button class="btn btn-primary" onclick="createFamilyFromSetup()">Create Family</button>' +
        '</div>'
    );
}

function showJoinCode() {
    showModal(
        '<h3>Join a Family</h3>' +
        '<div class="form-group"><label>Invite Code</label><input type="text" id="setup-invite-code" placeholder="Enter invite code" style="text-transform:uppercase;letter-spacing:2px;"></div>' +
        '<div class="modal-actions">' +
        '<button class="btn btn-secondary" onclick="showFamilySetup()">Back</button>' +
        '<button class="btn btn-primary" onclick="joinFamilyFromSetup()">Join</button>' +
        '</div>'
    );
}

function createFamilyFromSetup() {
    var name = document.getElementById('setup-family-name').value.trim();
    if (!name) { showToast('Enter a family name', 'error'); return; }
    API.post('/families', { name: name })
        .then(function(result) {
            currentFamilyId = result.id;
            closeModal();
            showApp();
            showToast('Created! Code: ' + result.invite_code);
        })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function joinFamilyFromSetup() {
    var code = document.getElementById('setup-invite-code').value.trim();
    if (!code) { showToast('Enter an invite code', 'error'); return; }
    API.post('/families/join', { invite_code: code })
        .then(function(result) {
            currentFamilyId = result.family_id;
            closeModal();
            showApp();
            showToast(result.message);
        })
        .catch(function(error) { showToast(error.message, 'error'); });
}