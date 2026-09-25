import { createContext, useContext } from 'react'
import { fr } from './fr'
import { en } from './en'
import type { PreferredLanguage } from '@/types/database'
import type { Translations } from './fr'

export const translations: Record<PreferredLanguage, Translations> = { fr, en }

export const I18nContext = createContext<{
  t: Translations
  language: PreferredLanguage
  setLanguage: (lang: PreferredLanguage) => void
}>({
  t: fr,
  language: 'fr',
  setLanguage: () => {},
})

export function useT(): Translations {
  return useContext(I18nContext).t
}

export function useLanguage(): PreferredLanguage {
  return useContext(I18nContext).language
}

export { fr, en }
export type { Translations }
