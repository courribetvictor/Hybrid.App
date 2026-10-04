import type { Activity, SportType } from '@/types/database'
import { SPORT_BY_KEY } from '@/constants/sportCatalog'
import { buildHybridIntelligence } from '@/lib/v10/intelligence'
import { buildLifeSnapshot, type LifeCheckin } from '@/lib/v11/life'
import type { AdaptiveGoal, AdaptivePreferences, TrainingPhase } from '@/constants/v12'

export type AdaptiveSession = {
  id: string
  date: string
  sport: SportType
  title: string
  durationMinutes: number
  intensity: 'recovery' | 'easy' | 'moderate' | 'hard'
  purpose: string
  why: string[]
  source: 'adaptive'
  status: 'planned' | 'adapted' | 'optional'
  confidence: number
}

export type AdaptiveDecision = {
  kind: 'keep' | 'reduce' | 'move' | 'replace' | 'rest' | 'progress'
  title: string
  explanation: string
  impact: string
  confidence: number
}

export type DigitalTwinInsight = {
  title: string
  value: string
  detail: string
  confidence: number
  tone: 'positive' | 'neutral' | 'warning'
}

export type AdaptiveSnapshot = {
  phase: TrainingPhase
  phaseWeek: number
  phaseLength: number
  headline: string
  trainingState: string
  plan: AdaptiveSession[]
  decisions: AdaptiveDecision[]
  twin: DigitalTwinInsight[]
  loadForecast: number[]
  adherenceEstimate: number
  planConfidence: number
  nextBestAction: string
  why: string[]
}

const clamp = (n:number,a=0,b=100)=>Math.max(a,Math.min(b,n))
const isoDay=(date:Date)=>date.toISOString().slice(0,10)
const sportLabel=(sport:string)=>SPORT_BY_KEY[sport]?.label??sport
const minutes=(a:Activity)=>Math.max(0,Math.round((a.duration_seconds??0)/60))
const recent=(xs:Activity,days:number)=>xs.filter(a=>Date.now()-new Date(a.performed_at??a.created_at).getTime()<=days*86400000)

function inferPhase(goals:AdaptiveGoal[], lifeScore:number, loadRatio:number):TrainingPhase {
  if (lifeScore < 48 || loadRatio > 1.6) return 'recovery'
  const deadlines = goals.map(g=>g.deadline).filter(Boolean).map(d=>Math.ceil((new Date(d!).getTime()-Date.now())/86400000)).filter(d=>d>=0)
  const nearest = deadlines.length ? Math.min(...deadlines) : 999
  if (nearest <= 7) return 'competition'
  if (nearest <= 21) return 'peak'
  if (goals.length) return 'build'
  return 'base'
}

function pickSport(goals:AdaptiveGoal[], favorites:SportType[], index:number):SportType {
  const priority = [...goals].sort((a,b)=>a.priority-b.priority).map(g=>g.sport).filter(Boolean) as SportType[]
  const pool = [...new Set([...priority, ...favorites])]
  return pool[index % Math.max(1,pool.length)] ?? 'running'
}

function sessionTemplate(sport:SportType, phase:TrainingPhase, slot:number, hardAllowed:boolean){
  const family=SPORT_BY_KEY[sport]?.family
  if(['running','trail_running','cycling','swimming','open_water_swimming','rowing'].includes(sport)){
    if(hardAllowed && slot%3===1 && phase!=='recovery') return {title:'Séance qualité',intensity:'hard' as const,purpose:'Stimulus spécifique sans surcharger la semaine'}
    if(slot%4===0) return {title:'Endurance fondamentale',intensity:'easy' as const,purpose:'Développer la base aérobie et favoriser la récupération'}
    return {title:'Endurance contrôlée',intensity:'moderate' as const,purpose:'Accumuler du travail utile à intensité maîtrisée'}
  }
  if(['gym','bodybuilding','powerlifting','weightlifting','crossfit','calisthenics'].includes(sport)||family==='strength_fitness'){
    if(phase==='recovery') return {title:'Technique & mobilité',intensity:'easy' as const,purpose:'Entretenir les patterns en limitant la fatigue'}
    return slot%2===0?{title:'Force / qualité',intensity:hardAllowed?'hard' as const:'moderate' as const,purpose:'Faire progresser les mouvements prioritaires'}:{title:'Volume contrôlé',intensity:'moderate' as const,purpose:'Construire du volume de qualité sans épuiser la récupération'}
  }
  if(family==='racket') return {title:hardAllowed?'Technique + intensité':'Technique & déplacements',intensity:hardAllowed?'hard' as const:'moderate' as const,purpose:'Faire progresser technique, appuis et capacité spécifique'}
  if(family==='combat') return {title:hardAllowed?'Rounds spécifiques':'Technique & mobilité',intensity:hardAllowed?'hard' as const:'moderate' as const,purpose:'Développer le sport sans empiler une charge inutile'}
  if(family==='team_ball') return {title:'Séance spécifique',intensity:hardAllowed?'hard' as const:'moderate' as const,purpose:'Travailler les qualités utiles au jeu'}
  return {title:'Séance spécifique',intensity:'moderate' as const,purpose:'Maintenir une pratique régulière et mesurable'}
}

