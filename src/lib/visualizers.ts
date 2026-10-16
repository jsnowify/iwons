export interface VisualFrame { cells:{id:string;value:string;label?:string;highlighted?:boolean;visited?:boolean}[]; message:string; state:string; columns?:number }
export function binarySearchFrames(values:number[],target:number):VisualFrame[] {
  const frames:VisualFrame[]=[];let low=0,high=values.length-1;
  frames.push({cells:values.map((value,index)=>({id:String(index),value:String(value)})),message:`Find ${target} in the sorted index.`,state:`low=${low}, high=${high}`});
  while(low<=high){const mid=Math.floor((low+high)/2);frames.push({cells:values.map((value,index)=>({id:String(index),value:String(value),highlighted:index===mid,label:index===mid?"middle":index===low?"low":index===high?"high":undefined,visited:index<low||index>high})),message:values[mid]===target?`Found ${target} at index ${mid}.`:values[mid]<target?`${values[mid]} is too small. Keep the right half.`:`${values[mid]} is too large. Keep the left half.`,state:`low=${low}, middle=${mid}, high=${high}`});if(values[mid]===target)return frames;if(values[mid]<target)low=mid+1;else high=mid-1;}
  frames.push({cells:values.map((value,index)=>({id:String(index),value:String(value),visited:true})),message:`${target} is absent. The search interval is empty.`,state:`low=${low}, high=${high}`});return frames;
}
export function insertionSortFrames(input:number[]):VisualFrame[]{
  const values=[...input];const frames:VisualFrame[]=[];
  const capture=(message:string,key:number,boundary:number)=>frames.push({cells:values.map((value,index)=>({id:String(index),value:String(value),highlighted:index===key,label:index===key?"moving key":undefined,visited:index<boundary})),message,state:`Sorted prefix length: ${boundary}`});
  capture("The first card starts the sorted prefix.",0,1);
  for(let i=1;i<values.length;i++){let j=i;capture(`Insert ${values[i]} into the sorted prefix.`,j,i);while(j>0&&values[j-1]>values[j]){[values[j-1],values[j]]=[values[j],values[j-1]];j--;capture("Move the key left past a larger card.",j,i);}capture("The prefix now includes one more card.",j,i+1);}return frames;
}
export function gridBfsFrames(grid:number[][],start:[number,number]):VisualFrame[]{
  if(!grid.length||!grid[0].length)return [];
  const rows=grid.length,cols=grid[0].length;if(grid.some(row=>row.length!==cols))throw new Error("Grid rows must have equal width.");
  const frames:VisualFrame[]=[],queue:[number,number,number][]=[],seen=new Set<string>();
  const capture=(message:string,current?:string)=>frames.push({columns:cols,cells:grid.flatMap((row,r)=>row.map((wall,c)=>({id:`${r},${c}`,value:wall?"■":`${r},${c}`,label:wall?"wall":current===`${r},${c}`?"current":seen.has(`${r},${c}`)?"discovered":undefined,highlighted:current===`${r},${c}`,visited:seen.has(`${r},${c}`)}))),message,state:`Queue: ${queue.map(([r,c,d])=>`(${r},${c}; distance ${d})`).join(" ")||"empty"}`});
  const [sr,sc]=start;if(sr<0||sc<0||sr>=rows||sc>=cols||grid[sr][sc]){capture("The start is outside the open grid.");return frames;}
  queue.push([sr,sc,0]);seen.add(`${sr},${sc}`);capture("Enqueue the starting square at distance zero.");
  while(queue.length){const [r,c,d]=queue.shift()!;for(const [dr,dc]of [[0,1],[1,0],[0,-1],[-1,0]]){const nr=r+dr,nc=c+dc,key=`${nr},${nc}`;if(nr>=0&&nc>=0&&nr<rows&&nc<cols&&!grid[nr][nc]&&!seen.has(key)){seen.add(key);queue.push([nr,nc,d+1]);}}capture(`Visit (${r},${c}) at distance ${d}; enqueue its undiscovered open neighbours.`,`${r},${c}`);}
  capture(`Finished. Reached ${seen.size} squares. Each square was enqueued once.`);return frames;
}
