import fs from "node:fs";
const copy = en => ({ translations: { en, fil: null, ceb: null }, translationStatus: { en: "reviewed", fil: "draft", ceb: "draft" } });
const code = {
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Ready");\n    }\n}',
  python: 'print("Ready")', javascript: 'console.log("Ready");', typescript: 'console.log("Ready");',
};
const answer = (answer, reason, nextStep) => ({ answer, reason, nextStep });
const lesson = {
  id: "tool-demo", moduleId: "tool-demo", course: "cp1", slug: "tool-demo", concepts: ["output"],
  introducedIn: Object.fromEntries(Object.keys(code).map(track => [track, { output: "tool-demo" }])),
  interactionTypes: ["guess", "run", "trace", "fill"], opening: "predict", estimatedMinutes: 5,
  shared: copy({
    title: "Learning tools demonstration",
    story: "A small office sign needs a message before the desk opens. Read the short program above and write the exact word you think will appear. Keep your guess even if you are unsure: comparing it with a real run gives you something concrete to investigate. This page demonstrates the lesson controls, rather than adding a completed course lesson to your record. Nothing here changes your course progress or earns rewards. You can return to any step using the numbered ribbon, so there is no need to remember an answer while hunting through a long page.",
    idea: "The program sends a short message to its output. The surrounding punctuation tells the language where that message begins and ends; it is not part of the printed word. Run the unchanged example before editing it. Then compare the output with your guess slip. If they differ, look at the letters inside the quotes one at a time. The trace step shows the same operation in a smaller view, giving you a way to check your reasoning before making a change.",
    make: "A real lesson connects this step to a small exercise ladder. You would first inspect a worked example, then complete a missing piece, arrange blocks, repair a mistake and write an independent program. This demonstration leaves those course links out. Use the next step to try retrieval instead: answer before revealing the explanation, then choose how difficult remembering felt.",
    recap: "You have compared a prediction with a run, stepped through output and tried changing a message. Recall checks ask you to retrieve an idea before seeing the answer. A useful next action is to explain which characters belong to the output and which belong to the program. The real lesson records your learning and schedules its cards; this tool demonstration deliberately keeps those records untouched.",
  }),
  tracks: {},
};
const keys = { lessonId: lesson.id, tracks: {} };
for (const track of Object.keys(code)) {
  const line = track === "java" ? 3 : 1;
  lesson.tracks[track] = {
    code: code[track], stdin: "",
    annotations:copy({items:[{line,text:"This statement prints the quoted message once."}]}),
    notes:copy({items:[track==="java"?"This Java program needs your configured endpoint for a browser run; use the local JDK otherwise.":track==="python"?"Python uses print to send the message to its output.":"The output appears in the results area, not on the webpage itself."]}),
    predict: copy({ prompt: "What exact word will this program print? Write a guess before running it." }),
    trace: copy({ steps: [{ line, state: "Output is empty.", message: "The output statement has not run yet." }, { line, state: "One line has been printed.", message: "The output statement runs once, then this program ends." }], question: "How many lines does this program print?" }),
    commonMistakes: copy({ items: ["The quote marks belong to the program. They are not printed around the word."] }),
    modify: copy({ prompt: "Change the printed message to Open. Keep the capitalization exactly as shown." }),
    breakIt: copy({ prompt: "Remove a closing quote, then check the program. Find the first error line before putting the quote back." }),
    recallCards: [
      { id: "demo-word", concept: "output", format: "multiple-choice", copy: copy({ prompt: "Which word does the original program print?", options: ["Ready", "Open", "Nothing"] }) },
      { id: "demo-lines", concept: "output", format: "short-answer", copy: copy({ prompt: "How many output lines does the original program produce? Answer with a digit." }) },
      { id: "demo-fill", concept: "output", format: "fill-in", copy: copy({ prompt: "Complete using the term for a row of output: The program prints one ___." }) },
    ],
    ladder: [{ exerciseId: "tool-demo", rung: "worked", concept: "output" }],
    skippedRungs: ["completion", "parsons", "fix", "write"].map(rung => ({ concept: "output", rung, reason: "This is a temporary tool demonstration, not a published course lesson." })),
  };
  keys.tracks[track] = {
    expectedOutput: "Ready", predict: answer("Ready", "The letters inside the quotes become the output.", "Read the message inside the quotes, then try the trace."),
    trace: answer("1", "The single output statement runs once.", "Step back to the output statement and count its executions."),
    modify: { cases: [{ id: "message", stdin: "", expected: "Open" }], referenceSolution: code[track].replace('"Ready"', '"Open"') },
    recall: {
      "demo-word": answer("Ready", "Ready is the original message inside the quotes.", "Look at the original program and read only the quoted word."),
      "demo-lines": answer("1", "There is one execution of the output statement.", "Return to the trace and count the output statements that run."),
      "demo-fill": answer("line", "One output line contains the message.", "Inspect the output panel and count the printed lines."),
    },
  };
}
fs.mkdirSync("public/learn-data", { recursive: true });
fs.writeFileSync("src/data/learning-demo.json", JSON.stringify(lesson, null, 2) + "\n");
fs.writeFileSync("public/learn-data/tool-demo.json", JSON.stringify(keys, null, 2) + "\n");
const questions = [
  { id: "message", prompt: "Which word appears when the original program runs?", options: [{id:"a",text:"Ready"},{id:"b",text:"Open"},{id:"c",text:"Nothing"}] },
  { id: "quotes", prompt: "Are the surrounding quote marks printed by this example?", options: [{id:"a",text:"Yes"},{id:"b",text:"No"},{id:"c",text:"Only on the first run"}] },
  { id: "lines", prompt: "How many output lines does the original program produce? Answer with a digit.", options: [{id:"a",text:"0"},{id:"b",text:"2"},{id:"c",text:"1"}] },
  { id: "change", prompt: "Where do you change the message in this example?", options: [{id:"a",text:"Inside the quotes"},{id:"b",text:"In the step ribbon"},{id:"c",text:"In the output panel"}] },
  { id: "observe", prompt: "After editing the program, how do you observe its new output?", options: [{id:"a",text:"Keep reading the old output"},{id:"b",text:"Run the changed program"},{id:"c",text:"Rename the lesson"}] },
];
const checkpoint = { id:"tool-demo",moduleId:"tool-demo",...copy({questions}) };
const checkpointKeys = {checkpointId:"tool-demo",answers:questions.map((question,index)=>({questionId:question.id,correctOptionId:["a","b","c","a","b"][index],explanations:{en:["Ready is the original quoted message. Return to Predict and read the letters inside the quotes.","The quotes mark the message in the code. Return to Run and compare the code with the printed output.","One output statement runs once. Follow the two trace steps and count the printed lines.","The quoted text supplies the message. Open Modify and change only that text.","Editing changes the program, not an earlier result. Run it again to see the new output."][index],fil:null,ceb:null}}))};
fs.writeFileSync("src/data/learning-checkpoint-demo.json",JSON.stringify(checkpoint,null,2)+"\n");
fs.writeFileSync("public/learn-data/checkpoint-tool-demo.json",JSON.stringify(checkpointKeys,null,2)+"\n");
console.log("Temporary four-track learning-tool sample prepared; not included in course counts.");
await import("./seed-learning-exercises-demo.mjs");
