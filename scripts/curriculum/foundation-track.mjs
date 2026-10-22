import fs from "node:fs";
import { lessons as module2 } from "./foundation/module-2.mjs";
import { lessons as module3 } from "./foundation/module-3.mjs";
import { lessons as module4 } from "./foundation/module-4.mjs";
import { lessons as module5 } from "./foundation/module-5.mjs";

// Author optional Foundation lessons here, in curriculum order (see
// src/data/foundation/curriculum.json). seed.mjs runs this and publishes public
// reading material separately from lazily loaded practice (starters, answers,
// hints and concept checks), so answers never appear in the initial page HTML.
//
// Code lesson: <=3 sentence neutral `explanation`; one syntax `note` per language;
// a task that states a goal, not syntax; `cases` (stdin -> expected output) when the
// program reads input; per-language starter, answer and 3 hints.
// Concept lesson: `explanation`, an `illustration` with a plain-language caption,
// optional read-only `snippets`, and a 2 to 3 question multiple-choice `check`.
const TRIP = "This trips up lots of people. ";
const L = (...lines) => lines.join("\n");
const readAll = 'require("fs").readFileSync(0, "utf8")';

const lessons = [
  // 1
  {
    id: "programming-fundamentals", type: "concept", title: "Programming fundamentals", summary: "What code is, and how a computer turns it into action.",
    topics: [], // generic: reached from the overview, never suggested on a challenge
    explanation: [
      "Programming means writing step-by-step instructions, called source code, for a computer.",
      "A compiler translates the whole program first, while an interpreter reads and runs it line by line.",
      "A runtime is the environment that runs your program, such as Node.js or the Python interpreter.",
    ],
    illustration: "source code\n  |-> compiler\n  |     -> machine code\n  |        -> runs\n  |-> interpreter\n        -> runs, line by line",
    illustrationCaption: "Two routes from source code to a running program. A compiler translates everything into machine code first. An interpreter reads and runs it line by line. Either way, a runtime does the running.",
    snippets: {
      javascript: { code: 'console.log("Hello!");', output: "Hello!", caption: "One line of source code. Node.js or your browser is the runtime that runs it." },
      python: { code: 'print("Hello!")', output: "Hello!", caption: "One line of source code. The Python interpreter is the runtime that runs it." },
    },
    successMessage: "You got them all. Lesson done; come back any time to read it again.",
    check: [
      { prompt: "What is source code?", options: ["The text of instructions that you write for a computer", "The electricity a computer uses to run", "A program that is already made of 0s and 1s"], answer: 0,
        explanation: "Source code is the human-readable text programmers write. A compiler or interpreter turns it into something the computer can actually run.",
        hint: "Think about what you type into an editor before anything runs." },
      { prompt: "What is the main difference between a compiler and an interpreter?", options: ["A compiler only works for Python, and an interpreter only works for Java", "A compiler translates the program ahead of time, while an interpreter reads and runs it as it goes", "An interpreter always makes code faster than a compiler"], answer: 1,
        explanation: "A compiler translates the whole program first and then runs the result. An interpreter reads your code and runs it line by line. Neither is always faster, and many languages use a mix of both.",
        hint: "Re-read the illustration: one route translates first, the other runs line by line." },
      { prompt: "Which of these is a runtime?", options: ["A text editor that colours your code", "The name of a variable", "Node.js, which runs JavaScript outside a browser"], answer: 2,
        explanation: "A runtime is the environment that executes your program. Node.js does that for JavaScript. An editor only helps you write code, and a variable is just a name inside your code.",
        hint: "A runtime is the thing that actually runs the program, not the thing that helps you write it." },
    ],
  },
  // 2
  {
    id: "syntax-semantics", type: "concept", title: "Syntax and semantics", summary: "How code is written versus what it means.",
    topics: [],
    explanation: [
      "Syntax is the set of rules for how code must be written, like the grammar of a sentence.",
      "Semantics is what the code means, which is what it actually does when it runs.",
      "Code can follow the syntax perfectly and still do the wrong thing.",
    ],
    illustration: 'syntax error:\n  print("Hi"\n  (a bracket is missing, so the\n   code cannot even be read)\n\nsemantic mistake:\n  4 + 6 / 2\n  (readable, but it means 4 + 3,\n   not (4 + 6) / 2)',
    illustrationCaption: "Two different kinds of mistake. A syntax error breaks the grammar, so the computer cannot read the line. A semantic mistake is readable code that means something other than what you intended.",
    snippets: {
      javascript: { code: "console.log(4 + 6 / 2);\nconsole.log((4 + 6) / 2);", output: "7\n5", caption: "Both lines are valid syntax. They print 7 and 5, because the brackets change the meaning." },
      python: { code: "print(4 + 6 / 2)\nprint((4 + 6) / 2)", output: "7.0\n5.0", caption: "Both lines are valid syntax. They print 7.0 and 5.0, because the brackets change the meaning." },
    },
    successMessage: "You got them all. Lesson done; you can revisit it whenever it helps.",
    check: [
      { prompt: "Which statement describes syntax?", options: ["The rules for how code must be written", "What the code is trying to achieve", "How fast the code runs"], answer: 0,
        explanation: "Syntax is the grammar of a language: where brackets, quotes and keywords must go. If the grammar is broken, the computer cannot read the code at all.",
        hint: "Syntax is to code what grammar is to a sentence." },
      { prompt: "A program runs without any error but prints the wrong answer. What kind of problem is that?", options: ["A syntax error", "A semantic problem: valid code that means something different from what you intended", "A broken keyboard"], answer: 1,
        explanation: "The code was readable, so the syntax was fine. It just meant something different from what you wanted, and that is a semantic problem. These are often harder to find because nothing crashes.",
        hint: "If the computer could read it and run it, was the grammar the problem?" },
      { prompt: "Which line has a syntax error?", options: ["total = 2 + 3", "total = 2 + 3 + 4", "total = 2 + * 3"], answer: 2,
        explanation: "In 2 + * 3 two operators sit next to each other with no value between them, which breaks the grammar. The other two lines are readable, whatever they mean.",
        hint: "Look for a line the computer could not even read, not one that gives a surprising answer." },
    ],
  },
  // 3
  {
    id: "variables-constants", type: "code", title: "Variables and constants", summary: "Give a value a name, then use it.", topics: ["Variables"],
    explanation: ["A variable is a name for a value.", "Once a value has a name, you can use the name wherever you would use the value.", "A constant is a name whose value should never change, such as a tax rate."],
    exampleOutput: "7",
    task: "Change the number stored in score to 12, then print the stored number.", expectedOutput: "12",
    successMessage: "You stored 12 in score and printed it. Lesson done; try a different value whenever you like.",
    languages: {
      javascript: {
        note: "In JavaScript, const score = 7 gives the number 7 the name score and stops the name from being reassigned. Use let for a variable that will change.",
        exampleCode: L("const score = 7;", "console.log(score);"), starterCode: L("const score = 5;", "console.log(score);"), answerCode: L("const score = 12;", "console.log(score);"),
        hints: ["Find the line that gives score its value.", "Change the 5 after the equals sign to 12. Leave console.log(score) as it is.", TRIP + "The value belongs after the equals sign; this complete example prints it."],
      },
      python: {
        note: "In Python, score = 7 gives the number 7 the name score. Python has no const, so names in ALL_CAPS, like MAX_SCORE, mark constants by habit.",
        exampleCode: L("score = 7", "print(score)"), starterCode: L("score = 5", "print(score)"), answerCode: L("score = 12", "print(score)"),
        hints: ["Find the line that gives score its value.", "Change the 5 after the equals sign to 12. Leave print(score) as it is.", TRIP + "The value belongs after the equals sign; this complete example prints it."],
      },
    },
  },
  // 4
  {
    id: "data-types", type: "code", title: "Data types", summary: "Numbers, text, true/false and nothing at all.", topics: [],
    explanation: [
      "A data type says what kind of value you have: a whole number, a decimal number, text, true or false, or nothing at all (null).",
      "The type decides what you can do with a value, because adding numbers works differently from joining text.",
      "Some languages check types before running (static typing), while JavaScript and Python check while running (dynamic typing).",
    ],
    exampleOutput: "Ada 12 1.5 false null",
    task: "The last value, nickname, holds nothing yet. Give it the text \"Adi\" so the last thing printed is Adi.", expectedOutput: "Ada 12 1.5 false Adi",
    successMessage: "nickname is text now, so it printed Adi instead of nothing. Lesson done; try changing the other values too.",
    languages: {
      javascript: {
        note: "In JavaScript, null means \"no value\" on purpose, and whole numbers and decimals share one number type.",
        exampleCode: L('const name = "Ada";', "const age = 12;", "const height = 1.5;", "const isStudent = false;", "const nickname = null;", "console.log(name, age, height, isStudent, nickname);"),
        starterCode: L('const name = "Ada";', "const age = 12;", "const height = 1.5;", "const isStudent = false;", "const nickname = null;", "console.log(name, age, height, isStudent, nickname);"),
        answerCode: L('const name = "Ada";', "const age = 12;", "const height = 1.5;", "const isStudent = false;", 'const nickname = "Adi";', "console.log(name, age, height, isStudent, nickname);"),
        exampleOutput: "Ada 12 1.5 false null", expectedOutput: "Ada 12 1.5 false Adi",
        hints: ["Find the line that stores nickname.", 'Replace null with "Adi". Keep the quotes so it is text.', TRIP + "Text needs quotes, and null means no value. Here is the complete code."],
      },
      python: {
        note: "In Python, None means \"no value\" on purpose, and whole numbers (int) and decimals (float) are separate types.",
        exampleCode: L('name = "Ada"', "age = 12", "height = 1.5", "is_student = False", "nickname = None", "print(name, age, height, is_student, nickname)"),
        starterCode: L('name = "Ada"', "age = 12", "height = 1.5", "is_student = False", "nickname = None", "print(name, age, height, is_student, nickname)"),
        answerCode: L('name = "Ada"', "age = 12", "height = 1.5", "is_student = False", 'nickname = "Adi"', "print(name, age, height, is_student, nickname)"),
        exampleOutput: "Ada 12 1.5 False None", expectedOutput: "Ada 12 1.5 False Adi",
        hints: ["Find the line that stores nickname.", 'Replace None with "Adi". Keep the quotes so it is text.', TRIP + "Text needs quotes, and None means no value. Here is the complete code."],
      },
    },
  },
  // 5
  {
    id: "operators", type: "code", title: "Operators", summary: "Do math, compare values and combine conditions.", topics: ["Arithmetic", "Math"],
    explanation: [
      "Operators are symbols that work on values: arithmetic (+ - * / %), comparison (> < ==), logical (and, or, not), assignment (= and +=), and bitwise (& and |, which work on binary digits).",
      "An expression such as 9 % 4 pairs an operator with its values, and % gives the remainder after dividing.",
      "Multiplication and division happen before addition and subtraction, and brackets change the order.",
    ],
    exampleOutput: "5\n1",
    task: "Change the first line to print the sum of 4 and 6, and the second line to print the remainder when 17 is divided by 5.", expectedOutput: "10\n2",
    successMessage: "4 + 6 is 10, and 17 % 5 leaves a remainder of 2. Lesson done; try the other operators too.",
    languages: {
      javascript: {
        note: "In JavaScript, console.log(9 % 4) prints 1, the remainder of 9 divided by 4. The logical operators are && (and), || (or) and ! (not).",
        exampleCode: L("console.log(2 + 3);", "console.log(9 % 4);"), starterCode: L("console.log(2 + 3);", "console.log(17 / 5);"), answerCode: L("console.log(4 + 6);", "console.log(17 % 5);"),
        hints: ["Look at the operator symbol on each line. Each symbol does a different job.", "Change 2 + 3 to 4 + 6, and change the / on the second line to %.", TRIP + "/ divides, but % gives what is left over. Here is the complete code."],
      },
      python: {
        note: "In Python, print(9 % 4) prints 1, the remainder of 9 divided by 4. The logical operators are the words and, or and not.",
        exampleCode: L("print(2 + 3)", "print(9 % 4)"), starterCode: L("print(2 + 3)", "print(17 / 5)"), answerCode: L("print(4 + 6)", "print(17 % 5)"),
        hints: ["Look at the operator symbol on each line. Each symbol does a different job.", "Change 2 + 3 to 4 + 6, and change the / on the second line to %.", TRIP + "/ divides, but % gives what is left over. Here is the complete code."],
      },
    },
  },
  // 6
  {
    id: "expressions-statements", type: "code", title: "Expressions and statements", summary: "Pieces that produce a value, and pieces that do something.", topics: ["Expressions"],
    explanation: ["An expression is code that produces a value, such as width * height.", "A statement is a complete instruction that does something, such as storing a value or printing one.", "Statements are often built from expressions, like storing the result of an expression in a variable."],
    exampleOutput: "18",
    task: "Replace the 0 with an expression, so area holds the width times the height and the program prints 24.", expectedOutput: "24",
    successMessage: "width * height is an expression, and storing it in area is a statement. It printed 24. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, a statement usually ends with a semicolon.",
        exampleCode: L("const width = 6;", "const height = 3;", "const area = width * height;", "console.log(area);"),
        starterCode: L("const width = 6;", "const height = 4;", "const area = 0;", "console.log(area);"),
        answerCode: L("const width = 6;", "const height = 4;", "const area = width * height;", "console.log(area);"),
        hints: ["The line with area stores a value. Which expression gives the area of a rectangle?", "Replace the 0 with width * height. The two names are already defined above.", TRIP + "Names stand in for their values, so no quotes are needed. Here is the complete code."],
      },
      python: {
        note: "In Python, each statement normally sits on its own line.",
        exampleCode: L("width = 6", "height = 3", "area = width * height", "print(area)"),
        starterCode: L("width = 6", "height = 4", "area = 0", "print(area)"),
        answerCode: L("width = 6", "height = 4", "area = width * height", "print(area)"),
        hints: ["The line with area stores a value. Which expression gives the area of a rectangle?", "Replace the 0 with width * height. The two names are already defined above.", TRIP + "Names stand in for their values, so no quotes are needed. Here is the complete code."],
      },
    },
  },
  // 7
  {
    id: "input-output", type: "code", title: "Input and output", summary: "Show results and read what someone gives you.", topics: ["Printing", "Input"],
    explanation: ["Output is what a program shows, and input is what it receives, such as text typed by a person.", "Programs read input as text, so what arrives is always a string.", "Printing the result is how a program answers."],
    exampleInput: "Sam\n", exampleOutput: "Hello, Sam!",
    task: "The program reads a name. Make it print Hello, then the name, then an exclamation mark, such as Hello, Ada!", expectedOutput: "Hello, Ada!",
    cases: [{ stdin: "Ada\n", expected: "Hello, Ada!" }, { stdin: "Mia\n", expected: "Hello, Mia!" }],
    successMessage: "Your program greeted each name it was given. Lesson done; input and output are in almost every program.",
    languages: {
      javascript: {
        note: "In JavaScript, require(\"fs\").readFileSync(0, \"utf8\") reads everything that was typed, and .trim() removes the extra line break.",
        exampleCode: L(`const name = ${readAll}.trim();`, 'console.log("Hello, " + name + "!");'),
        starterCode: L(`const name = ${readAll}.trim();`, 'console.log("Hello, Iwons!");'),
        answerCode: L(`const name = ${readAll}.trim();`, 'console.log("Hello, " + name + "!");'),
        hints: ["The program reads the name but never uses it. Look at what the last line prints.", 'Build the message from three pieces joined with +: "Hello, ", then name, then "!".', TRIP + "The name goes outside quotes so its value is used. Here is the complete code."],
      },
      python: {
        note: "In Python, input() reads one line of typed text.",
        exampleCode: L("name = input()", 'print("Hello, " + name + "!")'),
        starterCode: L("name = input()", 'print("Hello, Iwons!")'),
        answerCode: L("name = input()", 'print("Hello, " + name + "!")'),
        hints: ["The program reads the name but never uses it. Look at what the last line prints.", 'Build the message from three pieces joined with +: "Hello, ", then name, then "!".', TRIP + "The name goes outside quotes so its value is used. Here is the complete code."],
      },
    },
  },
  // 8
  {
    id: "type-conversion", type: "code", title: "Type conversion", summary: "Turn text into numbers and back, on purpose.", topics: [],
    explanation: ["Type conversion changes a value from one type to another, such as the text \"5\" into the number 5.", "Implicit conversion happens automatically, while explicit conversion is when you ask for it with a function.", "Input arrives as text, so numbers you read must be converted before you do math with them."],
    exampleOutput: "6",
    task: "The program reads two numbers, but they arrive as text, so + joins them instead of adding. Convert them so it prints their sum.", expectedOutput: "7",
    cases: [{ stdin: "3\n4\n", expected: "7" }, { stdin: "10\n20\n", expected: "30" }],
    successMessage: "You converted the text to numbers before adding, so 3 and 4 made 7 and not 34. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, Number(\"5\") turns text into a number.",
        exampleCode: L('const text = "5";', "const number = Number(text);", "console.log(number + 1);"),
        starterCode: L(`const lines = ${readAll}.trim().split("\\n");`, "const first = lines[0];", "const second = lines[1];", "console.log(first + second);"),
        answerCode: L(`const lines = ${readAll}.trim().split("\\n");`, "const first = lines[0];", "const second = lines[1];", "console.log(Number(first) + Number(second));"),
        hints: ["Run it and look at what prints for 3 and 4. Two pieces of text are being joined.", "Wrap each of first and second in Number(...) before adding them.", TRIP + "Number(first) + Number(second) adds numbers, while first + second joins text. Here is the complete code."],
      },
      python: {
        note: "In Python, int(\"5\") turns text into a whole number.",
        exampleCode: L('text = "5"', "number = int(text)", "print(number + 1)"),
        starterCode: L("first = input()", "second = input()", "print(first + second)"),
        answerCode: L("first = input()", "second = input()", "print(int(first) + int(second))"),
        hints: ["Run it and look at what prints for 3 and 4. Two pieces of text are being joined.", "Wrap each of first and second in int(...) before adding them.", TRIP + "int(first) + int(second) adds numbers, while first + second joins text. Here is the complete code."],
      },
    },
  },
  // 9
  {
    id: "conditional-statements", type: "code", title: "Conditional statements", summary: "Make your program choose between paths.", topics: ["Conditionals", "Logic"],
    explanation: ["A condition is a check with a true or false answer, such as temperature > 20 (greater than 20).", "if runs a block when its check is true, else if tries another check, and else runs when nothing matched.", "A switch picks one path by comparing a value with several exact options."],
    exampleOutput: "Cool",
    task: "Add one more check so a temperature above 30 prints Hot. Above 20 still prints Warm, and everything else prints Cool.", expectedOutput: "Hot",
    cases: [{ stdin: "35\n", expected: "Hot" }, { stdin: "25\n", expected: "Warm" }, { stdin: "10\n", expected: "Cool" }],
    successMessage: "Your three paths work: Hot, Warm and Cool. Lesson done; the order of the checks is what made it work.",
    languages: {
      javascript: {
        note: "In JavaScript, else if adds another check, and a switch statement compares a value with several case labels.",
        exampleCode: L("const temperature = 10;", "if (temperature > 20) {", '  console.log("Warm");', "} else {", '  console.log("Cool");', "}"),
        starterCode: L(`const temperature = Number(${readAll}.trim());`, "if (temperature > 20) {", '  console.log("Warm");', "} else {", '  console.log("Cool");', "}"),
        answerCode: L(`const temperature = Number(${readAll}.trim());`, "if (temperature > 30) {", '  console.log("Hot");', "} else if (temperature > 20) {", '  console.log("Warm");', "} else {", '  console.log("Cool");', "}"),
        hints: ["Which number should the new check compare the temperature with?", "Add a check for temperature > 30 that prints Hot, and put it first. Turn the old if into an else if.", TRIP + "Order matters: if > 20 comes first, 35 prints Warm. Here is the complete code."],
      },
      python: {
        note: "In Python, elif adds another check, and the indented lines under each check belong to it.",
        exampleCode: L("temperature = 10", "if temperature > 20:", '    print("Warm")', "else:", '    print("Cool")'),
        starterCode: L("temperature = int(input())", "if temperature > 20:", '    print("Warm")', "else:", '    print("Cool")'),
        answerCode: L("temperature = int(input())", "if temperature > 30:", '    print("Hot")', "elif temperature > 20:", '    print("Warm")', "else:", '    print("Cool")'),
        hints: ["Which number should the new check compare the temperature with?", "Add a check for temperature > 30 that prints Hot, and put it first. Turn the old if into an elif.", TRIP + "Order matters: if > 20 comes first, 35 prints Warm. Here is the complete code."],
      },
    },
  },
  // 10
  {
    id: "loops-iteration", type: "code", title: "Loops and iteration", summary: "Repeat work without repeating yourself.", topics: ["Loop", "Iteration", "Traversal"],
    explanation: ["A loop repeats code until a stopping rule says to finish.", "A for loop counts through a range, a while loop runs as long as a condition stays true, and a do-while loop always runs once before checking.", "break leaves a loop early, and continue skips straight to the next turn."],
    exampleOutput: "1\n2\n3",
    task: "The loop prints 1 to 5. Change it so it skips 3 and prints 1, 2, 4 and 5, each on its own line.", expectedOutput: "1\n2\n4\n5",
    successMessage: "continue skipped the number 3 and the loop carried on with 4 and 5. Lesson done.",
    languages: {
      javascript: {
        note: "This for loop starts count at 1, continues while count <= 3 (at most 3), and adds 1 after each turn. A while or do...while loop does the same with just a condition.",
        exampleCode: L("for (let count = 1; count <= 3; count += 1) {", "  console.log(count);", "}"),
        starterCode: L("for (let count = 1; count <= 5; count += 1) {", "  console.log(count);", "}"),
        answerCode: L("for (let count = 1; count <= 5; count += 1) {", "  if (count === 3) {", "    continue;", "  }", "  console.log(count);", "}"),
        hints: ["Inside the loop you need a check for the one number you want to skip.", "Before the console.log line, add if (count === 3) { continue; }.", TRIP + "continue must come before the line that prints, or 3 is printed first. Here is the complete loop."],
      },
      python: {
        note: "In Python, range(1, 4) gives 1, 2 and 3: it starts at 1 and stops just before 4. Python has no do-while; a while loop with break does the same job.",
        exampleCode: L("for count in range(1, 4):", "    print(count)"),
        starterCode: L("for count in range(1, 6):", "    print(count)"),
        answerCode: L("for count in range(1, 6):", "    if count == 3:", "        continue", "    print(count)"),
        hints: ["Inside the loop you need a check for the one number you want to skip.", "Before the print line, add if count == 3: and put continue on the indented line below it.", TRIP + "continue must come before the line that prints, or 3 is printed first. Here is the complete loop."],
      },
    },
  },
  // 11
  {
    id: "functions-procedures", type: "code", title: "Functions and procedures", summary: "Package steps into a reusable, named tool.", topics: ["Functions"],
    explanation: ["A function is a named piece of code you can run whenever you need it.", "A parameter is a name for a value the function receives, an argument is the value you pass in, and return sends a result back.", "A function that only does something, without returning a value, is often called a procedure."],
    exampleOutput: "5",
    task: 'Make greet use its name parameter, so greet("Ada") returns "Hello, Ada!" and greet("Mia") returns "Hello, Mia!".', expectedOutput: "Hello, Ada!\nHello, Mia!",
    successMessage: "greet now uses whatever name it is given. Lesson done; one function, many results.",
    languages: {
      javascript: {
        note: "In JavaScript, function add(first, second) { ... } defines the function, and add(2, 3) calls it with two arguments.",
        exampleCode: L("function add(first, second) {", "  return first + second;", "}", "console.log(add(2, 3));"),
        starterCode: L("function greet(name) {", '  return "Hello!";', "}", 'console.log(greet("Ada"));', 'console.log(greet("Mia"));'),
        answerCode: L("function greet(name) {", '  return "Hello, " + name + "!";', "}", 'console.log(greet("Ada"));', 'console.log(greet("Mia"));'),
        hints: ["greet receives name, but the return line ignores it.", 'Join three pieces with +: "Hello, ", then name, then "!".', TRIP + "name sits outside the quotes so its value is used. Here is the complete code."],
      },
      python: {
        note: "In Python, def add(first, second): defines the function, and add(2, 3) calls it with two arguments.",
        exampleCode: L("def add(first, second):", "    return first + second", "", "print(add(2, 3))"),
        starterCode: L("def greet(name):", '    return "Hello!"', "", 'print(greet("Ada"))', 'print(greet("Mia"))'),
        answerCode: L("def greet(name):", '    return "Hello, " + name + "!"', "", 'print(greet("Ada"))', 'print(greet("Mia"))'),
        hints: ["greet receives name, but the return line ignores it.", 'Join three pieces with +: "Hello, ", then name, then "!".', TRIP + "name sits outside the quotes so its value is used. Here is the complete code."],
      },
    },
  },
  // 12
  {
    id: "scope-lifetime", type: "code", title: "Scope and lifetime", summary: "Where a name can be seen, and how long it lives.", topics: ["Scope"],
    explanation: ["Scope is the part of a program where a name can be used.", "A local variable lives inside one function and disappears when the function ends, while a global variable can be seen everywhere.", "Code can look outward at the names around it (lexical scope), but not inward at a function's locals."],
    exampleOutput: "Hello!",
    task: "This program crashes because message only exists inside makeMessage. Fix it so it prints Scope works!", expectedOutput: "Scope works!",
    successMessage: "message lives inside the function, so the function returned it to the outside. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, const and let belong to the nearest pair of curly braces, and a function can read names from the code around it.",
        exampleCode: L('const greeting = "Hello";', "function shout() {", '  const ending = "!";', "  return greeting + ending;", "}", "console.log(shout());"),
        starterCode: L("function makeMessage() {", '  const message = "Scope works!";', "}", "makeMessage();", "console.log(message);"),
        answerCode: L("function makeMessage() {", '  const message = "Scope works!";', "  return message;", "}", "console.log(makeMessage());"),
        hints: ["Read the error: the last line asks for message, but message was made inside the function.", "Make the function return message, then print the value that makeMessage() gives back.", TRIP + "A name made inside a function stays inside it, so send the value out with return. Here is the complete code."],
      },
      python: {
        note: "In Python, a name made inside def is local to that function, and a function can read names defined outside it.",
        exampleCode: L('greeting = "Hello"', "", "def shout():", '    ending = "!"', "    return greeting + ending", "", "print(shout())"),
        starterCode: L("def make_message():", '    message = "Scope works!"', "", "make_message()", "print(message)"),
        answerCode: L("def make_message():", '    message = "Scope works!"', "    return message", "", "print(make_message())"),
        hints: ["Read the error: the last line asks for message, but message was made inside the function.", "Make the function return message, then print the value that make_message() gives back.", TRIP + "A name made inside a function stays inside it, so send the value out with return. Here is the complete code."],
      },
    },
  },
  // 13
  {
    id: "mutability-immutability", type: "code", title: "Mutability and immutability", summary: "Values that can change, and values that can't.", topics: [],
    explanation: ["A mutable value can be changed in place, while an immutable value never changes, and any \"change\" makes a new value.", "Lists are mutable, and text strings are immutable.", "Knowing which is which explains why a change can show up in more than one place."],
    exampleOutput: "cat CAT",
    task: 'Add "done" to the list tags, so the program prints 3 for the number of items.', expectedOutput: "3",
    successMessage: "You changed the list in place, so it now holds three items. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, const stops the name from being reassigned, but the list itself is still mutable, so push can change it.",
        exampleCode: L('const word = "cat";', "const loud = word.toUpperCase();", "console.log(word, loud);"),
        starterCode: L('const tags = ["new", "work"];', "console.log(tags.length);"),
        answerCode: L('const tags = ["new", "work"];', 'tags.push("done");', "console.log(tags.length);"),
        hints: ["The list needs one more item before its length is printed.", 'Add the line tags.push("done"); above console.log. Lists can be changed in place.', TRIP + "push changes the list itself, and it works even though tags is a const. Here is the complete code."],
      },
      python: {
        note: "In Python, lists are mutable, so append changes the list itself, while strings and tuples never change.",
        exampleCode: L('word = "cat"', "loud = word.upper()", "print(word, loud)"),
        starterCode: L('tags = ["new", "work"]', "print(len(tags))"),
        answerCode: L('tags = ["new", "work"]', 'tags.append("done")', "print(len(tags))"),
        hints: ["The list needs one more item before its length is printed.", 'Add the line tags.append("done") above print. Lists can be changed in place.', TRIP + "append changes the list itself instead of making a new one. Here is the complete code."],
      },
    },
  },
  // 14
  {
    id: "error-handling", type: "code", title: "Error handling", summary: "Expect things to go wrong, and recover calmly.", topics: [],
    explanation: ["An error happens when something goes wrong while a program runs, such as turning the text \"abc\" into a number.", "Validation checks input before it is used, and error handling lets a program recover instead of crashing.", "A friendly message that says what to fix is better than a crash."],
    exampleOutput: "Not a number",
    task: 'Right now bad input breaks the program. Make it print "Please enter a number" when the input is not a number, and print double the number otherwise.', expectedOutput: "42",
    cases: [{ stdin: "21\n", expected: "42" }, { stdin: "abc\n", expected: "Please enter a number" }, { stdin: "0\n", expected: "0" }],
    successMessage: "Good numbers are doubled and bad input gets a friendly message instead of a crash. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, Number(\"abc\") does not crash; it gives NaN (not a number), which this practice runner shows as null, so check with Number.isNaN. Code that can throw is wrapped in try and catch.",
        exampleCode: L('const text = "abc";', "const number = Number(text);", "if (Number.isNaN(number)) {", '  console.log("Not a number");', "} else {", "  console.log(number * 2);", "}"),
        starterCode: L(`const text = ${readAll}.trim();`, "const number = Number(text);", "console.log(number * 2);"),
        answerCode: L(`const text = ${readAll}.trim();`, "const number = Number(text);", "if (Number.isNaN(number)) {", '  console.log("Please enter a number");', "} else {", "  console.log(number * 2);", "}"),
        hints: ["Run it with abc as the input and read what prints. Check the number before you use it.", 'Add if (Number.isNaN(number)) { ... } else { ... }. Print "Please enter a number" in the first block.', TRIP + "Number(\"abc\") is NaN, and NaN * 2 is still NaN, so check first. Here is the complete code."],
      },
      python: {
        note: "In Python, int(\"abc\") raises a ValueError. try runs the risky code, and except catches the error so the program can recover.",
        exampleCode: L('text = "abc"', "try:", "    number = int(text)", "    print(number * 2)", "except ValueError:", '    print("Not a number")'),
        starterCode: L("text = input()", "number = int(text)", "print(number * 2)"),
        answerCode: L("text = input()", "try:", "    number = int(text)", "    print(number * 2)", "except ValueError:", '    print("Please enter a number")'),
        hints: ["Run it with abc as the input and read the error. The risky line is the one that converts the text.", 'Wrap the conversion and the print in try:, then add except ValueError: that prints "Please enter a number".', TRIP + "The except block only runs when the try block raises a ValueError. Here is the complete code."],
      },
    },
  },
];

