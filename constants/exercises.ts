import type { SportType } from '@/types/database'
export interface ExerciseTemplate { name:string; category:string; muscles?:string[]; equipment?:string; instructions?:string }
export const GYM_MUSCLE_GROUPS=[{key:'Pectoraux',label:'Pectoraux',emoji:'🫁',color:'#EF4444'},{key:'Dos',label:'Dos',emoji:'🦅',color:'#3B82F6'},{key:'Jambes',label:'Jambes',emoji:'🦵',color:'#22C55E'},{key:'Épaules',label:'Épaules',emoji:'🏋️',color:'#8B5CF6'},{key:'Bras',label:'Bras',emoji:'💪',color:'#F59E0B'},{key:'Core',label:'Core',emoji:'⚡',color:'#EC4899'}]
const gym:ExerciseTemplate[]=[
{name:'Développé couché',category:'Pectoraux',muscles:['pectoraux','triceps'],equipment:'Barre'},
{name:'Pompes',category:'Pectoraux',muscles:['pectoraux','triceps'],equipment:'Poids du corps'},
{name:'Tractions',category:'Dos',muscles:['grand dorsal','biceps'],equipment:'Barre fixe'},
{name:'Rowing barre',category:'Dos',muscles:['dos','biceps'],equipment:'Barre'},
{name:'Squat',category:'Jambes',muscles:['quadriceps','fessiers'],equipment:'Barre'},
{name:'Soulevé de terre',category:'Jambes',muscles:['ischios','dos'],equipment:'Barre'},
{name:'Développé militaire',category:'Épaules',muscles:['deltoïdes','triceps'],equipment:'Barre'},
{name:'Curl biceps',category:'Bras',muscles:['biceps'],equipment:'Haltères'},
{name:'Dips',category:'Bras',muscles:['triceps','pectoraux'],equipment:'Poids du corps'},
{name:'Gainage',category:'Core',muscles:['abdominaux'],equipment:'Poids du corps'}]
const generic=(category:string,names:string[]):ExerciseTemplate[]=>names.map(name=>({name,category}))
export const EXERCISE_DB:Record<SportType,ExerciseTemplate[]>={gym,running:generic('Course',['Endurance fondamentale','Tempo','Fractionné court','Fractionné long','Sortie longue']),cycling:generic('Vélo',['Endurance','Intervalles','Côte']),swimming:generic('Natation',['Crawl','Brasse','Dos','Papillon']),hiking:generic('Randonnée',['Randonnée']),football:generic('Football',['Match','Entraînement']),tennis:generic('Tennis',['Match','Entraînement']),badminton:generic('Badminton',['Simple','Double','Entraînement']),boxing:generic('Boxe',['Sac','Sparring','Technique']),athletics:generic('Athlétisme',['Sprint','Demi-fond','Saut','Lancer']),yoga:generic('Yoga',['Hatha','Vinyasa','Yin'])}
export const GLOBAL_GOAL_OPTIONS=[{type:'sessions',label:'Séances',unit:'séances',emoji:'🏅'},{type:'minutes',label:'Minutes',unit:'min',emoji:'⏱'}]
export const SPORT_GOAL_OPTIONS:Record<SportType,any[]> = Object.fromEntries((Object.keys(EXERCISE_DB) as SportType[]).map(s=>[s,[...GLOBAL_GOAL_OPTIONS,...(['running','cycling','swimming','hiking'].includes(s)?[{type:'km',label:'Distance',unit:'km',emoji:'📍'}]:[])]])) as any
