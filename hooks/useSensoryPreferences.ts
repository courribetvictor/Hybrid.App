import {useCallback,useEffect,useState} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
const KEY='hybrid:sensory:v5'
export type SensoryPreferences={haptics:boolean;sounds:boolean;reducedMotion:boolean}
const listeners=new Set<(prefs:SensoryPreferences)=>void>()
let current:SensoryPreferences|null=null
const DEFAULTS:SensoryPreferences={haptics:true,sounds:true,reducedMotion:false}
export function useSensoryPreferences(){
 const[prefs,setPrefs]=useState(current??DEFAULTS)
 useEffect(()=>{listeners.add(setPrefs);AsyncStorage.getItem(KEY).then(v=>{if(v&&!current){current={...DEFAULTS,...JSON.parse(v)};listeners.forEach(l=>l(current!))}}).catch(()=>{});return()=>{listeners.delete(setPrefs)}},[])
 const update=useCallback(async(p:Partial<SensoryPreferences>)=>{const n={...(current??DEFAULTS),...p};current=n;listeners.forEach(l=>l(n));await AsyncStorage.setItem(KEY,JSON.stringify(n)).catch(()=>{})},[])
 return{prefs,update}
}
