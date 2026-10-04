import{V7_ITEM_BY_ID,type CosmeticSlot}from'@/constants/v7'
export type FaceAssistResult={confidence:number;summary:string;suggested:Partial<Record<CosmeticSlot,string>>}
export async function analyzeAvatarSelfie(uri:string):Promise<{ok:true;result:FaceAssistResult}|{ok:false;reason:'not_configured'|'failed';message:string}>{
 const endpoint=process.env.EXPO_PUBLIC_AVATAR_AI_URL
 if(!endpoint)return{ok:false,reason:'not_configured',message:"L’analyse automatique est prête côté app, mais aucun service de vision sécurisé n’est encore connecté."}
 try{
  const blob=await(await fetch(uri)).blob();const body=new FormData();body.append('image',blob as any,'selfie.jpg')
  const res=await fetch(endpoint,{method:'POST',body,headers:{Accept:'application/json'}});if(!res.ok)throw new Error(`HTTP ${res.status}`)
  const raw=await res.json();const suggested:Partial<Record<CosmeticSlot,string>>={}
  for(const slot of ['skin','hair','face','head'] as CosmeticSlot[]){const id=raw?.suggested?.[slot];if(typeof id==='string'&&V7_ITEM_BY_ID[id]?.slot===slot)suggested[slot]=id}
  return{ok:true,result:{confidence:Math.max(0,Math.min(1,Number(raw?.confidence??.5))),summary:String(raw?.summary??'Proposition créée à partir de la photo.'),suggested}}
 }catch{return{ok:false,reason:'failed',message:"L’analyse du selfie n’a pas abouti. Tu peux continuer à personnaliser l’avatar manuellement."}}
}
