import type { SportType } from '@/types/database'

export type SportFamilyKey =
  | 'running_endurance' | 'cycling' | 'aquatic' | 'racket' | 'team_ball'
  | 'strength_fitness' | 'combat' | 'climbing_mountain' | 'winter'
  | 'board_action' | 'mind_body' | 'athletics_gymnastics' | 'precision'
  | 'paddle_boat'

export type MetricFieldType = 'number' | 'text' | 'select' | 'boolean'
export interface MetricOption { value: string; label: string }
export interface MetricField {
  key: string
  label: string
  type: MetricFieldType
  unit?: string
  placeholder?: string
  required?: boolean
  decimals?: boolean
  options?: MetricOption[]
}

export interface SportDefinition {
  key: SportType
  label: string
  shortLabel?: string
  emoji: string
  family: SportFamilyKey
  color: string
  aliases?: string[]
  sessionTypes: MetricOption[]
  metrics: MetricField[]
  coachFocus: string[]
}

export interface SportFamily {
  key: SportFamilyKey
  label: string
  emoji: string
  description: string
}

export const SPORT_FAMILIES: SportFamily[] = [
  { key: 'running_endurance', label: 'Course & endurance', emoji: '🏃', description: 'Course, trail, marche, triathlon et endurance.' },
  { key: 'cycling', label: 'Cyclisme', emoji: '🚴', description: 'Route, VTT, gravel, BMX et vélo indoor.' },
  { key: 'aquatic', label: 'Sports aquatiques', emoji: '🏊', description: 'Natation, eau libre, water-polo et disciplines aquatiques.' },
  { key: 'racket', label: 'Sports de raquette', emoji: '🎾', description: 'Tennis, badminton, padel, ping-pong, squash…' },
  { key: 'team_ball', label: 'Sports collectifs & ballon', emoji: '⚽', description: 'Football, basket, rugby, volley, handball et plus.' },
  { key: 'strength_fitness', label: 'Force & fitness', emoji: '🏋️', description: 'Musculation, CrossFit, powerlifting, calisthenics…' },
  { key: 'combat', label: 'Sports de combat', emoji: '🥊', description: 'Boxe, judo, MMA, BJJ, karaté, escrime…' },
  { key: 'climbing_mountain', label: 'Escalade & montagne', emoji: '🧗', description: 'Escalade, bloc, alpinisme et via ferrata.' },
  { key: 'winter', label: 'Sports d’hiver', emoji: '⛷️', description: 'Ski, snowboard, biathlon et patinage.' },
  { key: 'board_action', label: 'Glisse & action', emoji: '🏄', description: 'Surf, skate, roller, kite et windsurf.' },
  { key: 'mind_body', label: 'Mobilité & corps-esprit', emoji: '🧘', description: 'Yoga, Pilates, mobilité, stretching et danse.' },
  { key: 'athletics_gymnastics', label: 'Athlétisme & gymnastique', emoji: '🏟️', description: 'Piste, sauts, lancers, gymnastique et trampoline.' },
  { key: 'precision', label: 'Précision & adresse', emoji: '🎯', description: 'Golf, tir à l’arc, bowling, pétanque et fléchettes.' },
  { key: 'paddle_boat', label: 'Rame & navigation', emoji: '🚣', description: 'Aviron, kayak, canoë, paddle et voile.' },
]

const commonEndurance: MetricField[] = [
  { key: 'distance_km', label: 'Distance', type: 'number', unit: 'km', decimals: true, placeholder: '10,0' },
  { key: 'avg_heart_rate', label: 'FC moyenne', type: 'number', unit: 'bpm', placeholder: '150' },
  { key: 'max_heart_rate', label: 'FC max', type: 'number', unit: 'bpm', placeholder: '178' },
  { key: 'elevation_m', label: 'Dénivelé +', type: 'number', unit: 'm', placeholder: '120' },
]
const matchMetrics: MetricField[] = [
  { key: 'opponent', label: 'Adversaire / équipe', type: 'text', placeholder: 'Nom (facultatif)' },
  { key: 'score_for', label: 'Score pour', type: 'number', placeholder: '2' },
  { key: 'score_against', label: 'Score contre', type: 'number', placeholder: '1' },
  { key: 'match_won', label: 'Victoire', type: 'boolean' },
]
const racketMetrics: MetricField[] = [
  ...matchMetrics,
  { key: 'sets_for', label: 'Sets gagnés', type: 'number', placeholder: '2' },
  { key: 'sets_against', label: 'Sets perdus', type: 'number', placeholder: '1' },
]
const teamMetrics: MetricField[] = [
  ...matchMetrics,
  { key: 'goals_points', label: 'Buts / points personnels', type: 'number', placeholder: '0' },
  { key: 'assists', label: 'Passes décisives', type: 'number', placeholder: '0' },
]
const strengthMetrics: MetricField[] = [
  { key: 'workout_focus', label: 'Objectif', type: 'select', options: [
    { value: 'strength', label: 'Force' }, { value: 'hypertrophy', label: 'Hypertrophie' },
    { value: 'power', label: 'Puissance' }, { value: 'conditioning', label: 'Conditionnement' },
    { value: 'technique', label: 'Technique' },
  ]},
  { key: 'total_volume_kg', label: 'Volume total', type: 'number', unit: 'kg', placeholder: '5000' },
]
const combatMetrics: MetricField[] = [
  { key: 'rounds', label: 'Rounds', type: 'number', placeholder: '6' },
  { key: 'round_duration_min', label: 'Durée / round', type: 'number', unit: 'min', decimals: true, placeholder: '3' },
  { key: 'sparring', label: 'Sparring', type: 'boolean' },
  { key: 'avg_heart_rate', label: 'FC moyenne', type: 'number', unit: 'bpm', placeholder: '155' },
]
const climbingMetrics: MetricField[] = [
  { key: 'grade', label: 'Cotation max', type: 'text', placeholder: '6b / V4…' },
  { key: 'routes', label: 'Voies / blocs réussis', type: 'number', placeholder: '8' },
  { key: 'attempts', label: 'Essais', type: 'number', placeholder: '15' },
  { key: 'elevation_m', label: 'Dénivelé / hauteur', type: 'number', unit: 'm', placeholder: '30' },
]

