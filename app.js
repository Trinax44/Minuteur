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
const LIB = MANQ.LIB;
const EX = MANQ.BY_ID;

const state = {
  tab: 'timer',
  quick: store.get('quick', { sets: 4, work: 120, rest: 60, skipLastRest: true }),
  workouts: store.get('workouts', []),
  history: store.get('history', []),
  settings: Object.assign({}, DEFAULT_SETTINGS, store.get('settings', {})),
  calMonth: null,
  calSelected: null,
};

// Anciennes séances : on retrouve l'exercice de la bibliothèque par son nom
state.workouts.forEach((w) => w.exercises.forEach((e) => {
  if (!e.exId) {
    const m = LIB.find((x) => x.name.toLowerCase() === String(e.name || '').toLowerCase());
    if (m) e.exId = m.id;
  }
}));

function save(key) { store.set(key, state[key]); }

// ---------- Utilitaires ----------
const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const clone = (o) => JSON.parse(JSON.stringify(o));

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
  if (h) return `${h} h ${pad(m)}`;
  if (m) return s ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
}

function dayKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

// Pas d'incrément « intelligent » pour les durées
function stepUp(v) { return v < 60 ? v + 5 : v < 300 ? v + 15 : v + 30; }
function stepDown(v, min = 0) { const n = v <= 60 ? v - 5 : v <= 300 ? v - 15 : v - 30; return Math.max(min, n); }

const ICON = {
  minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4.2" height="16" rx="1.4"/><rect x="13.8" y="4" width="4.2" height="16" rx="1.4"/></svg>',
  save: '<svg viewBox="0 0 24 24"><path d="M7 3h10a2 2 0 0 1 2 2v16l-7-4-7 4V5a2 2 0 0 1 2-2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  dots: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2zM6 9h12l-1 12H7L6 9z"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M6 15l6-6 6 6" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  swap: '<svg viewBox="0 0 24 24"><path d="M7 7h12l-3-3M17 17H5l3 3" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};

// ---------- Programmes prêts à l'emploi ----------
const ex = (exId, sets, work, rest) => ({ exId, name: EX[exId].name, sets, work, rest });
const PRESETS = [
  { id: 'p-abdos', name: 'Abdos', level: 'Débutant', bg: 'linear-gradient(160deg,#3d3a52,#23222c)', restBetween: 30, skipLastRest: true,
    exercises: [ex('crunch', 3, 30, 15), ex('planche', 3, 30, 15), ex('releves_jambes', 3, 30, 15), ex('mountain', 3, 30, 15)] },
  { id: 'p-jambes', name: 'Bas du corps', level: 'Débutant', bg: 'linear-gradient(160deg,#34475a,#1f262e)', restBetween: 45, skipLastRest: true,
    exercises: [ex('squat', 3, 40, 20), ex('fentes', 3, 40, 20), ex('pont_fessier', 3, 40, 20), ex('squat_saute', 3, 30, 20)] },
  { id: 'p-haut', name: 'Haut du corps', level: 'Moyen', bg: 'linear-gradient(160deg,#55443a,#2a2420)', restBetween: 45, skipLastRest: true,
    exercises: [ex('pompes', 3, 40, 20), ex('dips_banc', 3, 40, 20), ex('superman', 3, 30, 20), ex('planche', 3, 40, 20)] },
  { id: 'p-push', name: 'Push salle', level: 'Salle', bg: 'linear-gradient(160deg,#523a45,#2a2126)', restBetween: 90, skipLastRest: true,
    exercises: [ex('dc', 4, 45, 90), ex('dc_incline', 3, 45, 75), ex('militaire', 3, 45, 75), ex('triceps_poulie', 3, 40, 60)] },
  { id: 'p-pull', name: 'Pull salle', level: 'Salle', bg: 'linear-gradient(160deg,#3a5047,#202a26)', restBetween: 90, skipLastRest: true,
    exercises: [ex('tractions', 4, 40, 90), ex('tirage_vertical', 3, 45, 75), ex('rowing_barre', 3, 45, 75), ex('curl_halteres', 3, 40, 60)] },
  { id: 'p-legs', name: 'Jambes salle', level: 'Salle', bg: 'linear-gradient(160deg,#504a36,#29271f)', restBetween: 90, skipLastRest: true,
    exercises: [ex('squat_barre', 4, 45, 120), ex('presse', 3, 45, 90), ex('leg_curl', 3, 40, 60), ex('mollets', 3, 40, 45)] },
  { id: 'p-tabata', name: 'Tabata', level: 'Intense', bg: 'linear-gradient(160deg,#573a3c,#2b2021)', restBetween: 0, skipLastRest: true,
    exercises: [ex('burpees', 8, 20, 10)] },
  { id: 'p-hiit', name: 'HIIT cardio', level: 'Moyen', bg: 'linear-gradient(160deg,#36504f,#1f2a2a)', restBetween: 30, skipLastRest: true,
    exercises: [ex('jumping_jacks', 3, 45, 15), ex('burpees', 3, 45, 15), ex('genoux_hauts', 3, 45, 15), ex('corde', 3, 45, 15)] },
];

