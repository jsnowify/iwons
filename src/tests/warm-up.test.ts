import {test,expect} from 'vitest';
import {warmUpQueue} from '../lib/warm-up';
const problems=Array.from({length:20},(_,i)=>({id:`p${i}`})),now=Date.UTC(2026,4,15,12);
const progress=Object.fromEntries(problems.map(problem=>[problem.id,true]));
test('warm-up prioritizes due Path cards and ignores retired review ids',()=>{
 const queue=warmUpQueue(problems,[{problemId:'retired',due:now-3,step:0},{problemId:'p7',due:now-2,step:0},{problemId:'p2',due:now-1,step:0}],progress,now);
 expect(queue.slice(0,2)).toEqual(['p7','p2']);expect(new Set(queue).size).toBe(3);expect(queue).not.toContain('retired');
});
test('fallback cards are solved only and stable within the same local day',()=>{
 expect(warmUpQueue(problems,[],{p3:true},now)).toEqual(['p3']);expect(warmUpQueue(problems,[],{},now)).toEqual([]);
 expect(warmUpQueue(problems,[],progress,now)).toEqual(warmUpQueue(problems,[],progress,now+60000));
});
test('daily fallback changes across days instead of repeating a fixed alphabetical set',()=>{
 const days=Array.from({length:7},(_,i)=>warmUpQueue(problems,[],progress,now+i*86400000).join(','));expect(new Set(days).size).toBeGreaterThan(1);
});
