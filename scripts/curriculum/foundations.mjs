import fs from "node:fs";

// Called by seed.mjs after the public curriculum has been authored.
export function seedFoundations() {
  const units = JSON.parse(fs.readFileSync("src/data/units.json", "utf8"));
  const catalog = JSON.parse(fs.readFileSync("src/data/catalog.json", "utf8"));
  const mistakes = [
    { pattern: "___", message: "Replace the ___ blank with your answer, then run again." },
    { pattern: "Unexpected token", message: "Almost! Check the brackets and parentheses around the part you changed." },
    { pattern: "not defined", message: "Check the spelling of your names. JavaScript treats upper and lower case as different letters." },
    { pattern: "return", message: "Use return inside the function's curly brackets to send back your answer." },
  ];
  const step = (id, title, explanation, exampleCode, starterCode, task, cases, hints, extra = {}) => ({
    id, title, explanation, exampleCode, starterCode, task, functionName: "practice",
    validate: cases.map(([input, expected], i) => ({ id: `${id}-${i}`, input, expected })),
    hints: [...hints, `That's totally normal, this trips up lots of people.\n${exampleCode}\nFollow the example one line at a time, then adapt it to the task.`].slice(0, 3),
    successMessage: "Nice, you worked through the steps and got the expected result.", mistakeMessages: mistakes, ...extra,
  });
  const receipts = `// a is the list you just built; k is the requested cutoff.
function total(a) { let n = 0; for (const x of a) n += x; return n; }
function countAtLeast(a, k) { let n = 0; for (const x of a) if (x >= k) n++; return n; }
function firstAtLeast(a, k) { for (const x of a) if (x >= k) return x; return -1; }
function peak(a) { if (!a.length) return 0; let n = a[0]; for (const x of a) if (x > n) n = x; return n; }
function floor(a) { if (!a.length) return 0; let n = a[0]; for (const x of a) if (x < n) n = x; return n; }
function countEven(a) { let n = 0; for (const x of a) if (x % 2 === 0) n++; return n; }
function positiveTotal(a) { let n = 0; for (const x of a) if (x > 0) n += x; return n; }
function positives(a) { const out = []; for (const x of a) if (x > 0) out.push(x); return out; }
function weighted(a) { let n = 0; for (let i = 0; i < a.length; i++) n += (i + 1) * a[i]; return n; }`;
  const receiptStep = (id) => ({ ...step(id, "Make a receipt from a list", "A total adds the numbers in a list. Start at zero and add one number at a time; an empty list stays at zero. let gives a value a name that you can update, and += adds to that value.", "function practice(a) {\n  let n = 0;\n  for (const x of a) { n += x; }\n  return n;\n}", "function practice(a) {\n  let n = 0;\n  for (const x of a) { /* add x to n */ }\n  return n;\n}", "Add x to n inside the loop to return the total.", [[[[2, 3]], 5], [[[]], 0], [[[0, -2, 4]], 2]], ["The loop visits each number once.", "Inside the loop, write n += x; (this means add x to n)."]), referenceCode: receipts });
  const first = [
    step("sum", "Change one number", "JavaScript follows instructions you write. A function is a named group of instructions; return sends its answer back. The + sign adds two numbers.", "function practice() {\n  return 2 + 3;\n}", "function practice() {\n  return 2 + ___;\n}", "Replace ___ with 4 to return 6.", [[[], 6]], ["Keep 2 and change the second number.", "2 + 4 makes 6."]),
    step("variable", "Give a number a name", "A variable is a name for a value. const gives a value a name; use that name later. The * sign multiplies, before + adds.", "function practice() {\n  const x = 4;\n  return 2 * x + 3;\n}", "function practice() {\n  const x = 5;\n  return ___;\n}", "Use x to multiply the stored number by 2, then add 3.", [[[], 13]], ["Replace the blank with an expression using x.", "Use 2 * x + 3."]),
    step("input", "Use a number someone gives you", "A parameter is a name for a value given to a function. Here x can change each time practice runs. Return the calculation rather than a fixed answer.", "function practice(x) {\n  return 2 * x + 3;\n}", "function practice(x) {\n  // Write the return instruction.\n}", "Return twice x plus 3 for any given x.", [[[4], 11], [[-2], -1], [[0], 3]], ["Use the same calculation as the previous step.", "Write return 2 * x + 3; inside the braces."]),
    step("list", "Work through a list", "An array is a list, written with square brackets. A for...of loop repeats an instruction for each item. push adds an item at the end of a list.", "function practice(readings) {\n  const out = [];\n  for (const x of readings) {\n    out.push(2 * x + 3);\n  }\n  return out;\n}", "function practice(readings) {\n  const out = [];\n  for (const x of readings) {\n    // Put the calculated value in out.\n  }\n  return out;\n}", "Add each transformed value to out in the loop.", [[[[4, -2, 0]], [11, -1, 3]], [[[]], []]], ["The calculation is still 2 * x + 3.", "Use out.push(2 * x + 3);."]),
    receiptStep("receipt"),
    step("recall", "Build your first proof strip", "Bring together the list, loop, and calculation you practised. Your first challenge asks for the same kind of list. Write a few lines, then answer the small recall question.", "function practice(readings) {\n  const out = [];\n  for (const x of readings) {\n    out.push(2 * x + 3);\n  }\n  return out;\n}", "function practice(readings) {\n  // Build and return the transformed list.\n}", "Return a list containing twice each reading plus 3.", [[[[4, -2, 0]], [11, -1, 3]], [[[1]], [5]], [[[]], []]], ["Create an empty out list first.", "Loop through readings and push the calculation into out, then return out."], { recall: { prompt: "Without hints: what number does 2 + 4 give?", answer: "6" } }),
  ];
  const gateCode = "function practice(readings) {\n  const out = [];\n  for (const x of readings) {\n    if (x < 0) { out.push(0); }\n    else { out.push(x); }\n  }\n  return out;\n}";
  const second = [
    step("compare", "Ask a yes-or-no question", "A comparison checks whether something is true. The < sign means less than. A number below zero is negative.", "function practice() {\n  return -2 < 0;\n}", "function practice() {\n  return -2 < ___;\n}", "Replace ___ with 0 to check whether -2 is negative.", [[[], true]], ["Compare -2 with zero.", "Write 0 in the blank."]),
    step("choose", "Choose what to return", "An if instruction runs its block only when the comparison is true. A block is the instructions inside curly brackets. If x is not negative, the later return keeps x.", "function practice(x) {\n  if (x < 0) { return 0; }\n  return x;\n}", "function practice(x) {\n  if (___) { return 0; }\n  return x;\n}", "Fill the comparison so negative inputs become zero.", [[[-3], 0], [[2], 2], [[0], 0]], ["Ask whether x is below zero.", "Replace ___ with x < 0."]),
    step("else", "Keep the other numbers", "else runs when the if comparison is false. Zero is not below zero, so keep it as it is. Only one of these two blocks runs for each input.", "function practice(x) {\n  if (x < 0) { return 0; }\n  else { return x; }\n}", "function practice(x) {\n  if (x < 0) { return 0; }\n  else { /* keep x */ }\n}", "Write the instruction that keeps a nonnegative input.", [[[-1], 0], [[7], 7], [[0], 0]], ["The other branch returns the input unchanged.", "Write return x; in the else block."]),
    step("list", "Make a choice for every item", "Use the loop you learned in Receipt arithmetic to visit every reading. Make the if choice inside that loop. Each visit adds exactly one value to out.", gateCode, "function practice(readings) {\n  const out = [];\n  for (const x of readings) {\n    // Add 0 if x is negative; otherwise add x.\n  }\n  return out;\n}", "Write the if and else blocks inside the loop.", [[[[-3, 0, 4]], [0, 0, 4]], [[[]], []]], ["Use out.push inside both branches.", "if (x < 0) { out.push(0); } else { out.push(x); }"]),
    receiptStep("receipt"),
    step("recall", "Build a strip with choices", "Put your loop and choices together with less help. Your first challenge follows this same rule. Recall the comparison from your first step before moving on.", gateCode, "function practice(readings) {\n  // Build and return the new list.\n}", "Return the readings with every negative value replaced by 0.", [[[[-2, 0, 5]], [0, 0, 5]], [[[-7]], [0]], [[[]], []]], ["Start with an empty out list, then loop through readings.", "Choose out.push(0) for x < 0, or out.push(x) otherwise, then return out."], { recall: { prompt: "Without hints: is -2 < 0 true or false?", answer: "true" } }),
  ];
  // The worked example uses different numbers; the final hint reveals the task's answer.
  first[0].hints[2] = "That's totally normal, this trips up lots of people.\nfunction practice() {\n  return 2 + 4;\n}\nThe + sign adds 2 and 4, giving 6.";
  first[1].hints[2] = "That's totally normal, this trips up lots of people.\nfunction practice() {\n  const x = 5;\n  return 2 * x + 3;\n}\nMultiply first, then add: 10 + 3 gives 13.";
  fs.mkdirSync("public/foundation-data", { recursive: true });
  const summaries = [];
  for (const unit of units) {
    const members = catalog.filter(p => p.unit === unit.slug);
    const problem = JSON.parse(fs.readFileSync(`src/data/problems/level-${unit.level}/${unit.slug}/${members[0].slug}.json`, "utf8"));
    const code = problem.referenceSolutions.javascript.replaceAll(problem.functionName, "practice");
    const cases = problem.cases.map(c => [c.input, c.expected]);
    // Later topics build on the earlier chapters. Fade the supplied return and body independently.
    const returnBlank = code.replace(/return out;/, "return ___;");
    const hasPush = code.includes("out.push(");
    const smallBlank = hasPush ? code.replace("out.push(", "out.___(") : code.replace("let out=[]", "let out=___");
    const bodyBlank = code.replace(/let out=\[\];([\s\S]*?)return out;/, "let out=[];\n  // Rebuild the derived list here.\n  return out;");
    const generic = [
      step("read", "Return the list you built", `${unit.idea} is this topic's new tool. ${unit.definition.split(". ").slice(0, 2).join(". ")}`, code, returnBlank, "Replace ___ with out to send the result list back.", cases, ["The list is named out.", "The final instruction is return out;."]),
      step("trace", "Fill a smaller piece", hasPush ? "push adds one value to the end of a list. Find that instruction in the example. Fill its name in the starter and inspect the returned values." : "An empty list is written as []. The working instructions fill that list. Supply the empty list before running the example.", code, smallBlank, hasPush ? "Replace ___ with push to add an item to out." : "Replace ___ with [] to begin with an empty list.", cases, [hasPush ? "Look for the instruction that adds an item." : "Use square brackets with nothing inside.", hasPush ? "Write out.push where the starter says out.___." : "Write let out=[] where the list is created."]),
      receiptStep("receipt"),
      step("rebuild", "Rebuild the working instructions", "Keep the supplied function and result list. Rebuild the part that fills the list using the example as a guide. Re-run whenever you want to check a change.", code, bodyBlank, "Fill the result list using this topic's rule.", cases, [unit.definition, "Revisit the example and copy one instruction at a time, checking what it does."]),
      step("recall", "Ready for the proof strip", "Write the small function again with less help. The first challenge uses the same input and output rule. Use return to send the finished list back.", code, "function practice(" + problem.parameterNames.join(", ") + ") {\n  // Build and return the result list.\n}", "Build the derived list for this topic, then return it.", cases, [unit.definition, "Create the result list, process the input in order, and return the list."], { recall: { prompt: "Without hints: which keyword sends a function's answer back?", answer: "return" } }),
    ].map(s => ({ ...s, inputKinds: s.id === "receipt" ? undefined : problem.inputKinds }));
    const steps = unit.slug === "receipt-arithmetic" ? first : unit.slug === "stamp-gates" ? second : generic;
    const concepts = [unit.idea, "Lists and loops", "Receipt rules"];
    const topic = { id: unit.slug, title: unit.name, concepts, foundation: { steps }, challenges: members.map(p => p.id) };
    fs.writeFileSync(`public/foundation-data/${unit.slug}.json`, JSON.stringify(topic, null, 2) + "\n");
    summaries.push({ id: unit.slug, title: unit.name, level: unit.level, concepts, stepIds: steps.map(s => s.id) });
  }
  fs.writeFileSync("src/data/topic-foundations.json", JSON.stringify(summaries, null, 2) + "\n");
}
