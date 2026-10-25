// sample builds one extra input, shaped like the tests, for a worked example that is not a test.
export function casesFor(kernel, sample) {
  const max = kernel.max;
  const raw = sample ? [sample.values] : [[7,-3,7,0,12],[4,4,-2,4],[],[9],[5,5,5,5],[-20,-1,-7],Array.from({length:max},(_,i)=>(i*13)%41-20),[0,0,0],[8,3,-2,8,1]];
  const kValues = sample ? [sample.k] : [3,2,1,1,4,8,3,5,2];
  return raw.map((values,i) => {
    const normalize = a => a.map(x => kernel.positive ? Math.abs(x) : x);
    let a = normalize(values);
    if (kernel.positive && i===6 && kernel.bound) a=a.map((_,j)=> j%2 ? kernel.bound : 0);
    if (kernel.sorted) a.sort((x,y)=>x-y);
    const {family} = kernel;
    if (family==="text") a=sample?sample.text:["inkk paaaper","QQ qQQ",""," ","aaaaa"," -!? ","i".repeat(max),"   ","a bb   ccc"][i];
    if (family==="words") a=sample?sample.words:[["ink","inside","inn","paper"],["aa","aa","ab"],[],["z"],["a","a","a"],["a","z"],Array.from({length:max},(_,j)=>j%2?"inkpaperdesk":"inkpaperpage"),["a","b"],["paper","pa","p"]][i];
    if (family==="pair" || family==="queries") {
      const left=normalize(values),right=normalize(raw[(i+2)%raw.length]);
      if (i===2) { left.length=0;right.length=0; }
      if (i===6) while(right.length<max) right.push((right.length*7)%31-15);
      if (kernel.sorted || family==="queries")left.sort((x,y)=>x-y);
      if (kernel.sorted && family!=="queries")right.sort((x,y)=>x-y);
      a=[left,right];
    }
    if (family==="matrix") {
      a=i===2?[]:i===6?Array.from({length:max},(_,r)=>Array.from({length:max},(_,c)=>(r+c)%11-5)):values.map((x,j)=>j===1?[]:[x,x-2]);
    }
    if (["graph","weightedGraph","undirected"].includes(family)) {
      const n=i===2?0:i===6?max:i===3?1:Math.min(6,values.length+1);
      a=Array.from({length:n},()=>Array(n).fill(0));
      for(let u=0;u<n;u++)for(let v=0;v<n;v++) {
        const edge=i===7?false:i===4?u===v:i===5?false:i===6?u<v:(u+v+i)%3===0;
        if(edge)a[u][v]=family==="weightedGraph"?1+(u*3+v)%13:1;
      }
      if(family==="undirected")for(let u=0;u<n;u++)for(let v=u+1;v<n;v++)a[v][u]=a[u][v];
    }
    if (["intervals","reservations"].includes(family)) a=values.map((x,j)=>{const start=x+j,end=start+1+Math.abs(x)%7;return family==="reservations"?[start,end,Math.abs(x)+j]:[start,end];});
    if(family==="items")a=values.map((x,j)=>[1+Math.abs(x)%8,Math.abs(x)+j]);
    if(family==="dimensions")a=values.map(x=>1+Math.abs(x)%10);
    if(family==="masks")a=values.map(x=>Math.abs(x)%Math.max(1,2**values.length));
    if(family==="masks" && i===6)a=Array(max).fill(2**max-1);
    if(family==="tree")a=i===2?[]:i===3?[9]:i===6?values:[values[0],null,values[1]??null,values[2]??null,values[3]??null];
    if(family==="bst") {
      const xs=[...new Set(i===6?Array.from({length:max},(_,j)=>j-15):values)].sort((x,y)=>x-y);
      const build=(l,r)=>{if(l>=r)return null;const mid=(l+r)>>1;return {val:xs[mid],left:build(l,mid),right:build(mid+1,r)};};
      const root=build(0,xs.length),queue=root?[root]:[];a=[];
      for(let j=0;j<queue.length;j++){const node=queue[j];a.push(node?node.val:null);if(node)queue.push(node.left,node.right);}
      while(a.at(-1)===null)a.pop();
    }
    return { input:[a,kValues[i]], coverage: sample ? "example" : ["worked","worked","empty","singleton","duplicates-or-redundancy","lower-bound","maximum-size","zero-or-minimum","order-and-ties"][i] };
  });
}
export function inputSpec(kernel) {
  const f=kernel.family;
  if(["text","words"].includes(f))return {name:f==="text"?"line":"words",java:f==="text"?"String":"String[]",ts:f==="text"?"string":"string[]"};
  if(f==="list")return {name:"head",java:"ListNode",ts:"ListNode | null",inputKinds:{"0":"list"}};
  if(f==="tree"||f==="bst")return {name:"root",java:"TreeNode",ts:"TreeNode | null",inputKinds:{"0":"tree"}};
  if(["pair","queries","matrix","graph","weightedGraph","undirected","intervals","items","reservations"].includes(f))return {name:["graph","weightedGraph","undirected"].includes(f)?"links":"drawers",java:"int[][]",ts:"number[][]"};
  return {name:"readings",java:"int[]",ts:"number[]"};
}
// Worked example for the description. Its input never matches a test case.
export const exampleCase = kernel => casesFor(kernel, { values: [6, -1, 6, 2], k: 4, text: "ok  zoo", words: ["tap", "tape", "top", "tap"] })[0];
