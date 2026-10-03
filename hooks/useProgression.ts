import{useCallback,useEffect,useMemo,useState}from'react'
import AsyncStorage from'@react-native-async-storage/async-storage'
import type{AthleteClassKey}from'@/constants/v5'
const KEY='hybrid:progression:v5'
type State={xp:number;claimed:string[];athleteClass?:AthleteClassKey}
const D:State={xp:0,claimed:[]}
export function useProgression(){const[state,setState]=useState<State>(D);useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>v&&setState({...D,...JSON.parse(v)})).catch(()=>{})},[])
 const save=useCallback((next:State)=>{setState(next);AsyncStorage.setItem(KEY,JSON.stringify(next)).catch(()=>{})},[])
 const addXp=useCallback((amount:number,id?:string)=>{setState(cur=>{if(id&&cur.claimed.includes(id))return cur;const n={...cur,xp:cur.xp+amount,claimed:id?[...cur.claimed,id]:cur.claimed};AsyncStorage.setItem(KEY,JSON.stringify(n)).catch(()=>{});return n})},[])
 const setAthleteClass=useCallback((athleteClass:AthleteClassKey)=>{setState(cur=>{const n={...cur,athleteClass};AsyncStorage.setItem(KEY,JSON.stringify(n)).catch(()=>{});return n})},[])
 const level=useMemo(()=>Math.max(1,Math.floor(Math.sqrt(state.xp/75))+1),[state.xp]);const base=(level-1)*(level-1)*75;const next=level*level*75;const progress=(state.xp-base)/Math.max(1,next-base)
 return{...state,level,progress,nextLevelXp:next,addXp,setAthleteClass}
}
