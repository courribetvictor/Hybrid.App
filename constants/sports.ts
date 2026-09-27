import React from 'react'
import {
  PersonStanding, Bike, Waves, Mountain, Dumbbell,
  CircleDot, Zap, Shield, Swords, Timer, Flower2,
} from 'lucide-react-native'
import type { SportType } from '@/types/database'

export type LucideIcon = React.ComponentType<{ size: number; color: string; strokeWidth?: number }>

export interface SportConfig {
  key: SportType
  label: string
  labelLong: string
  color: string
  colorLight: string   // 12% opacity bg
  Icon: LucideIcon
}

export const SPORTS_CONFIG: Record<SportType, SportConfig> = {
  running:   { key: 'running',   label: 'Course',     labelLong: 'Course à pied', color: '#FF6B35', colorLight: '#FF6B3514', Icon: PersonStanding },
  cycling:   { key: 'cycling',   label: 'Vélo',       labelLong: 'Cyclisme',      color: '#8B5CF6', colorLight: '#8B5CF614', Icon: Bike },
  swimming:  { key: 'swimming',  label: 'Natation',   labelLong: 'Natation',      color: '#06B6D4', colorLight: '#06B6D414', Icon: Waves },
  hiking:    { key: 'hiking',    label: 'Randonnée',  labelLong: 'Randonnée',     color: '#6366F1', colorLight: '#6366F114', Icon: Mountain },
  gym:       { key: 'gym',       label: 'Muscu',      labelLong: 'Musculation',   color: '#0055FF', colorLight: '#0055FF14', Icon: Dumbbell },
  football:  { key: 'football',  label: 'Football',   labelLong: 'Football',      color: '#22C55E', colorLight: '#22C55E14', Icon: CircleDot },
  tennis:    { key: 'tennis',    label: 'Tennis',     labelLong: 'Tennis',        color: '#EAB308', colorLight: '#EAB30814', Icon: Zap },
  badminton: { key: 'badminton', label: 'Badminton',  labelLong: 'Badminton',     color: '#10B981', colorLight: '#10B98114', Icon: Shield },
  boxing:    { key: 'boxing',    label: 'Boxe',       labelLong: 'Boxe',          color: '#DC2626', colorLight: '#DC262614', Icon: Swords },
  athletics: { key: 'athletics', label: 'Athlétisme', labelLong: 'Athlétisme',    color: '#F59E0B', colorLight: '#F59E0B14', Icon: Timer },
  yoga:      { key: 'yoga',      label: 'Yoga',       labelLong: 'Yoga',          color: '#EC4899', colorLight: '#EC489914', Icon: Flower2 },
}

export function getSportConfig(sport: SportType): SportConfig {
  return SPORTS_CONFIG[sport]
}
