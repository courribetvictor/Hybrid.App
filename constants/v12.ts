export type AdaptiveMode = 'manual' | 'suggestions' | 'autopilot'
export type GoalType = 'performance' | 'endurance' | 'strength' | 'hybrid' | 'skill' | 'consistency' | 'competition'
export type TrainingPhase = 'base' | 'build' | 'peak' | 'competition' | 'recovery'

export type AdaptiveGoal = {
  id: string
  title: string
  type: GoalType
  sport?: string
  target?: string
  priority: 1 | 2 | 3
  deadline?: string
}

export type AvailabilityDay = {
  day: number // 0 sunday ... 6 saturday
  minutes: number
  enabled: boolean
}

export type AdaptivePreferences = {
  mode: AdaptiveMode
  goals: AdaptiveGoal[]
  availability: AvailabilityDay[]
  preferredRestDay?: number
  maxHardSessionsPerWeek: number
  preferredSessionMinutes: number
  explainRecommendations: boolean
}

export const DEFAULT_AVAILABILITY: AvailabilityDay[] = [
  { day: 0, minutes: 75, enabled: true },
  { day: 1, minutes: 60, enabled: true },
  { day: 2, minutes: 60, enabled: true },
  { day: 3, minutes: 60, enabled: true },
  { day: 4, minutes: 60, enabled: true },
  { day: 5, minutes: 45, enabled: true },
  { day: 6, minutes: 90, enabled: true },
]

export const DEFAULT_ADAPTIVE_PREFERENCES: AdaptivePreferences = {
  mode: 'suggestions',
  goals: [],
  availability: DEFAULT_AVAILABILITY,
  preferredRestDay: 4,
  maxHardSessionsPerWeek: 3,
  preferredSessionMinutes: 60,
  explainRecommendations: true,
}

export const PHASE_META: Record<TrainingPhase, { label: string; color: string; subtitle: string }> = {
  base: { label: 'BASE', color: '#14B8A6', subtitle: 'Construire la capacité sans brûler les étapes' },
  build: { label: 'BUILD', color: '#315CFF', subtitle: 'Faire monter progressivement la charge spécifique' },
  peak: { label: 'PEAK', color: '#8B5CF6', subtitle: 'Transformer la forme en performance' },
  competition: { label: 'COMPÉTITION', color: '#F97316', subtitle: 'Fraîcheur, précision et exécution' },
  recovery: { label: 'RECOVERY', color: '#10B981', subtitle: 'Assimiler avant de repartir' },
}

export const ADAPTIVE_MODE_META: Record<AdaptiveMode, { label: string; description: string }> = {
  manual: { label: 'Manuel', description: 'Hybrid analyse, mais ne modifie jamais ton planning.' },
  suggestions: { label: 'Suggestions', description: 'Hybrid propose les changements et tu confirmes.' },
  autopilot: { label: 'Autopilot', description: 'Hybrid peut réorganiser automatiquement les séances futures.' },
}
