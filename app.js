'use strict';

/* =========================================================
   Minuteur — application web (PWA) de minuteur d'intervalles
   Toutes les données restent sur le téléphone (localStorage).
   ========================================================= */

// ---------- Stockage ----------
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem('minuteur.' + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('minuteur.' + key, JSON.stringify(value)); } catch (e) {}
  },
};

const DEFAULT_SETTINGS = { sound: true, voice: true, vibrate: true, prep: 10, wakeLock: true, countdown: 3 };

const state = {
  tab: 'timer',
  quick: store.get('quick', { sets: 4, work: 120, rest: 60, skipLastRest: true }),
  workouts: store.get('workouts', []),
  history: store.get('history', []),
  settings: Object.assign({}, DEFAULT_SETTINGS, store.get('settings', {})),
  calMonth: null,
  calSelected: null,
};

function save(key) { store.set(key, state[key]); }

// ---------- Utilitaires ----------
const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');

function fmt(sec) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function fmtLong(sec) {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h} h ${m} min`;
  if (m) return s ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
}

function dayKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

// Pas d'incrément « intelligent » pour les durées
function stepUp(v) { return v < 60 ? v + 5 : v < 300 ? v + 15 : v + 30; }
function stepDown(v, min = 0) { const n = v <= 60 ? v - 5 : v <= 300 ? v - 15 : v - 30; return Math.max(min, n); }

const ICON = {
  minus: '<svg viewBox="0 0 24 24"><path d="M4 12h16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M6 3.5v17a1 1 0 0 0 1.5.86l14-8.5a1 1 0 0 0 0-1.72l-14-8.5A1 1 0 0 0 6 3.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 3h4v18H6zM14 3h4v18h-4z"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24"><path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1zm1 2v14.6l5-2.9 5 2.9V4H7z"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12l-1 12H7L6 9z"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// ---------- Entraînements prédéfinis ----------
function preset(name, level, emoji, gradient, exercises, opts = {}) {
  return { id: 'preset-' + name, name, level, emoji, gradient, preset: true,
    restBetween: opts.restBetween ?? 45, skipLastRest: true, exercises };
}
const ex = (name, sets, work, rest) => ({ name, sets, work, rest });

const PRESETS = [
  preset('Abdos', 'Débutant', '🧘', 'linear-gradient(160deg,#6d5ad6,#2c1f6b)', [
    ex('Crunchs', 3, 30, 15), ex('Planche', 3, 30, 15), ex('Relevés de jambes', 3, 30, 15), ex('Mountain climbers', 3, 30, 15),
  ]),
  preset('Bas du corps', 'Débutant', '🦵', 'linear-gradient(160deg,#3d8bd9,#163a66)', [
    ex('Squats', 3, 40, 20), ex('Fentes', 3, 40, 20), ex('Pont fessier', 3, 40, 20), ex('Chaise', 3, 30, 20),
  ]),
  preset('Haut du corps', 'Moyen', '💪', 'linear-gradient(160deg,#d9773d,#6b2e12)', [
    ex('Pompes', 3, 40, 20), ex('Dips sur chaise', 3, 40, 20), ex('Pompes diamant', 3, 30, 20), ex('Planche épaules', 3, 40, 20),
  ]),
  preset('Tabata', 'Intense', '🔥', 'linear-gradient(160deg,#d93d5a,#5e1222)', [
    ex('Burpees', 8, 20, 10),
  ], { restBetween: 0 }),
  preset('HIIT cardio', 'Moyen', '⚡', 'linear-gradient(160deg,#2fb57a,#0f4a33)', [
    ex('Jumping jacks', 3, 45, 15), ex('Burpees', 3, 45, 15), ex('Montées de genoux', 3, 45, 15), ex('Patineur', 3, 45, 15),
  ], { restBetween: 30 }),
];

function quickAsWorkout() {
  const q = state.quick;
  return { name: 'Entraînement rapide', restBetween: 0, skipLastRest: q.skipLastRest,
    exercises: [{ name: '', sets: q.sets, work: q.work, rest: q.rest }] };
}

// Construit la liste des segments (préparation / travail / repos)
function buildSegments(w, withPrep = true) {
  const segs = [];
  const prep = state.settings.prep;
  if (withPrep && prep > 0) segs.push({ type: 'prep', label: 'Préparation', duration: prep });
  const exs = w.exercises.filter((e) => e.sets > 0 && e.work > 0);
  exs.forEach((e, i) => {
    const lastEx = i === exs.length - 1;
    for (let s = 1; s <= e.sets; s++) {
      const lastSet = s === e.sets;
      segs.push({ type: 'work', name: e.name, set: s, sets: e.sets, exIndex: i, exCount: exs.length, duration: e.work });
      if (!lastSet) {
        if (e.rest > 0) segs.push({ type: 'rest', name: e.name, set: s, sets: e.sets, exIndex: i, duration: e.rest });
      } else if (!lastEx) {
        const r = w.restBetween > 0 ? w.restBetween : e.rest;
        if (r > 0) segs.push({ type: 'rest', between: true, exIndex: i, duration: r });
      } else if (!w.skipLastRest && e.rest > 0) {
        segs.push({ type: 'rest', name: e.name, set: s, sets: e.sets, exIndex: i, duration: e.rest });
      }
    }
  });
  return segs;
}

const totalOf = (segs) => segs.reduce((a, s) => a + s.duration, 0);

function describe(w) {
  const total = totalOf(buildSegments(w, false));
  const n = w.exercises.length;
  return `${n} exercice${n > 1 ? 's' : ''} · ${fmt(total)}`;
}

// ---------- Rendu des onglets ----------
function render() {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
  const view = $('#view');
  if (state.tab === 'timer') view.innerHTML = renderTimer();
  if (state.tab === 'workouts') view.innerHTML = renderWorkouts();
  if (state.tab === 'history') view.innerHTML = renderHistory();
  if (state.tab === 'settings') view.innerHTML = renderSettings();
}

function stepperHTML(label, cls, value, key, small = false) {
  return `
  <div class="stepper ${small ? 'small' : ''}">
    <button class="step-btn" data-step="${key}" data-dir="-1" aria-label="Moins">${ICON.minus}</button>
    <button class="stepper-mid" data-pick="${key}">
      <div class="stepper-label ${cls}">${label}</div>
      <div class="stepper-value">${value}</div>
    </button>
    <button class="step-btn" data-step="${key}" data-dir="1" aria-label="Plus">${ICON.plus}</button>
  </div>`;
}

function renderTimer() {
  const q = state.quick;
  const total = totalOf(buildSegments(quickAsWorkout(), false));
  return `
  <div class="page-head">
    <h1 class="page-title">Entraînement rapide</h1>
    <button class="head-btn" id="save-quick" aria-label="Enregistrer">${ICON.bookmark}</button>
  </div>
  <div class="card">${stepperHTML('SÉRIES', '', q.sets, 'q.sets')}</div>
  <div class="card">
    ${stepperHTML('TRAVAIL', 'work', fmt(q.work), 'q.work')}
    ${stepperHTML('REPOS', 'rest', fmt(q.rest), 'q.rest')}
    <label class="row">Ignorer le dernier repos
      <span class="switch"><input type="checkbox" id="q-skip" ${q.skipLastRest ? 'checked' : ''}><span></span></span>
    </label>
  </div>
  <button class="add-btn" id="open-builder">${ICON.plus}<span>Entraînement à plusieurs exercices</span></button>
  <button class="launch" id="launch-quick">${ICON.play}<span>Lancer</span><span class="launch-total">${fmt(total)}</span></button>`;
}

function renderWorkouts() {
  const mine = state.workouts;
  return `
  <div class="page-head"><h1 class="page-title">Entraînements</h1></div>
  <h2 class="section-title">À la une</h2>
  <div class="featured">
    ${PRESETS.map((p) => `
      <button class="feat-card" data-preset="${esc(p.id)}" style="background:${p.gradient}">
        <span class="emoji">${p.emoji}</span>
        <span class="name">${esc(p.name)}</span>
        <span class="badge">${esc(p.level)}</span>
      </button>`).join('')}
  </div>
  <h2 class="section-title">Mes entraînements</h2>
  ${mine.length ? `<div class="card">${mine.map((w) => `
    <div class="w-item">
      <button class="w-main" data-edit="${esc(w.id)}">
        <div class="w-name">${esc(w.name)}</div>
        <div class="w-meta">${esc(describe(w))}</div>
      </button>
      <button class="dots-btn" data-wmenu="${esc(w.id)}" aria-label="Options">${ICON.dots}</button>
      <button class="w-play" data-start="${esc(w.id)}" aria-label="Lancer">${ICON.play}</button>
    </div>`).join('')}</div>` : '<p class="empty">Aucun entraînement pour l’instant.</p>'}
  <button class="add-btn" id="create-workout">${ICON.plus}<span>Créer un entraînement</span></button>`;
}

function renderHistory() {
  const now = new Date();
  if (!state.calMonth) state.calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (!state.calSelected) state.calSelected = dayKey(now);
  const m = state.calMonth;
  const byDay = {};
  state.history.forEach((h) => { const k = dayKey(new Date(h.date)); (byDay[k] = byDay[k] || []).push(h); });

  const first = new Date(m.getFullYear(), m.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // lundi = 0
  const start = new Date(first); start.setDate(1 - offset);
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const k = dayKey(d);
    const cls = ['cal-day'];
    if (d.getMonth() !== m.getMonth()) cls.push('other');
    if (k === dayKey(now)) cls.push('today');
    if (k === state.calSelected) cls.push('selected');
    cells.push(`<button class="${cls.join(' ')}" data-day="${k}">${d.getDate()}${byDay[k] ? '<span class="mark">💪</span>' : ''}</button>`);
  }

  const monthName = m.toLocaleDateString('fr-FR', { month: 'long' }) + (m.getFullYear() !== now.getFullYear() ? ' ' + m.getFullYear() : '');
  const inMonth = state.history.filter((h) => { const d = new Date(h.date); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); });
  const monthTime = inMonth.reduce((a, h) => a + h.duration, 0);
  const monthDays = new Set(inMonth.map((h) => dayKey(new Date(h.date)))).size;

  const sel = (byDay[state.calSelected] || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const selDate = new Date(state.calSelected + 'T12:00:00');

  return `
  <div class="month-head">
    <h1 class="page-title">${esc(monthName)}</h1>
    <div class="month-nav">
      <button class="head-btn" id="cal-prev" aria-label="Mois précédent">${ICON.left}</button>
      <button class="head-btn" id="cal-next" aria-label="Mois suivant">${ICON.right}</button>
    </div>
  </div>
  <div class="cal-grid">
    ${['LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.', 'DIM.'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
    ${cells.join('')}
  </div>
  <div class="stats">
    <div class="stat"><b>${inMonth.length}</b><span>séances</span></div>
    <div class="stat"><b>${monthDays}</b><span>jours actifs</span></div>
    <div class="stat"><b>${fmtLong(monthTime)}</b><span>au total</span></div>
  </div>
  <h2 class="section-title">${esc(selDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</h2>
  ${sel.length ? sel.map((h) => {
    const d = new Date(h.date);
    return `
    <div class="h-item">
      <div class="h-title"><span>${esc(h.name && h.name !== 'Entraînement rapide' ? h.name : 'Entraînement')} à ${pad(d.getHours())}:${pad(d.getMinutes())}</span>
        <button class="dots-btn" data-hmenu="${esc(h.id)}" aria-label="Options">${ICON.dots}</button></div>
      <div class="chips">
        <span class="chip">${fmtLong(h.duration)}</span>
        <span class="chip">Exercices: ${h.exercises}</span>
        ${h.complete === false ? '<span class="chip">Interrompu</span>' : ''}
      </div>
      <label class="note"><span>📝</span><input data-note="${esc(h.id)}" value="${esc(h.note || '')}" placeholder="Ajouter une remarque…" enterkeyhint="done"></label>
    </div>`;
  }).join('') : '<p class="empty">Aucun entraînement ce jour-là.</p>'}`;
}

function renderSettings() {
  const s = state.settings;
  const sw = (key, label, sub = '') => `
    <label class="row"><span>${label}${sub ? `<br><span class="sub">${sub}</span>` : ''}</span>
      <span class="switch"><input type="checkbox" data-setting="${key}" ${s[key] ? 'checked' : ''}><span></span></span>
    </label>`;
  return `
  <div class="page-head"><h1 class="page-title">Paramètres</h1></div>
  <div class="card">
    ${sw('sound', 'Sons', 'Bips au changement de phase')}
    ${sw('voice', 'Annonces vocales', '« Travail », « Repos », nom des exercices…')}
    ${sw('vibrate', 'Vibrations', 'Si l’appareil le permet')}
    ${sw('wakeLock', 'Garder l’écran allumé', 'Pendant un entraînement')}
  </div>
  <div class="card">${stepperHTML('PRÉPARATION', 'prep', fmt(s.prep), 's.prep', true)}</div>
  <p class="hint">Compte à rebours avant le début de l’entraînement.</p>
  <div class="card">
    <button class="row" id="test-sound">🔊 Tester le son et la voix</button>
  </div>
  <p class="hint">Astuce : sur iPhone, laisse l’écran allumé pendant la séance. Si l’écran se verrouille, le minuteur se recale automatiquement au retour, mais les sons ne peuvent pas être joués en arrière-plan.</p>
  <div class="card">
    <button class="row" id="export-data">📤 Exporter mes données</button>
    <button class="row" id="import-data">📥 Importer des données</button>
    <button class="row danger" id="reset-data">Tout effacer</button>
  </div>
  <p class="hint">Minuteur · gratuit, sans pub, fonctionne hors ligne.</p>`;
}

// ---------- Interactions des onglets ----------
function adjust(key, dir) {
  const [scope, field] = key.split('.');
  const obj = scope === 'q' ? state.quick : scope === 's' ? state.settings : null;
  if (!obj) return;
  if (field === 'sets') obj.sets = Math.min(99, Math.max(1, obj.sets + dir));
  else if (field === 'prep') obj.prep = dir > 0 ? Math.min(120, obj.prep + 5) : Math.max(0, obj.prep - 5);
  else obj[field] = dir > 0 ? Math.min(5999, stepUp(obj[field])) : stepDown(obj[field], field === 'work' ? 5 : 0);
  save(scope === 'q' ? 'quick' : 'settings');
  render();
}

// Répétition automatique quand on maintient + / −
let holdTimer = null;
function startHold(fn) {
  fn();
  let delay = 400;
  const loop = () => { fn(); delay = Math.max(70, delay * 0.8); holdTimer = setTimeout(loop, delay); };
  holdTimer = setTimeout(loop, delay);
}
function stopHold() { clearTimeout(holdTimer); holdTimer = null; }

document.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('[data-step]');
  if (!b || b.closest('.sheet')) return;
  e.preventDefault();
  const key = b.dataset.step, dir = +b.dataset.dir;
  startHold(() => adjust(key, dir));
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => document.addEventListener(t, stopHold));

$('#tabbar').addEventListener('click', (e) => {
  const b = e.target.closest('.tab');
  if (!b) return;
  state.tab = b.dataset.tab;
  window.scrollTo(0, 0);
  render();
});

$('#view').addEventListener('click', (e) => {
  const t = e.target;
  const pick = t.closest('[data-pick]');
  if (pick) {
    const key = pick.dataset.pick;
    const [scope, field] = key.split('.');
    const obj = scope === 'q' ? state.quick : state.settings;
    const done = (v) => { obj[field] = v; save(scope === 'q' ? 'quick' : 'settings'); render(); };
    if (field === 'sets') pickNumber('Séries', obj.sets, 1, 99, done);
    else pickDuration(field === 'work' ? 'Travail' : field === 'rest' ? 'Repos' : 'Préparation', obj[field], done, field === 'work' ? 5 : 0);
    return;
  }
  if (t.closest('#launch-quick')) return startWorkout(quickAsWorkout());
  if (t.closest('#save-quick')) {
    const q = state.quick;
    const w = { id: uid(), name: `${q.sets} × ${fmt(q.work)} / ${fmt(q.rest)}`, restBetween: 0, skipLastRest: q.skipLastRest,
      exercises: [{ name: 'Exercice', sets: q.sets, work: q.work, rest: q.rest }] };
    return openEditor(w, true);
  }
  if (t.closest('#open-builder') || t.closest('#create-workout')) {
    const q = state.quick;
    return openEditor({ id: uid(), name: '', restBetween: 30, skipLastRest: true,
      exercises: [{ name: 'Exercice 1', sets: q.sets, work: q.work, rest: q.rest }] }, true);
  }
  const p = t.closest('[data-preset]');
  if (p) return openPresetMenu(PRESETS.find((x) => x.id === p.dataset.preset));
  const st = t.closest('[data-start]');
  if (st) return startWorkout(state.workouts.find((w) => w.id === st.dataset.start));
  const ed = t.closest('[data-edit]');
  if (ed) return openEditor(state.workouts.find((w) => w.id === ed.dataset.edit), false);
  const wm = t.closest('[data-wmenu]');
  if (wm) return openWorkoutMenu(state.workouts.find((w) => w.id === wm.dataset.wmenu));
  const day = t.closest('[data-day]');
  if (day) {
    state.calSelected = day.dataset.day;
    const d = new Date(day.dataset.day + 'T12:00:00');
    if (d.getMonth() !== state.calMonth.getMonth()) state.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    return render();
  }
  if (t.closest('#cal-prev') || t.closest('#cal-next')) {
    const m = state.calMonth;
    state.calMonth = new Date(m.getFullYear(), m.getMonth() + (t.closest('#cal-prev') ? -1 : 1), 1);
    return render();
  }
  const hm = t.closest('[data-hmenu]');
  if (hm) return openHistoryMenu(hm.dataset.hmenu);
  if (t.closest('#test-sound')) { audio.unlock(); audio.beep(880, 0.15); setTimeout(() => audio.beep(1320, 0.4), 250); speak('Travail. Pompes.', true); return; }
  if (t.closest('#export-data')) return exportData();
  if (t.closest('#import-data')) return importData();
  if (t.closest('#reset-data')) {
    return confirmSheet('Effacer toutes les données ?', 'Entraînements et historique seront supprimés.', 'Tout effacer', () => {
      state.workouts = []; state.history = []; save('workouts'); save('history'); render(); toast('Données effacées');
    });
  }
});

$('#view').addEventListener('change', (e) => {
  const t = e.target;
  if (t.id === 'q-skip') { state.quick.skipLastRest = t.checked; save('quick'); render(); }
  if (t.dataset.setting) { state.settings[t.dataset.setting] = t.checked; save('settings'); }
  if (t.dataset.note) {
    const h = state.history.find((x) => x.id === t.dataset.note);
    if (h) { h.note = t.value.trim(); save('history'); }
  }
});
$('#view').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.dataset.note) e.target.blur(); });

// ---------- Feuilles modales ----------
function openSheet(html, { full = false, onMount } = {}) {
  const root = $('#sheet-root');
  const back = document.createElement('div');
  back.className = 'sheet-backdrop';
  back.innerHTML = `<div class="sheet ${full ? 'full' : ''}">${full ? '' : '<div class="sheet-grip"></div>'}${html}</div>`;
  const close = () => back.remove();
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  root.appendChild(back);
  if (onMount) onMount(back.firstElementChild, close);
  return close;
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

function confirmSheet(title, text, okLabel, onOk) {
  openSheet(`
    <h2 style="text-align:center;margin:4px 0 6px">${esc(title)}</h2>
    <p class="menu-title">${esc(text)}</p>
    <button class="btn danger" data-ok>${esc(okLabel)}</button>
    <button class="btn secondary" data-cancel>Annuler</button>`, {
    onMount(el, close) {
      el.querySelector('[data-ok]').onclick = () => { close(); onOk(); };
      el.querySelector('[data-cancel]').onclick = close;
    },
  });
}

function pickDuration(title, value, onDone, minTotal = 0) {
  const mins = Array.from({ length: 100 }, (_, i) => `<option value="${i}" ${Math.floor(value / 60) === i ? 'selected' : ''}>${pad(i)}</option>`).join('');
  const secs = Array.from({ length: 60 }, (_, i) => `<option value="${i}" ${value % 60 === i ? 'selected' : ''}>${pad(i)}</option>`).join('');
  openSheet(`
    <div class="sheet-head"><button class="link-btn" data-cancel>Annuler</button><h2>${esc(title)}</h2><button class="link-btn right" data-ok>OK</button></div>
    <div class="picker"><select data-m>${mins}</select><span>min</span><select data-s>${secs}</select><span>s</span></div>`, {
    onMount(el, close) {
      el.querySelector('[data-cancel]').onclick = close;
      el.querySelector('[data-ok]').onclick = () => {
        const v = +el.querySelector('[data-m]').value * 60 + +el.querySelector('[data-s]').value;
        close(); onDone(Math.max(minTotal, v));
      };
    },
  });
}

function pickNumber(title, value, min, max, onDone) {
  const opts = Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => `<option value="${n}" ${n === value ? 'selected' : ''}>${n}</option>`).join('');
  openSheet(`
    <div class="sheet-head"><button class="link-btn" data-cancel>Annuler</button><h2>${esc(title)}</h2><button class="link-btn right" data-ok>OK</button></div>
    <div class="picker"><select data-n>${opts}</select></div>`, {
    onMount(el, close) {
      el.querySelector('[data-cancel]').onclick = close;
      el.querySelector('[data-ok]').onclick = () => { close(); onDone(+el.querySelector('[data-n]').value); };
    },
  });
}

function openPresetMenu(p) {
  openSheet(`
    <h2 style="text-align:center;margin:4px 0 4px">${p.emoji} ${esc(p.name)}</h2>
    <p class="menu-title">${esc(p.level)} · ${esc(describe(p))}</p>
    <div class="card">${p.exercises.map((e) => `<div class="row"><span>${esc(e.name)}</span><span class="sub">${e.sets} × ${fmt(e.work)} / ${fmt(e.rest)}</span></div>`).join('')}</div>
    <button class="btn" data-go>Lancer</button>
    <button class="btn secondary" data-copy>Copier dans mes entraînements</button>`, {
    onMount(el, close) {
      el.querySelector('[data-go]').onclick = () => { close(); startWorkout(p); };
      el.querySelector('[data-copy]').onclick = () => {
        close();
        const copy = JSON.parse(JSON.stringify(p));
        delete copy.preset; delete copy.gradient; delete copy.level; delete copy.emoji;
        copy.id = uid();
        openEditor(copy, true);
      };
    },
  });
}

function openWorkoutMenu(w) {
  openSheet(`
    <p class="menu-title">${esc(w.name)}</p>
    <button class="btn" data-go>Lancer</button>
    <button class="btn secondary" data-edit>Modifier</button>
    <button class="btn secondary" data-dup>Dupliquer</button>
    <button class="btn danger" data-del>Supprimer</button>`, {
    onMount(el, close) {
      el.querySelector('[data-go]').onclick = () => { close(); startWorkout(w); };
      el.querySelector('[data-edit]').onclick = () => { close(); openEditor(w, false); };
      el.querySelector('[data-dup]').onclick = () => {
        close();
        const c = JSON.parse(JSON.stringify(w)); c.id = uid(); c.name += ' (copie)';
        state.workouts.push(c); save('workouts'); render();
      };
      el.querySelector('[data-del]').onclick = () => {
        close();
        confirmSheet('Supprimer cet entraînement ?', w.name, 'Supprimer', () => {
          state.workouts = state.workouts.filter((x) => x.id !== w.id); save('workouts'); render();
        });
      };
    },
  });
}

function openHistoryMenu(id) {
  confirmSheet('Supprimer cette séance ?', 'Elle sera retirée de l’historique.', 'Supprimer', () => {
    state.history = state.history.filter((h) => h.id !== id); save('history'); render();
  });
}

// ---------- Éditeur d'entraînement (plusieurs exercices) ----------
function openEditor(original, isNew) {
  const w = JSON.parse(JSON.stringify(original));
  let sheetEl, closeSheet;

  const draw = () => {
    const total = totalOf(buildSegments(w, false));
    sheetEl.innerHTML = `
      <div class="sheet-head">
        <button class="link-btn" data-cancel>Annuler</button>
        <h2>${isNew ? 'Nouvel entraînement' : 'Modifier'}</h2>
        <button class="link-btn right" data-save>Enregistrer</button>
      </div>
      <input class="text-input" data-name placeholder="Nom de l’entraînement" value="${esc(w.name)}" enterkeyhint="done">
      ${w.exercises.map((e, i) => `
        <div class="ex-card">
          <div class="ex-head">
            <span class="num">${i + 1}</span>
            <input data-exname="${i}" value="${esc(e.name)}" placeholder="Nom de l’exercice" enterkeyhint="done">
            ${i > 0 ? `<button class="mini" data-up="${i}" aria-label="Monter">${ICON.up}</button>` : ''}
            ${w.exercises.length > 1 ? `<button class="mini" data-del="${i}" aria-label="Supprimer">${ICON.trash}</button>` : ''}
          </div>
          ${stepperHTML('SÉRIES', '', e.sets, `${i}.sets`, true)}
          ${stepperHTML('TRAVAIL', 'work', fmt(e.work), `${i}.work`, true)}
          ${stepperHTML('REPOS', 'rest', fmt(e.rest), `${i}.rest`, true)}
        </div>`).join('')}
      <button class="add-btn" data-add>${ICON.plus}<span>Ajouter un exercice</span></button>
      <div class="card">
        ${w.exercises.length > 1 ? stepperHTML('REPOS ENTRE EXERCICES', 'rest', fmt(w.restBetween), 'rb', true) : ''}
        <label class="row">Ignorer le dernier repos
          <span class="switch"><input type="checkbox" data-skip ${w.skipLastRest ? 'checked' : ''}><span></span></span>
        </label>
      </div>
      <p class="hint">Durée totale : <b>${fmt(total)}</b>${state.settings.prep ? ` (+ ${fmt(state.settings.prep)} de préparation)` : ''}</p>
      <button class="btn" data-go>${ICON.play.replace('<svg', '<svg style="width:18px;height:18px;vertical-align:-3px;margin-right:8px"')}Enregistrer et lancer</button>
      ${!isNew ? '<button class="btn danger" data-delete>Supprimer l’entraînement</button>' : ''}`;
  };

  const persist = () => {
    if (!w.name.trim()) w.name = w.exercises.length === 1 && w.exercises[0].name ? w.exercises[0].name : 'Mon entraînement';
    w.exercises.forEach((e, i) => { if (!e.name.trim()) e.name = `Exercice ${i + 1}`; });
    const idx = state.workouts.findIndex((x) => x.id === w.id);
    if (idx >= 0) state.workouts[idx] = w; else state.workouts.push(w);
    save('workouts');
  };

  const adj = (key, dir) => {
    if (key === 'rb') w.restBetween = dir > 0 ? stepUp(w.restBetween) : stepDown(w.restBetween);
    else {
      const [i, f] = key.split('.');
      const e = w.exercises[+i];
      if (f === 'sets') e.sets = Math.min(99, Math.max(1, e.sets + dir));
      else e[f] = dir > 0 ? Math.min(5999, stepUp(e[f])) : stepDown(e[f], f === 'work' ? 5 : 0);
    }
    const y = sheetEl.scrollTop; draw(); sheetEl.scrollTop = y;
  };

  closeSheet = openSheet('', {
    full: true,
    onMount(el, close) {
      sheetEl = el; draw();
      el.addEventListener('pointerdown', (e) => {
        const b = e.target.closest('[data-step]');
        if (!b) return;
        e.preventDefault();
        const key = b.dataset.step, dir = +b.dataset.dir;
        startHold(() => adj(key, dir));
      });
      el.addEventListener('input', (e) => {
        if (e.target.matches('[data-name]')) w.name = e.target.value;
        if (e.target.dataset.exname) w.exercises[+e.target.dataset.exname].name = e.target.value;
      });
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.target.blur(); });
      el.addEventListener('change', (e) => { if (e.target.matches('[data-skip]')) { w.skipLastRest = e.target.checked; draw(); } });
      el.addEventListener('click', (e) => {
        const t = e.target;
        const redraw = () => { const y = el.scrollTop; draw(); el.scrollTop = y; };
        if (t.closest('[data-cancel]')) return close();
        if (t.closest('[data-save]')) { persist(); close(); toast('Entraînement enregistré'); state.tab = 'workouts'; return render(); }
        if (t.closest('[data-go]')) { persist(); close(); render(); return startWorkout(w); }
        if (t.closest('[data-delete]')) {
          return confirmSheet('Supprimer cet entraînement ?', w.name, 'Supprimer', () => {
            state.workouts = state.workouts.filter((x) => x.id !== w.id); save('workouts'); close(); render();
          });
        }
        if (t.closest('[data-add]')) {
          const last = w.exercises[w.exercises.length - 1];
          w.exercises.push({ name: `Exercice ${w.exercises.length + 1}`, sets: last.sets, work: last.work, rest: last.rest });
          draw(); el.scrollTop = el.scrollHeight; return;
        }
        const del = t.closest('[data-del]');
        if (del) { w.exercises.splice(+del.dataset.del, 1); return redraw(); }
        const up = t.closest('[data-up]');
        if (up) { const i = +up.dataset.up; [w.exercises[i - 1], w.exercises[i]] = [w.exercises[i], w.exercises[i - 1]]; return redraw(); }
        const pick = t.closest('[data-pick]');
        if (pick) {
          const key = pick.dataset.pick;
          if (key === 'rb') return pickDuration('Repos entre exercices', w.restBetween, (v) => { w.restBetween = v; redraw(); });
          const [i, f] = key.split('.');
          const e2 = w.exercises[+i];
          if (f === 'sets') return pickNumber('Séries', e2.sets, 1, 99, (v) => { e2.sets = v; redraw(); });
          return pickDuration(f === 'work' ? 'Travail' : 'Repos', e2[f], (v) => { e2[f] = v; redraw(); }, f === 'work' ? 5 : 0);
        }
      });
    },
  });
}

// ---------- Audio / voix / vibration ----------
const audio = {
  ctx: null,
  unlock() {
    try {
      // iOS 16.4+ : jouer même si le bouton silencieux est activé
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (e) {}
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    // tampon silencieux pour débloquer l'audio sur iOS
    const b = this.ctx.createBuffer(1, 1, 22050);
    const s = this.ctx.createBufferSource();
    s.buffer = b; s.connect(this.ctx.destination); s.start(0);
  },
  beep(freq = 880, dur = 0.12, vol = 0.6) {
    if (!state.settings.sound || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
};

let frVoice = null;
function loadVoice() {
  if (!('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  frVoice = vs.find((v) => v.lang === 'fr-FR' && /Thomas|Amélie|Audrey/i.test(v.name)) || vs.find((v) => v.lang && v.lang.startsWith('fr')) || null;
}
if ('speechSynthesis' in window) { loadVoice(); speechSynthesis.onvoiceschanged = loadVoice; }

function speak(text, force = false) {
  if (!('speechSynthesis' in window)) return;
  if (!force && (!state.settings.voice || !run.voice)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    if (frVoice) u.voice = frVoice;
    u.rate = 1.05;
    speechSynthesis.speak(u);
  } catch (e) {}
}

function vibrate(p) { if (state.settings.vibrate && navigator.vibrate) navigator.vibrate(p); }

let wakeLock = null;
async function requestWakeLock() {
  if (!state.settings.wakeLock || !('wakeLock' in navigator)) return;
  try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {}
}
function releaseWakeLock() { try { wakeLock && wakeLock.release(); } catch (e) {} wakeLock = null; }

// ---------- Moteur du minuteur ----------
const run = {
  active: false,
  workout: null,
  segs: [],
  i: 0,
  endAt: 0,        // instant de fin du segment courant (ms) quand il tourne
  remainingMs: 0,  // temps restant du segment quand en pause
  paused: false,
  done: false,
  activeMs: 0,     // temps réellement passé (hors pauses)
  lastTick: 0,
  lastSecond: null,
  startedAt: null,
  voice: true,
  timer: null,
};

function startWorkout(w) {
  if (!w) return;
  audio.unlock();
  const segs = buildSegments(w, true);
  if (!segs.length) return toast('Entraînement vide');
  Object.assign(run, {
    active: true, workout: w, segs, i: 0, paused: false, done: false,
    activeMs: 0, lastTick: performance.now(), startedAt: new Date(), voice: state.settings.voice,
  });
  enterSegment(0, true);
  $('#run').hidden = false;
  document.body.style.overflow = 'hidden';
  requestWakeLock();
  clearInterval(run.timer);
  run.timer = setInterval(tick, 100);
  drawRun();
}

function enterSegment(i, announce) {
  run.i = i;
  const seg = run.segs[i];
  run.remainingMs = seg.duration * 1000;
  run.endAt = performance.now() + run.remainingMs;
  run.lastSecond = null;
  if (announce) announceSegment(seg);
}

function segTitle(seg) {
  if (seg.type === 'prep') return 'Préparation';
  if (seg.type === 'rest' && seg.between) return 'Repos';
  const multi = run.workout.exercises.length > 1;
  const word = seg.type === 'work' ? (multi && seg.name ? seg.name : 'Travail') : 'Repos';
  return `${word} ${seg.set}/${seg.sets}`;
}

function nextInfo() {
  const n = run.segs[run.i + 1];
  if (!n) return 'Dernière ligne droite !';
  if (n.type === 'work') {
    const multi = run.workout.exercises.length > 1;
    return `Ensuite : ${multi && n.name ? n.name : 'Travail'} · ${fmt(n.duration)}`;
  }
  return `Ensuite : Repos · ${fmt(n.duration)}`;
}

function announceSegment(seg) {
  vibrate(seg.type === 'work' ? [200, 80, 200] : 300);
  audio.beep(seg.type === 'work' ? 1320 : 660, 0.45, 0.7);
  const multi = run.workout.exercises.length > 1;
  if (seg.type === 'prep') speak('Préparez-vous');
  else if (seg.type === 'work') {
    const isNewEx = seg.set === 1 && multi && seg.name;
    speak(isNewEx ? seg.name : 'Travail');
  } else if (seg.between) {
    const n = run.segs[run.i + 1];
    speak(n && n.name ? `Repos. Prochain exercice : ${n.name}` : 'Repos');
  } else speak('Repos');
}

function currentRemainingMs() {
  return run.paused ? run.remainingMs : Math.max(0, run.endAt - performance.now());
}

function tick() {
  if (!run.active || run.done) return;
  const now = performance.now();
  if (!run.paused) run.activeMs += now - run.lastTick;
  run.lastTick = now;
  if (run.paused) return;

  // Rattrape le temps si l'appli a été mise en veille
  let rem = run.endAt - now;
  let skipped = false;
  while (rem <= 0) {
    if (run.i >= run.segs.length - 1) return finishWorkout(true);
    const over = -rem;
    run.i++;
    run.endAt = now + run.segs[run.i].duration * 1000 - over;
    rem = run.endAt - now;
    run.lastSecond = null;
    skipped = true;
  }
  if (skipped) announceSegment(run.segs[run.i]);

  const sec = Math.ceil(rem / 1000);
  if (sec !== run.lastSecond) {
    if (run.lastSecond !== null && sec <= state.settings.countdown && sec > 0) {
      audio.beep(880, 0.12, 0.6);
      vibrate(60);
    }
    run.lastSecond = sec;
  }
  drawRun();
}

function drawRun() {
  const el = $('#run');
  if (run.done) return;
  const seg = run.segs[run.i];
  const rem = currentRemainingMs();
  const after = run.segs.slice(run.i + 1).reduce((a, s) => a + s.duration, 0);
  el.className = seg.type + (run.paused ? ' paused' : '');
  $('#run-phase').textContent = segTitle(seg);
  $('#run-time').textContent = fmt(Math.ceil(rem / 1000));
  $('#run-total').textContent = fmt(Math.ceil(rem / 1000) + after);
  $('#run-next').textContent = nextInfo();
  const pct = 100 * (1 - rem / (seg.duration * 1000));
  $('#run-bar').style.width = Math.min(100, Math.max(0, pct)) + '%';
  $('#run-toggle').innerHTML = run.paused ? `${ICON.play}<span>Reprendre</span>` : `${ICON.pause}<span>Pause</span>`;
  $('#run-voice').classList.toggle('off', !run.voice);
  $('#run-prev').style.visibility = '';
  $('#run-skip').style.visibility = '';
}

function togglePause() {
  if (run.done) return;
  audio.unlock();
  if (run.paused) {
    run.endAt = performance.now() + run.remainingMs;
    run.paused = false;
    requestWakeLock();
  } else {
    run.remainingMs = currentRemainingMs();
    run.paused = true;
  }
  run.lastTick = performance.now();
  drawRun();
}

function jump(delta) {
  if (run.done) return;
  const seg = run.segs[run.i];
  const elapsed = seg.duration * 1000 - currentRemainingMs();
  let target = run.i + delta;
  // « Précédent » : revient au début du segment si on y est depuis > 2 s
  if (delta < 0 && elapsed > 2000) target = run.i;
  if (target >= run.segs.length) return finishWorkout(true);
  target = Math.max(0, target);
  const wasPaused = run.paused;
  enterSegment(target, !wasPaused);
  if (wasPaused) run.remainingMs = run.segs[target].duration * 1000;
  drawRun();
}

function recordHistory(complete) {
  const secs = Math.round(run.activeMs / 1000);
  if (secs < 5) return;
  state.history.push({
    id: uid(),
    date: run.startedAt.toISOString(),
    duration: secs,
    exercises: run.workout.exercises.length,
    name: run.workout.name,
    complete,
  });
  save('history');
}

function finishWorkout(complete) {
  run.done = true;
  clearInterval(run.timer);
  recordHistory(complete);
  audio.beep(1320, 0.2); setTimeout(() => audio.beep(1320, 0.2), 250); setTimeout(() => audio.beep(1760, 0.6), 500);
  vibrate([300, 100, 300, 100, 500]);
  speak('Entraînement terminé. Bravo !');
  const el = $('#run');
  el.className = 'done';
  $('#run-phase').innerHTML = '';
  $('#run-time').innerHTML = `<div class="done-box"><div class="big-emoji">🎉</div><h2>Bravo !</h2><p>${fmtLong(run.activeMs / 1000)} d’entraînement</p></div>`;
  $('#run-time').style.fontSize = '16px';
  $('#run-next').textContent = '';
  $('#run-total').textContent = '00:00';
  $('#run-bar').style.width = '100%';
  $('#run-toggle').innerHTML = '<span>Terminer</span>';
  $('#run-prev').style.visibility = 'hidden';
  $('#run-skip').style.visibility = 'hidden';
}

function closeRun() {
  run.active = false;
  clearInterval(run.timer);
  releaseWakeLock();
  $('#run').hidden = true;
  $('#run-time').style.fontSize = '';
  document.body.style.overflow = '';
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  render();
}

$('#run-toggle').addEventListener('click', () => (run.done ? closeRun() : togglePause()));
$('#run-prev').addEventListener('click', () => jump(-1));
$('#run-skip').addEventListener('click', () => jump(1));
$('#run-voice').addEventListener('click', () => {
  run.voice = !run.voice;
  if (!run.voice && 'speechSynthesis' in window) speechSynthesis.cancel();
  toast(run.voice ? 'Annonces vocales activées' : 'Annonces vocales coupées');
  drawRun();
});
$('#run-close').addEventListener('click', () => {
  if (run.done) return closeRun();
  if (!run.paused) togglePause();
  const secs = Math.round(run.activeMs / 1000);
  openSheet(`
    <h2 style="text-align:center;margin:4px 0 6px">Arrêter l’entraînement ?</h2>
    <p class="menu-title">${fmtLong(secs)} effectués</p>
    ${secs >= 5 ? '<button class="btn" data-save>Arrêter et enregistrer</button>' : ''}
    <button class="btn danger" data-quit>Arrêter sans enregistrer</button>
    <button class="btn secondary" data-cancel>Continuer</button>`, {
    onMount(el, close) {
      const s = el.querySelector('[data-save]');
      if (s) s.onclick = () => { close(); recordHistory(false); closeRun(); toast('Séance enregistrée'); };
      el.querySelector('[data-quit]').onclick = () => { close(); closeRun(); };
      el.querySelector('[data-cancel]').onclick = () => { close(); togglePause(); };
    },
  });
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && run.active && !run.done) {
    requestWakeLock();
    if (audio.ctx && audio.ctx.state !== 'running') audio.ctx.resume();
    tick();
  }
});

// ---------- Export / import ----------
function exportData() {
  const data = JSON.stringify({ app: 'minuteur', version: 1, quick: state.quick, workouts: state.workouts, history: state.history, settings: state.settings }, null, 2);
  const file = new File([data], `minuteur-${dayKey(new Date())}.json`, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: 'Sauvegarde Minuteur' }).catch(() => {});
  } else {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
}

function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = async () => {
    try {
      const d = JSON.parse(await input.files[0].text());
      if (d.app !== 'minuteur') throw new Error();
      ['quick', 'workouts', 'history'].forEach((k) => { if (d[k]) { state[k] = d[k]; save(k); } });
      if (d.settings) { state.settings = Object.assign({}, DEFAULT_SETTINGS, d.settings); save('settings'); }
      render(); toast('Données importées');
    } catch (e) { toast('Fichier invalide'); }
  };
  input.click();
}

// ---------- Démarrage ----------
render();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