function quickAsWorkout() {
  const q = state.quick;
  return { name: 'Séance express', restBetween: 0, skipLastRest: q.skipLastRest,
    exercises: [{ name: '', sets: q.sets, work: q.work, rest: q.rest }] };
}

// Construit la liste des segments (préparation / effort / récup)
function buildSegments(w, withPrep = true) {
  const segs = [];
  const prep = state.settings.prep;
  const exs = w.exercises.filter((e) => e.sets > 0 && e.work > 0);
  if (withPrep && prep > 0) segs.push({ type: 'prep', duration: prep, exId: exs[0] && exs[0].exId, name: exs[0] && exs[0].name });
  exs.forEach((e, i) => {
    const lastEx = i === exs.length - 1;
    for (let s = 1; s <= e.sets; s++) {
      const lastSet = s === e.sets;
      segs.push({ type: 'work', name: e.name, exId: e.exId, set: s, sets: e.sets, exIndex: i, duration: e.work });
      if (!lastSet) {
        if (e.rest > 0) segs.push({ type: 'rest', name: e.name, exId: e.exId, set: s, sets: e.sets, exIndex: i, duration: e.rest });
      } else if (!lastEx) {
        const r = w.restBetween > 0 ? w.restBetween : e.rest;
        const nx = exs[i + 1];
        if (r > 0) segs.push({ type: 'rest', between: true, exIndex: i, name: nx.name, exId: nx.exId, duration: r });
      } else if (!w.skipLastRest && e.rest > 0) {
        segs.push({ type: 'rest', name: e.name, set: s, sets: e.sets, exIndex: i, duration: e.rest });
      }
    }
  });
  return segs;
}

const totalOf = (segs) => segs.reduce((a, s) => a + s.duration, 0);

function describe(w) {
  const n = w.exercises.length;
  return `${n} exercice${n > 1 ? 's' : ''} · ${fmt(totalOf(buildSegments(w, false)))}`;
}

const manq = (exId, cls = '') => (exId && EX[exId] ? `<div class="${cls}" data-manq="${esc(exId)}"></div>` : '');

// ---------- Rendu des onglets ----------
function render() {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === state.tab));
  const view = $('#view');
  if (state.tab === 'timer') view.innerHTML = renderTimer();
  if (state.tab === 'workouts') view.innerHTML = renderWorkouts();
  if (state.tab === 'history') view.innerHTML = renderHistory();
  if (state.tab === 'settings') view.innerHTML = renderSettings();
  MANQ.hydrate(view);
}

function tileHTML(label, dotCls, value, key) {
  return `
  <div class="tile">
    <div class="tile-label"><span class="dot ${dotCls}"></span>${label}</div>
    <button class="tile-value" data-pick="${key}">${value}</button>
    <div class="tile-btns">
      <button class="round" data-step="${key}" data-dir="-1" aria-label="Moins">${ICON.minus}</button>
      <button class="round" data-step="${key}" data-dir="1" aria-label="Plus">${ICON.plus}</button>
    </div>
  </div>`;
}

function timelineHTML(w) {
  const segs = buildSegments(w, false);
  const total = totalOf(segs) || 1;
  return `<div class="timeline">${segs.map((s) => `<span class="${s.type === 'work' ? 'w' : 'r'}" style="flex:${(s.duration / total).toFixed(4)}"></span>`).join('')}</div>`;
}

function renderTimer() {
  const q = state.quick;
  const w = quickAsWorkout();
  const total = totalOf(buildSegments(w, false));
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `
  <div class="head">
    <div><div class="kicker">${esc(today)}</div><h1 class="title">Séance express</h1></div>
    <button class="icon-btn" id="save-quick" aria-label="Enregistrer comme séance">${ICON.save}</button>
  </div>
  <div class="hero">
    <div class="hero-label">Durée totale</div>
    <div class="hero-total">${fmt(total)}</div>
    <div class="hero-sub">${q.sets} série${q.sets > 1 ? 's' : ''} · ${fmt(q.work)} d’effort · ${fmt(q.rest)} de récup</div>
    ${timelineHTML(w)}
  </div>
  <div class="tiles">
    ${tileHTML('Séries', '', q.sets, 'q.sets')}
    ${tileHTML('Effort', 'work', fmt(q.work), 'q.work')}
    ${tileHTML('Récup', 'rest', fmt(q.rest), 'q.rest')}
  </div>
  <div class="list">
    <label class="item">Sauter la dernière récup
      <span class="switch"><input type="checkbox" id="q-skip" ${q.skipLastRest ? 'checked' : ''}><span></span></span>
    </label>
  </div>
  <button class="promo" id="open-builder">
    ${manq('kb_swing', 'thumb')}
    <div><b>Composer une séance</b><span>Choisis tes exercices parmi ${LIB.length} animations</span></div>
    <span class="chev">${ICON.right}</span>
  </button>
  <button class="start" id="launch-quick">${ICON.play.replace('<svg', '<svg style="width:22px;height:22px"')}Démarrer<span class="total">${ICON.clock}${fmt(total)}</span></button>`;
}

