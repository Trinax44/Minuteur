'use strict';

/* =========================================================
   Bibliothèque d'exercices + mannequin animé (SVG)
   Chaque exercice est décrit par des poses clés (angles des
   articulations) ; le mannequin est animé entre ces poses.
   Angles en degrés : 0 = vers le bas, 90 = vers l'avant (droite),
   180 = vers le haut, -90 = vers l'arrière (gauche).
   ========================================================= */

const MANQ = (() => {
  const GROUND = 186;
  const L = { torso: 44, ua: 26, fa: 24, th: 36, sh: 34, ft: 11 };
  const RAD = Math.PI / 180;
  const dir = (a) => [Math.sin(a * RAD), Math.cos(a * RAD)];
  const add = (p, a, len) => { const d = dir(a); return [p[0] + d[0] * len, p[1] + d[1] * len]; };

  const C = {
    skin: '#e2b38e', skinFar: '#b8896a', hair: '#3a2a22',
    shirt: '#6f8fb0', shirtFar: '#55708d', shorts: '#353b47', shortsFar: '#2a2f39', shoe: '#eef0f3', shoeFar: '#b9bec7',
    prop: '#3b4250', propLight: '#565e6e', metal: '#a7afbd', plate: '#23272f', rim: '#5a6271',
  };

  // ---------- Bibliothèque ----------
  const GROUPS = [
    ['pecs', 'Pectoraux'], ['dos', 'Dos'], ['epaules', 'Épaules'], ['bras', 'Bras'],
    ['jambes', 'Jambes'], ['fessiers', 'Fessiers'], ['abdos', 'Abdos'], ['cardio', 'Cardio'],
  ];
  const EQUIP = [
    ['pdc', 'Poids du corps'], ['halteres', 'Haltères'], ['barre', 'Barre'], ['machine', 'Machine / poulie'], ['kb', 'Kettlebell'],
  ];

  const bench = (x1, x2, y) => ({ t: 'bench', x1, x2, y });

  const LIB = [
    // ----- Pectoraux -----
    { id: 'dc', name: 'Développé couché', group: 'pecs', equip: 'barre', muscles: 'Pectoraux, triceps, épaules',
      cues: ['Omoplates serrées sur le banc', 'Descends la barre au bas des pectoraux', 'Pousse en expirant, sans décoller les fesses'],
      props: [bench(35, 132, 154), { t: 'plate', at: 'wr' }],
      kf: [{ hip: [118, 145], t: -90, a: [40, 180], l: [100, 0, 90] }, { hip: [118, 145], t: -90, a: [180, 180], l: [100, 0, 90] }] },
    { id: 'dc_halteres', name: 'Développé couché haltères', group: 'pecs', equip: 'halteres', muscles: 'Pectoraux, triceps, épaules',
      cues: ['Haltères à hauteur de poitrine', 'Pousse vers le haut en rapprochant les haltères', 'Contrôle la descente'],
      props: [bench(35, 132, 154), { t: 'dbs' }],
      kf: [{ hip: [118, 145], t: -90, a: [50, 180], l: [100, 0, 90] }, { hip: [118, 145], t: -90, a: [180, 180], l: [100, 0, 90] }] },
    { id: 'dc_incline', name: 'Développé incliné haltères', group: 'pecs', equip: 'halteres', muscles: 'Haut des pectoraux, épaules',
      cues: ['Banc incliné à 30-45°', 'Coudes légèrement sous les épaules', 'Pousse à la verticale'],
      props: [{ t: 'pad', pts: [[103, 160], [64, 121]], w: 9 }, { t: 'pad', pts: [[98, 161], [136, 161]], w: 8 }, { t: 'line', pts: [[118, 165], [118, GROUND]], w: 4 }, { t: 'dbs' }],
      kf: [{ hip: [110, 150], t: -135, a: [30, 180], l: [90, 0, 90] }, { hip: [110, 150], t: -135, a: [178, 178], l: [90, 0, 90] }] },
    { id: 'pompes', name: 'Pompes', group: 'pecs', equip: 'pdc', muscles: 'Pectoraux, triceps, gainage',
      cues: ['Mains sous les épaules', 'Corps gainé et aligné', 'Poitrine près du sol, puis pousse'],
      kf: [{ t: 110, a: [-15, -15], l: [-70, -70, 0], pin: ['wr', 150], ground: true }, { t: 99, a: [-80, 20], l: [-81, -81, 0], pin: ['wr', 150], ground: true }] },
    { id: 'dips', name: 'Dips', group: 'pecs', equip: 'pdc', muscles: 'Bas des pectoraux, triceps',
      cues: ['Buste légèrement penché en avant', 'Descends jusqu’à 90° aux coudes', 'Remonte bras tendus'],
      props: [{ t: 'dip', x1: 85, x2: 140, y: 104 }],
      kf: [{ t: 180, a: [0, 0], l: [10, -50, 60], pin: ['wr', 110, 100] }, { t: 165, a: [-90, 0], l: [20, -60, 60], pin: ['wr', 110, 100] }] },
    { id: 'pompes_inclinees', name: 'Pompes déclinées', group: 'pecs', equip: 'pdc', muscles: 'Haut des pectoraux, épaules',
      cues: ['Pieds sur un banc', 'Corps bien droit', 'Descends le visage vers le sol'],
      props: [bench(22, 78, 113)],
      kf: [{ t: 75, a: [-12, -12], l: [-105, -105, 0], pin: ['to', 50, 114] }, { t: 65, a: [-70, 25], l: [-115, -115, 0], pin: ['to', 50, 114] }] },

    // ----- Dos -----
    { id: 'tractions', name: 'Tractions', group: 'dos', equip: 'pdc', muscles: 'Grand dorsal, biceps',
      cues: ['Mains un peu plus larges que les épaules', 'Tire les coudes vers les hanches', 'Menton au-dessus de la barre'],
      props: [{ t: 'bar', x1: 55, x2: 145, y: 22 }],
      kf: [{ t: 180, a: [180, 180], l: [10, -30, 60], pin: ['wr', 100, 22] }, { t: 175, a: [40, 170], l: [10, -30, 60], pin: ['wr', 100, 22] }] },
    { id: 'tirage_vertical', name: 'Tirage vertical', group: 'dos', equip: 'machine', muscles: 'Grand dorsal, biceps',
      cues: ['Buste légèrement incliné en arrière', 'Tire la barre vers le haut de la poitrine', 'Remonte lentement'],
      props: [{ t: 'frame', pts: [[160, GROUND], [160, 6], [86, 6]] }, { t: 'pad', pts: [[55, 160], [112, 160]], w: 8 }, { t: 'line', pts: [[84, 164], [84, GROUND]], w: 5 },
        { t: 'pad', pts: [[104, 137], [126, 137]], w: 7 }, { t: 'cable', from: [88, 9] }],
      kf: [{ hip: [85, 150], t: 190, a: [172, 172], l: [90, 0, 90] }, { hip: [85, 150], t: 192, a: [-20, 170], l: [90, 0, 90] }] },
    { id: 'tirage_horizontal', name: 'Tirage horizontal', group: 'dos', equip: 'machine', muscles: 'Dos, arrière d’épaules',
      cues: ['Dos droit, poitrine sortie', 'Tire la poignée vers le ventre', 'Serre les omoplates'],
      props: [{ t: 'pad', pts: [[40, 168], [112, 168]], w: 7 }, { t: 'line', pts: [[76, 171], [76, GROUND]], w: 5 }, { t: 'frame', pts: [[180, GROUND], [180, 138]] },
        { t: 'line', pts: [[156, 140], [156, GROUND]], w: 4 }, { t: 'cable', from: [178, 150] }],
      kf: [{ hip: [75, 158], t: 165, a: [90, 90], l: [85, 95, 170] }, { hip: [75, 158], t: 188, a: [-60, 95], l: [85, 95, 170] }] },
    { id: 'rowing_barre', name: 'Rowing barre', group: 'dos', equip: 'barre', muscles: 'Dos, biceps, lombaires',
      cues: ['Buste penché, dos plat', 'Tire la barre vers le nombril', 'Coudes près du corps'],
      props: [{ t: 'plate', at: 'wr' }],
      kf: [{ t: 115, a: [0, 0], l: [25, -10, 90], pin: ['an', 95], ground: true }, { t: 115, a: [-85, 5], l: [25, -10, 90], pin: ['an', 95], ground: true }] },
    { id: 'rowing_haltere', name: 'Rowing haltère', group: 'dos', equip: 'halteres', muscles: 'Grand dorsal, biceps',
      cues: ['Genou et main en appui sur le banc', 'Dos plat', 'Tire le coude vers le plafond'],
      props: [bench(30, 140, 151), { t: 'db1' }],
      kf: [{ hip: [80, 113], t: 115, a: [0, 0], a2: [5, 5], l: [10, 0, 90], l2: [0, -90, 0] }, { hip: [80, 113], t: 115, a: [-85, 5], a2: [5, 5], l: [10, 0, 90], l2: [0, -90, 0] }] },
    { id: 'sdt', name: 'Soulevé de terre', group: 'dos', equip: 'barre', muscles: 'Dos, fessiers, ischios',
      cues: ['Barre contre les tibias', 'Dos droit, regard devant', 'Pousse dans le sol et verrouille les hanches'],
      props: [{ t: 'plate', at: 'wr' }],
      kf: [{ t: 120, a: [0, 0], l: [70, -15, 90], pin: ['an', 90], ground: true }, { t: 180, a: [0, 0], l: [0, 0, 90], pin: ['an', 90], ground: true }] },
    { id: 'superman', name: 'Superman', group: 'dos', equip: 'pdc', muscles: 'Lombaires, fessiers',
      cues: ['Allongé sur le ventre', 'Décolle bras et jambes', 'Tiens 1 seconde en haut'],
      kf: [{ hip: [90, 0], t: 90, a: [90, 90], l: [-90, -90, -10], ground: true }, { hip: [90, 0], t: 100, a: [110, 110], l: [-100, -100, -20], ground: true }] },

    // ----- Épaules -----
    { id: 'militaire', name: 'Développé militaire', group: 'epaules', equip: 'halteres', muscles: 'Épaules, triceps',
      cues: ['Debout, abdos serrés', 'Haltères à hauteur d’épaules', 'Pousse au-dessus de la tête'],
      props: [{ t: 'dbs' }],
      kf: [{ a: [20, 175], pin: ['an', 100], ground: true }, { a: [180, 180], pin: ['an', 100], ground: true }] },
    { id: 'elev_laterales', name: 'Élévations latérales', group: 'epaules', equip: 'halteres', muscles: 'Deltoïdes',
      cues: ['Coudes très légèrement fléchis', 'Monte jusqu’à l’horizontale', 'Descends lentement'],
      view: 'front', props: [{ t: 'dbs' }],
      kf: [{ hip: [100, 0], a: [10, 8], l: [3, 0], ground: true }, { hip: [100, 0], a: [88, 90], l: [3, 0], ground: true }] },
    { id: 'elev_frontales', name: 'Élévations frontales', group: 'epaules', equip: 'halteres', muscles: 'Avant des épaules',
      cues: ['Bras presque tendus', 'Monte devant toi à hauteur des yeux', 'Pas d’élan'],
      props: [{ t: 'dbs' }],
      kf: [{ a: [0, 0], pin: ['an', 95], ground: true }, { a: [90, 90], pin: ['an', 95], ground: true }] },
    { id: 'oiseau', name: 'Oiseau', group: 'epaules', equip: 'halteres', muscles: 'Arrière des épaules, haut du dos',
      cues: ['Buste penché vers l’avant', 'Écarte les bras sur les côtés', 'Serre les omoplates'],
      view: 'front', props: [{ t: 'dbs' }],
      kf: [{ hip: [100, 0], a: [5, 5], l: [4, 0], ground: true }, { hip: [100, 0], a: [80, 85], l: [4, 0], ground: true }] },

    // ----- Bras -----
    { id: 'curl_halteres', name: 'Curl haltères', group: 'bras', equip: 'halteres', muscles: 'Biceps',
      cues: ['Coudes collés au corps', 'Monte sans balancer', 'Descends lentement'],
      props: [{ t: 'dbs' }],
      kf: [{ a: [0, 0], pin: ['an', 100], ground: true }, { a: [5, 155], pin: ['an', 100], ground: true }] },
    { id: 'curl_barre', name: 'Curl barre', group: 'bras', equip: 'barre', muscles: 'Biceps',
      cues: ['Prise en supination', 'Coudes fixes', 'Contracte en haut'],
      props: [{ t: 'plate', at: 'wr', r: 12 }],
      kf: [{ a: [0, 0], pin: ['an', 100], ground: true }, { a: [5, 155], pin: ['an', 100], ground: true }] },
    { id: 'curl_marteau', name: 'Curl marteau', group: 'bras', equip: 'halteres', muscles: 'Biceps, avant-bras',
      cues: ['Paumes face à face', 'Coudes fixes', 'Monte et descends lentement'],
      props: [{ t: 'dbs', vertical: true }],
      kf: [{ a: [0, 0], pin: ['an', 100], ground: true }, { a: [5, 150], pin: ['an', 100], ground: true }] },
    { id: 'triceps_poulie', name: 'Extension triceps poulie', group: 'bras', equip: 'machine', muscles: 'Triceps',
      cues: ['Coudes collés au corps', 'Tends complètement les bras', 'Remonte sans bouger les coudes'],
      props: [{ t: 'frame', pts: [[150, GROUND], [150, 8], [128, 8]] }, { t: 'cable', from: [128, 10] }],
      kf: [{ t: 172, a: [0, 150], pin: ['an', 95], ground: true }, { t: 172, a: [0, 8], pin: ['an', 95], ground: true }] },
    { id: 'triceps_nuque', name: 'Extension triceps nuque', group: 'bras', equip: 'halteres', muscles: 'Triceps',
      cues: ['Haltère tenu à deux mains', 'Coudes pointés vers le haut', 'Tends les bras au-dessus de la tête'],
      props: [{ t: 'db1' }],
      kf: [{ a: [175, -20], a2: [175, -20], pin: ['an', 100], ground: true }, { a: [180, 180], a2: [180, 180], pin: ['an', 100], ground: true }] },
    { id: 'barre_front', name: 'Barre au front', group: 'bras', equip: 'barre', muscles: 'Triceps',
      cues: ['Allongé sur le banc', 'Plie seulement les coudes', 'Descends la barre vers le front'],
      props: [bench(35, 132, 154), { t: 'plate', at: 'wr', r: 12 }],
      kf: [{ hip: [118, 145], t: -90, a: [185, 185], l: [100, 0, 90] }, { hip: [118, 145], t: -90, a: [195, -60], l: [100, 0, 90] }] },
    { id: 'dips_banc', name: 'Dips sur banc', group: 'bras', equip: 'pdc', muscles: 'Triceps',
      cues: ['Mains sur le bord du banc', 'Descends en pliant les coudes', 'Remonte en poussant'],
      props: [bench(12, 74, 131)],
      kf: [{ t: 180, a: [-30, -30], l: [44, 46, 120], pin: ['wr', 70, 127] }, { t: 180, a: [-90, 0], l: [80, 30, 110], pin: ['wr', 70, 127] }] },

    // ----- Jambes -----
    { id: 'squat', name: 'Squat', group: 'jambes', equip: 'pdc', muscles: 'Quadriceps, fessiers',
      cues: ['Pieds largeur d’épaules', 'Fesses en arrière, dos droit', 'Cuisses parallèles au sol'],
      kf: [{ a: [8, 8], pin: ['an', 92], ground: true }, { t: 145, a: [90, 90], l: [95, -25, 90], pin: ['an', 92], ground: true }] },
    { id: 'squat_barre', name: 'Squat barre', group: 'jambes', equip: 'barre', muscles: 'Quadriceps, fessiers, dos',
      cues: ['Barre sur le haut du dos', 'Genoux dans l’axe des pieds', 'Descends sous la parallèle si possible'],
      armRel: true, props: [{ t: 'plate', at: 'wr', dx: -2 }],
      kf: [{ a: [-40, 170], pin: ['an', 95], ground: true }, { t: 145, a: [-40, 170], l: [95, -25, 90], pin: ['an', 95], ground: true }] },
    { id: 'goblet', name: 'Goblet squat', group: 'jambes', equip: 'kb', muscles: 'Quadriceps, fessiers',
      cues: ['Kettlebell contre la poitrine', 'Coudes entre les genoux en bas', 'Buste droit'],
      armRel: true, props: [{ t: 'kb', at: 'wr', dy: 4 }],
      kf: [{ a: [20, 160], pin: ['an', 92], ground: true }, { t: 150, a: [20, 160], l: [98, -25, 90], pin: ['an', 92], ground: true }] },
    { id: 'fentes', name: 'Fentes', group: 'jambes', equip: 'pdc', muscles: 'Quadriceps, fessiers',
      cues: ['Grand pas en avant', 'Genou arrière vers le sol', 'Buste droit'],
      kf: [{ a: [0, 0], l: [25, 0, 90], l2: [-25, -10, 80], pin: ['an', 120], ground: true }, { a: [0, 0], l: [90, 0, 90], l2: [30, -90, 60], pin: ['an', 120], ground: true }] },
    { id: 'fentes_halteres', name: 'Fentes haltères', group: 'jambes', equip: 'halteres', muscles: 'Quadriceps, fessiers',
      cues: ['Un haltère dans chaque main', 'Genou avant au-dessus de la cheville', 'Pousse sur le talon avant'],
      props: [{ t: 'dbs' }],
      kf: [{ a: [0, 0], l: [25, 0, 90], l2: [-25, -10, 80], pin: ['an', 120], ground: true }, { a: [0, 0], l: [90, 0, 90], l2: [30, -90, 60], pin: ['an', 120], ground: true }] },
    { id: 'presse', name: 'Presse à cuisses', group: 'jambes', equip: 'machine', muscles: 'Quadriceps, fessiers',
      cues: ['Dos bien plaqué au dossier', 'Pieds largeur de hanches', 'Ne verrouille pas les genoux'],
      props: [{ t: 'line', pts: [[96, GROUND], [178, 104]], w: 5 }, { t: 'pad', pts: [[62, 159], [28, 118]], w: 9 }, { t: 'pad', pts: [[58, 160], [92, 160]], w: 8 },
        { t: 'line', pts: [[74, 164], [74, GROUND]], w: 5 }, { t: 'sled' }],
      kf: [{ hip: [70, 150], t: -130, a: [60, 40], l: [165, 100, 225] }, { hip: [70, 150], t: -130, a: [60, 40], l: [135, 135, 225] }] },
    { id: 'leg_extension', name: 'Leg extension', group: 'jambes', equip: 'machine', muscles: 'Quadriceps',
      cues: ['Dos contre le dossier', 'Tends les jambes', 'Contrôle la descente'],
      props: [{ t: 'pad', pts: [[62, 159], [124, 159]], w: 8 }, { t: 'pad', pts: [[72, 156], [72, 100]], w: 8 }, { t: 'line', pts: [[90, 163], [90, GROUND]], w: 5 }, { t: 'roller', at: 'an', dx: 5 }],
      kf: [{ hip: [88, 150], t: 183, a: [20, 20], l: [90, 0, 90] }, { hip: [88, 150], t: 183, a: [20, 20], l: [90, 85, 180] }] },
    { id: 'leg_curl', name: 'Leg curl', group: 'jambes', equip: 'machine', muscles: 'Ischio-jambiers',
      cues: ['Allongé sur le ventre', 'Ramène les talons vers les fesses', 'Hanches collées au banc'],
      props: [bench(30, 150, 151), { t: 'roller', at: 'an', dy: -5 }],
      kf: [{ hip: [100, 141], t: 90, a: [60, 60], l: [-90, -90, -10] }, { hip: [100, 141], t: 90, a: [60, 60], l: [-90, -175, -100] }] },
    { id: 'sdt_roumain', name: 'Soulevé de terre roumain', group: 'jambes', equip: 'halteres', muscles: 'Ischio-jambiers, fessiers',
      cues: ['Jambes presque tendues', 'Pousse les hanches en arrière', 'Haltères le long des jambes'],
      props: [{ t: 'dbs' }],
      kf: [{ a: [0, 0], l: [0, 0, 90], pin: ['an', 95], ground: true }, { t: 105, a: [0, 0], l: [15, 0, 90], pin: ['an', 95], ground: true }] },
    { id: 'mollets', name: 'Mollets debout', group: 'jambes', equip: 'halteres', muscles: 'Mollets',
      cues: ['Monte sur la pointe des pieds', 'Tiens 1 seconde en haut', 'Descends lentement'],
      props: [{ t: 'dbs' }],
      kf: [{ a: [0, 0], l: [0, 0, 90], pin: ['to', 108], ground: true }, { a: [0, 0], l: [0, 0, 40], pin: ['to', 108], ground: true }] },
    { id: 'squat_saute', name: 'Squat sauté', group: 'jambes', equip: 'pdc', muscles: 'Jambes, cardio',
      cues: ['Descends en squat', 'Saute de façon explosive', 'Réception souple'],
      dur: 1.4,
      kf: [{ t: 145, a: [-30, -30], l: [95, -25, 90], pin: ['an', 95], ground: true }, { t: 180, a: [140, 140], l: [0, 0, 40], lift: 10, pin: ['an', 95], ground: true }] },

    // ----- Fessiers -----
    { id: 'hip_thrust', name: 'Hip thrust', group: 'fessiers', equip: 'barre', muscles: 'Fessiers, ischios',
      cues: ['Haut du dos sur le banc', 'Monte les hanches à l’horizontale', 'Serre les fessiers en haut'],
      props: [bench(8, 60, 152), { t: 'plate', at: 'hip', dy: -14 }],
      kf: [{ t: -125, a: [40, 70], l: [130, 15, 90], pin: ['sh', 58, 146] }, { t: -90, a: [70, 110], l: [90, -10, 90], pin: ['sh', 58, 146] }] },
    { id: 'pont_fessier', name: 'Pont fessier', group: 'fessiers', equip: 'pdc', muscles: 'Fessiers, ischios',
      cues: ['Allongé, genoux pliés', 'Monte le bassin', 'Serre les fessiers en haut'],
      kf: [{ t: -88, a: [90, 90], l: [135, 20, 90], pin: ['sh', 45], ground: true }, { t: -70, a: [85, 88], l: [110, 0, 90], pin: ['sh', 45], ground: true }] },
    { id: 'kb_swing', name: 'Kettlebell swing', group: 'fessiers', equip: 'kb', muscles: 'Fessiers, ischios, dos',
      cues: ['Mouvement de charnière de hanche', 'Pousse avec les hanches, pas les bras', 'Kettlebell à hauteur des épaules'],
      props: [{ t: 'kb', at: 'wr' }], dur: 1.6,
      kf: [{ t: 125, a: [-25, -25], l: [30, -10, 90], pin: ['an', 95], ground: true }, { t: 180, a: [90, 90], l: [0, 0, 90], pin: ['an', 95], ground: true }] },

    // ----- Abdos -----
    { id: 'crunch', name: 'Crunch', group: 'abdos', equip: 'pdc', muscles: 'Grand droit',
      cues: ['Allongé, genoux pliés', 'Enroule le haut du dos', 'Ne tire pas sur la nuque'],
      armRel: true,
      kf: [{ t: -90, a: [120, 264], l: [135, 20, 90], pin: ['hip', 90], ground: true }, { t: -118, n: -12, a: [120, 264], l: [135, 20, 90], pin: ['hip', 90], ground: true }] },
    { id: 'planche', name: 'Planche', group: 'abdos', equip: 'pdc', muscles: 'Gainage complet',
      cues: ['Avant-bras au sol', 'Corps aligné de la tête aux pieds', 'Respire calmement'],
      dur: 3,
      kf: [{ t: 97, a: [0, 90], l: [-83, -83, 0], pin: ['wr', 150], ground: true }, { t: 95, a: [1, 90], l: [-85, -85, 0], pin: ['wr', 150], ground: true }] },
    { id: 'releves_jambes', name: 'Relevés de jambes', group: 'abdos', equip: 'pdc', muscles: 'Bas des abdos',
      cues: ['Allongé, mains sous les fesses', 'Monte les jambes tendues', 'Ne touche pas le sol en bas'],
      kf: [{ t: -90, a: [90, 90], l: [88, 88, 180], l2: [88, 88, 180], pin: ['sh', 40], ground: true }, { t: -90, a: [90, 90], l: [175, 175, 90], l2: [175, 175, 90], pin: ['sh', 40], ground: true }] },
    { id: 'releves_genoux', name: 'Relevés de genoux suspendu', group: 'abdos', equip: 'pdc', muscles: 'Abdos, fléchisseurs de hanche',
      cues: ['Suspendu à la barre', 'Monte les genoux vers la poitrine', 'Sans balancer'],
      props: [{ t: 'bar', x1: 55, x2: 145, y: 22 }],
      kf: [{ t: 180, a: [180, 180], l: [5, 0, 90], pin: ['wr', 100, 22] }, { t: 176, a: [180, 180], l: [100, 0, 90], pin: ['wr', 100, 22] }] },
    { id: 'roue', name: 'Roue abdominale', group: 'abdos', equip: 'pdc', muscles: 'Abdos, gainage',
      cues: ['À genoux, mains sur la roue', 'Roule vers l’avant dos plat', 'Reviens en contractant les abdos'],
      handR: 9, props: [{ t: 'wheel' }],
      kf: [{ t: 115, a: [10, 10], l: [0, -90, -90], pin: ['kn', 62], ground: true }, { t: 97, a: [65, 65], l: [55, -90, -90], pin: ['kn', 62], ground: true }] },
    { id: 'mountain', name: 'Mountain climbers', group: 'abdos', equip: 'pdc', muscles: 'Abdos, cardio',
      cues: ['Position de pompe', 'Ramène les genoux vers la poitrine', 'Alterne rapidement'],
      dur: 0.8,
      kf: [{ t: 110, a: [-15, -15], l: [90, -40, 60], l2: [-70, -70, 0], pin: ['wr', 150], ground: true }, { t: 110, a: [-15, -15], l: [-70, -70, 0], l2: [90, -40, 60], pin: ['wr', 150], ground: true }] },

    // ----- Cardio -----
    { id: 'burpees', name: 'Burpees', group: 'cardio', equip: 'pdc', muscles: 'Corps entier',
      cues: ['Mains au sol', 'Saute en planche', 'Reviens et saute bras en l’air'],
      dur: 3.2, loop: true,
      kf: [
        { hip: [95, 0], t: 180, a: [5, 5], l: [0, 0, 90], ground: true },
        { hip: [95, 0], t: 130, a: [5, 5], l: [100, -20, 90], ground: true },
        { hip: [100, 0], t: 110, a: [-15, -15], l: [-70, -70, 0], ground: true },
        { hip: [95, 0], t: 130, a: [5, 5], l: [100, -20, 90], ground: true },
        { hip: [95, 0], t: 180, a: [175, 175], l: [0, 0, 40], lift: 22, ground: true },
      ] },
    { id: 'jumping_jacks', name: 'Jumping jacks', group: 'cardio', equip: 'pdc', muscles: 'Cardio, épaules',
      cues: ['Saute en écartant bras et jambes', 'Reviens pieds joints', 'Rythme régulier'],
      view: 'front', dur: 0.9,
      kf: [{ hip: [100, 0], a: [8, 6], l: [3, 0], ground: true }, { hip: [100, 0], a: [160, 170], l: [16, 14], lift: 4, ground: true }] },
    { id: 'genoux_hauts', name: 'Montées de genoux', group: 'cardio', equip: 'pdc', muscles: 'Cardio, hanches',
      cues: ['Monte les genoux à la hauteur des hanches', 'Bras actifs', 'Reste sur l’avant des pieds'],
      dur: 0.7,
      kf: [{ l: [90, 0, 90], l2: [-5, -5, 70], a: [-40, 50], a2: [40, 140], pin: ['hip', 100], ground: true }, { l: [-5, -5, 70], l2: [90, 0, 90], a: [40, 140], a2: [-40, 50], pin: ['hip', 100], ground: true }] },
    { id: 'talons_fesses', name: 'Talons-fesses', group: 'cardio', equip: 'pdc', muscles: 'Cardio, ischios',
      cues: ['Talons vers les fesses', 'Buste droit', 'Petits appuis rapides'],
      dur: 0.7,
      kf: [{ l: [-5, -165, -60], l2: [0, 0, 70], a: [-30, 40], a2: [30, 130], pin: ['hip', 100], ground: true }, { l: [0, 0, 70], l2: [-5, -165, -60], a: [30, 130], a2: [-30, 40], pin: ['hip', 100], ground: true }] },
    { id: 'corde', name: 'Corde à sauter', group: 'cardio', equip: 'pdc', muscles: 'Cardio, mollets',
      cues: ['Petits sauts sur l’avant des pieds', 'Les poignets font tourner la corde', 'Coudes près du corps'],
      dur: 0.6, props: [{ t: 'rope' }],
      kf: [{ a: [25, 60], l: [0, 0, 40], pin: ['hip', 100], ground: true }, { a: [25, 60], l: [0, 0, 40], lift: 10, pin: ['hip', 100], ground: true }] },
    { id: 'rameur', name: 'Rameur', group: 'cardio', equip: 'machine', muscles: 'Corps entier, cardio',
      cues: ['Pousse d’abord avec les jambes', 'Puis bascule le buste et tire', 'Reviens dans l’ordre inverse'],
      dur: 2.2,
      props: [{ t: 'line', pts: [[15, 174], [178, 174]], w: 5 }, { t: 'line', pts: [[30, 174], [30, GROUND]], w: 4 }, { t: 'line', pts: [[170, 174], [170, GROUND]], w: 4 },
        { t: 'wheelBox', x: 172, y: 150 }, { t: 'line', pts: [[150, 146], [150, 172]], w: 5 }, { t: 'seat', at: 'hip' }, { t: 'cable', from: [168, 150] }],
      kf: [{ hip: [0, 162], t: 160, a: [95, 95], l: [150, 50, 160], pin: ['an', 142] }, { hip: [0, 162], t: 195, a: [-55, 80], l: [85, 100, 160], pin: ['an', 142] }] },
  ];

  const BY_ID = Object.fromEntries(LIB.map((e) => [e.id, e]));

  // ---------- Cinématique ----------
  // Pose → vecteur de nombres (pour l'interpolation)
  function normalize(k, ex) {
    const t = k.t ?? 180;
    const a = k.a ?? [0, 0];
    const a2 = k.a2 ?? [a[0] - 6, a[1] - 6];
    const l = k.l ? [k.l[0], k.l[1], k.l[2] ?? 90] : [0, 0, 90];
    const l2 = k.l2 ? [k.l2[0], k.l2[1], k.l2[2] ?? 90] : [l[0] - 5, l[1] - 5, l[2]];
    const hip = k.hip ?? [100, 100];
    const pin = k.pin ?? [null, NaN, NaN];
    return [t, k.n ?? 0, a[0], a[1], a2[0], a2[1], l[0], l[1], l[2], l2[0], l2[1], l2[2],
      hip[0], hip[1], pin[1] ?? NaN, pin[2] ?? NaN, k.lift ?? 0, k.rope ?? 0];
  }

  function prepare(ex) {
    if (ex._v) return ex;
    ex._v = ex.kf.map((k) => normalize(k, ex));
    ex._pin = ex.kf[0].pin ? ex.kf[0].pin[0] : null;
    ex._ground = !!ex.kf[0].ground;
    return ex;
  }

  function solve(v, ex) {
    const [t, n, a0, a1, b0, b1, l0, l1, l2, m0, m1, m2, hx, hy, px, py, lift, rope] = v;
    const P = {};
    if (ex.view === 'front') {
      const top = [0, -L.torso];
      P.hip = [0, 0]; P.hipL = [-8, 0]; P.hipR = [8, 0];
      P.sh = top; P.shL = [-15, top[1] + 2]; P.shR = [15, top[1] + 2];
      P.head = [0, top[1] - 15];
      P.elR = add(P.shR, a0, L.ua); P.wrR = add(P.elR, a1, L.fa);
      P.elL = add(P.shL, -a0, L.ua); P.wrL = add(P.elL, -a1, L.fa);
      P.knR = add(P.hipR, l0, L.th); P.anR = add(P.knR, l1, L.sh); P.toR = add(P.anR, 90, 8);
      P.knL = add(P.hipL, -l0, L.th); P.anL = add(P.knL, -l1, L.sh); P.toL = add(P.anL, -90, 8);
      P.wr = P.wrR; P.an = P.anR; P.to = P.toR; P.kn = P.knR; P.wr2 = P.wrL;
    } else {
      const off = ex.armRel ? t - 180 : 0;
      P.hip = [0, 0];
      P.sh = add(P.hip, t, L.torso);
      P.neck = add(P.sh, t + n, 5);
      P.head = add(P.sh, t + n, 15);
      P.el = add(P.sh, a0 + off, L.ua); P.wr = add(P.el, a1 + off, L.fa);
      P.el2 = add(P.sh, b0 + off, L.ua); P.wr2 = add(P.el2, b1 + off, L.fa);
      P.kn = add(P.hip, l0, L.th); P.an = add(P.kn, l1, L.sh); P.to = add(P.an, l2, L.ft);
      P.kn2 = add(P.hip, m0, L.th); P.an2 = add(P.kn2, m1, L.sh); P.to2 = add(P.an2, m2, L.ft);
    }
    // Placement
    let dx = hx, dy = hy;
    if (ex._pin && P[ex._pin]) {
      const p = P[ex._pin];
      if (!Number.isNaN(px)) dx = px - p[0];
      if (!Number.isNaN(py)) dy = py - p[1];
    }
    for (const k in P) P[k] = [P[k][0] + dx, P[k][1] + dy];
    if (ex._ground) {
      const hr = ex.handR ?? 4;
      const radius = { hip: 10, sh: 10, head: 10, el: 4.5, el2: 4.5, wr: hr, wr2: hr, kn: 5.5, kn2: 5.5, an: 4, an2: 4, to: 3, to2: 3,
        hipL: 6, hipR: 6, elL: 4.5, elR: 4.5, wrL: 4, wrR: 4, knL: 5.5, knR: 5.5, anL: 4, anR: 4, toL: 3, toR: 3 };
      let low = -Infinity;
      for (const k in radius) if (P[k]) low = Math.max(low, P[k][1] + radius[k]);
      const shift = GROUND - low - lift;
      for (const k in P) P[k][1] += shift;
    } else if (lift) {
      for (const k in P) P[k][1] -= lift;
    }
    P.rope = rope;
    return P;
  }

  const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);

  function vecAt(ex, phase) {
    prepare(ex);
    const V = ex._v;
    if (V.length === 1) return V[0];
    let i, f;
    if (ex.loop) {
      const x = phase * V.length;
      i = Math.floor(x) % V.length; f = x - Math.floor(x);
      return lerp(V[i], V[(i + 1) % V.length], ease(f));
    }
    // aller-retour avec petites pauses aux extrémités
    let x = phase < 0.5 ? phase * 2 : 2 - phase * 2;
    x = Math.min(1, Math.max(0, (x - 0.08) / 0.84));
    const seg = x * (V.length - 1);
    i = Math.min(V.length - 2, Math.floor(seg)); f = seg - i;
    return lerp(V[i], V[i + 1], ease(f));
  }

  function lerp(A, B, f) {
    const out = new Array(A.length);
    for (let i = 0; i < A.length; i++) {
      const a = A[i], b = B[i];
      out[i] = Number.isNaN(a) || Number.isNaN(b) ? a : a + (b - a) * f;
    }
    return out;
  }

  // ---------- Dessin ----------
  function drawList(ex, P) {
    const D = [];
    const line = (p, q, w, c) => D.push(['line', p[0], p[1], q[0], q[1], w, c]);
    const circ = (p, r, fill, stroke = 'none', sw = 0) => D.push(['circle', p[0], p[1], r, fill, stroke, sw]);
    const poly = (pts, w, c) => D.push(['poly', pts.map((p) => p.join(',')).join(' '), w, c]);
    const path = (d, w, c) => D.push(['path', d, w, c]);

    const props = ex.props || [];
    const dumb = (p, vertical) => {
      if (vertical) { line([p[0], p[1] - 9], [p[0], p[1] + 9], 6, C.plate); circ([p[0], p[1] - 9], 4, C.plate, C.rim, 1.5); circ([p[0], p[1] + 9], 4, C.plate, C.rim, 1.5); }
      else { circ(p, 7.5, C.plate, C.rim, 2); circ(p, 2, C.metal); }
    };

    // Décor fixe (derrière)
    D.push(['line', 6, GROUND + 1.5, 194, GROUND + 1.5, 2, 'rgba(255,255,255,.10)']);
    for (const pr of props) {
      if (pr.t === 'bench') {
        line([pr.x1 + 10, pr.y + 6], [pr.x1 + 10, GROUND], 4, C.propLight);
        line([pr.x2 - 10, pr.y + 6], [pr.x2 - 10, GROUND], 4, C.propLight);
        line([pr.x1 + 4, pr.y + 3.5], [pr.x2 - 4, pr.y + 3.5], 8, C.prop);
      } else if (pr.t === 'pad') line(pr.pts[0], pr.pts[1], pr.w || 8, C.prop);
      else if (pr.t === 'line') line(pr.pts[0], pr.pts[1], pr.w || 4, C.propLight);
      else if (pr.t === 'frame') poly(pr.pts, 5, C.propLight);
      else if (pr.t === 'bar') {
        line([pr.x1, pr.y], [pr.x1, GROUND], 4, C.propLight); line([pr.x2, pr.y], [pr.x2, GROUND], 4, C.propLight);
        line([pr.x1, pr.y], [pr.x2, pr.y], 4, C.metal);
      } else if (pr.t === 'dip') {
        line([pr.x1 + 6, pr.y], [pr.x1 + 6, GROUND], 4, C.propLight); line([pr.x2 - 6, pr.y], [pr.x2 - 6, GROUND], 4, C.propLight);
        line([pr.x1, pr.y], [pr.x2, pr.y], 5, C.metal);
      } else if (pr.t === 'wheelBox') { circ([pr.x, pr.y], 13, C.prop, C.propLight, 3); circ([pr.x, pr.y], 3, C.metal); }
      else if (pr.t === 'seat') line([P.hip[0] - 12, P.hip[1] + 11], [P.hip[0] + 12, P.hip[1] + 11], 6, C.prop);
      else if (pr.t === 'rope') {
        // la corde tourne autour du corps (vue de profil)
        const th = (P.phase * 360 + 180) * RAD;
        const c = [P.hip[0] + 4, P.hip[1] - 14];
        const pt = [c[0] + 34 * Math.sin(th), c[1] + 96 * Math.cos(th)];
        const w = P.wr;
        path(`M${w[0]},${w[1]} Q${2 * pt[0] - w[0]},${2 * pt[1] - w[1]} ${w[0] + 0.1},${w[1]}`, 2, '#d98b6a');
      }
    }

    const has = (t) => props.find((p) => p.t === t);
    const dbs = has('dbs');

    // ---- Formes du corps ----
    const shape = (d, fill) => D.push(['shape', d, fill]);
    const r1 = (n) => n.toFixed(1);
    // segment arrondi et effilé (membre) de p à q
    const capsule = (p, q, ra, rb, fill) => {
      let dx = q[0] - p[0], dy = q[1] - p[1];
      const len = Math.hypot(dx, dy) || 0.001; dx /= len; dy /= len;
      const nx = -dy, ny = dx;
      shape(`M${r1(p[0] + nx * ra)},${r1(p[1] + ny * ra)}L${r1(q[0] + nx * rb)},${r1(q[1] + ny * rb)}` +
        `A${rb},${rb} 0 0 0 ${r1(q[0] - nx * rb)},${r1(q[1] - ny * rb)}L${r1(p[0] - nx * ra)},${r1(p[1] - ny * ra)}` +
        `A${ra},${ra} 0 0 0 ${r1(p[0] + nx * ra)},${r1(p[1] + ny * ra)}Z`, fill);
    };
    const lerpP = (p, q, f) => [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
    // contour fermé lissé passant près des points
    const smooth = (pts, fill) => {
      const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const n = pts.length;
      let d = `M${r1(m(pts[n - 1], pts[0])[0])},${r1(m(pts[n - 1], pts[0])[1])}`;
      for (let i = 0; i < n; i++) {
        const c = pts[i], e = m(pts[i], pts[(i + 1) % n]);
        d += `Q${r1(c[0])},${r1(c[1])} ${r1(e[0])},${r1(e[1])}`;
      }
      shape(d + 'Z', fill);
    };
    const unit = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };

    // jambe : cuisse, short, tibia, chaussure
    const leg = (hip, kn, an, to, far) => {
      const skin = far ? C.skinFar : C.skin;
      capsule(hip, kn, 6.6, 5, skin);
      capsule(kn, an, 5, 3.3, skin);
      capsule(hip, lerpP(hip, kn, 0.55), 7.4, 6.4, far ? C.shortsFar : C.shorts);
      const f = unit(an, to);
      capsule([an[0] - f[0] * 3, an[1] - f[1] * 3], [to[0] + f[0] * 1.5, to[1] + f[1] * 1.5], 3.9, 3, far ? C.shoeFar : C.shoe);
    };
    // bras : bras, manche, avant-bras, main
    const arm = (sh, el, wr, far) => {
      const skin = far ? C.skinFar : C.skin;
      capsule(sh, el, 4.8, 3.8, skin);
      capsule(el, wr, 3.8, 2.9, skin);
      const f = unit(el, wr);
      capsule(wr, [wr[0] + f[0] * 4.5, wr[1] + f[1] * 4.5], 3.3, 2.6, skin);
      capsule(sh, lerpP(sh, el, 0.45), 5.8, 5.2, far ? C.shirtFar : C.shirt);
    };
    // tête avec cheveux, oreille et nez (orientée selon le cou)
    const head = (c, u, n, front) => {
      if (front) {
        circ([c[0], c[1] - 1.6], 9.4, C.hair);
        circ([c[0] - 8.4, c[1] + 1.2], 2.2, C.skinFar); circ([c[0] + 8.4, c[1] + 1.2], 2.2, C.skinFar);
        D.push(['ellipse', c[0], c[1] + 1, 8.3, 9.4, C.skin, null]);
        D.push(['ellipse', c[0], c[1] - 5.5, 8.4, 4.2, C.hair, null]);
        return;
      }
      circ([c[0] - n[0] * 1.6 + u[0] * 1.2, c[1] - n[1] * 1.6 + u[1] * 1.2], 9.3, C.hair);
      circ([c[0] + n[0] * 1.1 - u[0] * 0.6, c[1] + n[1] * 1.1 - u[1] * 0.6], 8.4, C.skin);
      circ([c[0] + n[0] * 8.6 - u[0] * 0.5, c[1] + n[1] * 8.6 - u[1] * 0.5], 1.7, C.skin);
      circ([c[0] - n[0] * 1.5 - u[0] * 0.5, c[1] - n[1] * 1.5 - u[1] * 0.5], 1.9, C.skinFar);
    };

    if (ex.view === 'front') {
      leg(P.hipL, P.knL, P.anL, P.toL, false);
      leg(P.hipR, P.knR, P.anR, P.toR, false);
      // bassin (short) puis buste (t-shirt)
      smooth([[P.hipL[0] - 6, P.hipL[1] - 6], [P.hipR[0] + 6, P.hipR[1] - 6], [P.hipR[0] + 7, P.hipR[1] + 6], [P.hip[0], P.hip[1] + 4], [P.hipL[0] - 7, P.hipL[1] + 6]], C.shorts);
      smooth([[P.shL[0] - 3, P.shL[1] - 3], [P.sh[0], P.sh[1] - 4], [P.shR[0] + 3, P.shR[1] - 3], [P.shR[0] + 1, P.sh[1] + 20], [P.hipR[0] + 4, P.hip[1] - 5], [P.hipL[0] - 4, P.hip[1] - 5], [P.shL[0] - 1, P.sh[1] + 20]], C.shirt);
      capsule(P.sh, [P.sh[0], P.sh[1] - 9], 3.6, 3.4, C.skin);
      head(P.head, [0, -1], [1, 0], true);
      arm(P.shL, P.elL, P.wrL, false);
      arm(P.shR, P.elR, P.wrR, false);
      if (dbs) { dumb(P.wrL, true); dumb(P.wrR, true); }
      return D;
    }

    // Profil : côté éloigné d'abord
    leg(P.hip, P.kn2, P.an2, P.to2, true);
    arm(P.sh, P.el2, P.wr2, true);
    if (dbs) dumb(P.wr2, dbs.vertical);

    // Buste : axe hanche → épaule, « n » = côté ventre
    const u = unit(P.hip, P.sh);
    const nrm = [-u[1], u[0]];
    const L0 = Math.hypot(P.sh[0] - P.hip[0], P.sh[1] - P.hip[1]);
    const at = (s, o) => [P.hip[0] + u[0] * L0 * s + nrm[0] * o, P.hip[1] + u[1] * L0 * s + nrm[1] * o];
    smooth([at(0.34, 9.2), at(0.06, 8.6), at(-0.15, 4), at(-0.15, -5.5), at(0.02, -11.6), at(0.34, -9.8)], C.shorts);
    smooth([at(0.22, 9.4), at(0.47, 10), at(0.72, 12.6), at(0.93, 10), at(1.04, 5), at(1.04, -6.4), at(0.86, -10), at(0.55, -9), at(0.22, -10)], C.shirt);

    // Cou et tête
    const v = unit(P.sh, P.head);
    capsule(P.sh, P.neck, 3.8, 3.5, C.skin);
    head(P.head, v, [-v[1], v[0]], false);

    // Câble (derrière la main proche)
    const cab = has('cable');
    if (cab) { line(cab.from, P.wr, 1.6, C.metal); circ(cab.from, 4, C.prop, C.metal, 1.5); }

    leg(P.hip, P.kn, P.an, P.to, false);

    // Accessoires liés aux articulations
    for (const pr of props) {
      if (pr.t === 'roller') circ([P.an[0] + (pr.dx || 0), P.an[1] + (pr.dy || 0)], 7, C.prop, C.propLight, 2);
      if (pr.t === 'sled') {
        const c = add(P.an, 135, 6); const p1 = add(c, 45, 20), p2 = add(c, 225, 20);
        line(p1, p2, 7, C.prop);
      }
    }

    arm(P.sh, P.el, P.wr, false);

    for (const pr of props) {
      if (pr.t === 'plate') {
        const base = P[pr.at] || P.wr;
        const c = [base[0] + (pr.dx || 0), base[1] + (pr.dy || 0)];
        circ(c, pr.r || 15, C.plate, C.rim, 3); circ(c, 3, C.metal);
      }
      if (pr.t === 'db1') dumb(P.wr, false);
      if (pr.t === 'kb') {
        const c = [P.wr[0], P.wr[1] + (pr.dy ?? 11)];
        D.push(['path', `M${P.wr[0] - 5},${c[1] - 2} Q${P.wr[0]},${P.wr[1] - 6} ${P.wr[0] + 5},${c[1] - 2}`, 2.5, C.rim]);
        circ(c, 8.5, C.plate, C.rim, 2);
      }
      if (pr.t === 'wheel') { circ(P.wr, 9, C.plate, C.rim, 2.5); circ(P.wr, 2.5, C.metal); }
    }
    if (dbs) dumb(P.wr, dbs.vertical);
    return D;
  }

  function angleOf(a, b) { return Math.atan2(b[0] - a[0], b[1] - a[1]) / RAD; }

  const NS = 'http://www.w3.org/2000/svg';
  function renderInto(svg, D) {
    let pool = svg._pool;
    const sig = D.map((d) => d[0]).join('|');
    if (!pool || svg._sig !== sig) {
      while (svg.lastChild) svg.removeChild(svg.lastChild);
      pool = D.map((d) => {
        const tag = { line: 'line', circle: 'circle', poly: 'polyline', polyfill: 'polygon', path: 'path', ellipse: 'ellipse', shape: 'path' }[d[0]];
        const el = document.createElementNS(NS, tag);
        if (tag === 'line' || tag === 'polyline' || tag === 'path') { el.setAttribute('stroke-linecap', 'round'); el.setAttribute('stroke-linejoin', 'round'); el.setAttribute('fill', 'none'); }
        svg.appendChild(el);
        return el;
      });
      svg._pool = pool; svg._sig = sig;
    }
    const f = (n) => n.toFixed(1);
    D.forEach((d, i) => {
      const el = pool[i];
      switch (d[0]) {
        case 'line':
          el.setAttribute('x1', f(d[1])); el.setAttribute('y1', f(d[2])); el.setAttribute('x2', f(d[3])); el.setAttribute('y2', f(d[4]));
          el.setAttribute('stroke-width', d[5]); el.setAttribute('stroke', d[6]); break;
        case 'circle':
          el.setAttribute('cx', f(d[1])); el.setAttribute('cy', f(d[2])); el.setAttribute('r', d[3]);
          el.setAttribute('fill', d[4]); el.setAttribute('stroke', d[5]); el.setAttribute('stroke-width', d[6]); break;
        case 'poly':
          el.setAttribute('points', d[1]); el.setAttribute('stroke-width', d[2]); el.setAttribute('stroke', d[3]); break;
        case 'polyfill':
          el.setAttribute('points', d[1]); el.setAttribute('fill', d[2]); break;
        case 'path':
          el.setAttribute('d', d[1]); el.setAttribute('stroke-width', d[2]); el.setAttribute('stroke', d[3]); break;
        case 'shape':
          el.setAttribute('d', d[1]); el.setAttribute('fill', d[2]); break;
        case 'ellipse':
          el.setAttribute('cx', f(d[1])); el.setAttribute('cy', f(d[2])); el.setAttribute('rx', d[3]); el.setAttribute('ry', d[4]); el.setAttribute('fill', d[5]);
          if (d[6] != null) el.setAttribute('transform', `rotate(${f(-d[6] + 180)} ${f(d[1])} ${f(d[2])})`);
          break;
      }
    });
  }

  function drawFrame(svg, ex, phase) {
    prepare(ex);
    const P = solve(vecAt(ex, phase), ex);
    P.phase = phase;
    renderInto(svg, drawList(ex, P));
  }

  // ---------- Lecteurs animés ----------
  const players = new Set();
  let raf = 0;
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => { if (e.target._player) e.target._player.visible = e.isIntersecting; }))
    : null;

  function loop(now) {
    raf = 0;
    for (const p of players) {
      if (!p.svg.isConnected) { players.delete(p); if (io) io.unobserve(p.svg); continue; }
      if (!p.visible || p.paused) continue;
      const dur = (p.ex.dur || 2.4) * 1000;
      drawFrame(p.svg, p.ex, ((now - p.t0) % dur) / dur);
    }
    if (players.size && document.visibilityState === 'visible') raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && players.size) raf = requestAnimationFrame(loop); }
  document.addEventListener('visibilitychange', kick);

  // Crée un mannequin animé dans `host` (élément HTML)
  function mount(host, exOrId, { animate = true } = {}) {
    const ex = typeof exOrId === 'string' ? BY_ID[exOrId] : exOrId;
    if (!ex) return null;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('class', 'manq');
    svg.setAttribute('aria-label', 'Animation : ' + ex.name);
    host.appendChild(svg);
    drawFrame(svg, ex, 0.25);
    if (!animate) return svg;
    const p = { svg, ex, t0: performance.now() - Math.random() * 500, visible: !io, paused: false };
    svg._player = p;
    if (io) io.observe(svg);
    players.add(p);
    kick();
    return svg;
  }

  // Remplace automatiquement les éléments [data-manq="id"] par un mannequin
  function hydrate(root = document) {
    root.querySelectorAll('[data-manq]').forEach((el) => {
      if (el._hydrated) return;
      el._hydrated = true;
      mount(el, el.dataset.manq, { animate: el.dataset.static == null });
    });
  }

  return { LIB, BY_ID, GROUPS, EQUIP, mount, hydrate, drawFrame };
})();
