import { SkillColors } from './theme'

export type AthleteClassKey = 'powerhouse'|'runner'|'velocity'|'racket_ace'|'team_engine'|'fighter'|'explorer'|'hybrid'
export type AthleteClass = {
  key: AthleteClassKey
  name: string
  subtitle: string
  description: string
  icon: string
  color: string
  color2: string
  xpBoost: number
  boostLabel: string
  skill: 'strength'|'endurance'|'speed'|'consistency'|'versatility'|'progression'
  recommendedFamilies: string[]
}

export const ATHLETE_CLASSES: AthleteClass[] = [
  {key:'powerhouse',name:'Powerhouse',subtitle:'Force & masse',description:'Pour la musculation, le powerlifting, l’haltérophilie et le CrossFit.',icon:'Dumbbell',color:'#EF4444',color2:'#FB7185',xpBoost:.10,boostLabel:'+10 % XP Force',skill:'strength',recommendedFamilies:['strength_fitness']},
  {key:'runner',name:'Runner',subtitle:'Endurance & moteur',description:'Pour la course, le trail, le triathlon et les sports d’endurance.',icon:'Footprints',color:'#1587FF',color2:'#22D3EE',xpBoost:.10,boostLabel:'+10 % XP Endurance',skill:'endurance',recommendedFamilies:['running_endurance','cycling','aquatic']},
  {key:'velocity',name:'Velocity',subtitle:'Vitesse & explosivité',description:'Pour sprinter, sauter, accélérer et devenir plus explosif.',icon:'Zap',color:'#F59E0B',color2:'#FDE047',xpBoost:.10,boostLabel:'+10 % XP Vitesse',skill:'speed',recommendedFamilies:['athletics_gymnastics']},
  {key:'racket_ace',name:'Racket Ace',subtitle:'Appuis & précision',description:'Pour badminton, tennis, padel, squash, tennis de table et sports de raquette.',icon:'Target',color:'#84CC16',color2:'#22C55E',xpBoost:.10,boostLabel:'+10 % XP Raquette',skill:'progression',recommendedFamilies:['racket']},
  {key:'team_engine',name:'Team Engine',subtitle:'Collectif & répétition',description:'Pour football, basket, handball, rugby, volley et sports collectifs.',icon:'Users',color:'#10B981',color2:'#34D399',xpBoost:.10,boostLabel:'+10 % XP Collectif',skill:'consistency',recommendedFamilies:['team_ball']},
  {key:'fighter',name:'Fighter',subtitle:'Combat & résilience',description:'Pour boxe, MMA, judo, BJJ et arts martiaux.',icon:'Shield',color:'#F97316',color2:'#EF4444',xpBoost:.10,boostLabel:'+10 % XP Combat',skill:'strength',recommendedFamilies:['combat']},
  {key:'explorer',name:'Explorer',subtitle:'Outdoor & aventure',description:'Pour randonnée, escalade, ski, surf, kayak et sports outdoor.',icon:'Mountain',color:'#8B5CF6',color2:'#22D3EE',xpBoost:.10,boostLabel:'+10 % XP Outdoor',skill:'versatility',recommendedFamilies:['climbing_mountain','winter','board_action','paddle_boat']},
  {key:'hybrid',name:'Hybrid',subtitle:'Tout-terrain',description:'Pour celles et ceux qui refusent de choisir une seule spécialité.',icon:'Sparkles',color:'#315CFF',color2:'#A78BFA',xpBoost:.07,boostLabel:'+7 % XP partout',skill:'versatility',recommendedFamilies:[]},
]

export const CLASS_BY_KEY = Object.fromEntries(ATHLETE_CLASSES.map(c=>[c.key,c])) as Record<AthleteClassKey,AthleteClass>

export const PRO_PLANS = {
  free:{name:'Hybrid Free',price:'0 €',period:'toujours',features:['Suivi multisport illimité','Hybrid Score & grades','Live essentiel','Classements publics','Coach de base']},
  monthly:{name:'Hybrid Pro',price:'5,99 €',period:'/ mois',trialDays:14,features:['Coach avancé illimité','Analyses & tendances avancées','Plans adaptatifs multi-sports','Live+ & Activity Story complète','Statistiques longue durée','Ligues et défis Pro','Thèmes, badges & cosmétiques Pro']},
  yearly:{name:'Hybrid Pro Annuel',price:'39,99 €',period:'/ an',trialDays:14,badge:'ÉCONOMISE 44 %',features:['Tout Hybrid Pro','≈ 3,33 € / mois','Deux mois bonus vs mensuel']},
} as const

export const SPORT_LEADERBOARD_METRICS = [
  {sport:'running',label:'Course',metrics:[{key:'5k',label:'5 km',unit:'temps',lowerBetter:true},{key:'10k',label:'10 km',unit:'temps',lowerBetter:true},{key:'half',label:'Semi-marathon',unit:'temps',lowerBetter:true},{key:'marathon',label:'Marathon',unit:'temps',lowerBetter:true}]},
  {sport:'swimming',label:'Natation',metrics:[{key:'100_free',label:'100 m nage libre',unit:'temps',lowerBetter:true},{key:'400_free',label:'400 m nage libre',unit:'temps',lowerBetter:true},{key:'1500_free',label:'1500 m',unit:'temps',lowerBetter:true}]},
  {sport:'cycling',label:'Cyclisme',metrics:[{key:'20min_power',label:'Puissance 20 min',unit:'W',lowerBetter:false},{key:'40k',label:'40 km',unit:'temps',lowerBetter:true}]},
  {sport:'gym',label:'Force',metrics:[{key:'squat_1rm',label:'Squat 1RM',unit:'kg',lowerBetter:false},{key:'bench_1rm',label:'Développé couché 1RM',unit:'kg',lowerBetter:false},{key:'deadlift_1rm',label:'Soulevé de terre 1RM',unit:'kg',lowerBetter:false}]},
] as const

export const COMPETITIVE_LEVELS = [
  'Loisir','Départemental','Régional','National 3','National 2','National 1','Élite / Pro','International'
] as const

export const V5_SKILL_ACCENTS = {
  strength:SkillColors.strength,endurance:SkillColors.endurance,speed:SkillColors.speed,
  consistency:SkillColors.consistency,versatility:SkillColors.versatility,progression:SkillColors.progression,
}