export function seedFoundationTrack() {
  // Module 1 is authored above; modules 2 to 5 live in ./foundation/module-N.mjs.
  const every = [...lessons, ...module2, ...module3, ...module4, ...module5];
  fs.mkdirSync("public/foundation-lessons", { recursive: true });
  const ids = new Set(every.map(lesson => lesson.id));
  if (ids.size !== every.length) throw new Error("Duplicate Foundation lesson ids.");
  // Drop practice files from lessons that were renamed or removed.
  for (const file of fs.readdirSync("public/foundation-lessons"))
    if (file.endsWith(".json") && !ids.has(file.slice(0, -5))) fs.unlinkSync(`public/foundation-lessons/${file}`);
  const reading = every.map(lesson => {
    const sentences = lesson.explanation.join(" ").split(/(?<=[.!?])\s+/).filter(Boolean).length;
    if (sentences > 3) throw new Error(`Foundation explanation has ${sentences} sentences (max 3): ${lesson.id}`);
    if (lesson.type === "concept") {
      const { check, ...copy } = lesson;
      for (const [language, snippet] of Object.entries(lesson.snippets ?? {}))
        if (!snippet.output) throw new Error(`Snippet needs its output: ${lesson.id}/${language}`);
      if (check.length < 2 || check.length > 3 || check.some(q => q.options.length < 2 || !Number.isInteger(q.answer) || q.answer >= q.options.length || !q.explanation))
        throw new Error(`Invalid concept check: ${lesson.id}`);
      fs.writeFileSync(`public/foundation-lessons/${lesson.id}.json`, JSON.stringify({ version: 2, id: lesson.id, type: "concept", check }, null, 2) + "\n");
      return copy;
    }
    if (lesson.cases?.some(item => typeof item.stdin !== "string" || typeof item.expected !== "string")) throw new Error(`Invalid cases: ${lesson.id}`);
    const practice = {}, languages = {};
    for (const [language, item] of Object.entries(lesson.languages)) {
      if (item.hints.length !== 3 || !item.hints[2].includes("This trips up lots of people")) throw new Error(`Invalid hints: ${lesson.id}/${language}`);
      const { hints, starterCode, answerCode, ...copy } = item;
      languages[language] = copy;
      practice[language] = { starterCode, hints, answerCode };
    }
    fs.writeFileSync(`public/foundation-lessons/${lesson.id}.json`, JSON.stringify({ version: 2, id: lesson.id, type: "code", languages: practice }, null, 2) + "\n");
    return { ...lesson, languages };
  });
  fs.writeFileSync("src/data/foundation-lessons.json", JSON.stringify(reading, null, 2) + "\n");
  return reading.length;
}
