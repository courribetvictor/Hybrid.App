import { useMemo } from 'react'
import type { Activity } from '@/types/database'
import { SPORT_BY_KEY } from '@/constants/sportCatalog'

export type SkillScores = { endurance:number; strength:number; speed:number; consistency:number; versatility:number; progression:number; overall:number }
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)))
const weight=(a:Activity)=>a.is_verified?1:.65

export function useSkills(activities:Activity[]):SkillScores{return useMemo(()=>{const now=Date.now();const last90=activities.filter(a=>now-new Date(a.performed_at||a.created_at).getTime()<90*86400000);const family=(a:Activity)=>SPORT_BY_KEY[a.sport_type]?.family
const enduranceActs=last90.filter(a=>['running_endurance','cycling','aquatic','paddle_boat','winter'].includes(family(a)))
const strengthActs=last90.filter(a=>['strength_fitness','climbing_mountain','combat'].includes(family(a)))
const speedActs=last90.filter(a=>['running_endurance','racket','team_ball','combat','athletics_gymnastics'].includes(family(a)))
const endurance=clamp(enduranceActs.reduce((s,a)=>{const km=Number((a.metrics as any)?.distance_m??0)/1000;return s+(2+Math.min(6,km*.45))*weight(a)},0))
const strength=clamp(strengthActs.reduce((s,a)=>{const volume=Number((a.metrics as any)?.total_volume_kg??0);return s+(4+Math.min(5,volume/2500))*weight(a)},0))
const speed=clamp(speedActs.reduce((s,a)=>s+(a.rpe&&a.rpe>=7?4:2.5)*weight(a),0))
const days=new Set(last90.map(a=>(a.performed_at||a.created_at).slice(0,10))).size;const consistency=clamp(days/45*100)
const sports=new Set(last90.map(a=>a.sport_type)).size;const families=new Set(last90.map(a=>family(a)).filter(Boolean)).size;const versatility=clamp((Math.min(sports,10)/10*.55+Math.min(families,8)/8*.45)*100)
const recent=last90.filter(a=>now-new Date(a.performed_at||a.created_at).getTime()<30*86400000).reduce((s,a)=>s+weight(a),0);const prior=last90.filter(a=>{const d=now-new Date(a.performed_at||a.created_at).getTime();return d>=30*86400000&&d<60*86400000}).reduce((s,a)=>s+weight(a),0);const progression=clamp(50+(recent-prior)*5)
const overall=clamp(endurance*.20+strength*.20+speed*.15+consistency*.20+versatility*.15+progression*.10);return{endurance,strength,speed,consistency,versatility,progression,overall}},[activities])}
