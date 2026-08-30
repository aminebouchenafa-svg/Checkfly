(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Pure date / status helpers (mirrors lib/alerts.ts in the CheckFly repo)
  // ---------------------------------------------------------------------
  function addMonths(dateStr, months) {
    // Pure calendar-integer arithmetic — never routes through a local-time
    // Date object + toISOString(), which silently shifts by a day whenever
    // the viewer's timezone offset is non-zero (e.g. UTC+1 in Algeria).
    var parts = dateStr.split('-').map(Number);
    var y = parts[0], m0 = parts[1] - 1, d = parts[2];
    var total = m0 + months;
    var newYear = y + Math.floor(total / 12);
    var newMonth0 = ((total % 12) + 12) % 12;
    var daysInMonth = new Date(Date.UTC(newYear, newMonth0 + 1, 0)).getUTCDate();
    var newDay = Math.min(d, daysInMonth);
    var mm = String(newMonth0 + 1).padStart(2, '0');
    var dd = String(newDay).padStart(2, '0');
    return newYear + '-' + mm + '-' + dd;
  }

  function daysBetween(from, to) {
    var a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    var b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b - a) / 86400000);
  }

  function urgencyFor(daysRemaining) {
    if (daysRemaining === null || daysRemaining === undefined) return 'unknown';
    if (daysRemaining < 0) return 'expired';
    if (daysRemaining <= 30) return 'urgent';
    if (daysRemaining <= 60) return 'warning';
    if (daysRemaining <= 90) return 'notice';
    return 'ok';
  }

  function computeChecks(pilot, today) {
    var simulatorExpiry = pilot.simulatorLastCheck ? addMonths(pilot.simulatorLastCheck, 6) : null;
    var lineCheckExpiry = pilot.lineCheckLastCheck ? addMonths(pilot.lineCheckLastCheck, 12) : null;
    var defs = [
      { key: 'license', label: 'Licence', date: pilot.licenseExpiry || null },
      { key: 'simulator', label: 'Contrôle simulateur (OPC)', date: simulatorExpiry },
      { key: 'lineCheck', label: 'Contrôle en ligne', date: lineCheckExpiry },
      { key: 'english', label: 'Niveau anglais (OACI)', date: pilot.englishExpiry || null }
    ];
    return defs.map(function (d) {
      var daysRemaining = d.date ? daysBetween(today, new Date(d.date + 'T00:00:00')) : null;
      return { key: d.key, label: d.label, date: d.date, daysRemaining: daysRemaining, urgency: urgencyFor(daysRemaining) };
    });
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    var parts = iso.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }

  function fmtDateTime(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var SEV_META = {
    expired: { label: 'Expirés', order: 0 },
    urgent: { label: "À moins d'1 mois", order: 1 },
    warning: { label: 'À moins de 2 mois', order: 2 },
    notice: { label: 'À moins de 3 mois', order: 3 }
  };
  var SEV_ORDER = ['expired', 'urgent', 'warning', 'notice'];

  function pillLabel(urgency, days) {
    if (urgency === 'expired') return 'Expiré (' + Math.abs(days) + ' j)';
    if (urgency === 'ok') return 'OK (' + days + ' j)';
    if (urgency === 'unknown') return '—';
    return days + ' j';
  }

  // ---------------------------------------------------------------------
  // Self-reconstruction: read this very <script> tag's exact source back
  // from the DOM, so a republish can carry the full app forward unchanged.
  // This avoids hand-written self-referential string literals entirely.
  // ---------------------------------------------------------------------
  var SELF_SCRIPT_TEXT = (function () {
    var el = document.getElementById('app-script');
    return el ? el.textContent : '';
  })();

  function escapeForScriptTag(s) {
    return s.split('</script').join('<\\/script');
  }

  function buildDocument(dataObj) {
    var dataJson = escapeForScriptTag(JSON.stringify(dataObj));
    var selfScript = escapeForScriptTag(SELF_SCRIPT_TEXT);
    return DOC_HEAD + BODY_SKELETON +
      '<script id="roster-data" type="application/json">' + dataJson + '</script>' +
      '<script id="app-script">' + selfScript + '</script>' +
      '</body></html>';
  }

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  var state = JSON.parse(document.getElementById('roster-data').textContent);
  var today = new Date();
  var artifactApi = null;
  var canWrite = true; // optimistic until a publish() call proves otherwise
  var editingIndex = -1;

  function pilotsWithChecks() {
    return state.pilots.map(function (p, i) {
      return { index: i, pilot: p, checks: computeChecks(p, today) };
    });
  }

  // ---------------------------------------------------------------------
  // Rendering (reads state + today, writes into the static skeleton's
  // containers — never mutates the skeleton structure itself)
  // ---------------------------------------------------------------------
  function render() {
    var withChecks = pilotsWithChecks();
    var totalCount = state.pilots.length;
    var cdbCount = state.pilots.filter(function (p) { return p.rank === 'CDB'; }).length;
    var oplCount = totalCount - cdbCount;

    var alerts = [];
    withChecks.forEach(function (row) {
      row.checks.forEach(function (c) {
        if (SEV_META[c.urgency]) alerts.push({ index: row.index, pilot: row.pilot, check: c });
      });
    });
    alerts.sort(function (a, b) { return a.check.daysRemaining - b.check.daysRemaining; });

    document.getElementById('updated-at').textContent = 'Mis à jour le ' + fmtDateTime(state.generatedAt);
    document.getElementById('footer-date').textContent = fmtDateTime(state.generatedAt);

    document.getElementById('home-alerts-value').textContent = alerts.length;
    var alertsBlock = document.getElementById('block-alerts');
    alertsBlock.classList.toggle('is-clear', alerts.length === 0);
    document.getElementById('home-alerts-sub').textContent = alerts.length === 0
      ? 'Tout est à jour'
      : SEV_ORDER.map(function (sev) {
          var n = alerts.filter(function (a) { return a.check.urgency === sev; }).length;
          return n > 0 ? n + ' ' + SEV_META[sev].label.toLowerCase() : null;
        }).filter(Boolean).join(' · ');

    document.getElementById('home-roster-value').textContent = totalCount;
    document.getElementById('home-roster-sub').textContent = cdbCount + ' CDB · ' + oplCount + ' OPL';

    var alertsEl = document.getElementById('alerts');
    if (alerts.length === 0) {
      alertsEl.innerHTML = '<div class="alert-empty">Aucune échéance dans les 3 prochains mois. Tout est à jour.</div>';
    } else {
      var html = '';
      SEV_ORDER.forEach(function (sev) {
        var rows = alerts.filter(function (a) { return a.check.urgency === sev; });
        if (!rows.length) return;
        html += '<div class="alert-group sev-' + sev + '">' +
          '<div class="alert-group-head"><span class="dot"></span>' + SEV_META[sev].label + ' · ' + rows.length + '</div>';
        rows.forEach(function (a) {
          html += '<div class="alert-row" data-index="' + a.index + '">' +
            '<div><span class="name">' + esc(a.pilot.firstName) + ' ' + esc(a.pilot.lastName) + '</span> <span class="grade">' + a.pilot.rank + '</span></div>' +
            '<div class="kind">' + a.check.label + '</div>' +
            '<div class="cell-date">' + fmtDate(a.check.date) + '</div>' +
            '<div class="days">' + pillLabel(a.check.urgency, a.check.daysRemaining) + '</div>' +
          '</div>';
        });
        html += '</div>';
      });
      alertsEl.innerHTML = html;
    }

    var sorted = withChecks.slice().sort(function (a, b) {
      return a.pilot.lastName.localeCompare(b.pilot.lastName, 'fr');
    });
    document.getElementById('roster-count').textContent = sorted.length + ' pilotes';

    document.getElementById('roster-body').innerHTML = sorted.map(function (row) {
      var byKey = {};
      row.checks.forEach(function (c) { byKey[c.key] = c; });
      function cell(c) {
        return '<span class="cell-date">' + fmtDate(c.date) + '</span><span class="pill pill-' + c.urgency + '">' + pillLabel(c.urgency, c.daysRemaining) + '</span>';
      }
      return '<tr class="roster-row" data-index="' + row.index + '">' +
        '<td><span class="pilot-name">' + esc(row.pilot.firstName) + ' ' + esc(row.pilot.lastName) + '</span>' +
        '<span class="pilot-grade grade-' + row.pilot.rank + '">' + row.pilot.rank + '</span></td>' +
        '<td>' + cell(byKey.license) + '</td>' +
        '<td>' + cell(byKey.simulator) + '</td>' +
        '<td>' + cell(byKey.lineCheck) + '</td>' +
        '<td>' + cell(byKey.english) + '</td>' +
        '</tr>';
    }).join('');

    var legendItems = [['expired', 'Expiré'], ['urgent', '≤ 1 mois'], ['warning', '≤ 2 mois'], ['notice', '≤ 3 mois'], ['ok', 'OK'], ['unknown', 'Non renseigné']];
    document.getElementById('legend').innerHTML = legendItems.map(function (pair) {
      return '<span class="pill pill-' + pair[0] + '">' + pair[1] + '</span>';
    }).join('');

    var hint = document.getElementById('edit-hint');
    hint.textContent = canWrite ? 'Touche un pilote pour saisir ses dates de contrôle.' : 'Lecture seule — les modifications ne sont pas enregistrées depuis cette vue.';
    hint.classList.toggle('is-readonly', !canWrite);

    wireRowClicks();
    applyFilter();
  }

  // ---------------------------------------------------------------------
  // Navigation: home (two big blocks) → alerts / effectif drill-down
  // ---------------------------------------------------------------------
  var VIEW_KEY = 'checkfly-view';
  function showView(view) {
    document.getElementById('view-home').hidden = view !== 'home';
    document.getElementById('view-alerts').hidden = view !== 'alerts';
    document.getElementById('view-roster').hidden = view !== 'roster';
    window.scrollTo(0, 0);
    try { sessionStorage.setItem(VIEW_KEY, view); } catch (e) {}
  }

  function wireRowClicks() {
    var rows = document.querySelectorAll('.roster-row, .alert-row');
    rows.forEach(function (row) {
      row.onclick = function () { openSheet(parseInt(row.getAttribute('data-index'), 10)); };
    });
  }

  // ---------------------------------------------------------------------
  // Search / filter (per-viewer UI, no persistence needed)
  // ---------------------------------------------------------------------
  function applyFilter() {
    var q = document.getElementById('search').value.trim().toLowerCase();
    var rank = document.getElementById('rank-filter').value;
    var rows = document.querySelectorAll('#roster-body tr');
    var visible = 0;
    rows.forEach(function (r) {
      var idx = parseInt(r.getAttribute('data-index'), 10);
      var p = state.pilots[idx];
      var name = (p.firstName + ' ' + p.lastName).toLowerCase();
      var match = (!q || name.indexOf(q) !== -1) && (!rank || p.rank === rank);
      r.hidden = !match;
      if (match) visible++;
    });
    document.getElementById('no-results').hidden = visible !== 0 || rows.length === 0;
  }

  // ---------------------------------------------------------------------
  // Edit sheet
  // ---------------------------------------------------------------------
  function openSheet(index) {
    editingIndex = index;
    var p = state.pilots[index];
    document.getElementById('sheet-title').textContent = p.firstName + ' ' + p.lastName;
    var gradeEl = document.getElementById('sheet-grade');
    gradeEl.textContent = p.rank;
    gradeEl.className = 'pilot-grade sheet-grade grade-' + p.rank;
    document.getElementById('input-simu').value = p.simulatorLastCheck || '';
    document.getElementById('input-line').value = p.lineCheckLastCheck || '';
    document.getElementById('input-english').value = p.englishExpiry || '';
    updatePreview();
    var msg = document.getElementById('sheet-msg');
    msg.hidden = true;
    msg.classList.remove('is-error');
    setSaving(false);
    document.getElementById('overlay').hidden = false;
  }

  function closeSheet() {
    document.getElementById('overlay').hidden = true;
    editingIndex = -1;
  }

  function updatePreview() {
    var simu = document.getElementById('input-simu').value;
    var line = document.getElementById('input-line').value;
    document.getElementById('preview-simu').textContent = simu ? 'Validité 6 mois — expire le ' + fmtDate(addMonths(simu, 6)) : 'Validité 6 mois';
    document.getElementById('preview-line').textContent = line ? 'Validité 12 mois — expire le ' + fmtDate(addMonths(line, 12)) : 'Validité 12 mois';
  }

  function setSaving(saving) {
    document.getElementById('sheet-save').disabled = saving;
    document.getElementById('sheet-save').textContent = saving ? 'Enregistrement…' : 'Enregistrer';
  }

  function showSheetError(text) {
    var msg = document.getElementById('sheet-msg');
    msg.textContent = text;
    msg.hidden = false;
    msg.classList.add('is-error');
  }

  function toast(text) {
    var el = document.getElementById('toast');
    el.textContent = text;
    el.classList.add('is-visible');
    setTimeout(function () { el.classList.remove('is-visible'); }, 2500);
  }

  function handleSave() {
    if (editingIndex < 0) return;
    var simu = document.getElementById('input-simu').value || null;
    var line = document.getElementById('input-line').value || null;
    var english = document.getElementById('input-english').value || null;

    var next = JSON.parse(JSON.stringify(state));
    next.pilots[editingIndex].simulatorLastCheck = simu;
    next.pilots[editingIndex].lineCheckLastCheck = line;
    next.pilots[editingIndex].englishExpiry = english;
    next.generatedAt = new Date().toISOString();

    if (!artifactApi) {
      // No write channel available in this view at all: keep the change
      // visible locally so the person can still read what they entered,
      // but make clear it will not persist once the page reloads.
      state = next;
      render();
      showSheetError("Lecture seule ici : la modification ne sera pas enregistrée. Ouvre le lien depuis ton compte pour éditer.");
      return;
    }

    setSaving(true);
    var html = buildDocument(next);
    artifactApi.publish(html).then(function () {
      // The view is about to reload to the new version; nothing else to do.
      toast('Enregistré');
    }).catch(function (err) {
      setSaving(false);
      if (err && (err.code === 'not_writer' || err.code === 'not_granted')) {
        canWrite = false;
        render();
        showSheetError('Lecture seule : tu ne peux pas modifier cette page depuis cette vue.');
        return;
      }
      if (err && err.code === 'conflict') {
        // Another edit landed first; every view (including this one) is
        // already being reloaded to it. Nothing to do.
        return;
      }
      showSheetError("Échec de l'enregistrement (" + (err && err.code ? err.code : 'erreur') + "). Réessaie.");
    });
  }

  // ---------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    render();

    var savedView = null;
    try { savedView = sessionStorage.getItem(VIEW_KEY); } catch (e) {}
    showView(savedView === 'alerts' || savedView === 'roster' ? savedView : 'home');

    document.getElementById('block-alerts').addEventListener('click', function () { showView('alerts'); });
    document.getElementById('block-roster').addEventListener('click', function () { showView('roster'); });
    document.getElementById('back-from-alerts').addEventListener('click', function () { showView('home'); });
    document.getElementById('back-from-roster').addEventListener('click', function () { showView('home'); });

    document.getElementById('search').addEventListener('input', applyFilter);
    document.getElementById('rank-filter').addEventListener('change', applyFilter);
    document.getElementById('input-simu').addEventListener('input', updatePreview);
    document.getElementById('input-line').addEventListener('input', updatePreview);
    document.getElementById('sheet-close').addEventListener('click', closeSheet);
    document.getElementById('sheet-cancel').addEventListener('click', closeSheet);
    document.getElementById('sheet-save').addEventListener('click', handleSave);
    document.getElementById('overlay').addEventListener('click', function (e) {
      if (e.target === document.getElementById('overlay')) closeSheet();
    });
  });

  if (window.claude && typeof window.claude.use === 'function') {
    window.claude.use('artifact').then(function (api) {
      artifactApi = api;
      if (!api) { canWrite = false; render(); }
    });
  } else {
    artifactApi = null;
    canWrite = false;
  }
})();
