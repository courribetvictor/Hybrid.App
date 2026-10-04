import type { ActivitySource, SportType } from '@/types/database'
import { importActivities, type ImportedActivity } from '@/lib/activity-import'
import { activityFingerprint } from '@/lib/v9/tracking'

export interface ProviderWorkout {
  id:string; sport:SportType; startedAt:string; durationSeconds:number; distanceKm?:number|null; calories?:number|null; title?:string|null; metrics?:Record<string,unknown>
}

export function normalizeProviderWorkout(row:ProviderWorkout):ImportedActivity{
  return{externalId:row.id,sportType:row.sport,performedAt:row.startedAt,durationSeconds:row.durationSeconds,caloriesBurned:row.calories??null,title:row.title??null,metrics:{...(row.metrics??{}),distance_km:row.distanceKm??(row.metrics as any)?.distance_km}}
}

export function dedupeProviderWorkouts(rows:ProviderWorkout[]){
  const seen=new Set<string>();return rows.filter(r=>{const fp=activityFingerprint({performedAt:r.startedAt,sport:r.sport,durationSeconds:r.durationSeconds,distanceKm:r.distanceKm});if(seen.has(fp))return false;seen.add(fp);return true})
}

export async function ingestProviderBatch(userId:string,source:Exclude<ActivitySource,'manual'|'gps'|'hybrid_tracker'>,rows:ProviderWorkout[]){
  const normalized=dedupeProviderWorkouts(rows).map(normalizeProviderWorkout)
  return importActivities(userId,source,normalized)
}
