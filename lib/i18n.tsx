export { I18nContext, translations, useT, useLanguage } from './i18n/index'
import { useContext } from 'react'
import { I18nContext } from './i18n/index'
export const useI18n = () => useContext(I18nContext)
