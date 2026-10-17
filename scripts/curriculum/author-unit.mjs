import fs from "node:fs";
import path from "node:path";
import { kernels } from "./kernels.mjs";
import { units, projections, modesFor } from "./units.mjs";
import { casesFor, inputSpec } from "./cases.mjs";
import { referenceFor } from "./references.mjs";
import { scenes } from "./scenes.mjs";
const manifest=JSON.parse(fs.readFileSync("src/data/curriculum.json","utf8"));
function nodes(input,family) {
  if(family==="list")return input.reduceRight((next,val)=>({val,next}),null);
  if(family==="tree"||family==="bst") {
    if(!input.length||input[0]===null)return null;
    const root={val:input[0],left:null,right:null},queue=[root];let i=1;
    for(let j=0;j<queue.length&&i<input.length;j++)for(const side of ["left","right"]){const val=input[i++];if(val!=null){queue[j][side]={val,left:null,right:null};queue.push(queue[j][side]);}}
    return root;
  }
  return input;
}
const receipts=[xs=>xs,xs=>xs.reduce((s,x)=>s+x,0),(xs,k)=>xs.filter(x=>x>=k).length,(xs,k)=>xs.find(x=>x>=k)??-1,xs=>xs.length?Math.max(...xs):0,xs=>xs.length?Math.min(...xs):0,xs=>xs.filter(x=>x%2===0).length,xs=>xs.reduce((s,x)=>s+Math.max(0,x),0),xs=>xs.filter(x=>x>0),xs=>xs.reduce((s,x,i)=>s+(i+1)*x,0)];
const stories=[
  name=>`${name} rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.`,
  name=>`${name} is closing the print-room account before the afternoon mail. A single total must replace the pile of working slips.`,
  name=>`${name} marks a threshold on the filing cabinet's inspection card. Only qualifying readings count toward today's clearance stamp.`,
  name=>`${name} needs the first qualifying slip while the courier waits at the door. Later matches must not jump ahead in the tray.`,
  name=>`${name} is setting the upper stop on an old office gauge. The largest derived reading goes on its label, even if the whole tray is below zero.`,
  name=>`${name} is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.`,
  name=>`${name} separates readings for the office's even-numbered keys. A zero reading belongs in that count, just like any other even number.`,
  name=>`${name} prepares an invoice that accepts only positive ink adjustments. Zero and negative derived readings stay off the invoice.`,
  name=>`${name} prepares a clean proof strip for the front desk. Positive derived readings keep their places relative to one another.`,
  name=>`${name} adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.`,
];
export function authorUnit(slug, rewrite = problem => problem) {
  const unit=units.find(u=>u.slug===slug);if(!unit)throw new Error(`Unknown unit ${slug}`);
  const kernel=kernels[unit.kernel];if(!kernel)throw new Error(`Missing ${unit.kernel}`);
  const intro=JSON.parse(fs.readFileSync("src/data/units.json","utf8")).find(u=>u.slug===slug).intro;
  const input=inputSpec(kernel);
  const candidateFunction=new Function("a","k",`let out=[];${kernel.js};return out;`);
  const members=manifest.filter(p=>p.unit===slug),modes=modesFor(unit);
  const folder=path.join("src/data/problems",`level-${unit.level}`,slug);fs.mkdirSync(folder,{recursive:true});
  for(const [index,entry]of members.entries()) {
    const mode=modes[index],projection=projections[mode],ref=referenceFor(entry,kernel,mode);
    const large = mode===4 && ["array","text","list","tree","bst","pair","queries"].includes(kernel.family) && !["recursive","subsets","matrixChain"].includes(unit.kernel);
    const caseKernel = large ? { ...kernel, max: 50000 } : kernel;
    const rawCases = casesFor(caseKernel);
    const sequences=[];
    const cases=rawCases.map((c,i)=>{
      const args=structuredClone(c.input);args[0]=nodes(args[0],kernel.family);
      const sequence=candidateFunction(...args),expected=receipts[mode](sequence,c.input[1]);
      sequences.push(sequence);
      return {id:`${entry.id}-${i+1}`,input:c.input,expected,coverage:c.coverage,...(i<3?{explanation:`The derived sequence is ${JSON.stringify(sequence)}. ${mode===9?`Its weighted products are ${JSON.stringify(sequence.map((x,j)=>(j+1)*x))}. `:""}${projection.task} This gives ${JSON.stringify(expected)}.`}:{})};
    });
    const names=["Mina","Sol","Ivo","Neri","Alma","Rafi","Pia","Tomas","Luz","Ada"];
    const constraints=[["tree","bst"].includes(kernel.family)?`0 <= node count <= ${caseKernel.max}; JSON null placeholders do not count as nodes.`:`0 <= input size <= ${caseKernel.max}${["pair","queries","matrix"].includes(kernel.family)?" per row":""}.`,"1 <= k <= 8. All arithmetic results fit a signed 32-bit integer.",
      kernel.family==="text"?"The line contains ASCII characters; the only word separator is a space.":kernel.family==="words"?"There are at most 64 lowercase English words, each with 1 to 12 letters.":kernel.family==="masks"?"There are at most 6 desks. Every mask is between 0 and (1 << n) - 1.":kernel.family==="dimensions"?"Every dimension is an integer from 1 through 10; there are at most 16 dimensions.":kernel.positive?`Readings are integers from 0 through ${kernel.bound??20}.`:"Numeric readings lie between -1,000,000 and 1,000,000, subject to the task's shape and ordering rules.",
      ...(ref.inputKinds?["Lists are acyclic. Trees use level-order JSON with null for missing children; [] is an empty root. The runner supplies nodes with val/next or val/left/right."]:[]),
      ...(kernel.family==="pair"||kernel.family==="queries"?[`The input has exactly two rows, each containing at most ${caseKernel.max} integers.`]:[]),
      ...(["graph","weightedGraph","undirected"].includes(kernel.family)?["The adjacency matrix is square and has at most 16 vertices; binary entries are 0 or 1, weighted entries are 0 through 13."]:[]),
      `Target time ${unit.time}; auxiliary space including the derived sequence ${unit.space}. n is the input length; d distinct values; q query count; M maximum reading; V vertices; E edges; h tree height; r reported tree nodes.`,
    ];
    const hints=[`Start with ${unit.idea.toLowerCase()}. What state describes the portion you have already processed?`,`${unit.definition} Derive each required reading once; do not restart the whole procedure for every output position.`,`${projection.task} ${mode===9?"Use an accumulator and a one-based position counter, revisiting the first level's loop work.":"Handle the empty derived sequence according to the stated return rule."}`];
    const p={...entry,descriptionMd:`${scenes[slug]} ${stories[mode](names[(index+unit.level)%names.length])}\n\n${unit.definition}\n\n${projection.task}\n\nImplement ${ref.fn}(${input.name}, k). ${[2,3].includes(mode)||["windowSum","shortWindow","prefixRanges","windowMax","roundRobin","bst","knapsack"].includes(unit.kernel)?"Use k exactly where specified above.":"k is part of the common inspection-card signature and does not affect this task's result."}`,
      unitIntro:intro,constraints,hints,functionName:ref.fn,mode:"function",starterCode:ref.starterCode,cases:cases.slice(0,3),timeLimitMs:2000,javaParams:ref.javaParams,...(ref.inputKinds?{inputKinds:ref.inputKinds}:{}),complexity:{time:unit.time,space:unit.space},overview:`${entry.stage}: ${unit.idea}. ${entry.revisit??"Build the sequence once, then report exactly what the inspection card requests."}`,tags:{level:unit.level,unit:slug,topic:unit.idea,pattern:unit.idea,bigO:unit.time},workedExamples:cases.slice(0,2),referenceSolutions:ref.solutions,
      privateData:{hiddenCases:cases.slice(3),editorialMd:`The working idea\n\n${unit.definition}\n\n${projection.task}\n\nWhy this works\n\nEach derived value follows the unit's stated order and includes exactly the items allowed by its definition. The receipt then folds or filters those values without changing their meaning. Check the empty, singleton, repeated and maximum-size inputs before trusting the final total.\n\nTarget time ${unit.time}; space ${unit.space}.\n\n${Object.entries(ref.solutions).map(([language,code])=>`${language}\n${code}`).join("\n\n")}`}};
    fs.writeFileSync(path.join(folder,`${entry.slug}.json`),JSON.stringify(rewrite(p,{unit,kernel,mode,input,sequences}),null,2)+"\n");
  }
  return members;
}
