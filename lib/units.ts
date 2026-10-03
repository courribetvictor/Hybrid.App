export function formatDurationLong(sec:number=0){ const h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60); return h?`${h} h ${m} min`:`${m} min` }
export function displayWeight(kg:number|null|undefined, unit:'metric'|'imperial'='metric'){ const value=kg==null?0:(unit==='imperial'?kg*2.20462:kg); return { value, unit: unit==='imperial'?'lbs':'kg' } }
export function formatWeight(kg:number|null|undefined, unit:'metric'|'imperial'='metric'){ if(kg==null)return '—'; const d=displayWeight(kg,unit); return `${d.value.toFixed(1)} ${d.unit}` }
export function formatHeight(cm:number|null|undefined, unit:'metric'|'imperial'='metric'){ if(cm==null)return '—'; if(unit==='metric')return `${Math.round(cm)} cm`; const inches=cm/2.54; return `${Math.floor(inches/12)}'${Math.round(inches%12)}\"` }
export function computeBMI(weightKg:number|null|undefined,heightCm:number|null|undefined){ if(!weightKg||!heightCm)return null; const m=heightCm/100; return Math.round((weightKg/(m*m))*10)/10 }
export function bmiCategory(bmi:number|null){ if(bmi==null)return null; if(bmi<18.5)return 'underweight'; if(bmi<25)return 'normal'; if(bmi<30)return 'overweight'; return 'obese' }
