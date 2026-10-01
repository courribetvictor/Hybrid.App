import { Activity, Bike, Dumbbell, Footprints, Mountain, Trophy, Waves } from 'lucide-react-native'
import { SPORT_BY_KEY } from './sportCatalog'
import type { SportType } from '@/types/database'
export type LucideIcon = any

function familyIcon(family?: string): LucideIcon {
  if (family === 'running_endurance') return Footprints
  if (family === 'cycling') return Bike
  if (family === 'aquatic' || family === 'paddle_boat') return Waves
  if (family === 'strength_fitness') return Dumbbell
  if (family === 'climbing_mountain' || family === 'winter') return Mountain
  if (family === 'racket' || family === 'team_ball' || family === 'precision') return Trophy
  return Activity
}

export const SPORTS_CONFIG = new Proxy({} as Record<SportType,{label:string;labelLong:string;Icon:LucideIcon;color:string;emoji?:string}>, {
  get(_target, prop: string) {
    const s = SPORT_BY_KEY[prop] ?? SPORT_BY_KEY.running
    return { label: s.shortLabel ?? s.label, labelLong: s.label, Icon: familyIcon(s.family), color: s.color, emoji: s.emoji }
  }
})
