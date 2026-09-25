export const Colors = {
  // ── Core brand ─────────────────────────────
  electric: '#0055FF',
  electricLight: '#3378FF',
  electricDim: 'rgba(0, 85, 255, 0.12)',

  // ── Backgrounds ────────────────────────────
  bg: '#FFFFFF',
  bgAlt: '#F8F9FA',
  bgCard: '#FFFFFF',

  // ── Text ───────────────────────────────────
  textPrimary: '#111111',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // ── Borders & dividers ─────────────────────
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // ── Semantic ───────────────────────────────
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // ── Sport accent palette ───────────────────
  running: '#FF6B35',
  cycling: '#8B5CF6',
  swimming: '#06B6D4',
  gym: '#0055FF',
  badminton: '#10B981',
  athletics: '#F59E0B',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
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
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
}

// Sport colors accessible from SportType key
import type { SportType } from '@/types/database'
export const SportColors: Record<SportType, string> = {
  running: Colors.running,
  cycling: Colors.cycling,
  swimming: Colors.swimming,
  gym: Colors.gym,
  badminton: Colors.badminton,
  athletics: Colors.athletics,
}
