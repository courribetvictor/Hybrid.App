import type { Activity } from '@/types/database'

export type IntegrityResult={score:number;status:'verified'|'trusted'|'review'|'manual';reasons:string[]}
const TRUSTED=new Set(['garmin','apple_health','health_connect','huawei_health','polar','suunto','coros','hybrid_tracker','gps'])
export function evaluateActivityIntegrity(a:Activity):IntegrityResult{
 let score=45;const reasons:string[]=[]
 if(a.is_verified){score+=30;reasons.push('Source vérifiée')}
 if(TRUSTED.has(a.source??'manual')){score+=18;reasons.push('Source capteur / plateforme connectée')}
 if((a.source??'manual')==='manual'){score-=18;reasons.push('Saisie manuelle')}
 const km=Number(a.metrics?.distance_km??0), sec=Number(a.duration_seconds??0)
 if(km>0&&sec>0){const speed=km/(sec/3600);if(speed>45&&['running','trail_running','walking','hiking'].includes(a.sport_type)){score-=45;reasons.push('Vitesse incohérente pour la discipline')}}
 const hr=Number(a.metrics?.heart_rate_avg??a.metrics?.avg_heart_rate??0);if(hr>230){score-=35;reasons.push('Fréquence cardiaque incohérente')}
 score=Math.max(0,Math.min(100,Math.round(score)))
 const status:IntegrityResult['status']=(a.source??'manual')==='manual'&&!a.is_verified?'manual':score>=85?'verified':score>=65?'trusted':'review'
 return{score,status,reasons}
}
