export interface TrackPoint { latitude:number; longitude:number; altitude?:number|null; speed?:number|null; timestamp:number; accuracy?:number|null }
export interface Split { index:number; distanceKm:number; seconds:number; paceSecondsPerKm:number }

const R=6371
export function distanceKm(a:TrackPoint,b:TrackPoint){
  const dLat=(b.latitude-a.latitude)*Math.PI/180,dLon=(b.longitude-a.longitude)*Math.PI/180
  const x=Math.sin(dLat/2)**2+Math.cos(a.latitude*Math.PI/180)*Math.cos(b.latitude*Math.PI/180)*Math.sin(dLon/2)**2
  return 2*R*Math.asin(Math.sqrt(x))
}
export function totalDistanceKm(points:TrackPoint[]){let d=0;for(let i=1;i<points.length;i++){const step=distanceKm(points[i-1],points[i]);if(step<.25)d+=step}return d}
export function elevationGain(points:TrackPoint[]){let g=0;for(let i=1;i<points.length;i++){const a=points[i-1].altitude,b=points[i].altitude;if(a!=null&&b!=null&&b>a&&b-a<40)g+=b-a}return g}
export function formatClock(sec:number){const s=Math.max(0,Math.floor(sec)),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),r=s%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`:`${m}:${String(r).padStart(2,'0')}`}
export function formatPace(secPerKm:number){if(!isFinite(secPerKm)||secPerKm<=0)return'--';const m=Math.floor(secPerKm/60),s=Math.round(secPerKm%60);return`${m}:${String(s).padStart(2,'0')}/km`}
export function buildSplits(points:TrackPoint[],elapsedSeconds:number,lapKm=1):Split[]{
  if(points.length<2||lapKm<=0)return[];let distance=0,next=lapKm,lastAt=0;const splits:Split[]=[]
  const totalStart=points[0].timestamp,totalEnd=points[points.length-1].timestamp,wall=Math.max(1,(totalEnd-totalStart)/1000)
  for(let i=1;i<points.length;i++){
    const step=distanceKm(points[i-1],points[i]);if(step>.25)continue;distance+=step
    while(distance>=next){const frac=Math.min(1,wall?((points[i].timestamp-totalStart)/1000)/wall:1);const at=elapsedSeconds*frac;const sec=at-lastAt;splits.push({index:splits.length+1,distanceKm:lapKm,seconds:sec,paceSecondsPerKm:sec/lapKm});lastAt=at;next+=lapKm}
  }
  return splits
}
export function estimateCalories(durationSeconds:number,rpe:number,weightKg=70){
  const met=2.5+Math.max(1,Math.min(10,rpe))*.85;return Math.round(met*weightKg*(durationSeconds/3600))
}
export function activityFingerprint(input:{performedAt:string;sport:string;durationSeconds:number;distanceKm?:number|null}){
  const minute=Math.floor(new Date(input.performedAt).getTime()/60000);return`${input.sport}:${minute}:${Math.round(input.durationSeconds/30)}:${Math.round((input.distanceKm??0)*20)}`
}
