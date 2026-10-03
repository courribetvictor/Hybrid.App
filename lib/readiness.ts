import type { Activity } from '@/types/database'

export type Readiness = {
  score: number
  label: string
  color: string
  message: string
  load7d: number
  hard48h: number
}

export function computeReadiness(activities: Activity[]): Readiness {
  const now = Date.now()
  const recent7 = activities.filter(a => now - new Date(a.performed_at ?? a.created_at).getTime() < 7 * 86400000)
  const hard48 = activities.filter(a => now - new Date(a.performed_at ?? a.created_at).getTime() < 48 * 3600000 && (a.rpe ?? 0) >= 8)
  const minutes = recent7.reduce((sum, a) => sum + (a.duration_seconds || 0) / 60, 0)
  const rpeLoad = recent7.reduce((sum, a) => sum + ((a.rpe ?? 5) * (a.duration_seconds || 0)) / 60, 0)

  let score = 88
  score -= Math.min(28, hard48.length * 11)
  score -= Math.min(22, Math.max(0, (rpeLoad - 1600) / 110))
  if (recent7.length === 0) score = 92
  score = Math.max(25, Math.min(98, Math.round(score)))

  if (score >= 80) return { score, label: 'Prêt', color: '#10B981', message: 'Bonne fenêtre pour une séance de qualité.', load7d: Math.round(minutes), hard48h: hard48.length }
  if (score >= 60) return { score, label: 'Correct', color: '#F59E0B', message: 'Tu peux t’entraîner, mais garde une marge.', load7d: Math.round(minutes), hard48h: hard48.length }
  return { score, label: 'Récupération', color: '#EF4444', message: 'Une séance légère ou du repos semble plus cohérent.', load7d: Math.round(minutes), hard48h: hard48.length }
}
