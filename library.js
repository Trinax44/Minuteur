'use strict';

/* =========================================================
   Bibliothèque d'exercices (free-exercise-db, domaine public)
   Chaque exercice a deux photos (début / fin du mouvement)
   qui s'enchaînent en boucle pour montrer le geste.
   ========================================================= */

const EXLIB = (() => {
  const MUSCLE = {
    abdominals: 'Abdominaux', abductors: 'Abducteurs', adductors: 'Adducteurs', biceps: 'Biceps', calves: 'Mollets',
    chest: 'Pectoraux', forearms: 'Avant-bras', glutes: 'Fessiers', hamstrings: 'Ischio-jambiers', lats: 'Grand dorsal',
    'lower back': 'Lombaires', 'middle back': 'Milieu du dos', neck: 'Cou', quadriceps: 'Quadriceps', shoulders: 'Épaules',
    traps: 'Trapèzes', triceps: 'Triceps',
  };
  const MUSCLE_GROUP = {
    chest: 'pecs', lats: 'dos', 'middle back': 'dos', 'lower back': 'dos', traps: 'dos', shoulders: 'epaules', neck: 'epaules',
    biceps: 'bras', triceps: 'bras', forearms: 'bras', quadriceps: 'jambes', hamstrings: 'jambes', calves: 'jambes',
    adductors: 'jambes', abductors: 'jambes', glutes: 'fessiers', abdominals: 'abdos',
  };
  const EQUIP_KEY = {
    'body only': 'pdc', dumbbell: 'halteres', barbell: 'barre', 'e-z curl bar': 'barre', machine: 'machine', cable: 'poulie',
    kettlebells: 'kb', bands: 'elastiques',
  };
  const GROUPS = [
    ['pecs', 'Pectoraux'], ['dos', 'Dos'], ['epaules', 'Épaules'], ['bras', 'Bras'], ['jambes', 'Jambes'],
    ['fessiers', 'Fessiers'], ['abdos', 'Abdos'], ['cardio', 'Cardio'], ['etirements', 'Étirements'],
  ];
  const EQUIP = [
    ['pdc', 'Poids du corps'], ['halteres', 'Haltères'], ['barre', 'Barre'], ['machine', 'Machine'], ['poulie', 'Poulie'],
    ['kb', 'Kettlebell'], ['elastiques', 'Élastiques'], ['autre', 'Autre'],
  ];
  const CATEGORY = {
    strength: 'Musculation', stretching: 'Étirement', plyometrics: 'Pliométrie', powerlifting: 'Force athlétique',
    'olympic weightlifting': 'Haltérophilie', strongman: 'Strongman', cardio: 'Cardio',
  };
  const LEVEL = { beginner: 'Débutant', intermediate: 'Intermédiaire', expert: 'Expert' };

  const LIB = (window.EXDB || []).map((x) => {
    const tags = new Set(x.m.map((m) => MUSCLE_GROUP[m]).filter(Boolean));
    if (x.c === 'cardio' || x.c === 'plyometrics') tags.add('cardio');
    if (x.c === 'stretching') tags.add('etirements');
    return {
      id: x.id,
      name: x.n,
      nameEn: x.ne,
      equip: EQUIP_KEY[x.e] || 'autre',
      tags,
      category: CATEGORY[x.c] || x.c,
      stretch: x.c === 'stretching',
      level: LEVEL[x.l] || x.l,
      muscles: x.m.map((m) => MUSCLE[m] || m).join(', '),
      secondary: x.s.map((m) => MUSCLE[m] || m).join(', '),
      cues: x.i,
      imgs: x.k,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  const BY_ID = Object.fromEntries(LIB.map((e) => [e.id, e]));

  // Photos qui alternent (début / fin du mouvement)
  function photo(id) {
    const x = BY_ID[id];
    if (!x || !x.imgs) return `<div class="ph ph-empty">${x ? x.name.slice(0, 1) : '?'}</div>`;
    const src = (k) => `img/ex/${encodeURIComponent(id)}-${k}.jpg`;
    return `<div class="ph"><img src="${src(0)}" alt="" loading="lazy" decoding="async">${x.imgs > 1 ? `<img class="b" src="${src(1)}" alt="" loading="lazy" decoding="async">` : ''}</div>`;
  }

  function mount(host, id) { host.innerHTML = photo(id); }

  // Remplit les éléments [data-manq="id"]
  function hydrate(root = document) {
    root.querySelectorAll('[data-manq]').forEach((el) => {
      if (el._h) return;
      el._h = true;
      el.insertAdjacentHTML('afterbegin', photo(el.dataset.manq));
    });
  }

  return { LIB, BY_ID, GROUPS, EQUIP, photo, mount, hydrate };
})();