const TRAIN = [{ value: 'training', label: 'Entraînement' }]
const MATCH = [{ value: 'match', label: 'Match' }, ...TRAIN]
const ENDURANCE = [
  { value: 'easy', label: 'Endurance facile' }, { value: 'tempo', label: 'Tempo / seuil' },
  { value: 'intervals', label: 'Fractionné' }, { value: 'long', label: 'Sortie longue' },
  { value: 'race', label: 'Compétition' }, { value: 'recovery', label: 'Récupération' },
]
const RACKET = [
  { value: 'match', label: 'Match' }, { value: 'technique', label: 'Technique' },
  { value: 'footwork', label: 'Déplacements / footwork' }, { value: 'drills', label: 'Exercices / répétitions' },
  { value: 'conditioning', label: 'Physique spécifique' },
]
const STRENGTH = [
  { value: 'strength', label: 'Force' }, { value: 'hypertrophy', label: 'Hypertrophie' },
  { value: 'power', label: 'Puissance' }, { value: 'conditioning', label: 'Conditionnement' },
  { value: 'technique', label: 'Technique' },
]

const defs: SportDefinition[] = [
  // Course & endurance
  { key:'running', label:'Course à pied', shortLabel:'Course', emoji:'🏃', family:'running_endurance', color:'#FF5A5F', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['endurance','vitesse','économie de course','progression de charge'] },
  { key:'trail_running', label:'Trail', emoji:'⛰️', family:'running_endurance', color:'#C65D2E', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['dénivelé','endurance','technicité','force des jambes'] },
  { key:'walking', label:'Marche sportive', emoji:'🚶', family:'running_endurance', color:'#4F7CAC', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['endurance douce','cadence','régularité'] },
  { key:'nordic_walking', label:'Marche nordique', emoji:'🥢', family:'running_endurance', color:'#52796F', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['coordination','endurance','posture'] },
  { key:'hiking', label:'Randonnée', shortLabel:'Rando', emoji:'🥾', family:'running_endurance', color:'#8B5E3C', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['endurance','dénivelé','gestion d’effort'] },
  { key:'obstacle_course', label:'Course à obstacles / OCR', emoji:'🧱', family:'running_endurance', color:'#7C4D32', sessionTypes:ENDURANCE, metrics:[...commonEndurance,{key:'obstacles',label:'Obstacles',type:'number',placeholder:'20'}], coachFocus:['course','grip','force','agilité'] },
  { key:'triathlon', label:'Triathlon', emoji:'🏊‍♂️', family:'running_endurance', color:'#0077B6', sessionTypes:[{value:'brick',label:'Enchaînement'}, {value:'race',label:'Compétition'}, ...TRAIN], metrics:commonEndurance, coachFocus:['natation','vélo','course','transitions'] },
  { key:'duathlon', label:'Duathlon', emoji:'🏃‍♂️', family:'running_endurance', color:'#F97316', sessionTypes:[{value:'brick',label:'Enchaînement'}, {value:'race',label:'Compétition'}, ...TRAIN], metrics:commonEndurance, coachFocus:['course','vélo','transitions'] },

  // Cyclisme
  { key:'cycling', label:'Cyclisme sur route', shortLabel:'Vélo', emoji:'🚴', family:'cycling', color:'#00A6FB', sessionTypes:ENDURANCE, metrics:[...commonEndurance,{key:'avg_power_w',label:'Puissance moyenne',type:'number',unit:'W',placeholder:'180'}], coachFocus:['endurance','puissance','cadence'] },
  { key:'mountain_biking', label:'VTT', emoji:'🚵', family:'cycling', color:'#2D6A4F', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['technicité','puissance','dénivelé'] },
  { key:'gravel_cycling', label:'Gravel', emoji:'🚲', family:'cycling', color:'#A98467', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['endurance','terrain mixte','gestion d’effort'] },
  { key:'bmx', label:'BMX', emoji:'🚲', family:'cycling', color:'#D97706', sessionTypes:[{value:'track',label:'Piste'}, {value:'street',label:'Street'}, ...TRAIN], metrics:[{key:'runs',label:'Runs',type:'number',placeholder:'10'}], coachFocus:['explosivité','technique','sprints'] },
  { key:'track_cycling', label:'Cyclisme sur piste', emoji:'🚴', family:'cycling', color:'#2563EB', sessionTypes:ENDURANCE, metrics:[...commonEndurance,{key:'avg_power_w',label:'Puissance moyenne',type:'number',unit:'W'}], coachFocus:['puissance','vitesse','cadence'] },
  { key:'cyclocross', label:'Cyclo-cross', emoji:'🚵', family:'cycling', color:'#7C2D12', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['puissance','technique','relances'] },
  { key:'indoor_cycling', label:'Vélo indoor / spinning', emoji:'🚴‍♀️', family:'cycling', color:'#0284C7', sessionTypes:ENDURANCE, metrics:[{key:'avg_heart_rate',label:'FC moyenne',type:'number',unit:'bpm'},{key:'avg_power_w',label:'Puissance moyenne',type:'number',unit:'W'}], coachFocus:['cardio','puissance','cadence'] },

  // Aquatique
  { key:'swimming', label:'Natation', emoji:'🏊', family:'aquatic', color:'#00B4D8', sessionTypes:[{value:'endurance',label:'Endurance'},{value:'intervals',label:'Séries'},{value:'technique',label:'Technique'},{value:'sprint',label:'Sprint'},{value:'race',label:'Compétition'}], metrics:[{key:'distance_m',label:'Distance',type:'number',unit:'m',placeholder:'1500'},{key:'pool_length_m',label:'Longueur bassin',type:'select',options:[{value:'25',label:'25 m'},{value:'50',label:'50 m'},{value:'open',label:'Eau libre'}]},{key:'stroke',label:'Nage principale',type:'select',options:[{value:'freestyle',label:'Crawl'},{value:'breaststroke',label:'Brasse'},{value:'backstroke',label:'Dos'},{value:'butterfly',label:'Papillon'},{value:'mixed',label:'4 nages / mixte'}]},{key:'avg_heart_rate',label:'FC moyenne',type:'number',unit:'bpm'}], coachFocus:['technique','endurance','allure au 100 m','efficacité'] },
  { key:'open_water_swimming', label:'Natation en eau libre', emoji:'🌊', family:'aquatic', color:'#0284C7', sessionTypes:ENDURANCE, metrics:[{key:'distance_m',label:'Distance',type:'number',unit:'m'}, {key:'water_temp_c',label:'Température eau',type:'number',unit:'°C',decimals:true}, {key:'avg_heart_rate',label:'FC moyenne',type:'number',unit:'bpm'}], coachFocus:['navigation','endurance','respiration'] },
  { key:'water_polo', label:'Water-polo', emoji:'🤽', family:'aquatic', color:'#0369A1', sessionTypes:MATCH, metrics:teamMetrics, coachFocus:['natation','explosivité','tir','tactique'] },
  { key:'diving', label:'Plongeon', emoji:'🤿', family:'aquatic', color:'#0E7490', sessionTypes:TRAIN, metrics:[{key:'dives',label:'Plongeons',type:'number'},{key:'platform_m',label:'Hauteur',type:'number',unit:'m',decimals:true}], coachFocus:['technique','gainage','mobilité'] },
  { key:'artistic_swimming', label:'Natation artistique', emoji:'🩱', family:'aquatic', color:'#0891B2', sessionTypes:TRAIN, metrics:[{key:'routines',label:'Routines',type:'number'},{key:'avg_heart_rate',label:'FC moyenne',type:'number',unit:'bpm'}], coachFocus:['apnée','coordination','mobilité','force'] },

  // Raquette
  { key:'tennis', label:'Tennis', emoji:'🎾', family:'racket', color:'#84CC16', sessionTypes:RACKET, metrics:racketMetrics, coachFocus:['service','retour','déplacements','endurance spécifique'] },
  { key:'badminton', label:'Badminton', emoji:'🏸', family:'racket', color:'#22C55E', sessionTypes:RACKET, metrics:racketMetrics, coachFocus:['footwork','explosivité','smash','endurance intermittente'] },
  { key:'padel', label:'Padel', emoji:'🎾', family:'racket', color:'#10B981', sessionTypes:RACKET, metrics:racketMetrics, coachFocus:['déplacements','volée','vitre','coordination en double'] },
  { key:'table_tennis', label:'Tennis de table / ping-pong', shortLabel:'Ping-pong', emoji:'🏓', family:'racket', color:'#EF4444', sessionTypes:RACKET, metrics:racketMetrics, coachFocus:['réactivité','service','rotation','déplacements courts'] },
  { key:'squash', label:'Squash', emoji:'🎾', family:'racket', color:'#F59E0B', sessionTypes:RACKET, metrics:racketMetrics, coachFocus:['endurance','T-position','explosivité','longueurs'] },
  { key:'racquetball', label:'Racquetball', emoji:'🎾', family:'racket', color:'#FB923C', sessionTypes:RACKET, metrics:racketMetrics, coachFocus:['réactivité','placement','puissance'] },
  { key:'pickleball', label:'Pickleball', emoji:'🏓', family:'racket', color:'#65A30D', sessionTypes:RACKET, metrics:racketMetrics, coachFocus:['placement','volée','réactivité'] },
  { key:'beach_tennis', label:'Beach tennis', emoji:'🏖️', family:'racket', color:'#EAB308', sessionTypes:RACKET, metrics:racketMetrics, coachFocus:['explosivité','volée','déplacements sable'] },

  // Collectifs
  { key:'football', label:'Football', emoji:'⚽', family:'team_ball', color:'#16A34A', sessionTypes:MATCH, metrics:[...teamMetrics,{key:'position',label:'Poste',type:'text',placeholder:'Milieu'}], coachFocus:['endurance intermittente','accélérations','technique','force'] },
  { key:'futsal', label:'Futsal', emoji:'⚽', family:'team_ball', color:'#15803D', sessionTypes:MATCH, metrics:teamMetrics, coachFocus:['agilité','explosivité','technique'] },
  { key:'basketball', label:'Basket-ball', emoji:'🏀', family:'team_ball', color:'#F97316', sessionTypes:MATCH, metrics:[...teamMetrics,{key:'rebounds',label:'Rebonds',type:'number'},{key:'minutes_played',label:'Minutes jouées',type:'number',unit:'min'}], coachFocus:['détente','agilité','tir','conditionnement'] },
  { key:'volleyball', label:'Volley-ball', emoji:'🏐', family:'team_ball', color:'#EAB308', sessionTypes:MATCH, metrics:[...matchMetrics,{key:'aces',label:'Aces',type:'number'},{key:'blocks',label:'Contres',type:'number'}], coachFocus:['détente','réactivité','épaule','technique'] },
  { key:'beach_volleyball', label:'Beach-volley', emoji:'🏐', family:'team_ball', color:'#FACC15', sessionTypes:MATCH, metrics:matchMetrics, coachFocus:['détente','déplacements sable','endurance'] },
  { key:'handball', label:'Handball', emoji:'🤾', family:'team_ball', color:'#2563EB', sessionTypes:MATCH, metrics:teamMetrics, coachFocus:['tir','détente','sprints','épaule'] },
  { key:'rugby', label:'Rugby', emoji:'🏉', family:'team_ball', color:'#166534', sessionTypes:MATCH, metrics:[...teamMetrics,{key:'tackles',label:'Plaquages',type:'number'}], coachFocus:['puissance','sprints','contacts','endurance'] },
  { key:'american_football', label:'Football américain', emoji:'🏈', family:'team_ball', color:'#92400E', sessionTypes:MATCH, metrics:teamMetrics, coachFocus:['puissance','vitesse','agilité','contacts'] },
  { key:'baseball', label:'Baseball', emoji:'⚾', family:'team_ball', color:'#DC2626', sessionTypes:MATCH, metrics:[...matchMetrics,{key:'hits',label:'Hits',type:'number'},{key:'runs',label:'Runs',type:'number'}], coachFocus:['lancer','frappe','sprint','rotation'] },
  { key:'softball', label:'Softball', emoji:'🥎', family:'team_ball', color:'#EA580C', sessionTypes:MATCH, metrics:matchMetrics, coachFocus:['lancer','frappe','sprint'] },
  { key:'field_hockey', label:'Hockey sur gazon', emoji:'🏑', family:'team_ball', color:'#0F766E', sessionTypes:MATCH, metrics:teamMetrics, coachFocus:['endurance','sprints','maniement de crosse'] },
  { key:'ice_hockey', label:'Hockey sur glace', emoji:'🏒', family:'team_ball', color:'#334155', sessionTypes:MATCH, metrics:teamMetrics, coachFocus:['patinage','puissance','sprints'] },
  { key:'lacrosse', label:'Lacrosse', emoji:'🥍', family:'team_ball', color:'#7C3AED', sessionTypes:MATCH, metrics:teamMetrics, coachFocus:['vitesse','coordination','tir'] },
  { key:'cricket', label:'Cricket', emoji:'🏏', family:'team_ball', color:'#059669', sessionTypes:MATCH, metrics:[...matchMetrics,{key:'runs',label:'Runs',type:'number'},{key:'wickets',label:'Wickets',type:'number'}], coachFocus:['frappe','lancer','sprint'] },
  { key:'ultimate', label:'Ultimate frisbee', emoji:'🥏', family:'team_ball', color:'#06B6D4', sessionTypes:MATCH, metrics:[...matchMetrics,{key:'assists',label:'Assists',type:'number'}], coachFocus:['sprints','agilité','lancer','endurance'] },

  // Force & fitness
  { key:'gym', label:'Musculation', shortLabel:'Muscu', emoji:'🏋️', family:'strength_fitness', color:'#7B61FF', sessionTypes:STRENGTH, metrics:strengthMetrics, coachFocus:['force','hypertrophie','technique','progression'] },
  { key:'bodybuilding', label:'Bodybuilding', emoji:'💪', family:'strength_fitness', color:'#8B5CF6', sessionTypes:STRENGTH, metrics:strengthMetrics, coachFocus:['hypertrophie','volume','symétrie'] },
  { key:'powerlifting', label:'Powerlifting', emoji:'🏋️', family:'strength_fitness', color:'#6D28D9', sessionTypes:STRENGTH, metrics:[...strengthMetrics,{key:'squat_kg',label:'Squat',type:'number',unit:'kg'},{key:'bench_kg',label:'Développé couché',type:'number',unit:'kg'},{key:'deadlift_kg',label:'Soulevé de terre',type:'number',unit:'kg'}], coachFocus:['squat','bench','deadlift','force maximale'] },
  { key:'weightlifting', label:'Haltérophilie', emoji:'🏋️‍♀️', family:'strength_fitness', color:'#5B21B6', sessionTypes:STRENGTH, metrics:[...strengthMetrics,{key:'snatch_kg',label:'Arraché',type:'number',unit:'kg'},{key:'clean_jerk_kg',label:'Épaulé-jeté',type:'number',unit:'kg'}], coachFocus:['puissance','technique','mobilité'] },
  { key:'crossfit', label:'CrossFit', emoji:'🔥', family:'strength_fitness', color:'#EF4444', sessionTypes:[{value:'wod',label:'WOD'},{value:'strength',label:'Force'},{value:'skill',label:'Skill'},{value:'metcon',label:'Metcon'}], metrics:[{key:'wod_name',label:'WOD',type:'text'},{key:'score',label:'Score / résultat',type:'text'},{key:'rx',label:'RX',type:'boolean'}], coachFocus:['force','gymnastique','conditioning','technique'] },
  { key:'calisthenics', label:'Calisthenics / street workout', emoji:'🤸', family:'strength_fitness', color:'#0EA5E9', sessionTypes:STRENGTH, metrics:[{key:'skill',label:'Skill principal',type:'text',placeholder:'Muscle-up, front lever…'},{key:'sets',label:'Séries',type:'number'},{key:'reps',label:'Répétitions',type:'number'}], coachFocus:['force relative','skills','gainage','mobilité'] },
  { key:'functional_training', label:'Entraînement fonctionnel', emoji:'🧰', family:'strength_fitness', color:'#14B8A6', sessionTypes:STRENGTH, metrics:strengthMetrics, coachFocus:['force','mobilité','conditionnement'] },
  { key:'circuit_training', label:'Circuit training', emoji:'🔁', family:'strength_fitness', color:'#F97316', sessionTypes:STRENGTH, metrics:[{key:'rounds',label:'Tours',type:'number'},{key:'work_sec',label:'Travail',type:'number',unit:'s'},{key:'rest_sec',label:'Repos',type:'number',unit:'s'}], coachFocus:['conditionnement','endurance musculaire'] },
  { key:'kettlebell', label:'Kettlebell', emoji:'🔔', family:'strength_fitness', color:'#475569', sessionTypes:STRENGTH, metrics:strengthMetrics, coachFocus:['puissance','grip','conditionnement'] },
  { key:'strongman', label:'Strongman', emoji:'🪨', family:'strength_fitness', color:'#78350F', sessionTypes:STRENGTH, metrics:strengthMetrics, coachFocus:['force maximale','portés','grip','puissance'] },

  // Combat
  { key:'boxing', label:'Boxe anglaise', shortLabel:'Boxe', emoji:'🥊', family:'combat', color:'#EF4444', sessionTypes:[{value:'bag',label:'Sac'},{value:'pads',label:'Pattes d’ours'},{value:'sparring',label:'Sparring'},{value:'technique',label:'Technique'},{value:'fight',label:'Combat'}], metrics:combatMetrics, coachFocus:['cardio','jeu de jambes','vitesse','technique'] },
  { key:'kickboxing', label:'Kick-boxing', emoji:'🥊', family:'combat', color:'#DC2626', sessionTypes:TRAIN, metrics:combatMetrics, coachFocus:['cardio','combinaisons','mobilité'] },
  { key:'muay_thai', label:'Muay-thaï', emoji:'🥊', family:'combat', color:'#B91C1C', sessionTypes:TRAIN, metrics:combatMetrics, coachFocus:['clinche','frappes','conditionnement'] },
  { key:'mma', label:'MMA', emoji:'🥋', family:'combat', color:'#991B1B', sessionTypes:TRAIN, metrics:combatMetrics, coachFocus:['striking','grappling','conditionnement'] },
  { key:'judo', label:'Judo', emoji:'🥋', family:'combat', color:'#1D4ED8', sessionTypes:TRAIN, metrics:[{key:'randori',label:'Randoris',type:'number'},{key:'techniques',label:'Techniques travaillées',type:'text'}], coachFocus:['uchikomi','grip','explosivité','mobilité'] },
  { key:'bjj', label:'Jiu-jitsu brésilien', shortLabel:'BJJ', emoji:'🥋', family:'combat', color:'#2563EB', sessionTypes:TRAIN, metrics:[{key:'rolls',label:'Rounds / rolls',type:'number'},{key:'submissions',label:'Soumissions',type:'number'}], coachFocus:['grappling','mobilité','grip','endurance'] },
  { key:'karate', label:'Karaté', emoji:'🥋', family:'combat', color:'#F59E0B', sessionTypes:TRAIN, metrics:combatMetrics, coachFocus:['vitesse','katas','kumite','mobilité'] },
  { key:'taekwondo', label:'Taekwondo', emoji:'🥋', family:'combat', color:'#0EA5E9', sessionTypes:TRAIN, metrics:combatMetrics, coachFocus:['souplesse','vitesse de jambes','explosivité'] },
  { key:'wrestling', label:'Lutte', emoji:'🤼', family:'combat', color:'#92400E', sessionTypes:TRAIN, metrics:[{key:'rounds',label:'Rounds',type:'number'},{key:'takedowns',label:'Amenées au sol',type:'number'}], coachFocus:['grip','explosivité','conditionnement'] },
  { key:'fencing', label:'Escrime', emoji:'🤺', family:'combat', color:'#64748B', sessionTypes:MATCH, metrics:[...matchMetrics,{key:'touches',label:'Touches marquées',type:'number'}], coachFocus:['réactivité','fentes','précision','footwork'] },

  // Escalade
  { key:'climbing', label:'Escalade', emoji:'🧗', family:'climbing_mountain', color:'#D97706', sessionTypes:[{value:'lead',label:'Difficulté'},{value:'top_rope',label:'Moulinette'},{value:'training',label:'Entraînement'}], metrics:climbingMetrics, coachFocus:['grip','technique','endurance avant-bras','mobilité'] },
  { key:'bouldering', label:'Bloc', emoji:'🧗‍♀️', family:'climbing_mountain', color:'#EA580C', sessionTypes:TRAIN, metrics:climbingMetrics, coachFocus:['puissance','coordination','grip'] },
  { key:'mountaineering', label:'Alpinisme', emoji:'🏔️', family:'climbing_mountain', color:'#475569', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['endurance','dénivelé','technicité','sécurité'] },
  { key:'via_ferrata', label:'Via ferrata', emoji:'🧗', family:'climbing_mountain', color:'#A16207', sessionTypes:TRAIN, metrics:climbingMetrics, coachFocus:['endurance','grip','aisance verticale'] },

  // Hiver
  { key:'alpine_skiing', label:'Ski alpin', emoji:'⛷️', family:'winter', color:'#38BDF8', sessionTypes:TRAIN, metrics:[{key:'distance_km',label:'Distance',type:'number',unit:'km',decimals:true},{key:'vertical_m',label:'Dénivelé',type:'number',unit:'m'},{key:'runs',label:'Descentes',type:'number'}], coachFocus:['jambes','équilibre','technique'] },
  { key:'cross_country_skiing', label:'Ski de fond', emoji:'🎿', family:'winter', color:'#0EA5E9', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['endurance','technique','haut du corps'] },
  { key:'snowboarding', label:'Snowboard', emoji:'🏂', family:'winter', color:'#0284C7', sessionTypes:TRAIN, metrics:[{key:'distance_km',label:'Distance',type:'number',unit:'km',decimals:true},{key:'vertical_m',label:'Dénivelé',type:'number',unit:'m'}], coachFocus:['équilibre','jambes','technique'] },
  { key:'biathlon', label:'Biathlon', emoji:'🎿', family:'winter', color:'#1E40AF', sessionTypes:ENDURANCE, metrics:[...commonEndurance,{key:'shooting_accuracy',label:'Précision tir',type:'number',unit:'%',placeholder:'85'}], coachFocus:['endurance','tir sous fatigue','technique'] },
  { key:'ice_skating', label:'Patinage sur glace', emoji:'⛸️', family:'winter', color:'#60A5FA', sessionTypes:TRAIN, metrics:[{key:'distance_km',label:'Distance',type:'number',unit:'km',decimals:true}], coachFocus:['équilibre','technique','jambes'] },

  // Glisse/action
  { key:'skateboarding', label:'Skateboard', emoji:'🛹', family:'board_action', color:'#64748B', sessionTypes:TRAIN, metrics:[{key:'tricks_landed',label:'Figures réussies',type:'number'},{key:'new_trick',label:'Nouvelle figure',type:'text'}], coachFocus:['équilibre','coordination','technique'] },
  { key:'surfing', label:'Surf', emoji:'🏄', family:'board_action', color:'#06B6D4', sessionTypes:TRAIN, metrics:[{key:'waves',label:'Vagues prises',type:'number'},{key:'wave_height_m',label:'Hauteur vagues',type:'number',unit:'m',decimals:true}], coachFocus:['rame','équilibre','pop-up','mobilité'] },
  { key:'kitesurfing', label:'Kitesurf', emoji:'🪁', family:'board_action', color:'#14B8A6', sessionTypes:TRAIN, metrics:[{key:'distance_km',label:'Distance',type:'number',unit:'km',decimals:true},{key:'wind_knots',label:'Vent',type:'number',unit:'kt'}], coachFocus:['équilibre','gainage','technique'] },
  { key:'windsurfing', label:'Windsurf', emoji:'🏄‍♂️', family:'board_action', color:'#0891B2', sessionTypes:TRAIN, metrics:[{key:'distance_km',label:'Distance',type:'number',unit:'km',decimals:true},{key:'wind_knots',label:'Vent',type:'number',unit:'kt'}], coachFocus:['équilibre','gainage','technique'] },
  { key:'roller_skating', label:'Roller', emoji:'🛼', family:'board_action', color:'#EC4899', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['endurance','équilibre','technique'] },
  { key:'inline_skating', label:'Roller vitesse', emoji:'🛼', family:'board_action', color:'#DB2777', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['vitesse','endurance','technique'] },

  // Corps-esprit
  { key:'yoga', label:'Yoga', emoji:'🧘', family:'mind_body', color:'#D946EF', sessionTypes:[{value:'hatha',label:'Hatha'},{value:'vinyasa',label:'Vinyasa'},{value:'yin',label:'Yin'},{value:'ashtanga',label:'Ashtanga'},{value:'power',label:'Power'}], metrics:[{key:'mobility_focus',label:'Zone travaillée',type:'text',placeholder:'Hanches, dos…'},{key:'avg_heart_rate',label:'FC moyenne',type:'number',unit:'bpm'}], coachFocus:['mobilité','respiration','contrôle'] },
  { key:'pilates', label:'Pilates', emoji:'🧘‍♀️', family:'mind_body', color:'#C026D3', sessionTypes:TRAIN, metrics:[{key:'level',label:'Niveau',type:'select',options:[{value:'beginner',label:'Débutant'},{value:'intermediate',label:'Intermédiaire'},{value:'advanced',label:'Avancé'}]}], coachFocus:['gainage','contrôle','mobilité'] },
  { key:'stretching', label:'Stretching', emoji:'🤸', family:'mind_body', color:'#A855F7', sessionTypes:TRAIN, metrics:[{key:'focus',label:'Zone',type:'text',placeholder:'Ischios, hanches…'}], coachFocus:['souplesse','récupération'] },
  { key:'mobility', label:'Mobilité', emoji:'🤸', family:'mind_body', color:'#9333EA', sessionTypes:TRAIN, metrics:[{key:'focus',label:'Articulation / zone',type:'text',placeholder:'Chevilles, épaules…'}], coachFocus:['amplitude','contrôle articulaire'] },
  { key:'dance', label:'Danse', emoji:'💃', family:'mind_body', color:'#F43F5E', sessionTypes:TRAIN, metrics:[{key:'style',label:'Style',type:'text',placeholder:'Hip-hop, salsa…'}], coachFocus:['coordination','cardio','rythme'] },

  // Athlétisme/gymnastique
  { key:'athletics', label:'Athlétisme', shortLabel:'Athlé', emoji:'🏟️', family:'athletics_gymnastics', color:'#F59E0B', sessionTypes:[{value:'sprint',label:'Sprint'},{value:'middle_distance',label:'Demi-fond'},{value:'long_distance',label:'Fond'},{value:'jumps',label:'Sauts'},{value:'throws',label:'Lancers'},{value:'race',label:'Compétition'}], metrics:[{key:'event',label:'Épreuve',type:'text',placeholder:'100 m, 1500 m, longueur…'},{key:'result',label:'Performance',type:'text',placeholder:'11.80 s / 6.20 m'}], coachFocus:['vitesse','puissance','technique','endurance selon épreuve'] },
  { key:'gymnastics', label:'Gymnastique', emoji:'🤸‍♀️', family:'athletics_gymnastics', color:'#EC4899', sessionTypes:TRAIN, metrics:[{key:'apparatus',label:'Agrès',type:'text',placeholder:'Sol, anneaux…'},{key:'skills',label:'Éléments travaillés',type:'text'}], coachFocus:['force','mobilité','technique','coordination'] },
  { key:'trampoline', label:'Trampoline', emoji:'🤸', family:'athletics_gymnastics', color:'#F472B6', sessionTypes:TRAIN, metrics:[{key:'skills',label:'Figures',type:'text'}], coachFocus:['coordination','gainage','technique'] },

  // Précision
  { key:'golf', label:'Golf', emoji:'⛳', family:'precision', color:'#16A34A', sessionTypes:[{value:'round',label:'Parcours'},{value:'range',label:'Practice'}], metrics:[{key:'holes',label:'Trous',type:'number',placeholder:'18'},{key:'score',label:'Score',type:'number'},{key:'fairways_pct',label:'Fairways',type:'number',unit:'%'}], coachFocus:['technique','régularité','mobilité'] },
  { key:'archery', label:'Tir à l’arc', emoji:'🏹', family:'precision', color:'#A16207', sessionTypes:TRAIN, metrics:[{key:'arrows',label:'Flèches',type:'number'},{key:'score',label:'Score',type:'number'},{key:'distance_m',label:'Distance',type:'number',unit:'m'}], coachFocus:['stabilité','précision','routine'] },
  { key:'darts', label:'Fléchettes', emoji:'🎯', family:'precision', color:'#DC2626', sessionTypes:MATCH, metrics:[...matchMetrics,{key:'average',label:'Moyenne',type:'number',decimals:true}], coachFocus:['précision','routine','concentration'] },
  { key:'bowling', label:'Bowling', emoji:'🎳', family:'precision', color:'#7C3AED', sessionTypes:MATCH, metrics:[{key:'games',label:'Parties',type:'number'},{key:'score',label:'Meilleur score',type:'number'}], coachFocus:['précision','répétabilité','technique'] },
  { key:'petanque', label:'Pétanque', emoji:'🔵', family:'precision', color:'#64748B', sessionTypes:MATCH, metrics:matchMetrics, coachFocus:['précision','gestuelle','stratégie'] },

  // Rame/navigation
  { key:'rowing', label:'Aviron', emoji:'🚣', family:'paddle_boat', color:'#0EA5E9', sessionTypes:ENDURANCE, metrics:[...commonEndurance,{key:'stroke_rate',label:'Cadence',type:'number',unit:'spm'}], coachFocus:['endurance','technique','puissance'] },
  { key:'kayaking', label:'Kayak', emoji:'🛶', family:'paddle_boat', color:'#0284C7', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['endurance','technique de pagaie','gainage'] },
  { key:'canoeing', label:'Canoë', emoji:'🛶', family:'paddle_boat', color:'#0369A1', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['endurance','pagaie','gainage'] },
  { key:'stand_up_paddle', label:'Stand-up paddle', shortLabel:'SUP', emoji:'🏄', family:'paddle_boat', color:'#0891B2', sessionTypes:ENDURANCE, metrics:commonEndurance, coachFocus:['équilibre','gainage','endurance'] },
  { key:'sailing', label:'Voile', emoji:'⛵', family:'paddle_boat', color:'#2563EB', sessionTypes:TRAIN, metrics:[{key:'distance_km',label:'Distance',type:'number',unit:'km',decimals:true},{key:'wind_knots',label:'Vent',type:'number',unit:'kt'}], coachFocus:['technique','lecture du vent','gainage'] },
]

export const SPORT_CATALOG: SportDefinition[] = defs
export const SPORT_BY_KEY: Record<string, SportDefinition> = Object.fromEntries(defs.map(s => [s.key, s]))
export const SPORTS_BY_FAMILY: Record<SportFamilyKey, SportDefinition[]> = Object.fromEntries(
  SPORT_FAMILIES.map(f => [f.key, defs.filter(s => s.family === f.key)])
) as Record<SportFamilyKey, SportDefinition[]>

export function searchSports(query: string): SportDefinition[] {
  const q = query.trim().toLowerCase()
  if (!q) return defs
  return defs.filter(s => [s.label, s.shortLabel, ...(s.aliases ?? [])].filter(Boolean).some(v => String(v).toLowerCase().includes(q)))
}
