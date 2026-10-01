import React,{useEffect,useState}from'react'
import AsyncStorage from'@react-native-async-storage/async-storage'
import{getHybridRank}from'@/constants/ranks'
import{RewardBurst}from'./RewardBurst'
export function GradeCelebrationGate({score}:{score:number}){const[show,setShow]=useState(false);const[rankName,setRankName]=useState('');useEffect(()=>{const rank=getHybridRank(score);const key='hybrid:last-rank:v5';AsyncStorage.getItem(key).then(prev=>{if(prev&&prev!==rank.key){setRankName(rank.name);setShow(true)}AsyncStorage.setItem(key,rank.key).catch(()=>{})}).catch(()=>{})},[score]);return <RewardBurst visible={show} title="GRADE UP" subtitle={`Bienvenue en ${rankName}. Ton profil sportif vient de franchir un cap.`} xp={250} onClose={()=>setShow(false)}/>}
