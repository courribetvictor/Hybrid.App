import { supabase } from '@/lib/supabase'
import type { Activity, ActivitySource, SportType } from '@/types/database'

export interface ImportedActivity {
  externalId: string
  sportType: SportType
  performedAt: string
  durationSeconds: number
  caloriesBurned?: number | null
  title?: string | null
  metrics?: Record<string, unknown>
}

/**
 * Common ingestion path for Garmin / Apple Health / Health Connect / Strava.
 * Imported records are idempotent through (user_id, source, source_external_id)
 * and are marked verified because they originate from a connected provider.
 */
export async function importActivities(userId: string, source: Exclude<ActivitySource, 'manual' | 'gps' | 'hybrid_tracker'>, rows: ImportedActivity[]) {
  if (!rows.length) return [] as Activity[]
  const payload = rows.map(row => ({
    user_id: userId,
    source,
    source_external_id: row.externalId,
    is_verified: true,
    visibility: 'public',
    sport_type: row.sportType,
    performed_at: row.performedAt,
    duration_seconds: row.durationSeconds,
    calories_burned: row.caloriesBurned ?? null,
    title: row.title ?? null,
    metrics: row.metrics ?? {},
  }))
  const { data, error } = await supabase
    .from('activities')
    .upsert(payload as any, { onConflict: 'user_id,source,source_external_id' })
    .select('*')
  if (error) throw error
  return (data ?? []) as Activity[]
}
