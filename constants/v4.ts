import { SkillColors } from './theme'

export const V4_COLORS = {
  night: '#081226',
  night2: '#111E3D',
  neonBlue: '#4B7BFF',
  aqua: '#22D3EE',
  lime: '#A3E635',
  coral: '#FB7185',
  purple: '#A78BFA',
  amber: '#FBBF24',
}

export const SKILL_META = [
  { key: 'strength', label: 'Force', color: SkillColors.strength },
  { key: 'endurance', label: 'Endurance', color: SkillColors.endurance },
  { key: 'speed', label: 'Vitesse', color: SkillColors.speed },
  { key: 'consistency', label: 'Régularité', color: SkillColors.consistency },
  { key: 'versatility', label: 'Polyvalence', color: SkillColors.versatility },
  { key: 'progression', label: 'Progression', color: SkillColors.progression },
] as const

export const LIVE_REACTIONS = ['🔥', '💪', '👏', '⚡', '❤️']

export const QUICK_COACH_PROMPTS = [
  "Que dois-je faire aujourd'hui ?",
  'Prépare ma semaine',
  'Analyse ma récupération',
  'Fais-moi progresser dans mon sport principal',
]

export const EQUIPMENT_CATEGORIES = [
  { key: 'shoes', label: 'Chaussures', icon: 'Footprints' },
  { key: 'bike', label: 'Vélo', icon: 'Bike' },
  { key: 'racket', label: 'Raquette', icon: 'CircleDot' },
  { key: 'watch', label: 'Montre / capteur', icon: 'Watch' },
  { key: 'other', label: 'Autre', icon: 'Package' },
]
