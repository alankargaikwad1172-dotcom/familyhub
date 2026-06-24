/*
 * notifications.js
 * Complete notification system.
 */

var NotificationSystem = {
    enabled: false,
    serviceWorkerReg: null,
    pollingTimer: null,
    reminderTimer: null,
    lastItemId: 0,
    audioCtx: null,

    init: function() {
        var self = this;
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/static/sw.js')
                .then(function(reg) {
                    self.serviceWorkerReg = reg;
                    console.log('Service Worker registered');
                })
                .catch(function(err) {
                    console.log('Service Worker failed:', err);
                });
        }
        if ('speechSynthesis' in window) {
            speechSynthesis.getVoices();
            speechSynthesis.onvoiceschanged = function() { speechSynthesis.getVoices(); };
        }
    },

    requestPermission: function(callback) {
        var self = this;
        if (!('Notification' in window)) {
            showToast('Your browser does not support notifications', 'error');
            if (callback) callback(false);
            return;
        }
        if (Notification.permission === 'granted') {
            self.enabled = true;
            self.showBell();
            showToast('Notifications are already enabled!', 'success');
            if (callback) callback(true);
            return;
        }
        if (Notification.permission === 'denied') {
            showToast('Notifications blocked. Go to browser settings to enable.', 'error');
            if (callback) callback(false);
            return;
        }
        Notification.requestPermission().then(function(permission) {
            if (permission === 'granted') {
                self.enabled = true;
                self.showBell();
                showToast('Notifications enabled!', 'success');
                setTimeout(function() { self.sendTestNotification(); }, 1000);
                if (callback) callback(true);
            } else {
                showToast('Notification permission denied', 'error');
                if (callback) callback(false);
            }
        });
    },

    checkPermission: function() {
        if ('Notification' in window && Notification.permission === 'granted') {
            this.enabled = true;
            this.showBell();
            return true;
        }
        return false;
    },

    showBell: function() {
        var bell = document.getElementById('notification-bell');
        if (bell) bell.classList.remove('hidden');
    },

    sendNotification: function(title, body, tag, requireInteraction) {
        showToast(body, 'info');
        this.playChime();
        if (navigator.vibrate) { navigator.vibrate([200, 100, 200]); }
        if (this.enabled && Notification.permission === 'granted') {
            try {
                var options = {
                    body: body,
                    tag: tag || 'fh-' + Date.now(),
                    renotify: true,
                    vibrate: [200, 100, 200]
                };
                if (requireInteraction) { options.requireInteraction = true; }
                if (this.serviceWorkerReg && this.serviceWorkerReg.active) {
                    this.serviceWorkerReg.showNotification(title, options);
                } else {
                    new Notification(title, options);
                }
            } catch(e) { console.log('Notification error:', e); }
        }
    },

    sendTestNotification: function() {
        this.sendNotification(
            'FamilyHub Notifications',
            'You will now receive alerts when items are added!',
            'test-notification',
            false
        );
    },

    playChime: function() {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            var ctx = this.audioCtx;
            if (ctx.state === 'suspended') { ctx.resume(); }
            var now = ctx.currentTime;
            var notes = [523, 659, 784, 1047];
            for (var i = 0; i < notes.length; i++) {
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(notes[i], now + i * 0.1);
                gain.gain.setValueAtTime(0.15, now + i * 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.2);
            }
        } catch(e) { console.log('Audio error:', e); }
    },

    playReminderSound: function() {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            var ctx = this.audioCtx;
            if (ctx.state === 'suspended') { ctx.resume(); }
            var now = ctx.currentTime;
            for (var repeat = 0; repeat < 3; repeat++) {
                var offset = repeat * 0.5;
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, now + offset);
                osc.frequency.setValueAtTime(660, now + offset + 0.15);
                gain.gain.setValueAtTime(0.2, now + offset);
                gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.3);
                osc.start(now + offset);
                osc.stop(now + offset + 0.3);
            }
        } catch(e) {}
    },

    startPolling: function(familyId) {
        var self = this;
        this.stopPolling();
        this.checkPermission();
        API.get('/shopping/' + familyId)
            .then(function(items) {
                if (items.length > 0) {
                    self.lastItemId = items[items.length - 1].id;
                }
            })
            .catch(function() {});
        this.pollingTimer = setInterval(function() {
            self.pollForNewItems(familyId);
        }, 8000);
        this.startReminderCheck(familyId);
    },

    stopPolling: function() {
        if (this.pollingTimer) { clearInterval(this.pollingTimer); this.pollingTimer = null; }
        if (this.reminderTimer) { clearInterval(this.reminderTimer); this.reminderTimer = null; }
    },

    pollForNewItems: function(familyId) {
        var self = this;
        API.get('/notifications/' + familyId + '/check?since_id=' + this.lastItemId)
            .then(function(data) {
                if (data.new_items && data.new_items.length > 0) {
                    for (var i = 0; i < data.new_items.length; i++) {
                        var item = data.new_items[i];
                        self.sendNotification(
                            '\uD83D\uDED2 New Shopping Item',
                            item.name + (item.quantity !== '1' ? ' (' + item.quantity + ')' : '') + ' added to the list',
                            'shopping-' + item.id,
                            false
                        );
                    }
                    self.lastItemId = data.latest_id;
                    self.updateBadge(data.new_items.length);
                    if (currentPage === 'shopping') { navigateTo('shopping'); }
                }
            })
            .catch(function() {});
    },

    updateBadge: function(count) {
        var badge = document.getElementById('notif-count');
        if (badge) {
            var current = parseInt(badge.textContent) || 0;
            badge.textContent = current + count;
            var bell = document.getElementById('notification-bell');
            if (bell) {
                bell.classList.remove('hidden');
                bell.style.animation = 'none';
                bell.offsetHeight;
                bell.style.animation = 'bellShake 0.5s ease';
            }
        }
    },

    clearBadge: function() {
        var badge = document.getElementById('notif-count');
        if (badge) badge.textContent = '0';
    },

    startReminderCheck: function(familyId) {
        var self = this;
        setTimeout(function() { self.checkReminders(familyId); }, 3000);
        this.reminderTimer = setInterval(function() {
            self.checkReminders(familyId);
        }, 30000);
    },

    checkReminders: function(familyId) {
        var self = this;
        API.get('/reminders/' + familyId + '/due')
            .then(function(data) {
                if (data.reminders && data.reminders.length > 0) {
                    for (var i = 0; i < data.reminders.length; i++) {
                        var r = data.reminders[i];
                        self.fireReminder(r.title, r.message, data.pending_items, r.speak);
                    }
                }
            })
            .catch(function() {});
    },

    fireReminder: function(title, message, pendingItems, shouldSpeak) {
        this.playReminderSound();
        if (navigator.vibrate) { navigator.vibrate([300, 100, 300, 100, 300]); }
        this.showReminderOverlay(title, message, pendingItems, shouldSpeak);
        this.sendNotification(
            '\uD83D\uDD14 ' + title,
            message + (pendingItems > 0 ? ' (' + pendingItems + ' items on list)' : ''),
            'reminder-' + Date.now(),
            true
        );
    },

    showReminderOverlay: function(title, message, pendingItems, shouldSpeak) {
        document.getElementById('reminder-alert-title').textContent = '\uD83D\uDD14 ' + title;
        document.getElementById('reminder-alert-message').textContent = message;
        var itemsDiv = document.getElementById('reminder-alert-items');
        if (pendingItems > 0) {
            itemsDiv.textContent = '\uD83D\uDED2 You have ' + pendingItems + ' item' + (pendingItems !== 1 ? 's' : '') + ' on your shopping list';
            itemsDiv.style.display = 'block';
        } else {
            itemsDiv.style.display = 'none';
        }
        var speakingDiv = document.getElementById('reminder-speaking');
        speakingDiv.classList.add('hidden');
        document.getElementById('reminder-alert-overlay').classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        if (shouldSpeak) {
            var self = this;
            setTimeout(function() {
                var fullMsg = message;
                if (pendingItems > 0) { fullMsg += '. You have ' + pendingItems + ' items to buy.'; }
                self.speak(fullMsg);
            }, 800);
        }
    },

    speak: function(text) {
        if (!('speechSynthesis' in window)) { showToast('Speech not supported', 'error'); return; }
        speechSynthesis.cancel();
        var speakingDiv = document.getElementById('reminder-speaking');
        if (speakingDiv) speakingDiv.classList.remove('hidden');
        var msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'en-IN';
        msg.rate = 0.9;
        msg.pitch = 1.1;
        msg.volume = 1.0;
        var voices = speechSynthesis.getVoices();
        for (var i = 0; i < voices.length; i++) {
            if (voices[i].lang === 'en-IN') { msg.voice = voices[i]; break; }
            if (voices[i].lang.startsWith('en')) { msg.voice = voices[i]; }
        }
        msg.onend = function() { if (speakingDiv) speakingDiv.classList.add('hidden'); };
        msg.onerror = function() { if (speakingDiv) speakingDiv.classList.add('hidden'); };
        speechSynthesis.speak(msg);
    },

    speakTest: function(text) {
        if (!('speechSynthesis' in window)) { showToast('Speech not supported', 'error'); return; }
        speechSynthesis.cancel();
        var msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'en-IN';
        msg.rate = 0.9;
        msg.pitch = 1.1;
        msg.volume = 1.0;
        var voices = speechSynthesis.getVoices();
        for (var i = 0; i < voices.length; i++) {
            if (voices[i].lang === 'en-IN') { msg.voice = voices[i]; break; }
            if (voices[i].lang.startsWith('en')) { msg.voice = voices[i]; }
        }
        speechSynthesis.speak(msg);
        showToast('Playing voice preview...', 'info');
    }
};

NotificationSystem.init();