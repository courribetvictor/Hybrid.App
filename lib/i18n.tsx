import React from 'react'
import type { PreferredLanguage } from '@/types/database'
const fr:any={common:{cancel:'Annuler',save:'Enregistrer'},profile:{editProfile:'Modifier le profil',hybridScore:'Hybrid Score',imperial:'Impérial',metric:'Métrique',language:'Langue',title:'Profil',units:'Unités'},activity:{addExercise:'Ajouter un exercice',addSet:'Ajouter une série',lost:'Perdu',won:'Gagné'},arena:{title:'Arène'}}
const en:any={common:{cancel:'Cancel',save:'Save'},profile:{editProfile:'Edit profile',hybridScore:'Hybrid Score',imperial:'Imperial',metric:'Metric',language:'Language',title:'Profile',units:'Units'},activity:{addExercise:'Add exercise',addSet:'Add set',lost:'Lost',won:'Won'},arena:{title:'Arena'}}
export const translations={fr,en}
export const I18nContext=React.createContext<{t:any;language:PreferredLanguage;setLanguage:(l:PreferredLanguage)=>void}>({t:fr,language:'fr',setLanguage:()=>{}})
export const useI18n=()=>React.useContext(I18nContext)
export const useT=()=>React.useContext(I18nContext).t
