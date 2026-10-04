import type{Activity}from'@/types/database'
import{buildHybridIntelligence}from'@/lib/v10/intelligence'

export type LifeCheckin={sleepHours?:number;sleepQuality?:number;fatigue?:number;soreness?:number;stress?:number;motivation?:number;hydration?:number;availabilityMinutes?:number;painFlag?:boolean}
export type LifeSnapshot={score:number;recovery:number;sleep:number;fuel:number;hydration:number;mind:number;availability:number;headline:string;actions:string[];trainingColor:string}
const clamp=(n:number,a=0,b=100)=>Math.max(a,Math.min(b,n))
export function buildLifeSnapshot(activities:Activity[],checkin:LifeCheckin={}):LifeSnapshot{
 const intel=buildHybridIntelligence(activities)
 const sleepH=checkin.sleepHours??7.5, sleepQ=checkin.sleepQuality??4, fatigue=checkin.fatigue??2, soreness=checkin.soreness??2, stress=checkin.stress??2, motivation=checkin.motivation??4, hydration=checkin.hydration??4
 const sleep=clamp((sleepH/8)*55+(sleepQ/5)*45)
 const recovery=clamp(100-(fatigue-1)*14-(soreness-1)*11-(intel.fatigue*.28)+(sleep*.3))
 const mind=clamp(((6-stress)/5)*55+(motivation/5)*45)
 const hydrationScore=clamp(hydration/5*100)
 const fuel=clamp(72+(intel.loadRatio>1.25?-8:0)+(intel.weeklyMinutes>300?-5:0))
 const availability=clamp(((checkin.availabilityMinutes??60)/90)*100)
 let score=clamp(recovery*.28+sleep*.2+mind*.16+hydrationScore*.12+fuel*.1+intel.readiness*.14)
 if(checkin.painFlag)score=Math.min(score,45)
 const actions:string[]=[]
 if(checkin.painFlag)actions.push('Douleur signalée : privilégie repos ou activité très légère et demande un avis professionnel si elle persiste ou s’aggrave.')
 else if(score<50)actions.push('Journée récupération : mobilité, marche ou séance très facile selon tes sensations.')
 else if(score<72)actions.push('Tu peux t’entraîner, mais garde l’intensité contrôlée et raccourcis si les sensations baissent.')
 else actions.push('Bonne fenêtre d’entraînement : ta séance clé peut être placée aujourd’hui si le planning le prévoit.')
 if(sleep<65)actions.push('Priorité sommeil ce soir : évite de compenser une mauvaise nuit par plus d’intensité.')
 if(hydrationScore<60)actions.push('Hydrate-toi progressivement avant l’effort plutôt que de boire beaucoup juste au départ.')
 if(intel.loadRatio>1.45)actions.push('Ta charge récente est élevée par rapport à ta base : évite d’ajouter une deuxième séance dure.')
 const headline=score>=80?'PRÊT À PERFORMER':score>=65?'PRÊT, À DOSER':score>=50?'JOURNÉE CONTRÔLÉE':'RÉCUPÉRATION D’ABORD'
 return{score:Math.round(score),recovery:Math.round(recovery),sleep:Math.round(sleep),fuel:Math.round(fuel),hydration:Math.round(hydrationScore),mind:Math.round(mind),availability:Math.round(availability),headline,actions,trainingColor:score>=80?'#10B981':score>=65?'#3B82F6':score>=50?'#F59E0B':'#EF4444'}
}
export function buildFuelPlan(durationMinutes:number,intensity:'easy'|'moderate'|'hard'='moderate'){
 const long=durationMinutes>=75, veryLong=durationMinutes>=120
 const pre=durationMinutes<45?'Repas normal 2–3 h avant, puis eau selon ta soif.':long?'Repas riche en glucides 2–4 h avant + petite collation si besoin.':'Repas habituel 2–3 h avant avec une source de glucides facile à digérer.'
 const during=!long?'Eau selon conditions et soif.':veryLong?'Prévois un apport régulier en glucides et fluides, testé à l’entraînement.':'Pour une séance longue/intense, prévois des glucides faciles à tolérer et de l’eau régulièrement.'
 const post=intensity==='hard'||long?'Dans les heures suivantes : repas avec glucides + protéines + réhydratation.':'Un repas équilibré suffit généralement après cette séance.'
 return{pre,during,post}
}
export function buildCompetitionChecklist(sport:string){return[
 'Tenue et équipement testés, rien de neuf le jour J',
 'Batterie montre/téléphone et synchronisation Hybrid vérifiées',
 sport.includes('run')||sport.includes('cycling')?'Parcours, allure cible et ravitaillement enregistrés':'Horaires, règles et matériel spécifiques vérifiés',
 'Échauffement prévu avec une heure de début réaliste',
 'Plan B simple si météo, fatigue ou sensations changent',
]}
