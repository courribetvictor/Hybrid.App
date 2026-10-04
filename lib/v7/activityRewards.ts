import type { Activity, ActivityMetrics } from '@/types/database'
import { SPORT_BY_KEY } from '@/constants/sportCatalog'

export type ActivityReward={effortUnits:number;xp:number;credits:number;reason:string}

const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v))
const num=(v:any)=>Number.isFinite(Number(v))?Number(v):0

export function computeActivityReward(input:Pick<Activity,'sport_type'|'duration_seconds'|'rpe'|'metrics'|'is_verified'>):ActivityReward{
  const minutes=clamp(input.duration_seconds/60,1,300)
  const rpe=clamp(input.rpe??5,1,10)
  const metrics:ActivityMetrics=input.metrics??{}
  const family=SPORT_BY_KEY[input.sport_type]?.family??''
  const durationBase=Math.pow(minutes,0.86)*1.65
  const intensity=.72+(rpe/10)*.72
  let specificity=1
  const distanceKm=num(metrics.distance_km)||num(metrics.distance_m)/1000
  const elevation=num(metrics.elevation_m)||num(metrics.elevation_gain_m)
  const volumeKg=num(metrics.total_volume_kg)
  const rounds=num(metrics.rounds)
  const sets=num(metrics.sets_count)

  if(['running_endurance','cycling','aquatic','paddle_boat'].includes(family)) specificity+=clamp(distanceKm/35,0,.35)
  if(family==='climbing_mountain') specificity+=clamp(elevation/1800,0,.25)
  if(family==='strength_fitness') specificity+=clamp(Math.log10(Math.max(1,volumeKg))/18,0,.28)
  if(family==='combat') specificity+=clamp(rounds/30,0,.22)
  if(family==='racket'||family==='team_ball') specificity+=clamp(sets/20,0,.15)

  // Short, high-intensity work is not punished like pure distance-based systems.
  const shortIntensityBonus=minutes<=35&&rpe>=8?1.16:1
  const verified=input.is_verified?1.08:1
  const effortUnits=Math.round(clamp(durationBase*intensity*specificity*shortIntensityBonus*verified,8,520))
  const xp=Math.round(effortUnits*1.35)
  const credits=Math.round(effortUnits*.72)
  return{effortUnits,xp,credits,reason:`${Math.round(minutes)} min · RPE ${rpe}/10 · ${Math.round(effortUnits)} EU`}
}
