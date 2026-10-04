import React,{createContext,useContext,useEffect,useMemo,useState}from'react'
import AsyncStorage from'@react-native-async-storage/async-storage'
import{V14_DEFAULT_IDENTITY,type V14IdentityState}from'@/constants/v14'
const KEY='hybrid:v14:identity'
type Ctx={state:V14IdentityState;ready:boolean;update:(patch:Partial<V14IdentityState>)=>void;reset:()=>void}
const Context=createContext<Ctx|undefined>(undefined)
export function V14IdentityProvider({children}:{children:React.ReactNode}){const[state,setState]=useState(V14_DEFAULT_IDENTITY);const[ready,setReady]=useState(false);useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{if(v)try{setState({...V14_DEFAULT_IDENTITY,...JSON.parse(v)})}catch{}setReady(true)}).catch(()=>setReady(true))},[]);const save=(next:V14IdentityState)=>{setState(next);AsyncStorage.setItem(KEY,JSON.stringify(next)).catch(()=>{})};const value=useMemo(()=>({state,ready,update:(patch:Partial<V14IdentityState>)=>save({...state,...patch}),reset:()=>save(V14_DEFAULT_IDENTITY)}),[state,ready]);return <Context.Provider value={value}>{children}</Context.Provider>}
export function useV14Identity(){const v=useContext(Context);if(!v)throw new Error('useV14Identity must be inside V14IdentityProvider');return v}
