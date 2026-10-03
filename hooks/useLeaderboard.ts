import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useGlobalLeaderboard(){
  const [entries,setEntries]=useState<any[]>([]),[loading,setLoading]=useState(false)
  const refetch=useCallback(async()=>{setLoading(true);const{data}=await supabase.from('profiles').select('id,username,avatar_url,is_pro,hybrid_score').eq('show_ranking',true).order('hybrid_score',{ascending:false}).limit(100);setEntries(data??[]);setLoading(false)},[])
  useEffect(()=>{refetch()},[refetch]);return{entries,loading,refetch}
}
export function useWeeklyLeaderboard(){
  const [entries,setEntries]=useState<any[]>([]),[loading,setLoading]=useState(false)
  const refetch=useCallback(async()=>{setLoading(true);const monday=new Date();monday.setDate(monday.getDate()-((monday.getDay()+6)%7));monday.setHours(0,0,0,0);const{data}=await supabase.from('activities').select('user_id,duration_seconds,is_verified,profile:profiles!user_id(id,username,avatar_url,is_pro,hybrid_score,show_ranking)').gte('performed_at',monday.toISOString());const map=new Map<string,any>();for(const a of data??[]){const p=(a as any).profile;if(!p?.show_ranking)continue;const e=map.get((a as any).user_id)??{...p,id:p.id,weekly_seconds:0,weekly_sessions:0,score:0};const w=(a as any).is_verified?1:.65;e.weekly_seconds+=(a as any).duration_seconds;e.weekly_sessions+=1;e.score+=Math.round(((a as any).duration_seconds/60)*w);map.set((a as any).user_id,e)}setEntries([...map.values()].sort((a,b)=>b.score-a.score));setLoading(false)},[])
  useEffect(()=>{refetch()},[refetch]);return{entries,loading,refetch}
}
export function useClubLeaderboard(){
  const [clubs,setClubs]=useState<any[]>([]),[loading,setLoading]=useState(false)
  const refetch=useCallback(async()=>{setLoading(true);const{data}=await supabase.from('club_leaderboard').select('*').order('total_points',{ascending:false}).limit(100);setClubs(data??[]);setLoading(false)},[])
  useEffect(()=>{refetch()},[refetch]);return{clubs,entries:clubs,loading,refetch}
}
