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

export function linearSearchFrames(values: number[], target: number): VisualFrame[] {
  const frames: VisualFrame[] = [{cells: values.map((v,i)=>({id:String(i),value:String(v)})),message:`Find ${target}, checking one card at a time.`,state:'Checked: 0'}];
  for(let i=0;i<values.length;i++) {
    frames.push({cells:values.map((v,j)=>({id:String(j),value:String(v),highlighted:j===i,visited:j<i,label:j===i?'checking':undefined})),message:values[i]===target?`Found ${target} at index ${i}.`:`${values[i]} does not match ${target}.`,state:`Checked: ${i+1}`});
    if(values[i]===target)return frames;
  }
  frames.push({cells:values.map((v,i)=>({id:String(i),value:String(v),visited:true})),message:`${target} is absent; every card was checked.`,state:`Checked: ${values.length}`});return frames;
}

function sortRecorder(values: number[]) {
  const frames: VisualFrame[]=[];
  const capture=(message:string,active:number[]=[],label='comparing',done=false)=>frames.push({cells:values.map((v,i)=>({id:String(i),value:String(v),highlighted:active.includes(i),visited:done,label:active.includes(i)?label:undefined})),message,state:`Cards: [${values.join(', ')}]`});
  capture('Start with the unsorted cards.');
  return {frames,capture,finish:()=>{capture('Sorted. Every card is in ascending order.',[],'',true);return frames;}};
}
export function bubbleSortFrames(input:number[]):VisualFrame[] {
  const values=[...input],{capture,finish}=sortRecorder(values);
  for(let end=values.length-1;end>0;end--){let swapped=false;for(let i=0;i<end;i++){capture(`Compare neighbours ${values[i]} and ${values[i+1]}.`,[i,i+1]);if(values[i]>values[i+1]){[values[i],values[i+1]]=[values[i+1],values[i]];swapped=true;capture('Swap the neighbours so the larger card moves right.',[i,i+1],'swapped');}}if(!swapped)break;}
  return finish();
}
export function selectionSortFrames(input:number[]):VisualFrame[] {
  const values=[...input],{capture,finish}=sortRecorder(values);
  for(let i=0;i<values.length-1;i++){let smallest=i;for(let j=i+1;j<values.length;j++){capture(`Look for the smallest remaining card; current minimum is ${values[smallest]}.`,[smallest,j]);if(values[j]<values[smallest])smallest=j;}if(smallest!==i){[values[i],values[smallest]]=[values[smallest],values[i]];capture(`Place ${values[i]} at the start of the unsorted suffix.`,[i,smallest],'placed');}}
  return finish();
}
export function mergeSortFrames(input:number[]):VisualFrame[] {
  const values=[...input],{capture,finish}=sortRecorder(values);
  function sort(low:number,high:number){if(high-low<2)return;const middle=Math.floor((low+high)/2);capture(`Split [${low}, ${high}) at ${middle}.`,[low,middle,high-1],'split');sort(low,middle);sort(middle,high);const left=values.slice(low,middle),right=values.slice(middle,high);let a=0,b=0;for(let k=low;k<high;k++){values[k]=b>=right.length||(a<left.length&&left[a]<=right[b])?left[a++]:right[b++];capture('Merge the smallest available card from the two sorted halves.',[k],'merged');}}
  sort(0,values.length);return finish();
}
export function quickSortFrames(input:number[]):VisualFrame[] {
  const values=[...input],{capture,finish}=sortRecorder(values);
  function sort(low:number,high:number){if(low>=high)return;const pivot=values[high];let boundary=low;capture(`Choose ${pivot} as the pivot.`,[high],'pivot');for(let j=low;j<high;j++){capture(`Compare ${values[j]} with pivot ${pivot}.`,[j,high]);if(values[j]<=pivot){[values[boundary],values[j]]=[values[j],values[boundary]];capture('Move this card into the smaller partition.',[boundary,j],'partition');boundary++;}}[values[boundary],values[high]]=[values[high],values[boundary]];capture(`Pivot ${pivot} is now in its final position.`,[boundary],'pivot placed');sort(low,boundary-1);sort(boundary+1,high);}
  sort(0,values.length-1);return finish();
}
export function gridDfsFrames(grid:number[][],start:[number,number]):VisualFrame[] {
  if(!grid.length||!grid[0].length)return [];
  const cols=grid[0].length;if(grid.some(row=>row.length!==cols))throw new Error('Grid rows must have equal width.');
  const frames:VisualFrame[]=[],seen=new Set<string>(),stack:[number,number][]=[];
  const capture=(message:string,current?:string)=>frames.push({columns:cols,cells:grid.flatMap((row,r)=>row.map((wall,c)=>({id:`${r},${c}`,value:wall?'■':`${r},${c}`,highlighted:current===`${r},${c}`,visited:seen.has(`${r},${c}`),label:wall?'wall':current===`${r},${c}`?'current':seen.has(`${r},${c}`)?'visited':undefined}))),message,state:`Stack: ${stack.map(([r,c])=>`(${r},${c})`).join(' ')||'empty'}`});
  const [r,c]=start;if(r<0||r>=grid.length||c<0||c>=cols||grid[r][c]){capture('The start is outside the open grid.');return frames;}
  stack.push(start);capture('Push the starting square onto the stack.');
  while(stack.length){const [r,c]=stack.pop()!,key=`${r},${c}`;if(seen.has(key))continue;seen.add(key);for(const[dr,dc]of [[-1,0],[0,-1],[1,0],[0,1]]){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<grid.length&&nc>=0&&nc<cols&&!grid[nr][nc]&&!seen.has(`${nr},${nc}`))stack.push([nr,nc]);}capture(`Visit (${r},${c}); explore the last pushed neighbour next.`,key);}
  capture(`Finished. Reached ${seen.size} squares using depth-first search.`);return frames;
}
