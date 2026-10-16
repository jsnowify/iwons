import { inputSpec } from "./cases.mjs";
export function referenceFor(entry,kernel,mode) {
  const input=inputSpec(kernel),fn=entry.slug.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
  const j=["return out;","return out.reduce((s,x)=>s+x,0);","return out.filter(x=>x>=k).length;","return out.find(x=>x>=k)??-1;","let answer=out.length?out[0]:0;for(const x of out)if(x>answer)answer=x;return answer;","return out.length?Math.min(...out):0;","return out.filter(x=>x%2===0).length;","return out.reduce((s,x)=>s+Math.max(0,x),0);","return out.filter(x=>x>0);","return out.reduce((s,x,i)=>s+(i+1)*x,0);"][mode];
  const p=["return out","return sum(out)","return sum(x>=k for x in out)","return next((x for x in out if x>=k),-1)","return max(out,default=0)","return min(out,default=0)","return sum(x%2==0 for x in out)","return sum(x for x in out if x>0)","return [x for x in out if x>0]","return sum((i+1)*x for i,x in enumerate(out))"][mode];
  const v=["return out.stream().mapToInt(Integer::intValue).toArray();","int answer=0;for(int x:out)answer+=x;return answer;","int answer=0;for(int x:out)if(x>=k)answer++;return answer;","for(int x:out)if(x>=k)return x;return -1;","int answer=out.isEmpty()?0:out.get(0);for(int x:out)answer=Math.max(answer,x);return answer;","int answer=out.isEmpty()?0:out.get(0);for(int x:out)answer=Math.min(answer,x);return answer;","int answer=0;for(int x:out)if(x%2==0)answer++;return answer;","int answer=0;for(int x:out)if(x>0)answer+=x;return answer;","return out.stream().filter(x->x>0).mapToInt(Integer::intValue).toArray();","int answer=0;for(int i=0;i<out.size();i++)answer+=(i+1)*out.get(i);return answer;"][mode];
  const ret=mode===0||mode===8?"int[]":"int",tsRet=ret==="int"?"number":"number[]";
  const js=`function ${fn}(${input.name}, k) {\n  const a=${input.name}; let out=[];\n  ${kernel.js}\n  ${j}\n}\n`;
  let tsBody=kernel.js;
  for(const [from,to]of Object.entries(kernel.ts||{}))tsBody=tsBody.replaceAll(from,to);
  if(entry.unit==="round-desk")tsBody=tsBody.replace("queue=[]", "queue:number[]=[]");
  if(entry.unit==="weighted-lines")tsBody=tsBody.replace("heap=[]", "heap:number[][]=[]");
  tsBody=tsBody.replaceAll("const j=stack.pop();","const j=stack.pop()!;").replaceAll("sums.at(-1)","sums.at(-1)!");
  const typescript=`function ${fn}(${input.name}: ${input.ts}, k: number): ${tsRet} {\n  const a=${input.name}; let out:number[]=[];\n  ${tsBody}\n  ${j}\n}\n`;
  const python=`def ${fn}(${input.name}, k):\n    a=${input.name}\n    out=[]\n${(kernel.python+'\n'+p).split('\n').map(s=>'    '+s).join('\n')}\n`;
  const java=`class Solution {\n  public ${ret} ${fn}(${input.java} ${input.name}, int k) {\n    ${input.java} a=${input.name}; List<Integer> out=new ArrayList<>();\n    {${kernel.java}}\n    ${v}\n  }\n}\n`;
  const defaultReturn=ret==="int"?"0":"new int[0]";
  const nodeHeader=input.java==="ListNode"?"type ListNode = { val: number; next: ListNode | null };\n":input.java==="TreeNode"?"type TreeNode = { val: number; left: TreeNode | null; right: TreeNode | null };\n":"";
  return { fn, solutions:{javascript:js,typescript:nodeHeader+typescript,python,java}, starterCode:{
    javascript:`function ${fn}(${input.name}, k) {\n  // Derive the sequence, then compute the requested receipt.\n  return ${ret==="int"?"0":"[]"};\n}\n`,
    typescript:nodeHeader+`function ${fn}(${input.name}: ${input.ts}, k: number): ${tsRet} {\n  // Derive the sequence, then compute the requested receipt.\n  return ${ret==="int"?"0":"[]"};\n}\n`,
    python:`def ${fn}(${input.name}, k):\n    # Derive the sequence, then compute the requested receipt.\n    return ${ret==="int"?"0":"[]"}\n`,
    java:`class Solution {\n  public ${ret} ${fn}(${input.java} ${input.name}, int k) {\n    // Derive the sequence, then compute the requested receipt.\n    return ${defaultReturn};\n  }\n}\n`,
  },javaParams:[input.java,"int"],...(input.inputKinds?{inputKinds:input.inputKinds}:{}) };
}
