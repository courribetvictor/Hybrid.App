export const Colors = {
  // ── Core brand ─────────────────────────────
  electric: '#4A8BFF',
  electricLight: '#7AADFF',
  electricDim: 'rgba(74,139,255,0.15)',

  // ── Backgrounds ────────────────────────────
  bg: '#0A0A0F',
  bgAlt: '#111118',
  bgCard: '#17172A',
  bgElevated: '#1F1F32',

  // ── Text ───────────────────────────────────
  textPrimary: '#EEF0FF',
  textSecondary: '#8A90B8',
  textTertiary: '#525770',
  textInverse: '#FFFFFF',

  // ── Borders & dividers ─────────────────────
  border: 'rgba(255,255,255,0.08)',
  borderLight: 'rgba(255,255,255,0.05)',

  // ── Semantic ───────────────────────────────
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // ── Sport accent palette ───────────────────
  running:   '#FF6B35',
  cycling:   '#8B5CF6',
  swimming:  '#06B6D4',
  gym:       '#4A8BFF',
  badminton: '#10B981',
  athletics: '#F59E0B',
  football:  '#22C55E',
  tennis:    '#EAB308',
  hiking:    '#6366F1',
  yoga:      '#EC4899',
  boxing:    '#DC2626',
} as const

// Pre-defined gradients for LinearGradient
export const Gradients = {
  electric: ['#2563EB', '#0EA5E9'] as const,
  pro:      ['#2563EB', '#7C3AED'] as const,
  arena:    ['#1A0A2E', '#0A1428'] as const,
  gold:     ['#F59E0B', '#FCD34D'] as const,
  warm:     ['#FF6B35', '#F59E0B'] as const,
  dark:     ['#17172A', '#0A0A0F'] as const,
} as const

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
} as const

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 28,
    elevation: 12,
  },
  glow: {
    shadowColor: '#4A8BFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
} as const

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
}

// Sport colors accessible from SportType key
import type { SportType } from '@/types/database'
export const SportColors: Record<SportType, string> = {
  running:   Colors.running,
  cycling:   Colors.cycling,
  swimming:  Colors.swimming,
  gym:       Colors.gym,
  badminton: Colors.badminton,
  athletics: Colors.athletics,
  football:  Colors.football,
  tennis:    Colors.tennis,
  hiking:    Colors.hiking,
  yoga:      Colors.yoga,
  boxing:    Colors.boxing,
}
