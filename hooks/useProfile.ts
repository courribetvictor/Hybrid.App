import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

export function useSession(){
  const [userId,setUserId]=useState<string|null>(null),[email,setEmail]=useState<string|null>(null),[ready,setReady]=useState(false)
  useEffect(()=>{supabase.auth.getSession().then(({data})=>{setUserId(data.session?.user.id??null);setEmail(data.session?.user.email??null);setReady(true)});const{data}=supabase.auth.onAuthStateChange((_e,s)=>{setUserId(s?.user.id??null);setEmail(s?.user.email??null);setReady(true)});return()=>data.subscription.unsubscribe()},[])
  return{userId,email,ready}
}

export function useProfile(userId?:string){
  const [profile,setProfile]=useState<Profile|null>(null),[loading,setLoading]=useState(false)
  const refetch=useCallback(async()=>{
    if(!userId){setProfile(null);return}
    setLoading(true)
    const {data,error}=await supabase.rpc('get_my_profile')
    if(!error){const row=Array.isArray(data)?data[0]:data;setProfile((row??null) as any)}
    setLoading(false)
  },[userId])
  useEffect(()=>{refetch()},[refetch])
  const updateProfile=useCallback(async(updates:Partial<Profile>)=>{
    if(!userId)return
    const{error}=await supabase.from('profiles').update(updates as any).eq('id',userId)
    if(error)throw error
    await refetch()
  },[userId,refetch])
  return{profile,loading,refetch,updateProfile}
}