function renderWorkouts() {
  const mine = state.workouts;
  const firstEx = (w) => (w.exercises.find((e) => e.exId) || {}).exId;
  return `
  <div class="head"><div><div class="kicker">Entraînements</div><h1 class="title">Séances</h1></div></div>
  <div class="section"><h2>Programmes</h2></div>
  <div class="rail">
    ${PRESETS.map((p) => `
      <button class="prog" data-preset="${p.id}" style="background:${p.bg}">
        ${manq(firstEx(p), 'thumb')}
        <span class="name">${esc(p.name)}</span>
        <span class="meta">${esc(describe(p))}</span>
        <span class="badge">${esc(p.level)}</span>
      </button>`).join('')}
  </div>
  <div class="section"><h2>Exercices</h2></div>
  <button class="lib-banner" id="open-library">
    <div class="thumbs">${['dc', 'squat_barre', 'tractions'].map((id) => manq(id)).join('')}</div>
    <div class="txt"><b>Bibliothèque d’exercices</b><span>${LIB.length} mouvements animés · salle et maison</span></div>
  </button>
  <div class="section"><h2>Mes séances</h2></div>
  ${mine.length ? `<div class="list">${mine.map((w) => `
    <div class="w-row">
      <button class="w-main" data-edit="${esc(w.id)}">
        <div class="w-thumb">${manq(firstEx(w))}</div>
        <div style="min-width:0"><div class="w-name">${esc(w.name)}</div><div class="w-meta">${esc(describe(w))}</div></div>
      </button>
      <button class="more" data-wmenu="${esc(w.id)}" aria-label="Options">${ICON.dots}</button>
      <button class="play" data-start="${esc(w.id)}" aria-label="Lancer">${ICON.play}</button>
    </div>`).join('')}</div>` : '<p class="empty">Aucune séance enregistrée pour l’instant.</p>'}
  <button class="ghost-btn" id="create-workout">${ICON.plus}Créer une séance</button>`;
}

function renderHistory() {
  const now = new Date();
  if (!state.calMonth) state.calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (!state.calSelected) state.calSelected = dayKey(now);
  const m = state.calMonth;
  const byDay = {};
  state.history.forEach((h) => { const k = dayKey(new Date(h.date)); (byDay[k] = byDay[k] || []).push(h); });

  // Série de jours consécutifs (aujourd'hui ou hier inclus)
  let streak = 0;
  const d0 = new Date(now);
  if (!byDay[dayKey(d0)]) d0.setDate(d0.getDate() - 1);
  while (byDay[dayKey(d0)]) { streak++; d0.setDate(d0.getDate() - 1); }

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
    if (byDay[k]) cls.push('has');
    if (k === state.calSelected) cls.push('selected');
    cells.push(`<button class="${cls.join(' ')}" data-day="${k}">${d.getDate()}</button>`);
  }

  const monthName = m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const inMonth = state.history.filter((h) => { const d = new Date(h.date); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); });
  const monthTime = inMonth.reduce((a, h) => a + h.duration, 0);

  const sel = (byDay[state.calSelected] || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const selDate = new Date(state.calSelected + 'T12:00:00');

  return `
  <div class="head"><div><div class="kicker">Progression</div><h1 class="title">Suivi</h1></div></div>
  <div class="kpis">
    <div class="kpi hl"><b>${streak}</b><span>jour${streak > 1 ? 's' : ''} d’affilée</span></div>
    <div class="kpi"><b>${inMonth.length}</b><span>séances ce mois</span></div>
    <div class="kpi"><b>${Math.round(monthTime / 60)}</b><span>minutes ce mois</span></div>
  </div>
  <div class="cal">
    <div class="cal-head">
      <b>${esc(monthName)}</b>
      <div class="cal-nav">
        <button id="cal-prev" aria-label="Mois précédent">${ICON.left}</button>
        <button id="cal-next" aria-label="Mois suivant">${ICON.right}</button>
      </div>
    </div>
    <div class="cal-grid">
      ${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
      ${cells.join('')}
    </div>
  </div>
  <div class="section"><h2 style="text-transform:capitalize">${esc(selDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }))}</h2></div>
  ${sel.length ? sel.map((h) => {
    const d = new Date(h.date);
    return `
    <div class="h-card">
      <div class="h-top">
        <div><div class="h-name">${esc(h.name || 'Séance')}</div><div class="h-time">à ${pad(d.getHours())}:${pad(d.getMinutes())}</div></div>
        <button class="more" data-hmenu="${esc(h.id)}" aria-label="Options">${ICON.dots}</button>
      </div>
      <div class="chips">
        <span class="chip lime">${fmtLong(h.duration)}</span>
        <span class="chip">${h.exercises} exercice${h.exercises > 1 ? 's' : ''}</span>
        ${h.complete === false ? '<span class="chip">Interrompue</span>' : ''}
      </div>
      <label class="note">${ICON.pen}<input data-note="${esc(h.id)}" value="${esc(h.note || '')}" placeholder="Ajouter une note…" enterkeyhint="done"></label>
    </div>`;
  }).join('') : '<p class="empty">Pas de séance ce jour-là.</p>'}`;
}

