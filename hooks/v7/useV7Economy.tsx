import React,{createContext,useCallback,useContext,useEffect,useMemo,useState}from'react'
import AsyncStorage from'@react-native-async-storage/async-storage'
import{V7_ITEM_BY_ID,V7_STARTER_EQUIPMENT,V7_STARTER_OWNED,V7_DAILY_REWARDS,type CosmeticSlot,type CosmeticItem}from'@/constants/v7'
import{computeActivityReward}from'@/lib/v7/activityRewards'
import type{Activity}from'@/types/database'

const KEY='hybrid:v7:economy'
type Boost={kind:'xp'|'coins';multiplier:number;endsAt:number}
export type OutfitPreset={id:string;name:string;equipped:Record<CosmeticSlot,string|undefined>;createdAt:number}
export type V7State={credits:number;xp:number;owned:string[];equipped:Record<CosmeticSlot,string|undefined>;outfits:OutfitPreset[];dailyStreak:number;lastDaily?:string;rewardedActivities:string[];claimedGoals:string[];boost?:Boost;chests:{bronze:number;silver:number;gold:number};avatarReady:boolean}
const INITIAL:V7State={credits:250,xp:0,owned:V7_STARTER_OWNED,equipped:V7_STARTER_EQUIPMENT,outfits:[],dailyStreak:0,rewardedActivities:[],claimedGoals:[],chests:{bronze:1,silver:0,gold:0},avatarReady:false}
const day=()=>new Date().toISOString().slice(0,10)
const yesterday=()=>{const d=new Date();d.setDate(d.getDate()-1);return d.toISOString().slice(0,10)}

