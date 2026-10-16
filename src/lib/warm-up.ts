import type { Review } from './types';
import {localDay} from './stats';
function rank(value:string){let hash=2166136261;for(const char of value)hash=Math.imul(hash^char.charCodeAt(0),16777619);return hash>>>0;}
export function warmUpQueue(problems:{id:string}[],reviews:Review[],progress:Record<string,boolean>,now:number){
 const known=new Set(problems.map(problem=>problem.id)),day=localDay(now);
 const due=reviews.filter(review=>review.due<=now&&known.has(review.problemId)).toSorted((a,b)=>a.due-b.due).map(review=>review.problemId);
 const solved=problems.filter(problem=>progress[problem.id]).toSorted((a,b)=>rank(`${day}:${a.id}`)-rank(`${day}:${b.id}`)||a.id.localeCompare(b.id)).map(problem=>problem.id);
 return [...new Set([...due,...solved])].slice(0,3);
}
