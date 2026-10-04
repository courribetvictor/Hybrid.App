import { useCallback, useEffect, useMemo, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Activity, SportType } from '@/types/database'
import { DEFAULT_ADAPTIVE_PREFERENCES, type AdaptivePreferences } from '@/constants/v12'
import { buildAdaptiveSnapshot } from '@/lib/v12/adaptive'
import type { LifeCheckin } from '@/lib/v11/life'

const KEY='hybrid:v12:adaptive_preferences'
export function useAdaptiveOS(activities:Activity[], favorites:SportType[] = [], checkin:LifeCheckin = {}){
  const [preferences,setPreferencesState]=useState<AdaptivePreferences>(DEFAULT_ADAPTIVE_PREFERENCES)
  const [ready,setReady]=useState(false)
  useEffect(()=>{AsyncStorage.getItem(KEY).then(raw=>{if(raw){try{setPreferencesState({...DEFAULT_ADAPTIVE_PREFERENCES,...JSON.parse(raw)})}catch{}}}).finally(()=>setReady(true))},[])
  const setPreferences=useCallback((next:AdaptivePreferences)=>{setPreferencesState(next);AsyncStorage.setItem(KEY,JSON.stringify(next)).catch(()=>{})},[])
  const patchPreferences=useCallback((patch:Partial<AdaptivePreferences>)=>setPreferences({...preferences,...patch}),[preferences,setPreferences])
  const snapshot=useMemo(()=>buildAdaptiveSnapshot(activities,favorites,preferences,checkin),[activities,favorites,preferences,checkin])
  return{preferences,setPreferences,patchPreferences,snapshot,ready}
}
