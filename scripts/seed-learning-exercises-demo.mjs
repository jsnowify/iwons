import fs from "node:fs";
const copy=en=>({translations:{en,fil:null,ceb:null},translationStatus:{en:"reviewed",fil:"draft",ceb:"draft"}});
const inputs=["North","","Tray 7","ñame","  West","A-B","0123","End!"];
const cases=inputs.map((input,index)=>({id:`label-${index}`,input:[],stdin:`${input}\n`,expected:`Desk: ${input}`}));
const blocks={
 java:[{id:"header",code:'import java.util.Scanner;\npublic class Main { public static void main(String[] args) {',indent:0},{id:"prefix",code:'String prefix = "Desk: ";',indent:0},{id:"input",code:'String name = new Scanner(System.in).nextLine();',indent:0},{id:"output",code:'System.out.println(prefix + name);\n} }',indent:0}],
 python:[{id:"prefix",code:'prefix = "Desk: "',indent:0},{id:"input",code:'name = input()',indent:0},{id:"output",code:'print(prefix + name)',indent:0}],
 javascript:[{id:"prefix",code:'const prefix = "Desk: ";',indent:0},{id:"input",code:'const name = require("fs").readFileSync(0, "utf8").replace(/\\r?\\n$/, "");',indent:0},{id:"output",code:'console.log(prefix + name);',indent:0}],
 typescript:[{id:"prefix",code:'const prefix: string = "Desk: ";',indent:0},{id:"input",code:'const name: string = require("fs").readFileSync(0, "utf8").replace(/\\r?\\n$/, "");',indent:0},{id:"output",code:'console.log(prefix + name);',indent:0}],
};
const exercises=[];
for(const kind of ["program","parsons"]){
 const id=`tool-demo-${kind}`;
 const exercise={id,slug:id,moduleId:"tool-demo",afterLessonId:"tool-demo",kind,track:"foundations",ioMode:"program",rung:kind==="parsons"?"parsons":"fix",conceptId:"input-output",javaMinVersion:8,xp:20,
 shared:copy({title:kind==="parsons"?"Arrange a desk label (tool demo)":"Repair a desk label (tool demo)",statement:"The label printer reads one line and prints Desk: followed by one space and that line. Keep capitalization and spaces inside the name. The input always contains a line, which can be empty. The final newline is not part of the name.\n\nThis is a temporary tool check, not a course exercise. Repair the prefix in the program, or arrange its blocks, then use the cases to check the result. Trailing whitespace at the end of an output line is ignored by the program runner.",hints:kind==="parsons"?["Find the output block and identify the values it uses.","Locate the blocks that create prefix and name. Both must run before output.","Place the definitions before output. In Java, keep the import and class opening first; the output block closes the wrapper."]:["Compare the first word of the expected output with the first word in the program.","The name should stay unchanged; the prefix supplies Desk and the colon.","Keep the prefix exactly Desk: followed by one space, then print the name."]}),cases:cases.slice(0,3),variants:{}};
 const keys={exerciseId:id,hiddenCases:cases.slice(3),variants:{}};
 for(const [track,parts]of Object.entries(blocks)){
  const source=parts.map(part=>part.code).join("\n");
  const header=track==="java"?["header"]:[];
  exercise.variants[track]={starterCode:source.replace('"Desk: "','"Label: "'),functionName:"main",concepts:["input-output"],introducedIn:{"input-output":"tool-demo"},...(kind==="parsons"?{parsons:{blocks:parts,initialOrder:[...parts].reverse().map(part=>part.id)}}:{})};
  keys.variants[track]={referenceSolution:source,explanations:copy({text:"The prefix and name combine into the output line. Compare the first failing input with your output, then check the prefix and rerun."}),...(kind==="parsons"?{alternativeOrders:[[...header,"prefix","input","output"],[...header,"input","prefix","output"]]}:{})};
 }
 exercises.push(exercise);fs.writeFileSync(`public/learn-data/exercise-${id}.json`,JSON.stringify(keys,null,2)+"\n");
}
fs.writeFileSync("src/data/learning-exercises-demo.json",JSON.stringify(exercises,null,2)+"\n");
console.log("Two temporary multi-track workspace samples prepared; no curriculum exercises published.");
