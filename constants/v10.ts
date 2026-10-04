export const V10_VERSION = '0.10.0'

export const INTELLIGENCE_STATES = {
  peak: { label: 'PEAK', color: '#10B981', description: 'Forme haute, fatigue maîtrisée' },
  building: { label: 'BUILDING', color: '#2563EB', description: 'Progression régulière et charge productive' },
  maintain: { label: 'MAINTAIN', color: '#7C3AED', description: 'Charge stable, bon moment pour consolider' },
  recover: { label: 'RECOVER', color: '#F59E0B', description: 'Fatigue élevée : récupération prioritaire' },
  reset: { label: 'RESET', color: '#EF4444', description: 'Charge ou fatigue déséquilibrée' },
} as const

export type IntelligenceState = keyof typeof INTELLIGENCE_STATES

export const V10_QUICK_ACTIONS = [
  { key: 'intelligence', label: 'Intelligence', icon: 'BrainCircuit' },
  { key: 'competition', label: 'Compétition', icon: 'Trophy' },
  { key: 'recap', label: 'Recap', icon: 'Sparkles' },
] as const
