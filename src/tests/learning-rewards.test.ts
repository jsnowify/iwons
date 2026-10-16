import { expect, it } from "vitest";
import { emptyLearningState, validateLearningState, type LearningState } from "@/lib/foundations/learning-state";
import { isLearningDay, learningStreak, recallRewards } from "@/lib/foundations/learning-rewards";

const time=(day:string)=>new Date(`${day}T12:00:00`).getTime();
function success(state:LearningState,day:string,key="card"){
 state.recallLog.push({key,at:time(day),correct:true,rating:"Good",day});
}
it("rewards successful retrieval once per card per local day, never failures or reratings",()=>{
 const state=emptyLearningState();success(state,"2026-10-12");success(state,"2026-10-12");
 state.recallLog.push({key:"miss",at:time("2026-10-12"),correct:false,rating:"Again"});
 expect(recallRewards(state)).toBe(5);success(state,"2026-10-13");expect(recallRewards(state)).toBe(10);
 success(state,"2026-10-13","other-track-card");expect(recallRewards(state)).toBe(15);
});
it("offers one missed-day bridge, which preserves a streak without earning XP",()=>{
 const state=emptyLearningState();success(state,"2026-10-12");success(state,"2026-10-14");
 expect(learningStreak(state,"2026-10-14")).toMatchObject({days:1,freezeDay:"2026-10-13"});
 const xp=recallRewards(state);state.streakFreezes.push("2026-10-13");
 expect(learningStreak(state,"2026-10-14")).toMatchObject({days:3,freezeDay:null,freezeAvailable:false});
 expect(recallRewards(state)).toBe(xp);
 success(state,"2026-10-16");expect(learningStreak(state,"2026-10-16").freezeDay).toBeNull();
});
it("does not count an unsuccessful session or bridge multiple missing days",()=>{
 const state=emptyLearningState();success(state,"2026-10-12");
 state.sessions.push({id:"quiet",track:"python",startedAt:time("2026-10-15"),endedAt:time("2026-10-15"),recalled:[],revisit:[],completed:[]});
 expect(learningStreak(state,"2026-10-15")).toMatchObject({days:0,freezeDay:null});
});
it("allocates freezes by calendar week of the missed day, including month boundaries",()=>{
 const state=emptyLearningState();state.streakFreezes=["2026-09-30"];success(state,"2026-10-04");
 expect(learningStreak(state,"2026-10-06").freezeDay).toBe("2026-10-05");
});
it("rejects impossible calendar days in imported freeze records",()=>{
 expect(isLearningDay("2026-02-30")).toBe(false);expect(isLearningDay("2028-02-29")).toBe(true);
 expect(()=>validateLearningState({...emptyLearningState(),streakFreezes:["yesterday"]})).toThrow();
 expect(learningStreak(emptyLearningState(),"").days).toBe(0);
});

it("does not chain two freezes over consecutive missing days at a week boundary",()=>{
 const state=emptyLearningState();success(state,"2026-10-10");state.streakFreezes=["2026-10-11"];success(state,"2026-10-13");
 expect(learningStreak(state,"2026-10-13")).toMatchObject({days:1,freezeDay:null,freezeAvailable:true});
});

it("keeps reward days stable after timezone changes, with a UTC fallback for older records",()=>{
 const state=emptyLearningState();state.recallLog=[{key:"card",at:Date.parse("2026-10-12T23:30:00Z"),correct:true,rating:"Good",day:"2026-10-13"},{key:"legacy",at:Date.parse("2026-10-12T23:30:00Z"),correct:true,rating:"Good"}];
 const original=process.env.TZ;
 try{process.env.TZ="Pacific/Honolulu";const first=recallRewards(state);process.env.TZ="Asia/Manila";expect(recallRewards(state)).toBe(first);expect(first).toBe(10);}finally{if(original===undefined)delete process.env.TZ;else process.env.TZ=original;}
});
it("rejects repeated, same-week and consecutive freeze allocations in imports",()=>{
 for(const streakFreezes of [["2026-10-12","2026-10-12"],["2026-10-12","2026-10-14"],["2026-10-11","2026-10-12"]])expect(()=>validateLearningState({...emptyLearningState(),streakFreezes})).toThrow();
});