export function buildAdaptiveSnapshot(
  activities:Activity[],
  favorites:SportType[] = [],
  preferences:AdaptivePreferences,
  checkin:LifeCheckin = {},
):AdaptiveSnapshot {
  const intel=buildHybridIntelligence(activities)
  const life=buildLifeSnapshot(activities,checkin)
  const phase=inferPhase(preferences.goals,life.score,intel.loadRatio)
  const now=new Date(); const monday=new Date(now); const diff=(now.getDay()+6)%7; monday.setDate(now.getDate()-diff)
  const hardBudget = phase==='recovery'?0:phase==='competition'?1:Math.max(1,preferences.maxHardSessionsPerWeek)
  let hardUsed=0, sessionIndex=0
  const plan:AdaptiveSession[]=[]
  const whyGlobal=[`Hybrid Life ${life.score}/100`,`Charge ${intel.loadRatio.toFixed(2)}× ta base`,`État ${intel.state.toUpperCase()}`]

  for(let i=0;i<7;i++){
    const d=new Date(monday);d.setDate(monday.getDate()+i)
    const availability=preferences.availability.find(a=>a.day===d.getDay())
    if(!availability?.enabled||d.getDay()===preferences.preferredRestDay)continue
    const sport=pickSport(preferences.goals,favorites,sessionIndex)
    const hardAllowed=hardUsed<hardBudget && life.score>=58 && intel.fatigue<76
    const tmpl=sessionTemplate(sport,phase,sessionIndex,hardAllowed)
    if(tmpl.intensity==='hard')hardUsed++
    let dur=Math.min(availability.minutes,preferences.preferredSessionMinutes)
    if(phase==='recovery')dur=Math.min(dur,40)
    if(life.score<60)dur=Math.round(dur*.75)
    if(phase==='competition')dur=Math.round(dur*.82)
    const adapted=life.score<65||intel.loadRatio>1.4
    plan.push({
      id:`adaptive_${isoDay(d)}_${sport}`,
      date:isoDay(d),sport,title:`${sportLabel(sport)} · ${tmpl.title}`,durationMinutes:Math.max(20,dur),intensity:tmpl.intensity,
      purpose:tmpl.purpose,why:[...whyGlobal,availability.minutes<preferences.preferredSessionMinutes?`Disponibilité limitée à ${availability.minutes} min`:`Créneau disponible ${availability.minutes} min`],source:'adaptive',status:adapted?'adapted':'planned',confidence:clamp(62+recent(activities,28).length*1.5+(preferences.goals.length?8:0),60,94)
    })
    sessionIndex++
  }

  const decisions:AdaptiveDecision[]=[]
  if(intel.loadRatio>1.5) decisions.push({kind:'reduce',title:'Réduire la charge immédiate',explanation:`Ta charge 7 jours est à ${intel.loadRatio.toFixed(2)}× ta base.`,impact:'-20 à -30 % de volume sur la prochaine séance',confidence:88})
  if(life.score<50) decisions.push({kind:'rest',title:'Transformer la séance dure en récupération',explanation:`Hybrid Life est à ${life.score}/100.`,impact:'Repos, marche ou technique très légère',confidence:91})
  if(intel.state==='peak'&&life.score>=75) decisions.push({kind:'progress',title:'Fenêtre de performance',explanation:'Forme haute, fatigue contrôlée et récupération favorable.',impact:'Conserver la séance clé prévue',confidence:84})
  if(!decisions.length) decisions.push({kind:'keep',title:'Plan stable',explanation:'Aucun signal fort ne justifie une modification majeure aujourd’hui.',impact:'Conserver le plan et réévaluer après la prochaine séance',confidence:78})

  const d28=recent(activities,28), d7=recent(activities,7)
  const avgRpe=d28.length?d28.reduce((s,a)=>s+(a.rpe??5),0)/d28.length:5
  const preferredHour=(()=>{const hours=d28.map(a=>new Date(a.performed_at??a.created_at).getHours());if(!hours.length)return null;return Math.round(hours.reduce((a,b)=>a+b,0)/hours.length)})()
  const twin:DigitalTwinInsight[]=[
    {title:'Récupération estimée',value:life.score>=75?'Rapide':life.score>=55?'Normale':'Lente',detail:`Basée sur ton Life Score (${life.score}) et ta charge récente.`,confidence:clamp(55+d28.length*1.4,55,90),tone:life.score>=65?'positive':'warning'},
    {title:'Tolérance actuelle',value:`${Math.round(intel.chronicLoad)} pts/sem`,detail:'Base de charge estimée sur les 4 dernières semaines.',confidence:clamp(50+d28.length*1.6,50,92),tone:'neutral'},
    {title:'Effort perçu moyen',value:`RPE ${avgRpe.toFixed(1)}`,detail:'Ton niveau moyen déclaré sur les séances récentes.',confidence:d28.length?88:40,tone:avgRpe<7?'positive':'warning'},
    {title:'Créneau habituel',value:preferredHour==null?'À apprendre':`${String(preferredHour).padStart(2,'0')}h`,detail:'Heure moyenne de tes séances, utile pour personnaliser le planning.',confidence:preferredHour==null?25:clamp(45+d28.length*2,45,88),tone:'neutral'},
  ]

  const base=Math.max(10,intel.chronicLoad||intel.acuteLoad||20)
  const phaseFactor=phase==='recovery'?.72:phase==='base'?.9:phase==='build'?1.08:phase==='peak'?.96:.72
  const loadForecast=Array.from({length:6},(_,i)=>Math.round(base*Math.pow(phaseFactor,Math.min(i+1,3))))
  const adherenceEstimate=clamp(55+preferences.availability.filter(a=>a.enabled).length*4+(life.score-50)*.25-(intel.fatigue>75?10:0),45,94)
  const planConfidence=clamp(48+d28.length*1.5+(preferences.goals.length*8)+(checkin.sleepHours?6:0),50,95)
  const next=plan.find(s=>s.date>=isoDay(now))??plan[0]
  const headline=phase==='recovery'?'Assimile avant de repartir':phase==='competition'?'Arrive frais, pas fatigué':phase==='peak'?'Transforme ta forme en performance':phase==='build'?'Construis sans brûler les étapes':'Construis ta base'
  return{phase,phaseWeek:1,phaseLength:phase==='competition'?1:phase==='recovery'?1:4,headline,trainingState:intel.state,plan,decisions,twin,loadForecast,adherenceEstimate:Math.round(adherenceEstimate),planConfidence:Math.round(planConfidence),nextBestAction:next?`${next.title} · ${next.durationMinutes} min`:'Récupération et check-in',why:whyGlobal}
}

export function simulateScenario(snapshot:AdaptiveSnapshot, scenario:'more_volume'|'miss_session'|'competition'|'poor_sleep'){
  if(scenario==='more_volume')return{title:'+25 % de volume',effect:'Charge monte rapidement',risk:'Récupération plus exigeante',recommendation:snapshot.phase==='build'?'Augmente plutôt de 5–10 % puis réévalue.':'Évite cette hausse dans la phase actuelle.'}
  if(scenario==='miss_session')return{title:'Séance ratée',effect:'Impact faible sur une semaine isolée',risk:'Rattrapage agressif inutile',recommendation:'Ne double pas le lendemain : replace seulement la séance clé si nécessaire.'}
  if(scenario==='competition')return{title:'Compétition ajoutée',effect:'Devient la séance prioritaire de la semaine',risk:'Fatigue si tu gardes toutes les séances dures',recommendation:'Réduis le volume 24–72 h avant selon le sport.'}
  return{title:'Mauvaise nuit',effect:'Readiness probablement plus basse',risk:'Technique et prise de décision peuvent se dégrader',recommendation:'Garde la séance facile ou réduis la séance intense de 20–30 %.'}
}
