// ── FrameSpell HQ Integration ─────────────────────────────────────
// 1) Error Tracking  → HQ Worker /api/errors
// 2) Support Modal   → HQ Worker /api/support/submit
(function () {
  'use strict';
  var HQ = 'https://webcontrol-hq-api.karol-paschek.workers.dev';
  var SITE = 'framespell';

  // ── 1. ERROR TRACKING ────────────────────────────────────────────
  var _sent = Object.create(null);

  function sendError(type, message, stack) {
    var msg = String(message || '').slice(0, 500);
    var key = type + ':' + msg;
    if (_sent[key]) return;
    _sent[key] = 1;
    fetch(HQ + '/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      keepalive: true,
      body: JSON.stringify({
        site_id: SITE,
        error_type: type,
        message: msg,
        stack: stack ? String(stack).slice(0, 2000) : null,
        path: location.pathname
      })
    }).catch(function () {});
  }

  window.addEventListener('error', function (e) {
    sendError('js_error',
      e.message || 'Unknown error',
      (e.error && e.error.stack) || (e.filename + ':' + e.lineno + ':' + e.colno)
    );
  });

  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    sendError('unhandled_promise',
      r instanceof Error ? r.message : String(r),
      r instanceof Error ? r.stack : null
    );
  });

  var _origErr = console.error.bind(console);
  console.error = function () {
    _origErr.apply(console, arguments);
    var args = Array.prototype.slice.call(arguments);
    var msg = args.map(function (a) { return a instanceof Error ? a.message : String(a); }).join(' ');
    var errObj = null;
    for (var i = 0; i < args.length; i++) { if (args[i] instanceof Error) { errObj = args[i]; break; } }
    sendError('console_error', msg, errObj ? errObj.stack : null);
  };

  // ── 2. SUPPORT MODAL ─────────────────────────────────────────────
  var CSS =
    '#fshq-overlay{display:none;position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.78);backdrop-filter:blur(4px);align-items:center;justify-content:center;}' +
    '#fshq-overlay.open{display:flex;}' +
    '#fshq-box{background:#0f172a;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:32px 28px;width:100%;max-width:480px;position:relative;box-shadow:0 24px 80px rgba(0,0,0,.7);}' +
    '#fshq-box h3{margin:0 0 4px;font-size:19px;font-weight:700;color:#f8fafc;font-family:inherit;}' +
    '#fshq-box .sub{font-size:12px;color:rgba(255,255,255,.4);margin-bottom:22px;font-family:inherit;}' +
    '#fshq-box .lbl{display:block;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:5px;font-family:inherit;}' +
    '#fshq-box input,#fshq-box textarea,#fshq-box select{width:100%;box-sizing:border-box;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:9px;color:#f8fafc;font-size:13px;padding:11px 13px;margin-bottom:12px;outline:none;resize:vertical;font-family:inherit;transition:border-color .15s;}' +
    '#fshq-box input:focus,#fshq-box textarea:focus,#fshq-box select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.15);}' +
    '#fshq-box textarea{min-height:110px;}' +
    '#fshq-box select option{background:#1e293b;color:#f8fafc;}' +
    '#fshq-box input::placeholder,#fshq-box textarea::placeholder{color:rgba(255,255,255,.25);}' +
    '#fshq-send{width:100%;padding:13px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .15s,transform .1s;}' +
    '#fshq-send:hover{opacity:.88;transform:translateY(-1px);}' +
    '#fshq-send:disabled{opacity:.4;cursor:default;transform:none;}' +
    '#fshq-fb{font-size:12px;margin-top:10px;min-height:16px;text-align:center;font-family:inherit;}' +
    '#fshq-close{position:absolute;top:16px;right:18px;background:none;border:none;color:rgba(255,255,255,.35);font-size:24px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:6px;transition:color .15s,background .15s;}' +
    '#fshq-close:hover{color:#f8fafc;background:rgba(255,255,255,.08);}';

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.id = 'fshq-overlay';
  overlay.innerHTML =
    '<div id="fshq-box">' +
    '<button id="fshq-close" aria-label="Schlie&szlig;en">&times;</button>' +
    '<h3>&#127915; Support-Ticket erstellen</h3>' +
    '<p class="sub">Wir melden uns so schnell wie m&ouml;glich.</p>' +
    '<label class="lbl">Name (optional)</label>' +
    '<input id="fshq-name" type="text" maxlength="80" placeholder="Dein Name">' +
    '<label class="lbl">E-Mail (optional)</label>' +
    '<input id="fshq-email" type="email" maxlength="120" placeholder="deine@email.de">' +
    '<label class="lbl">Betreff *</label>' +
    '<input id="fshq-subject" type="text" maxlength="150" placeholder="Worum geht es?">' +
    '<label class="lbl">Kategorie</label>' +
    '<select id="fshq-cat">' +
    '<option value="bug">&#x1F41B; Fehler / Bug</option>' +
    '<option value="api">&#x1F50C; API-Problem</option>' +
    '<option value="billing">&#x1F4B3; Abrechnung / Zahlung</option>' +
    '<option value="feature">&#x2728; Feature-Wunsch</option>' +
    '<option value="other">&#x1F4AC; Sonstiges</option>' +
    '</select>' +
    '<label class="lbl">Nachricht *</label>' +
    '<textarea id="fshq-msg" maxlength="2000" placeholder="Beschreibe dein Anliegen m&ouml;glichst genau&hellip;"></textarea>' +
    '<button id="fshq-send">Ticket erstellen</button>' +
    '<div id="fshq-fb"></div>' +
    '</div>';
  document.body.appendChild(overlay);

  function saveTicket(id, token) {
    try {
      var list = JSON.parse(localStorage.getItem('fshq_tickets') || '[]');
      list.unshift({ id: id, token: token, ts: Date.now() });
      localStorage.setItem('fshq_tickets', JSON.stringify(list.slice(0, 20)));
    } catch (e) {}
  }

  function openSupport() {
    document.getElementById('fshq-fb').textContent = '';
    overlay.classList.add('open');
    setTimeout(function () { document.getElementById('fshq-subject').focus(); }, 80);
  }
  function closeSupport() { overlay.classList.remove('open'); }

  document.getElementById('fshq-close').addEventListener('click', closeSupport);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeSupport(); });

  document.getElementById('fshq-send').addEventListener('click', function () {
    var name    = (document.getElementById('fshq-name').value || '').trim();
    var email   = (document.getElementById('fshq-email').value || '').trim();
    var subject = (document.getElementById('fshq-subject').value || '').trim();
    var cat     = document.getElementById('fshq-cat').value;
    var msg     = (document.getElementById('fshq-msg').value || '').trim();
    var fb      = document.getElementById('fshq-fb');
    var btn     = document.getElementById('fshq-send');

    if (!subject) { fb.style.color = '#f87171'; fb.textContent = 'Bitte einen Betreff angeben.'; return; }
    if (msg.length < 10) { fb.style.color = '#f87171'; fb.textContent = 'Nachricht zu kurz (mind. 10 Zeichen).'; return; }

    btn.disabled = true; btn.textContent = 'Wird gesendet\u2026'; fb.textContent = '';

    fetch(HQ + '/api/support/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({
        site_id: SITE,
        name: name || 'Anonym',
        email: email || null,
        subject: '[' + cat + '] ' + subject,
        message: msg
      })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data && data.success) {
        saveTicket(data.ticket_id, data.user_token);
        fb.style.color = '#4ade80';
        fb.textContent = '\u2713 Ticket #' + data.ticket_id + ' erstellt! Wir melden uns bald.';
        ['fshq-name','fshq-email','fshq-subject','fshq-msg'].forEach(function (id) {
          document.getElementById(id).value = '';
        });
        setTimeout(closeSupport, 3200);
      } else { throw new Error('failed'); }
    })
    .catch(function () {
      fb.style.color = '#f87171';
      fb.textContent = 'Fehler beim Senden \u2013 bitte sp\u00e4ter erneut versuchen.';
    })
    .finally(function () { btn.disabled = false; btn.textContent = 'Ticket erstellen'; });
  });

  // Public API
  window.openFrameSpellSupport = openSupport;
})();
