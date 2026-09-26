import type { SportType } from '@/types/database'

// ── Muscle group metadata ─────────────────────────────────────

export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  Pectoraux:          '#EF4444', // red
  'Grand pectoral':   '#EF4444',
  Dos:                '#3B82F6', // blue
  'Grand dorsal':     '#3B82F6',
  Trapèzes:           '#6366F1', // indigo
  Rhomboïdes:         '#6366F1',
  Épaules:            '#8B5CF6', // violet
  Deltoïdes:          '#8B5CF6',
  Biceps:             '#F59E0B', // amber
  Triceps:            '#F97316', // orange
  'Avant-bras':       '#FBBF24', // yellow
  Quadriceps:         '#10B981', // emerald
  Ischio:             '#059669', // green
  Fessiers:           '#EC4899', // pink
  Mollets:            '#14B8A6', // teal
  Abdos:              '#06B6D4', // cyan
  Lombaires:          '#84CC16', // lime
  Polyarticulaire:    '#F97316', // orange
}

export const MUSCLE_GROUP_EMOJI: Record<string, string> = {
  Pectoraux:     '💪',
  Dos:           '🔵',
  Trapèzes:      '🔷',
  Épaules:       '🟣',
  Biceps:        '💛',
  Triceps:       '🟠',
  'Avant-bras':  '🟡',
  Quadriceps:    '🟢',
  Ischio:        '🟩',
  Fessiers:      '💗',
  Mollets:       '🩵',
  Abdos:         '🩶',
  Lombaires:     '🟡',
  Polyarticulaire: '🟠',
}

// ── Exercise types ────────────────────────────────────────────

export interface ExerciseTemplate {
  name: string
  category: string         // muscle group or sport category
  emoji: string
  unit?: string
  equipment?: string       // 'barre' | 'haltères' | 'machine' | 'câble' | 'corps' | 'poulie'
  muscles?: string[]       // secondary muscles targeted
  difficulty?: 1 | 2 | 3  // 1=débutant, 2=intermédiaire, 3=avancé
  description?: string
}

// ── GYM — 75 exercices ───────────────────────────────────────

