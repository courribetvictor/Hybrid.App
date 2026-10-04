import { createClient } from '@supabase/supabase-js'
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key'
export const supabase = createClient(url, anon, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:false } })
