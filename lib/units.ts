import type { PreferredUnit } from '@/types/database'

// ── Conversion constants ─────────────────────────────────────
const KG_TO_LBS = 2.20462
const CM_TO_INCH = 0.393701
const KM_TO_MILES = 0.621371
const M_TO_FEET = 3.28084

// ── Weight ───────────────────────────────────────────────────

export function formatWeight(kg: number, unit: PreferredUnit): string {
  if (unit === 'imperial') return `${(kg * KG_TO_LBS).toFixed(1)} lbs`
  return `${kg.toFixed(1)} kg`
}

export function displayWeight(kg: number, unit: PreferredUnit): { value: number; label: string } {
  if (unit === 'imperial') return { value: parseFloat((kg * KG_TO_LBS).toFixed(1)), label: 'lbs' }
  return { value: parseFloat(kg.toFixed(1)), label: 'kg' }
}

export function toKg(value: number, unit: PreferredUnit): number {
  return unit === 'imperial' ? value / KG_TO_LBS : value
}

// ── Height ───────────────────────────────────────────────────

export function formatHeight(cm: number, unit: PreferredUnit): string {
  if (unit === 'imperial') {
    const totalInches = cm * CM_TO_INCH
    const feet = Math.floor(totalInches / 12)
    const inches = Math.round(totalInches % 12)
    return `${feet}'${inches}"`
  }
  return `${Math.round(cm)} cm`
}

export function toCm(value: number, unit: PreferredUnit): number {
  return unit === 'imperial' ? value / CM_TO_INCH : value
}

// ── Distance ─────────────────────────────────────────────────

export function formatDistance(meters: number, unit: PreferredUnit): string {
  if (unit === 'imperial') {
    const miles = meters / 1000 * KM_TO_MILES
    return miles < 0.1 ? `${Math.round(meters * M_TO_FEET)} ft` : `${miles.toFixed(2)} mi`
  }
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`
}

export function displayDistance(meters: number, unit: PreferredUnit): { value: number; label: string } {
  if (unit === 'imperial') {
    const miles = (meters / 1000) * KM_TO_MILES
    return { value: parseFloat(miles.toFixed(2)), label: 'mi' }
  }
  const km = meters / 1000
  return { value: parseFloat(km.toFixed(2)), label: 'km' }
}

// ── Pace ─────────────────────────────────────────────────────

export function formatPace(secondsPerKm: number, unit: PreferredUnit): string {
  const effectiveSeconds = unit === 'imperial' ? secondsPerKm / KM_TO_MILES : secondsPerKm
  const min = Math.floor(effectiveSeconds / 60)
  const sec = Math.round(effectiveSeconds % 60)
  const label = unit === 'imperial' ? '/mi' : '/km'
  return `${min}:${sec.toString().padStart(2, '0')}${label}`
}

// ── Duration ─────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
  if (m > 0) return `${m}:${s.toString().padStart(2, '0')}`
  return `${s}s`
}

export function formatDurationLong(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const parts: string[] = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}min`)
  if (s > 0 && h === 0) parts.push(`${s}s`)
  return parts.join(' ')
}

// ── Volume (gym) ─────────────────────────────────────────────

export function formatVolume(kg: number, unit: PreferredUnit): string {
  if (unit === 'imperial') return `${Math.round(kg * KG_TO_LBS)} lbs`
  return `${Math.round(kg)} kg`
}

// ── BMI (always metric internally) ───────────────────────────

export function computeBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100
  return parseFloat((weightKg / (heightM * heightM)).toFixed(1))
}

export function bmiCategory(bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'overweight'
  return 'obese'
}