export const EXERCISE_DB: Record<SportType, ExerciseTemplate[]> = {
  gym: [
    // ─ PECTORAUX ─
    { name: 'Développé couché barre', category: 'Pectoraux', emoji: '🏋️', equipment: 'barre',    muscles: ['Triceps', 'Épaules'], difficulty: 2, description: 'Exercice roi du haut du corps' },
    { name: 'Développé couché haltères', category: 'Pectoraux', emoji: '🏋️', equipment: 'haltères', muscles: ['Triceps', 'Épaules'], difficulty: 2 },
    { name: 'Développé incliné barre', category: 'Pectoraux', emoji: '🏋️', equipment: 'barre',    muscles: ['Épaules', 'Triceps'], difficulty: 2, description: 'Accent sur le haut des pecs' },
    { name: 'Développé incliné haltères', category: 'Pectoraux', emoji: '🏋️', equipment: 'haltères', muscles: ['Épaules'], difficulty: 2 },
    { name: 'Développé décliné', category: 'Pectoraux', emoji: '🏋️', equipment: 'barre',    muscles: ['Triceps'], difficulty: 2, description: 'Bas des pectoraux' },
    { name: 'Écarté plat haltères', category: 'Pectoraux', emoji: '🏋️', equipment: 'haltères', muscles: ['Épaules'], difficulty: 2 },
    { name: 'Écarté incliné haltères', category: 'Pectoraux', emoji: '🏋️', equipment: 'haltères', muscles: ['Épaules'], difficulty: 2 },
    { name: 'Croisé poulie haute', category: 'Pectoraux', emoji: '🔵', equipment: 'câble',    muscles: ['Épaules'], difficulty: 2 },
    { name: 'Croisé poulie basse', category: 'Pectoraux', emoji: '🔵', equipment: 'câble',    muscles: ['Épaules'], difficulty: 2, description: 'Accent sur le haut' },
    { name: 'Pompes', category: 'Pectoraux', emoji: '💪', equipment: 'corps', muscles: ['Triceps', 'Épaules'], difficulty: 1 },
    { name: 'Pompes déclinées', category: 'Pectoraux', emoji: '💪', equipment: 'corps', muscles: ['Épaules'], difficulty: 2, description: 'Pieds surélevés' },
    { name: 'Pompes diamant', category: 'Pectoraux', emoji: '💪', equipment: 'corps', muscles: ['Triceps'], difficulty: 2 },
    { name: 'Pull-over haltère', category: 'Pectoraux', emoji: '🏋️', equipment: 'haltères', muscles: ['Grand dorsal'], difficulty: 2 },

    // ─ DOS ─
    { name: 'Tractions pronation', category: 'Dos', emoji: '💪', equipment: 'corps', muscles: ['Biceps', 'Trapèzes'], difficulty: 2, description: 'Prise en pronation (paumes vers l\'extérieur)' },
    { name: 'Tractions supination', category: 'Dos', emoji: '💪', equipment: 'corps', muscles: ['Biceps'], difficulty: 2, description: 'Chin-up – paumes vers soi' },
    { name: 'Tractions neutres', category: 'Dos', emoji: '💪', equipment: 'corps', muscles: ['Biceps'], difficulty: 2 },
    { name: 'Tractions assistées', category: 'Dos', emoji: '💪', equipment: 'machine', muscles: ['Biceps'], difficulty: 1 },
    { name: 'Rowing barre pronation', category: 'Dos', emoji: '🏋️', equipment: 'barre',    muscles: ['Biceps', 'Trapèzes'], difficulty: 2 },
    { name: 'Rowing barre supination', category: 'Dos', emoji: '🏋️', equipment: 'barre',    muscles: ['Biceps'], difficulty: 2 },
    { name: 'Rowing haltère', category: 'Dos', emoji: '🏋️', equipment: 'haltères', muscles: ['Biceps', 'Trapèzes'], difficulty: 1 },
    { name: 'Rowing assis poulie', category: 'Dos', emoji: '🔵', equipment: 'câble',    muscles: ['Biceps', 'Trapèzes'], difficulty: 1 },
    { name: 'Tirage poulie haute large', category: 'Dos', emoji: '🔵', equipment: 'poulie',  muscles: ['Biceps'], difficulty: 1 },
    { name: 'Tirage poulie haute serré', category: 'Dos', emoji: '🔵', equipment: 'poulie',  muscles: ['Biceps'], difficulty: 1 },
    { name: 'Tirage horizontal poulie', category: 'Dos', emoji: '🔵', equipment: 'câble',    muscles: ['Biceps'], difficulty: 1 },
    { name: 'Soulevé de terre', category: 'Dos', emoji: '🏋️', equipment: 'barre',    muscles: ['Lombaires', 'Fessiers', 'Quadriceps'], difficulty: 3, description: 'ROI des exercices polyarticulaires' },
    { name: 'Soulevé de terre roumain', category: 'Dos', emoji: '🏋️', equipment: 'barre',    muscles: ['Ischio', 'Fessiers'], difficulty: 2 },
    { name: 'Good morning', category: 'Dos', emoji: '🏋️', equipment: 'barre',    muscles: ['Ischio', 'Fessiers'], difficulty: 2 },
    { name: 'Extension dos machine', category: 'Dos', emoji: '🔧', equipment: 'machine', muscles: ['Lombaires'], difficulty: 1 },
    { name: 'Shrugs barre', category: 'Trapèzes', emoji: '🏋️', equipment: 'barre',    muscles: ['Cou'], difficulty: 1 },
    { name: 'Shrugs haltères', category: 'Trapèzes', emoji: '🏋️', equipment: 'haltères', muscles: ['Cou'], difficulty: 1 },

    // ─ ÉPAULES ─
    { name: 'Développé militaire barre', category: 'Épaules', emoji: '🏋️', equipment: 'barre',    muscles: ['Triceps', 'Trapèzes'], difficulty: 2 },
    { name: 'Développé militaire haltères', category: 'Épaules', emoji: '🏋️', equipment: 'haltères', muscles: ['Triceps'], difficulty: 2 },
    { name: 'Développé Arnold', category: 'Épaules', emoji: '🏋️', equipment: 'haltères', muscles: ['Triceps'], difficulty: 2, description: 'Rotation de la prise pendant le mouvement' },
    { name: 'Élévations latérales', category: 'Épaules', emoji: '🏋️', equipment: 'haltères', muscles: [], difficulty: 1, description: 'Deltoïdes latéraux' },
    { name: 'Élévations frontales', category: 'Épaules', emoji: '🏋️', equipment: 'haltères', muscles: [], difficulty: 1, description: 'Deltoïdes antérieurs' },
    { name: 'Oiseau / élévations arrière', category: 'Épaules', emoji: '🏋️', equipment: 'haltères', muscles: ['Rhomboïdes'], difficulty: 2, description: 'Deltoïdes postérieurs' },
    { name: 'Upright row', category: 'Épaules', emoji: '🏋️', equipment: 'barre',    muscles: ['Trapèzes', 'Biceps'], difficulty: 2 },
    { name: 'Face pull', category: 'Épaules', emoji: '🔵', equipment: 'câble',    muscles: ['Trapèzes', 'Rhomboïdes'], difficulty: 1, description: 'Excellent pour la santé des épaules' },
    { name: 'Élévations latérales poulie', category: 'Épaules', emoji: '🔵', equipment: 'câble', muscles: [], difficulty: 1 },

    // ─ BICEPS ─
    { name: 'Curl barre droite', category: 'Biceps', emoji: '💪', equipment: 'barre',    muscles: ['Avant-bras'], difficulty: 1 },
    { name: 'Curl barre EZ', category: 'Biceps', emoji: '💪', equipment: 'barre',    muscles: ['Avant-bras'], difficulty: 1 },
    { name: 'Curl haltères alternés', category: 'Biceps', emoji: '💪', equipment: 'haltères', muscles: ['Avant-bras'], difficulty: 1 },
    { name: 'Curl marteau', category: 'Biceps', emoji: '💪', equipment: 'haltères', muscles: ['Avant-bras', 'Brachial'], difficulty: 1 },
    { name: 'Curl incliné', category: 'Biceps', emoji: '💪', equipment: 'haltères', muscles: [], difficulty: 2, description: 'Étirement maximal du biceps' },
    { name: 'Curl concentration', category: 'Biceps', emoji: '💪', equipment: 'haltères', muscles: [], difficulty: 1 },
    { name: 'Curl poulie basse', category: 'Biceps', emoji: '🔵', equipment: 'câble', muscles: [], difficulty: 1 },
    { name: 'Spider curl', category: 'Biceps', emoji: '💪', equipment: 'haltères', muscles: [], difficulty: 2 },

    // ─ TRICEPS ─
    { name: 'Dips', category: 'Triceps', emoji: '💪', equipment: 'corps', muscles: ['Pectoraux', 'Épaules'], difficulty: 2 },
    { name: 'Dips assistés', category: 'Triceps', emoji: '💪', equipment: 'machine', muscles: ['Pectoraux'], difficulty: 1 },
    { name: 'Extension triceps barre', category: 'Triceps', emoji: '🏋️', equipment: 'barre', muscles: [], difficulty: 2, description: 'French press' },
    { name: 'Extension triceps haltère', category: 'Triceps', emoji: '🏋️', equipment: 'haltères', muscles: [], difficulty: 2 },
    { name: 'Pushdown poulie', category: 'Triceps', emoji: '🔵', equipment: 'câble', muscles: [], difficulty: 1 },
    { name: 'Pushdown corde', category: 'Triceps', emoji: '🔵', equipment: 'câble', muscles: [], difficulty: 1 },
    { name: 'Extension triceps poulie', category: 'Triceps', emoji: '🔵', equipment: 'câble', muscles: [], difficulty: 1 },
    { name: 'Kickback haltère', category: 'Triceps', emoji: '🏋️', equipment: 'haltères', muscles: [], difficulty: 1 },
    { name: 'Pompes triceps (étroites)', category: 'Triceps', emoji: '💪', equipment: 'corps', muscles: ['Pectoraux'], difficulty: 2 },

    // ─ QUADRICEPS ─
    { name: 'Squat barre haute', category: 'Quadriceps', emoji: '🏋️', equipment: 'barre', muscles: ['Fessiers', 'Ischio', 'Abdos'], difficulty: 3, description: 'ROI des jambes' },
    { name: 'Squat barre basse', category: 'Quadriceps', emoji: '🏋️', equipment: 'barre', muscles: ['Fessiers', 'Ischio'], difficulty: 3 },
    { name: 'Squat gobelet', category: 'Quadriceps', emoji: '🏋️', equipment: 'haltères', muscles: ['Fessiers', 'Abdos'], difficulty: 1 },
    { name: 'Presse à cuisses', category: 'Quadriceps', emoji: '🔧', equipment: 'machine', muscles: ['Fessiers', 'Ischio'], difficulty: 1 },
    { name: 'Leg extension', category: 'Quadriceps', emoji: '🔧', equipment: 'machine', muscles: [], difficulty: 1 },
    { name: 'Fentes avant haltères', category: 'Quadriceps', emoji: '🏃', equipment: 'haltères', muscles: ['Fessiers', 'Ischio'], difficulty: 2 },
    { name: 'Fentes marchées', category: 'Quadriceps', emoji: '🏃', equipment: 'haltères', muscles: ['Fessiers', 'Ischio'], difficulty: 2 },
    { name: 'Fentes bulgares', category: 'Quadriceps', emoji: '🏃', equipment: 'haltères', muscles: ['Fessiers'], difficulty: 3, description: 'Bulgarian split squat' },
    { name: 'Hack squat machine', category: 'Quadriceps', emoji: '🔧', equipment: 'machine', muscles: ['Fessiers'], difficulty: 2 },
    { name: 'Step-up haltères', category: 'Quadriceps', emoji: '🏃', equipment: 'haltères', muscles: ['Fessiers'], difficulty: 2 },

    // ─ ISCHIO-JAMBIERS ─
    { name: 'Leg curl couché', category: 'Ischio', emoji: '🔧', equipment: 'machine', muscles: [], difficulty: 1 },
    { name: 'Leg curl assis', category: 'Ischio', emoji: '🔧', equipment: 'machine', muscles: [], difficulty: 1 },
    { name: 'Nordic hamstring curl', category: 'Ischio', emoji: '💪', equipment: 'corps', muscles: [], difficulty: 3, description: 'Un des meilleurs pour prévenir les blessures' },
    { name: 'Romanian deadlift', category: 'Ischio', emoji: '🏋️', equipment: 'barre', muscles: ['Fessiers', 'Dos'], difficulty: 2 },
    { name: 'Glute ham raise', category: 'Ischio', emoji: '💪', equipment: 'corps', muscles: ['Fessiers'], difficulty: 3 },

    // ─ FESSIERS ─
    { name: 'Hip thrust barre', category: 'Fessiers', emoji: '🏋️', equipment: 'barre', muscles: ['Ischio', 'Quadriceps'], difficulty: 2, description: 'Meilleur exercice pour les fessiers' },
    { name: 'Hip thrust machine', category: 'Fessiers', emoji: '🔧', equipment: 'machine', muscles: ['Ischio'], difficulty: 1 },
    { name: 'Kickback fessier poulie', category: 'Fessiers', emoji: '🔵', equipment: 'câble', muscles: [], difficulty: 1 },
    { name: 'Abduction machine', category: 'Fessiers', emoji: '🔧', equipment: 'machine', muscles: [], difficulty: 1 },
    { name: 'Sumo squat', category: 'Fessiers', emoji: '🏋️', equipment: 'haltères', muscles: ['Quadriceps', 'Adducteurs'], difficulty: 1 },
    { name: 'Pont fessier', category: 'Fessiers', emoji: '💪', equipment: 'corps', muscles: ['Ischio'], difficulty: 1 },
    { name: 'Clamshell', category: 'Fessiers', emoji: '💪', equipment: 'corps', muscles: [], difficulty: 1 },

    // ─ MOLLETS ─
    { name: 'Mollets debout barre', category: 'Mollets', emoji: '🏋️', equipment: 'barre', muscles: [], difficulty: 1 },
    { name: 'Mollets machine', category: 'Mollets', emoji: '🔧', equipment: 'machine', muscles: [], difficulty: 1 },
    { name: 'Mollets assis machine', category: 'Mollets', emoji: '🔧', equipment: 'machine', muscles: [], difficulty: 1 },
    { name: 'Mollets à une jambe', category: 'Mollets', emoji: '💪', equipment: 'corps', muscles: [], difficulty: 2 },

    // ─ ABDOS & CORE ─
    { name: 'Gainage frontal', category: 'Abdos', emoji: '💪', equipment: 'corps', muscles: ['Lombaires'], difficulty: 1 },
    { name: 'Gainage latéral', category: 'Abdos', emoji: '💪', equipment: 'corps', muscles: ['Obliques'], difficulty: 1 },
    { name: 'Crunchs', category: 'Abdos', emoji: '💪', equipment: 'corps', muscles: [], difficulty: 1 },
    { name: 'Crunchs obliques', category: 'Abdos', emoji: '💪', equipment: 'corps', muscles: ['Obliques'], difficulty: 1 },
    { name: 'Russian twist', category: 'Abdos', emoji: '💪', equipment: 'corps', muscles: ['Obliques'], difficulty: 2 },
    { name: 'Relevé de jambes suspendu', category: 'Abdos', emoji: '💪', equipment: 'corps', muscles: ['Fléchisseurs de hanche'], difficulty: 2 },
    { name: 'Relevé de jambes banc', category: 'Abdos', emoji: '💪', equipment: 'corps', muscles: [], difficulty: 1 },
    { name: 'Wheel rollout', category: 'Abdos', emoji: '⚙️', equipment: 'autre', muscles: ['Épaules', 'Dos'], difficulty: 3 },
    { name: 'Cable crunch', category: 'Abdos', emoji: '🔵', equipment: 'câble', muscles: [], difficulty: 2 },
    { name: 'Dead bug', category: 'Abdos', emoji: '💪', equipment: 'corps', muscles: ['Lombaires'], difficulty: 2 },
    { name: 'Mountain climber', category: 'Abdos', emoji: '💪', equipment: 'corps', muscles: ['Épaules'], difficulty: 2 },
    { name: 'Dragon flag', category: 'Abdos', emoji: '💪', equipment: 'corps', muscles: [], difficulty: 3, description: 'Exercice de Bruce Lee' },
  ],

  // ─ RUNNING ─
  running: [
    { name: 'Sortie facile (Z1/Z2)', category: 'Endurance', emoji: '🏃‍♂️', description: 'Conversation possible à tout moment' },
    { name: 'Sortie longue', category: 'Endurance', emoji: '🏃‍♂️', description: '90min+ à allure confortable' },
    { name: 'Fractionné court 200m', category: 'Vitesse', emoji: '⚡' },
    { name: 'Fractionné 400m', category: 'Vitesse', emoji: '⚡' },
    { name: 'Fractionné 800m', category: 'Vitesse', emoji: '⚡' },
    { name: 'Fractionné 1000m', category: 'Vitesse', emoji: '⚡' },
    { name: 'Tempo / seuil anaérobie', category: 'Seuil', emoji: '🔥', description: 'Allure "inconfortablement rapide"' },
    { name: 'Allure spécifique marathon', category: 'Compétition', emoji: '🎯' },
    { name: 'Allure spécifique semi', category: 'Compétition', emoji: '🎯' },
    { name: 'Allure spécifique 10km', category: 'Compétition', emoji: '🎯' },
    { name: 'Côtes 30s', category: 'Force', emoji: '⛰️' },
    { name: 'Côtes longues (2min)', category: 'Force', emoji: '⛰️' },
    { name: 'Fartlek', category: 'Mixte', emoji: '🎲', description: 'Alternance intensités aléatoires' },
    { name: 'Récupération active', category: 'Récup', emoji: '😌' },
    { name: 'Séance piste (200-800m)', category: 'Piste', emoji: '🏟️' },
    { name: 'Trail facile', category: 'Trail', emoji: '🌲' },
    { name: 'Trail technique', category: 'Trail', emoji: '⛰️' },
  ],

  // ─ CYCLING ─
  cycling: [
    { name: 'Sortie endurance Z2', category: 'Endurance', emoji: '🚵', description: 'Base aérobie 2-4h' },
    { name: 'Sortie longue', category: 'Endurance', emoji: '🚵' },
    { name: 'Fractionné VO2max', category: 'Vitesse', emoji: '⚡', description: '5×5min à intensité max' },
    { name: 'Ascension col', category: 'Grimpe', emoji: '⛰️' },
    { name: 'Tempo / sweetspot', category: 'Seuil', emoji: '🔥', description: '85-95% FTP' },
    { name: 'Sprint', category: 'Vitesse', emoji: '💨' },
    { name: 'Neuromuscular (sprint court)', category: 'Vitesse', emoji: '⚡', description: '5-8s max power' },
    { name: 'Home-trainer Z2', category: 'Intérieur', emoji: '🏠' },
    { name: 'Home-trainer fractionné', category: 'Intérieur', emoji: '⚡' },
    { name: 'Récupération active', category: 'Récup', emoji: '😌' },
    { name: 'Critérium / course', category: 'Compétition', emoji: '🏆' },
  ],

  // ─ SWIMMING ─
  swimming: [
    { name: 'Nage libre (crawl)', category: 'Endurance', emoji: '🏊‍♀️' },
    { name: 'Brasse', category: 'Technique', emoji: '🏊', description: 'Nage 4 nages' },
    { name: 'Dos crawlé', category: 'Technique', emoji: '🏊' },
    { name: 'Papillon', category: 'Technique', emoji: '🦋', description: 'La plus exigeante' },
    { name: 'Quatre nages (IM)', category: 'Mixte', emoji: '🔄' },
    { name: 'Fractionné 50m', category: 'Vitesse', emoji: '⚡' },
    { name: 'Fractionné 100m', category: 'Vitesse', emoji: '⚡' },
    { name: 'Drills technique', category: 'Technique', emoji: '🎯', description: 'Exercices de placement corps' },
    { name: 'Descente 100×100m', category: 'Endurance', emoji: '🔢' },
    { name: 'Pull buoy (bras seul)', category: 'Bras', emoji: '💪' },
    { name: 'Palmes (jambes seul)', category: 'Jambes', emoji: '🦵' },
    { name: 'Récupération', category: 'Récup', emoji: '😌' },
    { name: 'Open water', category: 'Lac/mer', emoji: '🌊' },
  ],

  // ─ HIKING ─
  hiking: [
    { name: 'Randonnée facile', category: 'Facile', emoji: '🥾', description: 'Moins de 300m D+' },
    { name: 'Randonnée moyenne', category: 'Moyen', emoji: '🏔️', description: '300–800m D+' },
    { name: 'Randonnée difficile', category: 'Difficile', emoji: '⛰️', description: '800m+ D+' },
    { name: 'Trail running', category: 'Trail', emoji: '🏃‍♂️' },
    { name: 'Via ferrata', category: 'Escalade', emoji: '🧗' },
    { name: 'Raquettes hivernales', category: 'Hiver', emoji: '❄️' },
    { name: 'Trekking multi-jours', category: 'Expédition', emoji: '🗺️' },
    { name: 'Snowshoe', category: 'Hiver', emoji: '❄️' },
    { name: 'Marche nordique', category: 'Facile', emoji: '🏃' },
  ],

  // ─ FOOTBALL ─
  football: [
    { name: 'Match complet (90min)', category: 'Match', emoji: '⚽' },
    { name: 'Match réduit', category: 'Match', emoji: '⚽' },
    { name: 'Futsal', category: 'Match', emoji: '⚽' },
    { name: 'Entraînement technique', category: 'Technique', emoji: '🎯' },
    { name: 'Tirs au but', category: 'Technique', emoji: '🥅' },
    { name: 'Fractionné foot (navettes)', category: 'Physique', emoji: '⚡' },
    { name: 'Jonglages', category: 'Technique', emoji: '🎪' },
    { name: 'Dribbles / slalom', category: 'Technique', emoji: '🏃' },
    { name: 'Passes courtes', category: 'Technique', emoji: '🎯' },
    { name: 'Passes longues', category: 'Technique', emoji: '📏' },
    { name: 'Préparation physique', category: 'Physique', emoji: '💪' },
  ],

  // ─ TENNIS ─
  tennis: [
    { name: 'Match simple', category: 'Match', emoji: '🎾' },
    { name: 'Match double', category: 'Match', emoji: '🎾' },
    { name: 'Entraînement revers', category: 'Technique', emoji: '🎯' },
    { name: 'Travail du service', category: 'Technique', emoji: '💥' },
    { name: 'Échange fond de court', category: 'Technique', emoji: '🎯' },
    { name: 'Volée au filet', category: 'Technique', emoji: '⚡' },
    { name: 'Préparation physique', category: 'Physique', emoji: '💪' },
    { name: 'Sparring informel', category: 'Match', emoji: '🤝' },
    { name: 'Machine à balles', category: 'Technique', emoji: '🤖' },
  ],

  // ─ BADMINTON ─
  badminton: [
    { name: 'Match simple', category: 'Match', emoji: '🏸' },
    { name: 'Match double', category: 'Match', emoji: '🏸' },
    { name: 'Entraînement smash', category: 'Technique', emoji: '💥' },
    { name: 'Frappe au filet', category: 'Technique', emoji: '🎯' },
    { name: 'Déplacements', category: 'Physique', emoji: '🏃' },
    { name: 'Multi-navettes', category: 'Physique', emoji: '⚡' },
    { name: 'Sparring technique', category: 'Match', emoji: '🤝' },
    { name: 'Service et retour', category: 'Technique', emoji: '🎯' },
  ],

  // ─ YOGA ─
  yoga: [
    { name: 'Hatha doux', category: 'Hatha', emoji: '🕉️', description: 'Postures statiques lentes' },
    { name: 'Vinyasa flow', category: 'Vinyasa', emoji: '🌊', description: 'Enchaînements fluides' },
    { name: 'Yin Yoga', category: 'Yin', emoji: '☯️', description: 'Postures tenues 3-5 min' },
    { name: 'Ashtanga', category: 'Ashtanga', emoji: '🔥', description: 'Série de postures dynamique' },
    { name: 'Power Yoga', category: 'Power', emoji: '💪' },
    { name: 'Yoga restaurateur', category: 'Détente', emoji: '😌' },
    { name: 'Méditation guidée', category: 'Méditation', emoji: '🧘' },
    { name: 'Pranayama', category: 'Respiration', emoji: '💨', description: 'Techniques de souffle' },
    { name: 'Yoga nidra', category: 'Relaxation', emoji: '🌙', description: 'Sommeil yogique' },
    { name: 'Bikram (chaud)', category: 'Chaud', emoji: '🌡️' },
  ],

  // ─ BOXING ─
  boxing: [
    { name: 'Sac de frappe', category: 'Sac', emoji: '🥊' },
    { name: 'Pattes d\'ours', category: 'Pattes', emoji: '🐻', description: 'Combinaisons sur coussinets' },
    { name: 'Sparring léger', category: 'Sparring', emoji: '🤜' },
    { name: 'Sparring technique', category: 'Sparring', emoji: '🥊' },
    { name: 'Corde à sauter', category: 'Cardio', emoji: '⚡', description: 'Cardio-coordination' },
    { name: 'Shadow boxing', category: 'Technique', emoji: '👤' },
    { name: 'Combinaisons', category: 'Technique', emoji: '🎯' },
    { name: 'Compétition amateur', category: 'Combat', emoji: '🏆' },
    { name: 'Mitaines', category: 'Pattes', emoji: '🧤' },
    { name: 'Frappe sur target', category: 'Précision', emoji: '🎯' },
    { name: 'Defense / esquives', category: 'Défense', emoji: '🛡️' },
  ],

  // ─ ATHLETICS ─
  athletics: [
    { name: '60m', category: 'Sprint', emoji: '⚡', unit: 's' },
    { name: '100m', category: 'Sprint', emoji: '⚡', unit: 's' },
    { name: '200m', category: 'Sprint', emoji: '⚡', unit: 's' },
    { name: '400m', category: 'Sprint', emoji: '⚡', unit: 's' },
    { name: '800m', category: 'Demi-fond', emoji: '🏃', unit: 's' },
    { name: '1500m', category: 'Demi-fond', emoji: '🏃', unit: 's' },
    { name: '3000m steeple', category: 'Demi-fond', emoji: '🏃', unit: 's' },
    { name: '5000m', category: 'Fond', emoji: '🏃', unit: 's' },
    { name: '10000m', category: 'Fond', emoji: '🏃', unit: 's' },
    { name: 'Saut en longueur', category: 'Sauts', emoji: '🦘', unit: 'm' },
    { name: 'Saut en hauteur', category: 'Sauts', emoji: '🦘', unit: 'm' },
    { name: 'Triple saut', category: 'Sauts', emoji: '🦘', unit: 'm' },
    { name: 'Saut à la perche', category: 'Sauts', emoji: '🏋️', unit: 'm' },
    { name: 'Lancer de poids', category: 'Lancers', emoji: '⚾', unit: 'm' },
    { name: 'Lancer de disque', category: 'Lancers', emoji: '🥏', unit: 'm' },
    { name: 'Lancer de javelot', category: 'Lancers', emoji: '🏹', unit: 'm' },
    { name: 'Lancer de marteau', category: 'Lancers', emoji: '🔨', unit: 'm' },
    { name: 'Décathlon / Heptathlon', category: 'Combiné', emoji: '🌟', unit: 'points' },
  ],
}