function renderSettings() {
  const s = state.settings;
  const sw = (key, label, sub = '') => `
    <label class="item"><span>${label}${sub ? `<span class="sub">${sub}</span>` : ''}</span>
      <span class="switch"><input type="checkbox" data-setting="${key}" ${s[key] ? 'checked' : ''}><span></span></span>
    </label>`;
  return `
  <div class="head"><div><div class="kicker">Préférences</div><h1 class="title">Réglages</h1></div></div>
  <div class="list">
    ${sw('sound', 'Sons', 'Bips 3-2-1 et changement de phase')}
    ${sw('voice', 'Annonces vocales', 'Nom des exercices, « Effort », « Récup »…')}
    ${sw('vibrate', 'Vibrations', 'Si l’appareil le permet')}
    ${sw('wakeLock', 'Garder l’écran allumé', 'Pendant une séance')}
  </div>
  <div class="tiles" style="grid-template-columns:1fr">${tileHTML('Préparation avant la séance', 'prep', fmt(s.prep), 's.prep')}</div>
  <div class="list"><button class="item" id="test-sound">Tester le son et la voix <span class="chev">${ICON.right}</span></button></div>
  <p class="hint">Sur iPhone, garde l’écran allumé pendant la séance. Si l’écran se verrouille, le minuteur se recale au retour, mais les sons ne peuvent pas être joués en arrière-plan.</p>
  <div class="list">
    <button class="item" id="export-data">Exporter mes données <span class="chev">${ICON.right}</span></button>
    <button class="item" id="import-data">Importer des données <span class="chev">${ICON.right}</span></button>
    <button class="item danger" id="reset-data">Tout effacer</button>
  </div>
  <p class="hint">Minuteur · gratuit, sans pub, fonctionne hors ligne.</p>`;
}

// ---------- Interactions des onglets ----------
function adjust(key, dir) {
  const [scope, field] = key.split('.');
  const obj = scope === 'q' ? state.quick : state.settings;
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
  let delay = 420;
  const loop = () => { fn(); delay = Math.max(70, delay * 0.8); holdTimer = setTimeout(loop, delay); };
  holdTimer = setTimeout(loop, delay);
}
function stopHold() { clearTimeout(holdTimer); holdTimer = null; }
['pointerup', 'pointercancel'].forEach((t) => document.addEventListener(t, stopHold));

$('#view').addEventListener('pointerdown', (e) => {
  const b = e.target.closest('[data-step]');
  if (!b) return;
  e.preventDefault();
  const key = b.dataset.step, dir = +b.dataset.dir;
  startHold(() => adjust(key, dir));
});

$('#tabbar').addEventListener('click', (e) => {
  const b = e.target.closest('.tab');
  if (!b) return;
  state.tab = b.dataset.tab;
  window.scrollTo(0, 0);
  render();
});

function newWorkout(exercises) {
  return { id: uid(), name: '', restBetween: 60, skipLastRest: true, exercises };
}

