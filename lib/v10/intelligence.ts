import type { Activity, SportType } from '@/types/database'
import { SPORT_BY_KEY } from '@/constants/sportCatalog'
import type { IntelligenceState } from '@/constants/v10'

type ReadinessLike = { score?: number | null } | null | undefined

export type SportSignal = {
  sport: SportType
  label: string
  sessions28d: number
  minutes28d: number
  load28d: number
  trendPct: number
}

export type Prediction = {
  key: '5k'|'10k'|'half'|'marathon'|'strength'
  label: string
  value: string
  confidence: number
  explanation: string
}

export type HybridIntelligence = {
  state: IntelligenceState
  form: number
  fatigue: number
  readiness: number
  progression: number
  consistency: number
  balance: number
  acuteLoad: number
  chronicLoad: number
  loadRatio: number
  weeklyMinutes: number
  previousWeeklyMinutes: number
  recommendations: string[]
  warnings: string[]
  strengths: string[]
  weaknesses: string[]
  sportSignals: SportSignal[]
  predictions: Prediction[]
}

const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n))
const when=(a:Activity)=>new Date(a.performed_at??a.created_at).getTime()
const daysAgo=(d:number)=>Date.now()-d*86400000
const durationMin=(a:Activity)=>Math.max(0,(a.duration_seconds??0)/60)
const effort=(a:Activity)=>{
  const rpe=clamp(a.rpe??5,1,10)
  const verified=a.is_verified?1.06:1
  const intensity=0.65+rpe/16
  const metrics=a.metrics??{}
  const distanceBonus=typeof metrics.distance_km==='number'?Math.min(metrics.distance_km*1.3,25):0
  const elevationBonus=typeof metrics.elevation_m==='number'?Math.min(metrics.elevation_m/100,8):0
  const volumeBonus=typeof metrics.total_volume_kg==='number'?Math.min(metrics.total_volume_kg/1200,10):0
  return Math.max(4,(durationMin(a)*intensity+distanceBonus+elevationBonus+volumeBonus)*verified)
}

