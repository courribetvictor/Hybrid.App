import { SPORT_BY_KEY } from '@/constants/sportCatalog'

export type TrackerMode = 'gps'|'swim'|'strength'|'racket'|'combat'|'climb'|'team'|'interval'|'generic'
export type TrackerMetricKey = 'time'|'distance'|'pace'|'speed'|'heart_rate'|'elevation'|'calories'|'cadence'|'splits'|'score'|'sets'|'rounds'|'reps'|'load'|'rest'|'attempts'|'grade'

export interface TrackerProfile {
  mode: TrackerMode
  metrics: TrackerMetricKey[]
  autoPause?: boolean
  autoLapKm?: number
  gps?: boolean
  supportsGhost?: boolean
  supportsPacer?: boolean
  supportsRoute?: boolean
  label?: string
}

const GPS_RUN: TrackerProfile={mode:'gps',gps:true,autoPause:true,autoLapKm:1,supportsGhost:true,supportsPacer:true,supportsRoute:true,metrics:['time','distance','pace','heart_rate','elevation','splits']}
const GPS_RIDE: TrackerProfile={mode:'gps',gps:true,autoPause:true,autoLapKm:5,supportsGhost:true,supportsPacer:false,supportsRoute:true,metrics:['time','distance','speed','heart_rate','elevation','splits']}
const RACKET: TrackerProfile={mode:'racket',metrics:['time','score','sets','heart_rate']}
const TEAM: TrackerProfile={mode:'team',gps:true,autoPause:false,metrics:['time','distance','speed','heart_rate','score']}
const COMBAT: TrackerProfile={mode:'combat',metrics:['time','rounds','rest','heart_rate']}
const CLIMB: TrackerProfile={mode:'climb',metrics:['time','attempts','grade','rest','heart_rate']}
const STRENGTH: TrackerProfile={mode:'strength',metrics:['time','reps','load','rest','heart_rate']}
const SWIM: TrackerProfile={mode:'swim',metrics:['time','distance','pace','heart_rate','sets']}

const overrides:Record<string,TrackerProfile>={
  running:GPS_RUN, trail_running:{...GPS_RUN,metrics:['time','distance','pace','heart_rate','elevation','splits']}, walking:GPS_RUN, hiking:{...GPS_RUN,supportsPacer:false},
  cycling:GPS_RIDE, mountain_biking:GPS_RIDE, gravel_cycling:GPS_RIDE, road_cycling:GPS_RIDE,
  swimming:SWIM, open_water_swimming:{...GPS_RUN,mode:'gps'}, water_polo:{...TEAM,gps:false},
  strength_training:STRENGTH, bodybuilding:STRENGTH, powerlifting:STRENGTH, weightlifting:STRENGTH, crossfit:{mode:'interval',metrics:['time','rounds','reps','load','rest','heart_rate']}, calisthenics:STRENGTH,
  tennis:RACKET, padel:RACKET, badminton:RACKET, table_tennis:RACKET, squash:RACKET, pickleball:RACKET,
  boxing:COMBAT, kickboxing:COMBAT, muay_thai:COMBAT, mma:COMBAT, judo:COMBAT, brazilian_jiu_jitsu:COMBAT, wrestling:COMBAT,
  climbing:CLIMB, bouldering:CLIMB, indoor_climbing:CLIMB,
  football:TEAM, futsal:TEAM, basketball:TEAM, rugby:TEAM, handball:TEAM, hockey:TEAM, field_hockey:TEAM,
  rowing:GPS_RIDE, kayaking:GPS_RIDE, canoeing:GPS_RIDE, stand_up_paddle:GPS_RIDE, roller_skating:GPS_RIDE, inline_skating:GPS_RIDE,
  cross_country_skiing:GPS_RIDE, skiing:GPS_RIDE, snowboarding:GPS_RIDE, surfing:{...GPS_RIDE,autoLapKm:undefined},
}

export function getTrackerProfile(sport:string):TrackerProfile{
  return overrides[sport] ?? {mode:'generic',metrics:['time','heart_rate']}
}

export const CONNECTED_PROVIDERS=[
  {id:'garmin',name:'Garmin Connect',kind:'watch',verified:true,description:'Runs, vélo, natation, multisport, cardio et fichiers FIT/GPX/TCX.'},
  {id:'apple_health',name:'Apple Health / Watch',kind:'health',verified:true,description:'Workouts, cardio, distance, énergie et données HealthKit.'},
  {id:'health_connect',name:'Health Connect',kind:'health',verified:true,description:'Hub Android pour données de santé et entraînements compatibles.'},
  {id:'huawei_health',name:'Huawei Health',kind:'watch',verified:true,description:'Exercices et données Huawei Health après autorisation.'},
  {id:'strava',name:'Strava',kind:'app',verified:true,description:'Import d’activités et historique avec anti-doublon.'},
  {id:'polar',name:'Polar Flow',kind:'watch',verified:true,description:'Préparé pour activités et cardio via API Polar.'},
  {id:'suunto',name:'Suunto',kind:'watch',verified:true,description:'Préparé pour activités outdoor et traces.'},
  {id:'coros',name:'COROS',kind:'watch',verified:true,description:'Préparé pour synchronisation d’activités.'},
] as const

export function sportTrackerLabel(sport:string){
  const sportDef=SPORT_BY_KEY[sport]
  const p=getTrackerProfile(sport)
  const modeLabel:Record<TrackerMode,string>={gps:'GPS + métriques',swim:'Longueurs + séries',strength:'Séries + repos',racket:'Score + sets',combat:'Rounds + repos',climb:'Voies + essais',team:'GPS + match',interval:'WOD + intervalles',generic:'Chrono intelligent'}
  return `${sportDef?.label??sport} · ${modeLabel[p.mode]}`
}
