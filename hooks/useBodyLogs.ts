import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
export function useBodyLogs(userId?:string,days=90){
  const [logs,setLogs]=useState<any[]>([])
  const refetch=useCallback(async()=>{
    if(!userId){setLogs([]);return}
    const since=new Date(Date.now()-days*86400000).toISOString().slice(0,10)
    const {data}=await supabase.from('body_logs').select('*').eq('user_id',userId).gte('logged_date',since).order('logged_date')
    setLogs(data??[])
  },[userId,days])
  useEffect(()=>{refetch()},[refetch])
  return {logs,refetch}
}