type Ctx=ReturnType<typeof buildValue>|null
const Context=createContext<Ctx>(null)
function buildValue(state:V7State,ready:boolean,commit:(fn:(s:V7State)=>V7State)=>void){
 const level=Math.max(1,Math.floor(Math.sqrt(state.xp/90))+1),nextXp=level*level*90,baseXp=(level-1)*(level-1)*90,levelProgress=(state.xp-baseXp)/Math.max(1,nextXp-baseXp)
 const claimDaily=()=>{let reward=0;commit(s=>{if(s.lastDaily===day())return s;const streak=s.lastDaily===yesterday()?s.dailyStreak+1:1;const cycle=((streak-1)%7);reward=V7_DAILY_REWARDS[cycle];return{...s,credits:s.credits+reward,dailyStreak:streak,lastDaily:day(),chests:{...s.chests,bronze:s.chests.bronze+(streak%7===0?1:0)}}});return reward}
 const buy=(id:string)=>{let ok=false;commit(s=>{const item=V7_ITEM_BY_ID[id];if(!item||s.owned.includes(id)||s.credits<item.price||level<item.level)return s;ok=true;return{...s,credits:s.credits-item.price,owned:[...s.owned,id]}});return ok}
 const equip=(id:string)=>commit(s=>{const item=V7_ITEM_BY_ID[id];if(!item||!s.owned.includes(id))return s;return{...s,equipped:{...s.equipped,[item.slot]:id}}})
 const unequip=(slot:CosmeticSlot)=>commit(s=>({...s,equipped:{...s.equipped,[slot]:undefined}}))
 const setAvatarReady=(avatarReady=true)=>commit(s=>({...s,avatarReady}))
 const saveOutfit=(name:string)=>{let id='';commit(s=>{id=`outfit_${Date.now()}`;const preset={id,name:name.trim()||`Tenue ${s.outfits.length+1}`,equipped:{...s.equipped},createdAt:Date.now()};return{...s,outfits:[...s.outfits.slice(-7),preset]}});return id}
 const loadOutfit=(id:string)=>commit(s=>{const preset=s.outfits.find(x=>x.id===id);if(!preset)return s;const valid=Object.fromEntries(Object.entries(preset.equipped).filter(([,item])=>!item||s.owned.includes(item))) as Record<CosmeticSlot,string|undefined>;return{...s,equipped:{...s.equipped,...valid}}})
 const deleteOutfit=(id:string)=>commit(s=>({...s,outfits:s.outfits.filter(x=>x.id!==id)}))
 const rewardActivity=(activity:Activity)=>{let result=computeActivityReward(activity);commit(s=>{if(s.rewardedActivities.includes(activity.id))return s;const active=s.boost&&s.boost.endsAt>Date.now()?s.boost:undefined;const xp=Math.round(result.xp*(active?.kind==='xp'?active.multiplier:1));const credits=Math.round(result.credits*(active?.kind==='coins'?active.multiplier:1));result={...result,xp,credits};return{...s,xp:s.xp+xp,credits:s.credits+credits,rewardedActivities:[...s.rewardedActivities.slice(-199),activity.id],boost:active}});return result}
 const activateBoost=(kind:'xp'|'coins',multiplier:number,minutes:number,cost:number)=>{let ok=false;commit(s=>{if(s.credits<cost)return s;ok=true;return{...s,credits:s.credits-cost,boost:{kind,multiplier,endsAt:Date.now()+minutes*60_000}}});return ok}
 const addChest=(tier:'bronze'|'silver'|'gold',n=1)=>commit(s=>({...s,chests:{...s.chests,[tier]:s.chests[tier]+n}}))
 const spendCredits=(amount:number)=>{let ok=false;commit(s=>{if(amount<0||s.credits<amount)return s;ok=true;return{...s,credits:s.credits-amount}});return ok}
 const grantCredits=(amount:number)=>commit(s=>({...s,credits:Math.max(0,s.credits+Math.round(amount))}))
 const grantGoal=(id:string,xp:number,credits:number,chest?:'bronze'|'silver'|'gold')=>{let ok=false;commit(s=>{if(s.claimedGoals.includes(id))return s;ok=true;return{...s,xp:s.xp+xp,credits:s.credits+credits,claimedGoals:[...s.claimedGoals.slice(-199),id],chests:chest?{...s.chests,[chest]:s.chests[chest]+1}:s.chests}});return ok}
 const unlockDestination=(id:string,multiplier:number,hours:number,chest:'bronze'|'silver'|'gold')=>{let ok=false;commit(s=>{const key=`destination:${id}`;if(s.claimedGoals.includes(key))return s;ok=true;return{...s,claimedGoals:[...s.claimedGoals,key],boost:{kind:'xp',multiplier,endsAt:Date.now()+hours*3600_000},chests:{...s.chests,[chest]:s.chests[chest]+1}}});return ok}
 const openChest=(tier:'bronze'|'silver'|'gold')=>{let outcome:{credits:number;item?:string}|null=null;commit(s=>{if(s.chests[tier]<=0)return s;const cfg=tier==='bronze'?{a:80,b:180,ch:.18}:tier==='silver'?{a:160,b:320,ch:.32}:{a:280,b:600,ch:.48};const credits=Math.floor(cfg.a+Math.random()*(cfg.b-cfg.a));let item:string|undefined;if(Math.random()<cfg.ch){const pool=(Object.values(V7_ITEM_BY_ID) as CosmeticItem[]).filter(x=>!s.owned.includes(x.id)&&level>=x.level);item=pool[Math.floor(Math.random()*pool.length)]?.id}outcome={credits,item};return{...s,credits:s.credits+credits,owned:item?[...s.owned,item]:s.owned,chests:{...s.chests,[tier]:s.chests[tier]-1}}});return outcome}
 return{state,ready,level,nextXp,levelProgress,claimDaily,buy,equip,unequip,setAvatarReady,saveOutfit,loadOutfit,deleteOutfit,rewardActivity,activateBoost,addChest,spendCredits,grantCredits,grantGoal,unlockDestination,openChest}
}
export function V7EconomyProvider({children}:{children:React.ReactNode}){const[state,setState]=useState<V7State>(INITIAL),[ready,setReady]=useState(false);useEffect(()=>{AsyncStorage.getItem(KEY).then(v=>{if(v)setState({...INITIAL,...JSON.parse(v)});setReady(true)}).catch(()=>setReady(true))},[]);const commit=useCallback((fn:(s:V7State)=>V7State)=>setState(cur=>{const n=fn(cur);AsyncStorage.setItem(KEY,JSON.stringify(n)).catch(()=>{});return n}),[]);const value=useMemo(()=>buildValue(state,ready,commit),[state,ready,commit]);return <Context.Provider value={value}>{children}</Context.Provider>}
export function useV7Economy(){const v=useContext(Context);if(!v)throw new Error('useV7Economy must be inside V7EconomyProvider');return v}
