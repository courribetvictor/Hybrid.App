import React,{createContext,useCallback,useContext,useEffect,useMemo,useState}from'react'
import AsyncStorage from'@react-native-async-storage/async-storage'
import type{CardFrameId,CardThemeId,CompanionMood,RoomTheme,StoryTemplate}from'@/constants/v8'

const KEY='hybrid:v8:world'
export type V8State={
 cardTheme:CardThemeId;cardFrame:CardFrameId;ownedFrames:CardFrameId[];cardTitle:string;cardQuote:string;
 companionId:string;companionMood:CompanionMood;companionGear?:string;ownedCompanions:string[];ownedCompanionGear:string[];
 roomTheme:RoomTheme;ownedRoomThemes:RoomTheme[];pinnedTrophies:string[];
 storyTemplate:StoryTemplate;favoriteStoryIds:string[];worldClaimed:string[];
 musicVisible:boolean;showTopRecord:boolean;showGrade:boolean;
}
const INITIAL:V8State={cardTheme:'midnight',cardFrame:'clean',ownedFrames:['clean'],cardTitle:'Hybrid Athlete',cardQuote:'Built by movement.',companionId:'wolf_nova',companionMood:'proud',ownedCompanions:['wolf_nova'],ownedCompanionGear:[],roomTheme:'studio',ownedRoomThemes:['studio'],pinnedTrophies:['first_session'],storyTemplate:'clean',favoriteStoryIds:[],worldClaimed:['paris'],musicVisible:true,showTopRecord:true,showGrade:true}

type ContextValue={state:V8State;ready:boolean;patch:(p:Partial<V8State>)=>void;ownCompanion:(id:string)=>void;ownGear:(id:string)=>void;ownRoom:(id:RoomTheme)=>void;claimWorld:(id:string)=>void;toggleTrophy:(id:string)=>void}
const Context=createContext<ContextValue|null>(null)
export function V8WorldProvider({children}:{children:React.ReactNode}){const[state,setState]=useState(INITIAL),[ready,setReady]=useState(false);useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{if(v)setState({...INITIAL,...JSON.parse(v)});setReady(true)}).catch(()=>setReady(true))},[]);const commit=useCallback((fn:(s:V8State)=>V8State)=>setState(cur=>{const next=fn(cur);AsyncStorage.setItem(KEY,JSON.stringify(next)).catch(()=>{});return next}),[]);const value=useMemo<ContextValue>(()=>({state,ready,patch:p=>commit(s=>({...s,...p})),ownCompanion:id=>commit(s=>s.ownedCompanions.includes(id)?s:{...s,ownedCompanions:[...s.ownedCompanions,id]}),ownGear:id=>commit(s=>s.ownedCompanionGear.includes(id)?s:{...s,ownedCompanionGear:[...s.ownedCompanionGear,id]}),ownRoom:id=>commit(s=>s.ownedRoomThemes.includes(id)?s:{...s,ownedRoomThemes:[...s.ownedRoomThemes,id]}),claimWorld:id=>commit(s=>s.worldClaimed.includes(id)?s:{...s,worldClaimed:[...s.worldClaimed,id]}),toggleTrophy:id=>commit(s=>({...s,pinnedTrophies:s.pinnedTrophies.includes(id)?s.pinnedTrophies.filter(x=>x!==id):[...s.pinnedTrophies.slice(-5),id]}))}),[state,ready,commit]);return <Context.Provider value={value}>{children}</Context.Provider>}
export function useV8World(){const v=useContext(Context);if(!v)throw new Error('useV8World must be inside V8WorldProvider');return v}