$('#view').addEventListener('click', (e) => {
  const t = e.target;
  const pick = t.closest('[data-pick]');
  if (pick) {
    const [scope, field] = pick.dataset.pick.split('.');
    const obj = scope === 'q' ? state.quick : state.settings;
    const done = (v) => { obj[field] = v; save(scope === 'q' ? 'quick' : 'settings'); render(); };
    if (field === 'sets') pickNumber('Séries', obj.sets, 1, 99, done);
    else pickDuration({ work: 'Effort', rest: 'Récup', prep: 'Préparation' }[field], obj[field], done, field === 'work' ? 5 : 0);
    return;
  }
  if (t.closest('#launch-quick')) return startWorkout(quickAsWorkout());
  if (t.closest('#save-quick')) {
    const q = state.quick;
    const w = newWorkout([{ name: 'Exercice', sets: q.sets, work: q.work, rest: q.rest }]);
    w.name = `${q.sets} × ${fmt(q.work)} / ${fmt(q.rest)}`; w.skipLastRest = q.skipLastRest;
    return openEditor(w, true);
  }
  if (t.closest('#open-builder') || t.closest('#create-workout')) {
    return openLibrary({ onPick: (exo) => openEditor(newWorkout([exo]), true) });
  }
  if (t.closest('#open-library')) return openLibrary({});
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
  if (hm) {
    return confirmSheet('Supprimer cette séance ?', 'Elle sera retirée du suivi.', 'Supprimer', () => {
      state.history = state.history.filter((h) => h.id !== hm.dataset.hmenu); save('history'); render();
    });
  }
  if (t.closest('#test-sound')) { audio.unlock(); audio.beep(880, 0.15); setTimeout(() => audio.beep(1320, 0.4), 250); speak('Effort. Pompes.', true); return; }
  if (t.closest('#export-data')) return exportData();
  if (t.closest('#import-data')) return importData();
  if (t.closest('#reset-data')) {
    return confirmSheet('Effacer toutes les données ?', 'Séances et suivi seront supprimés.', 'Tout effacer', () => {
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
  const back = document.createElement('div');
  back.className = 'sheet-backdrop';
  back.innerHTML = `<div class="sheet ${full ? 'full' : ''}">${full ? '' : '<div class="grip"></div>'}${html}</div>`;
  const close = () => back.remove();
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  $('#sheet-root').appendChild(back);
  MANQ.hydrate(back);
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
    <h2 class="sheet-title">${esc(title)}</h2>
    <p class="sheet-sub">${esc(text)}</p>
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
    <div class="sheet-head"><button class="txt-btn" data-cancel>Annuler</button><h2>${esc(title)}</h2><button class="txt-btn r" data-ok>OK</button></div>
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
    <div class="sheet-head"><button class="txt-btn" data-cancel>Annuler</button><h2>${esc(title)}</h2><button class="txt-btn r" data-ok>OK</button></div>
    <div class="picker"><select data-n>${opts}</select></div>`, {
    onMount(el, close) {
      el.querySelector('[data-cancel]').onclick = close;
      el.querySelector('[data-ok]').onclick = () => { close(); onDone(+el.querySelector('[data-n]').value); };
    },
  });
}

function openPresetMenu(p) {
  openSheet(`
    <h2 class="sheet-title">${esc(p.name)}</h2>
    <p class="sheet-sub">${esc(p.level)} · ${esc(describe(p))}</p>
    <div class="list">${p.exercises.map((e) => `
      <button class="item" data-detail="${esc(e.exId)}">
        <span style="display:flex;align-items:center;gap:12px">${manq(e.exId, 'w-thumb')}<span>${esc(e.name)}<span class="sub">${e.sets} × ${fmt(e.work)} · récup ${fmt(e.rest)}</span></span></span>
        <span class="chev">${ICON.right}</span>
      </button>`).join('')}</div>
    <button class="btn" data-go>${ICON.play}Lancer</button>
    <button class="btn secondary" data-copy>Personnaliser et enregistrer</button>`, {
    onMount(el, close) {
      el.querySelector('[data-go]').onclick = () => { close(); startWorkout(p); };
      el.querySelector('[data-copy]').onclick = () => {
        close();
        const c = clone(p); delete c.bg; delete c.level; c.id = uid();
        openEditor(c, true);
      };
      el.addEventListener('click', (e) => { const d = e.target.closest('[data-detail]'); if (d) openDetail(EX[d.dataset.detail], {}); });
    },
  });
}

function openWorkoutMenu(w) {
  openSheet(`
    <h2 class="sheet-title">${esc(w.name)}</h2>
    <p class="sheet-sub">${esc(describe(w))}</p>
    <button class="btn" data-go>${ICON.play}Lancer</button>
    <button class="btn secondary" data-edit>Modifier</button>
    <button class="btn secondary" data-dup>Dupliquer</button>
    <button class="btn danger" data-del>Supprimer</button>`, {
    onMount(el, close) {
      el.querySelector('[data-go]').onclick = () => { close(); startWorkout(w); };
      el.querySelector('[data-edit]').onclick = () => { close(); openEditor(w, false); };
      el.querySelector('[data-dup]').onclick = () => {
        close();
        const c = clone(w); c.id = uid(); c.name += ' (copie)';
        state.workouts.push(c); save('workouts'); render();
      };
      el.querySelector('[data-del]').onclick = () => {
        close();
        confirmSheet('Supprimer cette séance ?', w.name, 'Supprimer', () => {
          state.workouts = state.workouts.filter((x) => x.id !== w.id); save('workouts'); render();
        });
      };
    },
  });
}

// ---------- Bibliothèque d'exercices ----------
// onPick(exercice) : mode « choisir » (depuis l'éditeur) ; sinon simple consultation
function openLibrary({ onPick } = {}) {
  let group = 'all', equip = 'all', query = '';
  let gridEl;

  const list = () => LIB.filter((x) =>
    (group === 'all' || x.group === group) &&
    (equip === 'all' || x.equip === equip) &&
    (!query || (x.name + ' ' + x.muscles).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .includes(query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))));

  const equipName = Object.fromEntries(MANQ.EQUIP);
  const drawGrid = () => {
    const items = list();
    gridEl.innerHTML = `
      <div class="lib-count">${items.length} exercice${items.length > 1 ? 's' : ''}</div>
      <div class="lib-grid">
        ${onPick ? `<button class="lib-card custom" data-custom>${ICON.plus}<b>Exercice libre</b><span>Sans animation, nom au choix</span></button>` : ''}
        ${items.map((x) => `
          <button class="lib-card" data-ex="${x.id}">
            <div class="anim" data-manq="${x.id}"></div>
            <div class="info"><b>${esc(x.name)}</b><span>${esc(equipName[x.equip])}</span></div>
          </button>`).join('')}
      </div>`;
    MANQ.hydrate(gridEl);
  };

  const chips = (arr, cur, attr, alt) => `<button class="filter ${alt} ${cur === 'all' ? 'on' : ''}" ${attr}="all">Tout</button>` +
    arr.map(([k, v]) => `<button class="filter ${alt} ${cur === k ? 'on' : ''}" ${attr}="${k}">${esc(v)}</button>`).join('');

  openSheet(`
    <div class="sticky">
      <div class="sheet-head"><button class="txt-btn" data-close>Fermer</button><h2>${onPick ? 'Choisir un exercice' : 'Bibliothèque'}</h2><span style="min-width:76px"></span></div>
      <div class="search">${ICON.search}<input type="search" placeholder="Rechercher (ex. squat, dos…)" data-q></div>
      <div class="filters" data-groups>${chips(MANQ.GROUPS, group, 'data-g', '')}</div>
      <div class="filters" data-equips>${chips(MANQ.EQUIP, equip, 'data-e', 'alt')}</div>
    </div>
    <div data-grid></div>`, {
    full: true,
    onMount(el, close) {
      gridEl = el.querySelector('[data-grid]');
      drawGrid();
      el.querySelector('[data-q]').addEventListener('input', (e) => { query = e.target.value.trim(); drawGrid(); });
      el.addEventListener('click', (e) => {
        const t = e.target;
        if (t.closest('[data-close]')) return close();
        const g = t.closest('[data-g]');
        if (g) { group = g.dataset.g; el.querySelector('[data-groups]').innerHTML = chips(MANQ.GROUPS, group, 'data-g', ''); return drawGrid(); }
        const q = t.closest('[data-e]');
        if (q) { equip = q.dataset.e; el.querySelector('[data-equips]').innerHTML = chips(MANQ.EQUIP, equip, 'data-e', 'alt'); return drawGrid(); }
        if (t.closest('[data-custom]')) {
          close();
          return onPick({ name: 'Exercice libre', sets: 3, work: 40, rest: 20 });
        }
        const c = t.closest('[data-ex]');
        if (c) {
          const x = EX[c.dataset.ex];
          openDetail(x, onPick ? { onAdd: (exo) => { close(); onPick(exo); } } : {
            onCreate: (exo) => { close(); openEditor(newWorkout([exo]), true); },
          });
        }
      });
    },
  });
}

function defaultsFor(x) {
  const gym = x.equip !== 'pdc';
  return { exId: x.id, name: x.name, sets: gym ? 4 : 3, work: gym ? 45 : 40, rest: gym ? 75 : 20 };
}

function openDetail(x, { onAdd, onCreate } = {}) {
  if (!x) return;
  const groupName = Object.fromEntries(MANQ.GROUPS)[x.group];
  const equipName = Object.fromEntries(MANQ.EQUIP)[x.equip];
  openSheet(`
    <div class="detail">
      <div class="detail-anim" data-manq="${x.id}"></div>
      <h3>${esc(x.name)}</h3>
      <div class="chips"><span class="chip lime">${esc(groupName)}</span><span class="chip">${esc(equipName)}</span></div>
      <div class="muscles">Muscles : ${esc(x.muscles)}</div>
      <ol class="cues">${x.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
      ${onAdd ? `<button class="btn" data-add>${ICON.plus}Ajouter à ma séance</button>` : ''}
      ${onCreate ? `<button class="btn" data-create>${ICON.plus}Créer une séance avec</button>` : ''}
      <button class="btn secondary" data-close>Fermer</button>
    </div>`, {
    onMount(el, close) {
      el.querySelector('[data-close]').onclick = close;
      const a = el.querySelector('[data-add]');
      if (a) a.onclick = () => { close(); onAdd(defaultsFor(x)); };
      const c = el.querySelector('[data-create]');
      if (c) c.onclick = () => { close(); onCreate(defaultsFor(x)); };
    },
  });
}

// ---------- Éditeur de séance ----------
function openEditor(original, isNew) {
  const w = clone(original);
  let sheetEl;

  const exTiles = (e, i) => `
    <div class="tiles compact">
      ${tileHTML('Séries', '', e.sets, `${i}.sets`)}
      ${tileHTML('Effort', 'work', fmt(e.work), `${i}.work`)}
      ${tileHTML('Récup', 'rest', fmt(e.rest), `${i}.rest`)}
    </div>`;

  const draw = () => {
    const total = totalOf(buildSegments(w, false));
    const y = sheetEl.scrollTop;
    sheetEl.innerHTML = `
      <div class="sheet-head">
        <button class="txt-btn" data-cancel>Annuler</button>
        <h2>${isNew ? 'Nouvelle séance' : 'Modifier la séance'}</h2>
        <button class="txt-btn r" data-save>OK</button>
      </div>
      <input class="field" data-name placeholder="Nom de la séance" value="${esc(w.name)}" enterkeyhint="done">
      ${w.exercises.map((e, i) => `
        <div class="ex-card">
          <div class="ex-top">
            ${e.exId && EX[e.exId] ? `<button class="ex-thumb" data-info="${i}" data-manq="${esc(e.exId)}" aria-label="Voir l’exercice"></button>` : `<div class="ex-thumb noanim">${i + 1}</div>`}
            <div class="ex-info">
              <input data-exname="${i}" value="${esc(e.name)}" placeholder="Nom de l’exercice" enterkeyhint="done">
              <div class="ex-sub">Exercice ${i + 1} · ${fmt(e.sets * e.work + (e.sets - 1) * e.rest)}</div>
            </div>
            <div class="ex-actions">
              <button class="mini" data-swap="${i}" aria-label="Changer d’exercice">${ICON.swap}</button>
              ${w.exercises.length > 1 ? `<button class="mini" data-del="${i}" aria-label="Supprimer">${ICON.trash}</button>` : ''}
            </div>
            ${i > 0 ? `<button class="mini" data-up="${i}" aria-label="Monter" style="align-self:flex-start">${ICON.up}</button>` : ''}
          </div>
          ${exTiles(e, i)}
        </div>`).join('')}
      <button class="ghost-btn" data-add>${ICON.plus}Ajouter un exercice</button>
      <div class="list">
        ${w.exercises.length > 1 ? `<div class="item"><span>Récup entre exercices</span>
          <span style="display:flex;align-items:center;gap:8px">
            <button class="round" data-step="rb" data-dir="-1">${ICON.minus}</button>
            <button class="tile-value" style="width:auto;margin:0;font-size:20px" data-pick="rb">${fmt(w.restBetween)}</button>
            <button class="round" data-step="rb" data-dir="1">${ICON.plus}</button>
          </span></div>` : ''}
        <label class="item">Sauter la dernière récup
          <span class="switch"><input type="checkbox" data-skip ${w.skipLastRest ? 'checked' : ''}><span></span></span>
        </label>
      </div>
      <p class="hint">Durée totale : <b>${fmt(total)}</b>${state.settings.prep ? ` (+ ${fmt(state.settings.prep)} de préparation)` : ''}</p>
      <button class="btn" data-go>${ICON.play}Enregistrer et lancer</button>
      ${!isNew ? '<button class="btn danger" data-delete>Supprimer la séance</button>' : ''}`;
    MANQ.hydrate(sheetEl);
    sheetEl.scrollTop = y;
  };

  const persist = () => {
    if (!w.name.trim()) w.name = w.exercises.length === 1 && w.exercises[0].name ? w.exercises[0].name : 'Ma séance';
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
    draw();
  };

  openSheet('', {
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
        if (t.closest('[data-cancel]')) return close();
        if (t.closest('[data-save]')) { persist(); close(); toast('Séance enregistrée'); state.tab = 'workouts'; return render(); }
        if (t.closest('[data-go]')) { persist(); close(); render(); return startWorkout(w); }
        if (t.closest('[data-delete]')) {
          return confirmSheet('Supprimer cette séance ?', w.name, 'Supprimer', () => {
            state.workouts = state.workouts.filter((x) => x.id !== w.id); save('workouts'); close(); render();
          });
        }
        if (t.closest('[data-add]')) {
          return openLibrary({ onPick: (exo) => { w.exercises.push(exo); draw(); el.scrollTop = el.scrollHeight; } });
        }
        const sw = t.closest('[data-swap]');
        if (sw) {
          const i = +sw.dataset.swap;
          return openLibrary({ onPick: (exo) => { const o = w.exercises[i]; w.exercises[i] = Object.assign({}, exo, { sets: o.sets, work: o.work, rest: o.rest }); draw(); } });
        }
        const info = t.closest('[data-info]');
        if (info) return openDetail(EX[w.exercises[+info.dataset.info].exId], {});
        const del = t.closest('[data-del]');
        if (del) { w.exercises.splice(+del.dataset.del, 1); return draw(); }
        const up = t.closest('[data-up]');
        if (up) { const i = +up.dataset.up; [w.exercises[i - 1], w.exercises[i]] = [w.exercises[i], w.exercises[i - 1]]; return draw(); }
        const pick = t.closest('[data-pick]');
        if (pick) {
          const key = pick.dataset.pick;
          if (key === 'rb') return pickDuration('Récup entre exercices', w.restBetween, (v) => { w.restBetween = v; draw(); });
          const [i, f] = key.split('.');
          const e2 = w.exercises[+i];
          if (f === 'sets') return pickNumber('Séries', e2.sets, 1, 99, (v) => { e2.sets = v; draw(); });
          return pickDuration(f === 'work' ? 'Effort' : 'Récup', e2[f], (v) => { e2[f] = v; draw(); }, f === 'work' ? 5 : 0);
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
const RING_LEN = 2 * Math.PI * 54;
const run = {
  active: false, workout: null, segs: [], i: 0,
  endAt: 0,        // instant de fin du segment courant (ms) quand il tourne
  remainingMs: 0,  // temps restant du segment quand en pause
  paused: false, done: false,
  activeMs: 0,     // temps réellement passé (hors pauses)
  lastTick: 0, lastSecond: null, startedAt: null, voice: true, timer: null,
  animId: null,
};

function startWorkout(w) {
  if (!w) return;
  audio.unlock();
  const segs = buildSegments(w, true);
  if (!segs.length) return toast('Séance vide');
  Object.assign(run, {
    active: true, workout: w, segs, i: 0, paused: false, done: false,
    activeMs: 0, lastTick: performance.now(), startedAt: new Date(), voice: state.settings.voice, animId: null,
  });
  $('#run-inner').innerHTML = '<div class="phase-pill" id="run-phase"></div><div class="run-time" id="run-time"></div><div class="run-set" id="run-set"></div>';
  $('#run-ring').style.strokeDasharray = RING_LEN;
  $('#run-prev').style.visibility = '';
  $('#run-skip').style.visibility = '';
  $('.ring-wrap').style.display = '';
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

const PHASE = { prep: 'Prépare-toi', work: 'Effort', rest: 'Récup' };

function nextInfo() {
  const n = run.segs[run.i + 1];
  if (!n) return 'Dernier effort, tiens bon !';
  if (n.type === 'work') return `Ensuite : <b>${esc(n.name || 'Effort')}</b> · ${fmt(n.duration)}`;
  return `Ensuite : <b>Récup</b> · ${fmt(n.duration)}`;
}

function announceSegment(seg) {
  vibrate(seg.type === 'work' ? [200, 80, 200] : 300);
  audio.beep(seg.type === 'work' ? 1320 : 660, 0.45, 0.7);
  if (seg.type === 'prep') speak(seg.name ? `Préparez-vous. ${seg.name}` : 'Préparez-vous');
  else if (seg.type === 'work') speak(seg.set === 1 && seg.name ? seg.name : 'Effort');
  else if (seg.between) speak(seg.name ? `Récup. Prochain exercice : ${seg.name}` : 'Récup');
  else speak('Récup');
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
  if (run.done) return;
  const el = $('#run');
  const seg = run.segs[run.i];
  const rem = currentRemainingMs();
  const after = run.segs.slice(run.i + 1).reduce((a, s) => a + s.duration, 0);
  const hasAnim = !!(seg.exId && EX[seg.exId]);
  el.className = seg.type + (run.paused ? ' paused' : '') + (hasAnim ? ' has-anim' : '');

  // Mannequin de l'exercice en cours (ou du suivant pendant la récup)
  const animId = hasAnim ? seg.exId : null;
  if (animId !== run.animId) {
    run.animId = animId;
    const host = $('#run-anim');
    host.innerHTML = '';
    if (animId) MANQ.mount(host, animId);
  }
  const label = seg.between || seg.type === 'prep' ? (seg.name ? `À suivre : ${seg.name}` : '') : seg.name || '';
  if ($('#run-name').textContent !== label) $('#run-name').textContent = label;

  $('#run-phase').textContent = PHASE[seg.type];
  $('#run-time').textContent = fmt(Math.ceil(rem / 1000));
  $('#run-set').textContent = seg.type === 'work' || (seg.type === 'rest' && !seg.between && seg.set) ? `Série ${seg.set}/${seg.sets}` : '';
  $('#run-total').textContent = fmt(Math.ceil(rem / 1000) + after);
  const nx = nextInfo();
  if ($('#run-next').innerHTML !== nx) $('#run-next').innerHTML = nx;
  const frac = Math.min(1, Math.max(0, rem / (seg.duration * 1000)));
  $('#run-ring').style.strokeDashoffset = (RING_LEN * (1 - frac)).toFixed(1);
  $('#run-toggle').innerHTML = run.paused ? ICON.play : ICON.pause;
  $('#run-toggle').className = 'run-main';
  $('#run-voice').classList.toggle('off', !run.voice);
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
    id: uid(), date: run.startedAt.toISOString(), duration: secs,
    exercises: run.workout.exercises.length, name: run.workout.name, complete,
  });
  save('history');
}

function finishWorkout(complete) {
  run.done = true;
  clearInterval(run.timer);
  recordHistory(complete);
  audio.beep(1320, 0.2); setTimeout(() => audio.beep(1320, 0.2), 250); setTimeout(() => audio.beep(1760, 0.6), 500);
  vibrate([300, 100, 300, 100, 500]);
  speak('Séance terminée. Bravo !');
  const el = $('#run');
  el.className = 'done';
  $('#run-anim').innerHTML = ''; run.animId = null;
  $('#run-name').textContent = '';
  $('.ring-wrap').style.display = 'none';
  $('#run-inner').innerHTML = '';
  $('#run-next').innerHTML = `<div class="done-box"><div class="medal">🏆</div><h2>Bravo !</h2><p>${fmtLong(run.activeMs / 1000)} d’entraînement</p></div>`;
  $('#run-total').textContent = '00:00';
  $('#run-toggle').innerHTML = 'Terminer';
  $('#run-toggle').className = 'run-main wide';
  $('#run-prev').style.visibility = 'hidden';
  $('#run-skip').style.visibility = 'hidden';
}

function closeRun() {
  run.active = false;
  clearInterval(run.timer);
  releaseWakeLock();
  $('#run').hidden = true;
  $('#run-anim').innerHTML = ''; run.animId = null;
  $('.ring-wrap').style.display = '';
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
  if (!run.done) drawRun(); else $('#run-voice').classList.toggle('off', !run.voice);
});
$('#run-close').addEventListener('click', () => {
  if (run.done) return closeRun();
  if (!run.paused) togglePause();
  const secs = Math.round(run.activeMs / 1000);
  openSheet(`
    <h2 class="sheet-title">Arrêter la séance ?</h2>
    <p class="sheet-sub">${fmtLong(secs)} effectués</p>
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
  const data = JSON.stringify({ app: 'minuteur', version: 2, quick: state.quick, workouts: state.workouts, history: state.history, settings: state.settings }, null, 2);
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
