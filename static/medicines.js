/*
 * medicines.js
 * Track medicine schedules for family members.
 */
function renderMedicines(container) {
    API.get('/medicines/' + currentFamilyId)
        .then(function(meds) {
            var html = '';
            html += '<div class="page-header"><div><h1 class="page-title">Medicines</h1><p class="page-subtitle">' + meds.length + ' active</p></div><button class="btn btn-primary" onclick="openAddMedicine()">+ Add Medicine</button></div>';
            if (meds.length > 0) {
                html += '<div class="list-card"><h3>\u{1F48A} Active Medicines</h3>';
                for (var i = 0; i < meds.length; i++) {
                    var m = meds[i];
                    var t = m.time ? ' &bull; \u23F0 ' + m.time : '';
                    html += '<div class="list-item" style="animation-delay:' + (i * 0.05) + 's"><div class="item-icon" style="background:rgba(244,63,94,0.15);">\u{1F48A}</div><div class="item-info"><div class="item-title">' + m.medicine_name + '</div><div class="item-meta">\u{1F464} ' + m.person_name + ' &bull; ' + (m.dosage || 'No dosage') + ' &bull; ' + m.frequency + t + '</div></div><button class="btn-delete" onclick="deleteMedicine(' + m.id + ')">\u{1F5D1}</button></div>';
                }
                html += '</div>';
            } else {
                html += '<div class="empty-state"><p>No medicines tracked yet</p><button class="btn btn-primary" onclick="openAddMedicine()">Add Medicine</button></div>';
            }
            container.innerHTML = html;
        })
        .catch(function() { container.innerHTML = '<div class="empty-state"><p>Failed to load</p></div>'; });
}

function openAddMedicine() {
    showModal('<h3>Add Medicine</h3><div class="form-group"><label>Person Name</label><input type="text" id="med-person" placeholder="e.g., Dad, Mom"></div><div class="form-group"><label>Medicine Name</label><input type="text" id="med-name" placeholder="e.g., Metformin 500mg"></div><div class="form-group"><label>Dosage</label><input type="text" id="med-dosage" placeholder="e.g., 1 tablet"></div><div class="form-group"><label>Frequency</label><select id="med-frequency"><option value="daily">Once Daily</option><option value="twice_daily">Twice Daily</option><option value="thrice_daily">Thrice Daily</option><option value="weekly">Weekly</option></select></div><div class="form-group"><label>Time</label><input type="time" id="med-time"></div><div class="modal-actions"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="submitMedicine()">Add</button></div>');
}

function submitMedicine() {
    var person = document.getElementById('med-person').value.trim();
    var name = document.getElementById('med-name').value.trim();
    var dosage = document.getElementById('med-dosage').value.trim();
    var frequency = document.getElementById('med-frequency').value;
    var time = document.getElementById('med-time').value;
    if (!person || !name) { showToast('Fill in person and medicine name', 'error'); return; }
    API.post('/medicines', { family_id: currentFamilyId, person_name: person, medicine_name: name, dosage: dosage || null, frequency: frequency, time: time || null })
        .then(function() { closeModal(); showToast('Added!'); navigateTo('medicines'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}

function deleteMedicine(id) {
    if (!confirm('Remove?')) return;
    API.del('/medicines/' + id)
        .then(function() { showToast('Removed'); navigateTo('medicines'); })
        .catch(function(error) { showToast(error.message, 'error'); });
}