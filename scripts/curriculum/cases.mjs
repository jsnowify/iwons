// Every problem gets its own test inputs: a small seeded generator keyed by the problem's slug.
// The shapes (empty, singleton, duplicates, negatives, zeros, maximum size) stay the same; only the values change.
function rng(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const LETTERS = "abcdefghijklmnopqrstuvwxyz";
const STEMS = ["ink", "paper", "key", "ribbon", "stamp", "drawer", "margin", "carriage", "slip", "binder", "tray", "lever", "roller", "typebar", "ledger", "folio"];
function makeInputs(seed, max) {
  const r = rng(seed);
  const int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const pick = list => list[int(0, list.length - 1)];
  const shuffle = list => { const out = [...list]; for (let i = out.length - 1; i > 0; i--) { const j = int(0, i); [out[i], out[j]] = [out[j], out[i]]; } return out; };
  const distinct = (count, lo, hi, avoid = []) => { const seen = new Set(avoid), out = []; while (out.length < count) { const v = int(lo, hi); if (!seen.has(v)) { seen.add(v); out.push(v); } } return out; };
  const letter = () => pick([...LETTERS]);
  const letters = n => Array.from({ length: n }, letter).join("");
  const [a0, b0] = distinct(2, 2, 20, [0]);
  const neg0 = -int(1, 12);
  const [p, q, t] = distinct(3, 2, 14, [0]);
  const raw = [
    shuffle([a0, neg0, a0, 0, b0]),
    [],
    [],
    [int(1, 20)],
    Array(4).fill(int(2, 9)),
    distinct(3, 1, 20).map(v => -v),
    [],
    [0, 0, 0],
    shuffle([p, q, -int(1, 8), p, t]),
  ];
  const dup = int(2, 9);
  raw[1] = shuffle([dup, dup, -int(1, 9), dup]);
  const slope = pick([7, 9, 11, 13, 17, 19, 23, 29]);
  raw[6] = Array.from({ length: max }, (_, i) => (i * slope) % 41 - 20);
  const kValues = Array.from({ length: 9 }, () => int(1, 8));
  const x = letter(), y = letter(), z = letter(), w = letter();
  const text = [
    `${letters(1)}${x}${x}${letters(2)} ${letters(1)}${y}${y}${y}${letters(1)}`,
    `${x.toUpperCase()}${x.toUpperCase()} ${x}${x.toUpperCase()}${x.toUpperCase()}`,
    "", " ", z.repeat(5),
    ` ${pick([..."-!?.,;"])}${pick([..."-!?.,;"])}${pick([..."-!?.,;"])} `,
    w.repeat(max), "   ",
    `${x} ${y.repeat(2)}   ${z.repeat(3)}`,
  ];
  const stem = pick(STEMS), other = pick(STEMS.filter(s => s !== stem)), word = pick(STEMS);
  const longA = `${stem.slice(0, 5)}${other.slice(0, 5)}`.slice(0, 11), longEnd = letters(1);
  const words = [
    [stem, stem.slice(0, 3) + pick(["side", "ed", "er"]), stem.slice(0, 2) + letters(1) + letters(1), other],
    [word, word, word.slice(0, -1) + letter()],
    [], [pick(STEMS)], Array(3).fill(pick(["a", "ab", "go", "me"])),
    [pick(["a", "b", "c"]), pick(["x", "y", "z"])],
    Array.from({ length: max }, (_, j) => j % 2 ? longA + "x" : longA + longEnd),
    [pick(["a", "b", "c"]), pick(["d", "e", "f"])],
    [pick(STEMS), pick(STEMS).slice(0, 2), pick(STEMS).slice(0, 1)],
  ];
  return { raw, kValues, text, words, edgeOffset: int(0, 2), weightOffset: int(0, 12), padSlope: pick([5, 7, 9, 11]), bstShift: int(10, 18), sampleTail: int(0, 3), treeSingle: int(1, 20), r, int, pick, shuffle, letters };
}
// sample builds one extra input, shaped like the tests, for a worked example that is not a test.
export function casesFor(kernel, seed = "default", sample) {
  const max = kernel.max;
  const gen = makeInputs(seed, max);
  const raw = sample ? [sample.values] : gen.raw;
  const kValues = sample ? [sample.k] : gen.kValues;
  return raw.map((values,i) => {
    const normalize = a => a.map(x => kernel.positive ? Math.abs(x) : x);
    let a = normalize(values);
    if (kernel.positive && i===6 && kernel.bound) a=a.map((_,j)=> j%2 ? kernel.bound : 0);
    if (kernel.sorted) a.sort((x,y)=>x-y);
    const {family} = kernel;
    if (family==="text") a=sample?sample.text:gen.text[i];
    if (family==="words") a=sample?sample.words:gen.words[i];
    if (family==="pair" || family==="queries") {
      const left=normalize(values),right=normalize(raw[(i+2)%raw.length]);
      if (i===2) { left.length=0;right.length=0; }
      if (i===6) while(right.length<max) right.push((right.length*gen.padSlope)%31-15);
      if (kernel.sorted || family==="queries")left.sort((x,y)=>x-y);
      if (kernel.sorted && family!=="queries")right.sort((x,y)=>x-y);
      a=[left,right];
    }
    if (family==="matrix") {
      a=i===2?[]:i===6?Array.from({length:max},(_,r)=>Array.from({length:max},(_,c)=>(r+c+gen.edgeOffset)%11-5)):values.map((x,j)=>j===1?[]:[x,x-2]);
    }
    if (["graph","weightedGraph","undirected"].includes(family)) {
      const n=i===2?0:i===6?max:i===3?1:Math.min(6,values.length+1);
      a=Array.from({length:n},()=>Array(n).fill(0));
      const draw=rng(`${seed}#graph${i}`);
      for(let u=0;u<n;u++)for(let v=0;v<n;v++) {
        const chance=draw(),weight=1+Math.floor(draw()*13);
        const edge=i===7?false:i===4?u===v:i===5?false:i===6?u<v:chance<0.4;
        if(edge)a[u][v]=family==="weightedGraph"?weight:1;
      }
      if(family==="undirected")for(let u=0;u<n;u++)for(let v=u+1;v<n;v++)a[v][u]=a[u][v];
    }
    if (["intervals","reservations"].includes(family)) a=values.map((x,j)=>{const start=x+j,end=start+1+Math.abs(x)%7;return family==="reservations"?[start,end,Math.abs(x)+j]:[start,end];});
    if(family==="items")a=values.map((x,j)=>[1+Math.abs(x)%8,Math.abs(x)+j]);
    if(family==="dimensions")a=values.map(x=>1+Math.abs(x)%10);
    if(family==="masks")a=values.map(x=>Math.abs(x)%Math.max(1,2**values.length));
    if(family==="masks" && i===6)a=Array(max).fill(2**max-1);
    if(family==="tree")a=i===2?[]:i===3?[gen.treeSingle]:i===6?values:[values[0],null,values[1]??null,values[2]??null,values[3]??null];
    if(family==="bst") {
      const xs=[...new Set(i===6?Array.from({length:max},(_,j)=>j-gen.bstShift):values)].sort((x,y)=>x-y);
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
export function exampleCase(kernel, seed) {
  const g = makeInputs(`${seed}#example`, kernel.max), pickFrom = list => g.pick(list);
  const dup = g.int(2, 9), word = pickFrom(STEMS);
  return casesFor(kernel, seed, {
    values: g.shuffle([dup, -g.int(1, 9), dup, g.int(0, 9), g.int(2, 12)]), k: g.int(1, 8),
    text: `${g.letters(1)}${g.letters(1)}  ${g.letters(2)}${word[0]}`,
    words: [word, word, word.slice(0, 2) + g.letters(1), pickFrom(STEMS)],
  })[0];
}
