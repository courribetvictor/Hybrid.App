import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Activity, ActivityWithProfile, SportType } from '@/types/database'

export function useActivities(userId?:string, days=365){
  const [activities,setActivities]=useState<Activity[]>([])
  const [loading,setLoading]=useState(false)
  const refetch=useCallback(async()=>{
    if(!userId){setActivities([]);return}
    setLoading(true)
    const since=new Date(Date.now()-days*86400000).toISOString()
    const {data,error}=await supabase.from('activities').select('*').eq('user_id',userId).gte('performed_at',since).order('performed_at',{ascending:false})
    if(!error)setActivities((data??[]) as any)
    setLoading(false)
  },[userId,days])
  useEffect(()=>{refetch()},[refetch])
  const addActivity=useCallback(async(input:Partial<Activity>)=>{
    if(!userId)throw new Error('Session requise')
    const payload={...input,user_id:userId,performed_at:input.performed_at??new Date().toISOString(),source:input.source??'manual',is_verified:input.is_verified??false,visibility:input.visibility??'public'}
    const {data,error}=await supabase.from('activities').insert(payload as any).select('*').single()
    if(error)throw error
    setActivities(p=>[data as any,...p]); return data as any
  },[userId])
  const updateActivity=useCallback(async(id:string,updates:Partial<Activity>)=>{const{data,error}=await supabase.from('activities').update({...updates,updated_at:new Date().toISOString()} as any).eq('id',id).select('*').single();if(error)throw error;setActivities(p=>p.map(a=>a.id===id?data as any:a));return data as any},[])
  const deleteActivity=useCallback(async(id:string)=>{const{error}=await supabase.from('activities').delete().eq('id',id);if(error)throw error;setActivities(p=>p.filter(a=>a.id!==id))},[])
  const derived=useMemo(()=>{
    const sportBreakdown:Partial<Record<SportType,number>>={}; let totalCalories=0,totalDurationSeconds=0
    const dayCounts:Record<string,number>={}
    activities.forEach(a=>{sportBreakdown[a.sport_type]=(sportBreakdown[a.sport_type]??0)+1;totalCalories+=a.calories_burned??0;totalDurationSeconds+=a.duration_seconds;const day=(a.performed_at??a.created_at).slice(0,10);dayCounts[day]=(dayCounts[day]??0)+1})
    const heatmapData=dayCounts
    return{sportBreakdown,heatmapData,totalCalories,totalDurationSeconds}
  },[activities])
  return{activities,loading,refetch,addActivity,updateActivity,deleteActivity,...derived}
}

export function useFriendFeed(friendIds:string[]){
  const [feed,setFeed]=useState<ActivityWithProfile[]>([]),[loading,setLoading]=useState(false)
  const refetch=useCallback(async()=>{if(!friendIds.length){setFeed([]);return};setLoading(true);const{data}=await supabase.from('activities').select('*, profile:profiles!user_id(id,username,avatar_url,is_pro,hybrid_score)').in('user_id',friendIds).order('performed_at',{ascending:false}).limit(50);setFeed((data??[]) as any);setLoading(false)},[friendIds.join(',')])
  useEffect(()=>{refetch()},[refetch]);return{feed,loading,refetch}
}
