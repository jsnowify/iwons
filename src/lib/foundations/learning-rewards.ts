import type { LearningState } from "./learning-state";

export const recallXp=5,moduleXp=100;
export function localLearningDay(timestamp:number){
 const date=new Date(timestamp);
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
export function recallRewards(state:LearningState){
 // One successful retrieval per card and local day earns credit. Rechecking or
 // changing a self-rating cannot multiply that day's reward.
 return new Set(state.recallLog.filter(event=>event.correct).map(event=>`${event.key}:${event.day??new Date(event.at).toISOString().slice(0,10)}`)).size*recallXp;
}
export function isLearningDay(day:string){return /^\d{4}-\d{2}-\d{2}$/.test(day)&&Number.isFinite(Date.parse(`${day}T12:00:00Z`))&&new Date(`${day}T12:00:00Z`).toISOString().slice(0,10)===day;}
function previousDay(day:string){const date=new Date(`${day}T12:00:00Z`);date.setUTCDate(date.getUTCDate()-1);return date.toISOString().slice(0,10);}
export function learningWeekStart(day:string){const date=new Date(`${day}T12:00:00Z`);date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));return date.toISOString().slice(0,10);}
export function learningStreak(state:LearningState,today:string){
 if(!isLearningDay(today))return {days:0,freezeDay:null as string|null,freezeAvailable:false};
 const active=new Set([...state.attempts.filter(item=>item.correct).map(item=>item.day??new Date(item.at).toISOString().slice(0,10)),...state.recallLog.filter(item=>item.correct).map(item=>item.day??new Date(item.at).toISOString().slice(0,10))]);
 const freezes=state.streakFreezes.filter(isLearningDay);
 const covered=new Set([...active,...freezes]);
 let cursor=covered.has(today)?today:previousDay(today),days=0;
 while(covered.has(cursor)){days++;cursor=previousDay(cursor);}
 const yesterday=previousDay(today),freezeAvailable=!freezes.some(day=>learningWeekStart(day)===learningWeekStart(yesterday));
 const freezeDay=freezeAvailable&&!covered.has(yesterday)&&active.has(previousDay(yesterday))?yesterday:null;
 return {days,freezeDay,freezeAvailable};
}
