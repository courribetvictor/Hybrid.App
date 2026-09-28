export const Colors = {
  // ── Core brand ─────────────────────────────
  electric: '#0055FF',
  electricLight: '#3378FF',
  electricDim: 'rgba(0,85,255,0.10)',

  // ── Backgrounds ────────────────────────────
  bg: '#EEF3FF',        // Fond bleu-gris très clair — les cartes blanches ressortent nettement
  bgAlt: '#E4ECFF',
  bgCard: '#FFFFFF',
  bgElevated: '#FFFFFF',

  // ── Text ───────────────────────────────────
  textPrimary: '#0F1117',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // ── Borders & dividers ─────────────────────
  border: '#E5E7EB',
  borderLight: '#EEF2FF',

  // ── Semantic ───────────────────────────────
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // ── Sport accent palette ───────────────────
  running:   '#FF6B35',
  cycling:   '#8B5CF6',
  swimming:  '#06B6D4',
  gym:       '#0055FF',
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
  electric: ['#0055FF', '#0EA5E9'] as const,
  pro:      ['#0055FF', '#7C3AED'] as const,
  arena:    ['#1E0A4A', '#0A1E4A'] as const,
  gold:     ['#F59E0B', '#FCD34D'] as const,
  warm:     ['#FF6B35', '#F59E0B'] as const,
  soft:     ['#EEF2FF', '#F5F7FF'] as const,
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
    shadowColor: '#1A1A4E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  md: {
    shadowColor: '#1A1A4E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: '#0055FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.20,
    shadowRadius: 32,
    elevation: 12,
  },
  glow: {
    shadowColor: '#0055FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.40,
    shadowRadius: 22,
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
