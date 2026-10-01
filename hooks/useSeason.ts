import{useEffect,useState}from'react';import{supabase}from'@/lib/supabase'
export function useCurrentSeason(){const[season,setSeason]=useState<any|null>(null);useEffect(()=>{supabase.from('seasons').select('*').eq('active',true).order('starts_at',{ascending:false}).limit(1).maybeSingle().then(({data})=>setSeason(data??null))},[]);return season}
