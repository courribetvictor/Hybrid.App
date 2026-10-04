import {useCallback,useEffect,useState} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
const KEY='hybrid:sensory:v5'
export type SensoryPreferences={haptics:boolean;sounds:boolean;reducedMotion:boolean}
const DEFAULTS:SensoryPreferences={haptics:true,sounds:true,reducedMotion:false}
export function useSensoryPreferences(){
 const[prefs,setPrefs]=useState(DEFAULTS)
 useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{if(v)setPrefs({...DEFAULTS,...JSON.parse(v)})}).catch(()=>{})},[])
 const update=useCallback(async(p:Partial<SensoryPreferences>)=>{setPrefs(cur=>{const n={...cur,...p};AsyncStorage.setItem(KEY,JSON.stringify(n)).catch(()=>{});return n})},[])
 return{prefs,update}
}
