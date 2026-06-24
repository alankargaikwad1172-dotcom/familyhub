// ==================== MEDICINES ====================

function openAddMed() {
    openModal("addMedModal");
}

function saveMed() {
    var person = document.getElementById("medPerson").value.trim();
    var name = document.getElementById("medName").value.trim();
    var dosage = document.getElementById("medDosage").value.trim();
    var frequency = document.getElementById("medFreq").value;
    var time = document.getElementById("medTime").value;

    if (!person || !name) {
        showToast("Enter person and medicine name", "warning");
        return;
    }

    apiPost("/api/medicines", {
        family_id: window.currentFamilyId,
        person_name: person,
        medicine_name: name,
        dosage: dosage,
        frequency: frequency,
        time: time
    }).then(function(data) {
        showToast("Medicine added!", "success");
        closeModal("addMedModal");
        document.getElementById("medPerson").value = "";
        document.getElementById("medName").value = "";
        document.getElementById("medDosage").value = "";
        loadMedicines();
    }).catch(function(err) {
        showToast("Failed to add medicine", "error");
    });
}

function loadMedicines() {
    if (!window.currentFamilyId) return;

    apiGet("/api/medicines/" + window.currentFamilyId).then(function(meds) {
        renderMedList(meds);
    }).catch(function(err) {
        console.log("Medicines load error:", err);
    });
}

function renderMedList(meds) {
    var container = document.getElementById("medList");
    if (!container) return;

    if (!meds || meds.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💊</div><h3>No medicines</h3><p>Add a medicine to track</p></div>';
        return;
    }

    var html = "";
    for (var i = 0; i < meds.length; i++) {
        var m = meds[i];
        html += '<div class="med-item">';
        html += '<div class="med-item-info">';
        html += '<div class="med-item-person">' + escapeHtml(m.person_name) + '</div>';
        html += '<div class="med-item-name">' + escapeHtml(m.medicine_name) + '</div>';
        html += '<div class="med-item-details">';
        if (m.dosage) html += escapeHtml(m.dosage);
        if (m.frequency) html += ' · ' + escapeHtml(m.frequency);
        if (m.time) html += ' · ' + m.time;
        html += '</div></div>';
        html += '<button class="med-item-delete" onclick="deleteMed(' + m.id + ')">🗑️</button>';
        html += '</div>';
    }
    container.innerHTML = html;
}

function deleteMed(medId) {
    apiDelete("/api/medicines/" + medId).then(function() {
        showToast("Medicine deleted", "info");
        loadMedicines();
    }).catch(function(err) {
        showToast("Failed to delete", "error");
    });
}