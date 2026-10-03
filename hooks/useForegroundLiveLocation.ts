import {useEffect,useRef,useState} from 'react'
import * as Location from 'expo-location'
export type LiveLocationPoint={latitude:number;longitude:number;altitude?:number|null;speed?:number|null;timestamp:number}
export function useForegroundLiveLocation(active:boolean,onPoint?:(p:LiveLocationPoint)=>void){
 const[points,setPoints]=useState<LiveLocationPoint[]>([]);const[permission,setPermission]=useState<'unknown'|'granted'|'denied'>('unknown');const cb=useRef(onPoint);cb.current=onPoint
 useEffect(()=>{if(!active)return;let sub:Location.LocationSubscription|undefined;let cancelled=false;(async()=>{const p=await Location.requestForegroundPermissionsAsync();if(cancelled)return;if(p.status!=='granted'){setPermission('denied');return}setPermission('granted');sub=await Location.watchPositionAsync({accuracy:Location.Accuracy.High,timeInterval:3000,distanceInterval:8},loc=>{const pt={latitude:loc.coords.latitude,longitude:loc.coords.longitude,altitude:loc.coords.altitude,speed:loc.coords.speed,timestamp:loc.timestamp};setPoints(prev=>[...prev.slice(-399),pt]);cb.current?.(pt)})})();return()=>{cancelled=true;sub?.remove()}},[active]);return{points,permission,clear:()=>setPoints([])}}