function windowActivities(activities:Activity[],start:number,end=Date.now()){
  return activities.filter(a=>{const t=when(a);return t>=start&&t<=end})
}
function sumLoad(xs:Activity[]){return xs.reduce((s,a)=>s+effort(a),0)}
function sumMinutes(xs:Activity[]){return xs.reduce((s,a)=>s+durationMin(a),0)}
function uniqueDays(xs:Activity[]){return new Set(xs.map(a=>new Date(when(a)).toISOString().slice(0,10))).size}
function secondsToClock(sec:number){
  sec=Math.max(1,Math.round(sec)); const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60
  return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`
}
function bestPace(activities:Activity[], minDistance:number){
  let best:number|null=null
  for(const a of activities){
    if(!['running','trail_running'].includes(a.sport_type))continue
    const km=Number(a.metrics?.distance_km??0); if(km<minDistance)continue
    const pace=a.duration_seconds/km
    if(Number.isFinite(pace)&&pace>120&&pace<900)best=best==null?pace:Math.min(best,pace)
  }
  return best
}
function racePrediction(activities:Activity[],dist:number,label:string,key:Prediction['key']):Prediction|null{
  const pace=bestPace(activities,Math.min(5,dist))
  if(!pace)return null
  const baseDist=activities.filter(a=>['running','trail_running'].includes(a.sport_type)).reduce((m,a)=>Math.max(m,Number(a.metrics?.distance_km??0)),0)
  const fatigueFactor=dist>baseDist?1.03+Math.min((dist-baseDist)/100,0.12):1
  const sec=pace*dist*fatigueFactor
  const runs=activities.filter(a=>['running','trail_running'].includes(a.sport_type)).length
  const confidence=clamp(35+runs*4+(baseDist>=dist?20:0),35,92)
  return{key,label,value:secondsToClock(sec),confidence,explanation:`Estimé à partir de tes meilleures allures récentes et de ta distance maximale (${baseDist.toFixed(1)} km).`}
}

export function buildHybridIntelligence(activities:Activity[], readiness?:ReadinessLike):HybridIntelligence{
  const now=Date.now()
  const d7=windowActivities(activities,daysAgo(7),now)
  const prev7=windowActivities(activities,daysAgo(14),daysAgo(7)-1)
  const d28=windowActivities(activities,daysAgo(28),now)
  const prev28=windowActivities(activities,daysAgo(56),daysAgo(28)-1)
  const acuteLoad=sumLoad(d7)
  const chronicLoad=sumLoad(d28)/4
  const loadRatio=chronicLoad>0?acuteLoad/chronicLoad:acuteLoad>0?1:0
  const weeklyMinutes=Math.round(sumMinutes(d7))
  const previousWeeklyMinutes=Math.round(sumMinutes(prev7))
  const ready=clamp(readiness?.score??74)
  const hard48=windowActivities(activities,Date.now()-48*3600000).filter(a=>(a.rpe??0)>=8).length
  const fatigue=clamp(35+Math.max(0,loadRatio-0.9)*34+hard48*8+(100-ready)*0.25)
  const progressionRaw=sumLoad(prev28)>0?(sumLoad(d28)-sumLoad(prev28))/sumLoad(prev28)*100:activities.length?8:0
  const progression=clamp(50+progressionRaw*1.25,0,100)
  const consistency=clamp(uniqueDays(d28)/16*100)
  const families=new Set(d28.map(a=>SPORT_BY_KEY[a.sport_type]?.family??a.sport_type)).size
  const balance=clamp(35+families*11)
  const form=clamp(ready*0.42+(100-fatigue)*0.28+progression*0.18+consistency*0.12)

  let state:IntelligenceState='maintain'
  if(fatigue>=78||loadRatio>=1.65)state='recover'
  else if(ready<45&&fatigue>65)state='reset'
  else if(form>=82&&fatigue<58)state='peak'
  else if(progression>=58&&loadRatio>=0.8&&loadRatio<=1.45)state='building'

  const sportMap=new Map<string,{sessions:number;minutes:number;load:number;prev:number}>()
  for(const a of d28){const x=sportMap.get(a.sport_type)??{sessions:0,minutes:0,load:0,prev:0};x.sessions++;x.minutes+=durationMin(a);x.load+=effort(a);sportMap.set(a.sport_type,x)}
  for(const a of prev28){const x=sportMap.get(a.sport_type)??{sessions:0,minutes:0,load:0,prev:0};x.prev+=effort(a);sportMap.set(a.sport_type,x)}
  const sportSignals=[...sportMap.entries()].map(([sport,x])=>({sport,label:SPORT_BY_KEY[sport]?.label??sport,sessions28d:x.sessions,minutes28d:Math.round(x.minutes),load28d:Math.round(x.load),trendPct:x.prev?Math.round((x.load-x.prev)/x.prev*100):x.load?100:0})).sort((a,b)=>b.load28d-a.load28d)
  const strengths=sportSignals.filter(s=>s.trendPct>=8||s.sessions28d>=6).slice(0,3).map(s=>`${s.label} · ${s.trendPct>=0?'+':''}${s.trendPct}%`)
  const weaknesses=sportSignals.filter(s=>s.trendPct<=-15||s.sessions28d<=1).slice(0,3).map(s=>`${s.label} · ${s.trendPct}%`)
  const warnings:string[]=[]
  if(loadRatio>1.5)warnings.push(`Charge 7 jours élevée (${loadRatio.toFixed(2)}× ta base). Évite d’empiler une nouvelle séance dure.`)
  if(hard48>=2)warnings.push(`${hard48} séances à RPE ≥8 en 48 h : surveille ta récupération.`)
  if(ready<50)warnings.push(`Readiness basse (${ready}/100) : privilégie technique, mobilité ou récupération.`)
  const recommendations:string[]=[]
  if(state==='recover'||state==='reset')recommendations.push('Aujourd’hui : 20–40 min très facile ou repos complet selon tes sensations.')
  else if(state==='peak')recommendations.push('Tu es dans une bonne fenêtre de performance : place une séance clé ou une compétition si elle est prévue.')
  else recommendations.push('Charge productive : garde une séance de qualité et protège les jours faciles.')
  if(families<2&&d28.length>=5)recommendations.push('Ta charge est très concentrée : une séance complémentaire mobilité/renforcement peut améliorer l’équilibre.')
  if(previousWeeklyMinutes>0&&weeklyMinutes>previousWeeklyMinutes*1.3)recommendations.push(`Volume +${Math.round((weeklyMinutes/previousWeeklyMinutes-1)*100)}% cette semaine : évite une nouvelle hausse brutale.`)

  const predictions=[
    racePrediction(d28,5,'5 km','5k'),racePrediction(d28,10,'10 km','10k'),racePrediction(d28,21.0975,'Semi','half'),racePrediction(d28,42.195,'Marathon','marathon'),
  ].filter(Boolean) as Prediction[]
  const gym=d28.filter(a=>a.sport_type==='gym'||a.sport_type==='powerlifting'||a.sport_type==='bodybuilding')
  if(gym.length){
    const best= gym.reduce((m,a)=>Math.max(m,Number(a.metrics?.estimated_1rm_kg??0),Number(a.metrics?.max_weight_kg??0)),0)
    if(best>0)predictions.push({key:'strength',label:'Force',value:`~${Math.round(best)} kg`,confidence:clamp(45+gym.length*5,45,90),explanation:'Meilleure estimation de force issue de tes séances récentes.'})
  }

  return{state,form:Math.round(form),fatigue:Math.round(fatigue),readiness:Math.round(ready),progression:Math.round(progression),consistency:Math.round(consistency),balance:Math.round(balance),acuteLoad:Math.round(acuteLoad),chronicLoad:Math.round(chronicLoad),loadRatio:Number(loadRatio.toFixed(2)),weeklyMinutes,previousWeeklyMinutes,recommendations,warnings,strengths,weaknesses,sportSignals,predictions}
}