// ── Exercise categories for gym (for UI grouping) ─────────────

export const GYM_MUSCLE_GROUPS = [
  { key: 'Pectoraux',   label: 'Pectoraux',  color: '#EF4444', emoji: '💪' },
  { key: 'Dos',         label: 'Dos',        color: '#3B82F6', emoji: '🔵' },
  { key: 'Trapèzes',    label: 'Trapèzes',   color: '#6366F1', emoji: '🔷' },
  { key: 'Épaules',     label: 'Épaules',    color: '#8B5CF6', emoji: '🟣' },
  { key: 'Biceps',      label: 'Biceps',     color: '#F59E0B', emoji: '💛' },
  { key: 'Triceps',     label: 'Triceps',    color: '#F97316', emoji: '🟠' },
  { key: 'Quadriceps',  label: 'Quadri.',    color: '#10B981', emoji: '🟢' },
  { key: 'Ischio',      label: 'Ischio.',    color: '#059669', emoji: '🟩' },
  { key: 'Fessiers',    label: 'Fessiers',   color: '#EC4899', emoji: '💗' },
  { key: 'Mollets',     label: 'Mollets',    color: '#14B8A6', emoji: '🩵' },
  { key: 'Abdos',       label: 'Abdos',      color: '#06B6D4', emoji: '🩶' },
]

