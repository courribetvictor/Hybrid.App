import { useCallback,useEffect,useMemo,useRef,useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import { buildSplits,elevationGain,totalDistanceKm,type TrackPoint } from '@/lib/v9/tracking'

const STORAGE='hybrid.v9.active-tracking'
export type SessionStatus='idle'|'running'|'paused'|'finished'
export interface TrackingSnapshot {sport:string;status:SessionStatus;startedAt:number|null;elapsedSeconds:number;points:TrackPoint[];laps:number[];events:any[];updatedAt:number}

export function useTrackingSession(sport:string,gps:boolean,autoLapKm=1){
  const [status,setStatus]=useState<SessionStatus>('idle');const[startedAt,setStartedAt]=useState<number|null>(null);const[elapsedBase,setElapsedBase]=useState(0);const[resumeAt,setResumeAt]=useState<number|null>(null);const[points,setPoints]=useState<TrackPoint[]>([]);const[laps,setLaps]=useState<number[]>([]);const[events,setEvents]=useState<any[]>([]);const[tick,setTick]=useState(0);const watcher=useRef<Location.LocationSubscription|null>(null)
  const elapsedSeconds=elapsedBase+(status==='running'&&resumeAt?Math.floor((Date.now()-resumeAt)/1000):0)
  useEffect(()=>{if(status!=='running')return;const id=setInterval(()=>setTick(v=>v+1),1000);return()=>clearInterval(id)},[status])
  const stopWatcher=()=>{watcher.current?.remove();watcher.current=null}
  const startWatcher=useCallback(async()=>{if(!gps||watcher.current)return;const perm=await Location.requestForegroundPermissionsAsync();if(perm.status!=='granted')return;watcher.current=await Location.watchPositionAsync({accuracy:Location.Accuracy.BestForNavigation,timeInterval:1000,distanceInterval:3},loc=>{const c=loc.coords;setPoints(p=>[...p,{latitude:c.latitude,longitude:c.longitude,altitude:c.altitude,speed:c.speed,timestamp:loc.timestamp,accuracy:c.accuracy}])})},[gps])
  const start=useCallback(async()=>{const now=Date.now();setStatus('running');setStartedAt(now);setResumeAt(now);setElapsedBase(0);setPoints([]);setLaps([]);setEvents([]);await startWatcher()},[startWatcher])
  const pause=useCallback(()=>{if(status!=='running')return;setElapsedBase(elapsedSeconds);setResumeAt(null);setStatus('paused');stopWatcher()},[status,elapsedSeconds])
  const resume=useCallback(async()=>{if(status!=='paused')return;setResumeAt(Date.now());setStatus('running');await startWatcher()},[status,startWatcher])
  const finish=useCallback(()=>{if(status==='running')setElapsedBase(elapsedSeconds);setResumeAt(null);setStatus('finished');stopWatcher()},[status,elapsedSeconds])
  const addEvent=useCallback((event:any)=>setEvents(e=>[...e,{...event,atSeconds:elapsedSeconds,createdAt:Date.now()}]),[elapsedSeconds])
  const manualLap=useCallback(()=>setLaps(l=>[...l,elapsedSeconds]),[elapsedSeconds])
  const distanceKm=useMemo(()=>totalDistanceKm(points),[points,tick]);const elevationM=useMemo(()=>elevationGain(points),[points]);const splits=useMemo(()=>buildSplits(points,elapsedSeconds,autoLapKm),[points,elapsedSeconds,autoLapKm])
  useEffect(()=>{if(status==='idle'||status==='finished')return;const snapshot:TrackingSnapshot={sport,status,startedAt,elapsedSeconds,points:points.slice(-2000),laps,events,updatedAt:Date.now()};AsyncStorage.setItem(STORAGE,JSON.stringify(snapshot)).catch(()=>{})},[sport,status,startedAt,elapsedSeconds,points.length,laps,events])
  useEffect(()=>()=>stopWatcher(),[])
  const restore=useCallback(async(snapshot:TrackingSnapshot)=>{stopWatcher();setStartedAt(snapshot.startedAt);setElapsedBase(snapshot.elapsedSeconds);setResumeAt(null);setPoints(snapshot.points??[]);setLaps(snapshot.laps??[]);setEvents(snapshot.events??[]);setStatus('paused')},[])
  const clear=useCallback(async()=>{stopWatcher();setStatus('idle');setStartedAt(null);setElapsedBase(0);setResumeAt(null);setPoints([]);setLaps([]);setEvents([]);await AsyncStorage.removeItem(STORAGE)},[])
  return{status,startedAt,elapsedSeconds,points,laps,events,distanceKm,elevationM,splits,start,pause,resume,finish,addEvent,manualLap,restore,clear}
}

export async function recoverTrackingSnapshot(){try{const raw=await AsyncStorage.getItem(STORAGE);return raw?JSON.parse(raw) as TrackingSnapshot:null}catch{return null}}
