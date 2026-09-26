import { useMemo } from 'react'
import type { Activity, SportType } from '@/types/database'

export interface Skills {
  explosivite: number  // 0-100
  detente:     number
  endurance:   number
  force:       number
  agilite:     number
}

// Sport → which skills it trains (partial contribution)
const SPORT_SKILLS: Record<SportType, Partial<Skills>> = {
  running:    { endurance: 3,  agilite: 1 },
  cycling:    { endurance: 3,  force: 1 },
  swimming:   { endurance: 3,  force: 2 },
  gym:        { force: 4,      explosivite: 1 },
  badminton:  { agilite: 3,    explosivite: 2, detente: 2 },
  athletics:  { explosivite: 3, detente: 3, endurance: 1 },
  football:   { agilite: 2,    explosivite: 2, endurance: 2, detente: 1 },
  tennis:     { agilite: 3,    explosivite: 1 },
  hiking:     { endurance: 4,  force: 1 },
  yoga:       { agilite: 2,    force: 1 },
  boxing:     { force: 2,      explosivite: 3, agilite: 1 },
}

const SKILL_KEYS = ['explosivite', 'detente', 'endurance', 'force', 'agilite'] as const

export function computeSkills(activities: Activity[]): Skills {
  const raw: Skills = { explosivite: 0, detente: 0, endurance: 0, force: 0, agilite: 0 }

  for (const act of activities) {
    const contrib = SPORT_SKILLS[act.sport_type]
    if (!contrib) continue
    // Duration bonus: each 30 min = 1 multiplier
    const durationMult = Math.max(1, act.duration_seconds / 1800)
    for (const key of SKILL_KEYS) {
      const base = contrib[key] ?? 0
      if (base > 0) raw[key] += base * durationMult
    }
  }

  // Normalise to 0-100 with a soft cap (log-ish curve)
  const result = {} as Skills
  for (const key of SKILL_KEYS) {
    // 200 pts raw ≈ 100 skill
    result[key] = Math.min(100, Math.round((raw[key] / 200) * 100))
  }
  return result
}

export function useSkills(activities: Activity[]): Skills {
  return useMemo(() => computeSkills(activities), [activities])
}

export const SKILL_META: Record<keyof Skills, { label: string; emoji: string; color: string; desc: string }> = {
  explosivite: { label: 'Explosivité', emoji: '⚡', color: '#F59E0B', desc: 'Puissance explosive et vitesse de démarrage' },
  detente:     { label: 'Détente',     emoji: '🦘', color: '#8B5CF6', desc: 'Saut vertical et réactivité neuromusculaire' },
  endurance:   { label: 'Endurance',   emoji: '🫀', color: '#06B6D4', desc: 'Capacité cardio et résistance à la fatigue' },
  force:       { label: 'Force',       emoji: '💪', color: '#EF4444', desc: 'Force musculaire brute et résistance' },
  agilite:     { label: 'Agilité',     emoji: '🌀', color: '#10B981', desc: 'Coordination, vitesse de changement de direction' },
}