// ── Goal options per sport ─────────────────────────────────────

export const SPORT_GOAL_OPTIONS: Record<SportType, { type: string; label: string; emoji: string; unit: string; values: number[] }[]> = {
  running: [
    { type: 'km',       label: 'Distance',  emoji: '📍', unit: 'km',      values: [10, 20, 30, 40, 50, 60, 80, 100] },
    { type: 'sessions', label: 'Sorties',   emoji: '🏃', unit: 'sorties', values: [1, 2, 3, 4, 5, 6, 7] },
    { type: 'minutes',  label: 'Durée',     emoji: '⏱',  unit: 'min',     values: [60, 90, 120, 180, 240, 300, 360] },
  ],
  cycling: [
    { type: 'km',       label: 'Distance',  emoji: '📍', unit: 'km',      values: [50, 100, 150, 200, 300, 400] },
    { type: 'sessions', label: 'Sorties',   emoji: '🚴', unit: 'sorties', values: [1, 2, 3, 4, 5] },
    { type: 'minutes',  label: 'Durée',     emoji: '⏱',  unit: 'min',     values: [60, 120, 180, 240, 360, 480] },
  ],
  swimming: [
    { type: 'km',       label: 'Distance',  emoji: '📍', unit: 'km',      values: [1, 2, 5, 8, 10, 15, 20, 25] },
    { type: 'sessions', label: 'Séances',   emoji: '🏊', unit: 'séances', values: [1, 2, 3, 4, 5] },
    { type: 'minutes',  label: 'Durée',     emoji: '⏱',  unit: 'min',     values: [30, 60, 90, 120, 180] },
  ],
  gym: [
    { type: 'sessions', label: 'Séances',   emoji: '🏋️', unit: 'séances', values: [1, 2, 3, 4, 5, 6] },
    { type: 'minutes',  label: 'Durée',     emoji: '⏱',  unit: 'min',     values: [60, 90, 120, 150, 180, 240, 300] },
  ],
  hiking: [
    { type: 'km',       label: 'Distance',  emoji: '📍', unit: 'km',      values: [5, 10, 20, 30, 50, 80, 100] },
    { type: 'sessions', label: 'Sorties',   emoji: '🥾', unit: 'sorties', values: [1, 2, 3, 4] },
    { type: 'minutes',  label: 'Durée',     emoji: '⏱',  unit: 'min',     values: [60, 120, 180, 240, 360] },
  ],
  football: [
    { type: 'sessions', label: 'Matchs/entr.', emoji: '⚽', unit: 'séances', values: [1, 2, 3, 4, 5] },
    { type: 'minutes',  label: 'Durée',        emoji: '⏱',  unit: 'min',     values: [60, 90, 120, 180, 240] },
  ],
  tennis: [
    { type: 'sessions', label: 'Séances',   emoji: '🎾', unit: 'séances', values: [1, 2, 3, 4, 5] },
    { type: 'minutes',  label: 'Durée',     emoji: '⏱',  unit: 'min',     values: [60, 90, 120, 150, 180] },
  ],
  badminton: [
    { type: 'sessions', label: 'Séances',   emoji: '🏸', unit: 'séances', values: [1, 2, 3, 4, 5] },
    { type: 'minutes',  label: 'Durée',     emoji: '⏱',  unit: 'min',     values: [60, 90, 120, 150, 180] },
  ],
  boxing: [
    { type: 'sessions', label: 'Entraîne.', emoji: '🥊', unit: 'séances', values: [1, 2, 3, 4, 5, 6] },
    { type: 'minutes',  label: 'Durée',     emoji: '⏱',  unit: 'min',     values: [30, 60, 90, 120, 150, 180] },
  ],
  yoga: [
    { type: 'sessions', label: 'Séances',   emoji: '🧘', unit: 'séances', values: [1, 2, 3, 4, 5, 6, 7] },
    { type: 'minutes',  label: 'Durée',     emoji: '⏱',  unit: 'min',     values: [30, 60, 90, 120, 150] },
  ],
  athletics: [
    { type: 'sessions', label: 'Entraîne.', emoji: '⚡', unit: 'séances', values: [1, 2, 3, 4, 5, 6] },
    { type: 'minutes',  label: 'Durée',     emoji: '⏱',  unit: 'min',     values: [60, 90, 120, 150, 180] },
  ],
}

export const GLOBAL_GOAL_OPTIONS = [
  { type: 'sessions', label: 'Séances',  emoji: '🏅', unit: 'séances', values: [1, 2, 3, 4, 5, 6, 7, 10, 14] },
  { type: 'minutes',  label: 'Minutes',  emoji: '⏱',  unit: 'min',     values: [60, 90, 120, 150, 180, 210, 240, 300, 360] },
  { type: 'km',       label: 'Distance', emoji: '📍',  unit: 'km',      values: [10, 20, 30, 40, 50, 75, 100, 150, 200] },
]
