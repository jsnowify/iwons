import { TRIP, L, readAll, q } from "./helpers.mjs";

// Module 5: Practical software engineering foundations (topics 49 to 60).
const done = "You got them all. Lesson done; come back whenever you want a refresher.";
export const lessons = [
  // 49
  {
    id: "debugging", type: "code", title: "Debugging", summary: "Tracing, logs and finding root causes.", topics: [],
    explanation: ["Debugging is finding out why a program does not do what you expect, and then fixing the cause.", "Trace the program by hand, or print values as it runs, to see where reality stops matching your plan.", "Fix the root cause rather than the symptom, and check that nothing else broke."],
    exampleOutput: "i = 1 total = 1\ni = 2 total = 3\ni = 3 total = 6",
    task: "The program should print the sum of 1 up to n, so 5 gives 15. It prints too little. Trace the loop, find the off-by-one mistake and fix it.", expectedOutput: "15",
    cases: [{ stdin: "5\n", expected: "15" }, { stdin: "1\n", expected: "1" }, { stdin: "10\n", expected: "55" }],
    successMessage: "The loop stopped one number too early, and you found it by tracing. Lesson done; off-by-one mistakes are among the most common bugs.",
    languages: {
      javascript: {
        note: "In JavaScript, console.log inside the loop shows each value as it changes.",
        exampleCode: L("let total = 0;", "for (let i = 1; i <= 3; i++) {", "  total += i;", '  console.log("i =", i, "total =", total);', "}"),
        starterCode: L(`const n = Number(${readAll}.trim());`, "let total = 0;", "for (let i = 1; i < n; i++) {", "  total += i;", "}", "console.log(total);"),
        answerCode: L(`const n = Number(${readAll}.trim());`, "let total = 0;", "for (let i = 1; i <= n; i++) {", "  total += i;", "}", "console.log(total);"),
        hints: ["Try n = 1 by hand. How many times does the loop run, and what does it print?", 'Add console.log("i =", i) inside the loop to see which numbers are added. The last one is missing.', TRIP + "i < n stops before n, but the sum should include n. Change it to i <= n. Here is the complete code."],
      },
      python: {
        note: "In Python, print inside the loop shows each value as it changes.",
        exampleCode: L("total = 0", "for i in range(1, 4):", "    total += i", '    print("i =", i, "total =", total)'),
        starterCode: L("n = int(input())", "total = 0", "for i in range(1, n):", "    total += i", "print(total)"),
        answerCode: L("n = int(input())", "total = 0", "for i in range(1, n + 1):", "    total += i", "print(total)"),
        hints: ["Try n = 1 by hand. How many times does the loop run, and what does it print?", 'Add print("i =", i) inside the loop to see which numbers are added. The last one is missing.', TRIP + "range(1, n) stops before n, but the sum should include n. Change it to range(1, n + 1). Here is the complete code."],
      },
    },
  },
  // 50
  {
    id: "testing", type: "code", title: "Testing", summary: "Unit, integration and end-to-end tests.", topics: [],
    explanation: ["A test runs your code with a known input and checks that the result is what you expect.", "A unit test checks one small piece, an integration test checks that pieces work together, and an end-to-end test checks the whole program the way a user would.", "Passing tests give you the confidence to change code without fear."],
    exampleOutput: "PASS",
    task: "This tiny test runner checks isEven on three inputs and prints PASS or FAIL for each. All three fail. Read what the tests expect and fix isEven so all three print PASS.", expectedOutput: "PASS\nPASS\nPASS",
    successMessage: "Three tests, three passes. The tests showed you exactly what was wrong. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, a test compares the actual result with the expected result and reports the outcome.",
        exampleCode: L("function double(n) {", "  return n * 2;", "}", 'console.log(double(4) === 8 ? "PASS" : "FAIL");'),
        starterCode: L("function isEven(n) {", "  return n % 2 === 1;", "}", "const tests = [[2, true], [3, false], [10, true]];", "for (const [input, expected] of tests) {", '  console.log(isEven(input) === expected ? "PASS" : "FAIL");', "}"),
        answerCode: L("function isEven(n) {", "  return n % 2 === 0;", "}", "const tests = [[2, true], [3, false], [10, true]];", "for (const [input, expected] of tests) {", '  console.log(isEven(input) === expected ? "PASS" : "FAIL");', "}"),
        hints: ["Look at the first test: isEven(2) should be true. What does isEven return for 2 right now?", "An even number leaves a remainder of 0 when divided by 2, not 1.", TRIP + "The tests were right and the function was wrong. Change === 1 to === 0. Here is the complete code."],
      },
      python: {
        note: "In Python, a test compares the actual result with the expected result and reports the outcome.",
        exampleCode: L("def double(n):", "    return n * 2", "", 'print("PASS" if double(4) == 8 else "FAIL")'),
        starterCode: L("def is_even(n):", "    return n % 2 == 1", "", "tests = [(2, True), (3, False), (10, True)]", "for value, expected in tests:", '    print("PASS" if is_even(value) == expected else "FAIL")'),
        answerCode: L("def is_even(n):", "    return n % 2 == 0", "", "tests = [(2, True), (3, False), (10, True)]", "for value, expected in tests:", '    print("PASS" if is_even(value) == expected else "FAIL")'),
        hints: ["Look at the first test: is_even(2) should be True. What does is_even return for 2 right now?", "An even number leaves a remainder of 0 when divided by 2, not 1.", TRIP + "The tests were right and the function was wrong. Change == 1 to == 0. Here is the complete code."],
      },
    },
  },
  // 51
  {
    id: "version-control", type: "concept", title: "Version control", summary: "Git, commits, branches and merges.", topics: [],
    explanation: ["Version control records every change to your files, so you can see what changed, who changed it, and go back.", "In Git, a commit is a saved snapshot, a branch is a separate line of work, and a merge brings branches together.", "Small commits with clear messages make history easy to read and mistakes easy to undo."],
    illustration: "main     A --- B ---------- E\n                \\         /\nfeature          C ---- D",
    illustrationCaption: "A branch history. Work on a feature branch (commits C and D) happens separately from main, and a merge brings it back as commit E.",
    successMessage: done,
    check: [
      q("What is a commit in Git?", ["A saved snapshot of your changes, with a message", "A copy of the whole internet", "A way to delete a branch"], 0, "A commit records the state of your files at a point in time, with a message saying why.", "It is a snapshot you can return to."),
      q("Why work on a branch?", ["So your changes stay separate until they are ready to merge", "Because main cannot be edited", "To make the files smaller"], 0, "A branch isolates work in progress, so main stays stable and several people can work at once.", "What does separate buy you?"),
      q("What makes a good commit?", ["A small, focused change with a clear message", "Every change from the whole week in one commit", "An empty message"], 0, "Small, well-described commits are easy to review, understand and undo.", "Think about reading the history later."),
    ],
  },
  // 52
  {
    id: "code-readability", type: "concept", title: "Code readability", summary: "Naming, formatting and structure.", topics: [],
    explanation: ["Readable code is written for people first, because code is read far more often than it is written.", "Clear names, consistent formatting and small functions make the meaning obvious.", "A comment should explain why, not repeat what the code already says."],
    illustration: "calc(a, b)       unclear\n\ndiscountAmount(price,\n               quantity)  clear",
    illustrationCaption: "The same idea with two names. A good name tells you what a function does before you read its body.",
    snippets: {
      javascript: { code: L("function calc(a, b) {", "  return a * b * 0.2;", "}", "function discountAmount(price, quantity) {", "  const DISCOUNT_RATE = 0.2;", "  return price * quantity * DISCOUNT_RATE;", "}", "console.log(calc(10, 2), discountAmount(10, 2));"), output: "4 4", caption: "Both functions give the same answer. Only the second explains itself." },
      python: { code: L("def calc(a, b):", "    return a * b * 0.2", "", "def discount_amount(price, quantity):", "    DISCOUNT_RATE = 0.2", "    return price * quantity * DISCOUNT_RATE", "", "print(calc(10, 2), discount_amount(10, 2))"), output: "4.0 4.0", caption: "Both functions give the same answer. Only the second explains itself." },
    },
    successMessage: done,
    check: [
      q("Why does readability matter?", ["Code is read far more often than it is written", "The computer reads names slowly", "Short names run faster"], 0, "People spend most of their time reading code, so making it easy to understand saves time and mistakes.", "Who reads the code, besides the computer?"),
      q("Which name is best for a function that works out a discount?", ["calc", "discountAmount", "x"], 1, "discountAmount says what it returns. calc and x make the reader open the body to find out.", "Which one explains itself?"),
      q("What should a good comment explain?", ["Why the code does something non-obvious", "Exactly what each line does in words", "Who is the best programmer on the team"], 0, "The code shows what it does, so use comments for the reasons that the code cannot show.", "Code can show what, but not why."),
    ],
  },
  // 53
  {
    id: "refactoring", type: "code", title: "Refactoring", summary: "Improve the code without changing what it does.", topics: [],
    explanation: ["Refactoring means improving how code is organized without changing what it does.", "Common moves are extracting repeated code into a function, giving things clearer names and removing duplication.", "Make small steps and run your checks after each one."],
    exampleOutput: "Tea: $3.30",
    task: "The program prints two price lines with the same tax formula copied twice. Add a third line, Pie at 5, but instead of copying the formula again, move it into a function called withTax and use it for all three lines.", expectedOutput: "Tea: $3.30\nCake: $4.40\nPie: $5.50",
    successMessage: "One function now holds the formula, so a change to the tax rate happens in one place. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, a small function that returns the formatted price removes the repeated formula.",
        exampleCode: L("const TAX = 1.1;", "function withTax(price) {", "  return (price * TAX).toFixed(2);", "}", 'console.log("Tea: $" + withTax(3));'),
        starterCode: L('console.log("Tea: $" + (3 * 1.1).toFixed(2));', 'console.log("Cake: $" + (4 * 1.1).toFixed(2));'),
        answerCode: L("function withTax(price) {", "  return (price * 1.1).toFixed(2);", "}", 'console.log("Tea: $" + withTax(3));', 'console.log("Cake: $" + withTax(4));', 'console.log("Pie: $" + withTax(5));'),
        hints: ["The formula (price * 1.1).toFixed(2) appears twice. Where could it live once?", "Write function withTax(price) that returns (price * 1.1).toFixed(2), then call it for Tea, Cake and Pie.", TRIP + "The function takes the price as a parameter, so the same code works for every item. Here is the complete code."],
      },
      python: {
        note: "In Python, a small function that returns the formatted price removes the repeated formula.",
        exampleCode: L("TAX = 1.1", "", "def with_tax(price):", '    return f"{price * TAX:.2f}"', "", 'print("Tea: $" + with_tax(3))'),
        starterCode: L('print("Tea: $" + f"{3 * 1.1:.2f}")', 'print("Cake: $" + f"{4 * 1.1:.2f}")'),
        answerCode: L("def with_tax(price):", '    return f"{price * 1.1:.2f}"', "", 'print("Tea: $" + with_tax(3))', 'print("Cake: $" + with_tax(4))', 'print("Pie: $" + with_tax(5))'),
        hints: ["The formula f\"{price * 1.1:.2f}\" appears twice. Where could it live once?", "Write def with_tax(price) that returns the formatted price, then call it for Tea, Cake and Pie.", TRIP + "The function takes the price as a parameter, so the same code works for every item. Here is the complete code."],
      },
    },
  },
  // 54
  {
    id: "data-validation", type: "code", title: "Data validation", summary: "Check input before you trust it.", topics: [],
    explanation: ["Data validation checks that input is acceptable before the program uses it.", "Check the type, the range, the length and the format, and reject anything that does not fit.", "Validate on the server even when the page already checked, because users can bypass the page."],
    exampleOutput: "valid",
    task: "The program reads an age and always prints valid. Make it print valid only for whole numbers from 0 to 120, and invalid for anything else, such as -5, 150 or abc.", expectedOutput: "valid",
    cases: [{ stdin: "25\n", expected: "valid" }, { stdin: "-5\n", expected: "invalid" }, { stdin: "abc\n", expected: "invalid" }, { stdin: "150\n", expected: "invalid" }],
    successMessage: "Good ages pass and anything odd is rejected before it can cause trouble. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, Number.isInteger(age) is false for NaN, so it catches text that is not a number.",
        exampleCode: L('const age = Number("25");', 'console.log(Number.isInteger(age) && age >= 0 && age <= 120 ? "valid" : "invalid");'),
        starterCode: L(`const text = ${readAll}.trim();`, "const age = Number(text);", 'console.log("valid");'),
        answerCode: L(`const text = ${readAll}.trim();`, "const age = Number(text);", 'if (text !== "" && Number.isInteger(age) && age >= 0 && age <= 120) {', '  console.log("valid");', "} else {", '  console.log("invalid");', "}"),
        hints: ["The program never looks at the age. Decide what a good age must satisfy.", "Check Number.isInteger(age), age >= 0 and age <= 120 together with &&, and print invalid otherwise.", TRIP + "Number(\"abc\") is NaN, and NaN is not an integer, so the isInteger check rejects it. Here is the complete code."],
      },
      python: {
        note: "In Python, int(text) raises a ValueError when the text is not a whole number, which try and except can catch.",
        exampleCode: L('age = int("25")', 'print("valid" if 0 <= age <= 120 else "invalid")'),
        starterCode: L("text = input()", 'print("valid")'),
        answerCode: L("text = input()", "try:", "    age = int(text)", "except ValueError:", "    age = -1", 'print("valid" if 0 <= age <= 120 else "invalid")'),
        hints: ["The program never looks at the age. Decide what a good age must satisfy.", "Convert with int(text) inside try, treat a ValueError as invalid, and check 0 <= age <= 120.", TRIP + "int(\"abc\") raises a ValueError, so catching it lets you reject bad input instead of crashing. Here is the complete code."],
      },
    },
  },
  // 55
  {
    id: "security-fundamentals", type: "concept", title: "Security fundamentals", summary: "Authentication, authorization, encryption basics and safe input.", topics: [],
    explanation: ["Authentication checks who you are, and authorization checks what you are allowed to do.", "Encryption scrambles data so only someone with the key can read it, and passwords should be stored only as salted hashes, never as plain text.", "Treat all input as untrusted: validate it, and never build commands or queries by pasting input into text."],
    illustration: "authentication  \"Who are you?\"\n                (log in)\n\nauthorization   \"May you do this?\"\n                (permissions)",
    illustrationCaption: "Two different checks. Authentication proves who you are, and authorization decides what that person may do.",
    snippets: {
      javascript: { code: L("function escapeHtml(text) {", '  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");', "}", 'console.log(escapeHtml("<script>alert(1)</script>"));'), output: "&lt;script&gt;alert(1)&lt;/script&gt;", caption: "Escaping turns special characters into harmless text, so pasted input cannot run as code on a page." },
      python: { code: L("import sqlite3", "", 'db = sqlite3.connect(":memory:")', 'db.execute("CREATE TABLE users (name TEXT)")', "db.execute(\"INSERT INTO users VALUES ('Ada')\")", "name = \"x' OR '1'='1\"", 'rows = db.execute("SELECT * FROM users WHERE name = ?", (name,)).fetchall()', "print(len(rows))"), output: "0", caption: "The ? placeholder keeps the input as data, so the attack text matches no user. Pasting it into the query text could have returned every row." },
    },
    successMessage: done,
    check: [
      q("What is the difference between authentication and authorization?", ["Authentication proves who you are, and authorization decides what you may do", "They mean exactly the same thing", "Authorization proves who you are, and authentication decides what you may do"], 0, "First the system checks who you are, then it checks what that person is allowed to do.", "One is identity, the other is permission."),
      q("How should a website store passwords?", ["As plain text, so they can be shown to users who forget", "As salted hashes, never as plain text", "In the page's source code"], 1, "A salted hash cannot be turned back into the password, so even a leaked database does not reveal passwords.", "Could you ever need to read a password back?"),
      q("Why is the placeholder in the SQL example safer than pasting the input into the query?", ["It keeps input as plain data, so it cannot change the query", "It makes the query run faster", "It removes the need to validate input"], 0, "With a placeholder the database treats the input only as a value, so special characters cannot rewrite the query.", "What could attacker text do if it became part of the query itself?"),
    ],
  },
  // 56
  {
    id: "api-fundamentals", type: "concept", title: "API fundamentals", summary: "Endpoints, status codes and contracts.", topics: [],
    explanation: ["An API lets one program use another through agreed requests and responses.", "A web API has endpoints (URLs), uses methods such as GET to read and POST to create, and answers with a status code such as 200 for success or 404 for not found.", "The API's contract says what to send and what comes back, so both sides can change independently."],
    illustration: "GET /users/7    --> 200 OK\n                    {\"name\":\"Ada\"}\nGET /users/999  --> 404 Not Found",
    illustrationCaption: "Two requests to the same API. A user that exists gets a 200 response with data, and a user that does not exist gets a 404.",
    snippets: {
      javascript: { code: L('const users = { 7: "Ada" };', "function getUser(id) {", "  if (!(id in users)) return { status: 404 };", "  return { status: 200, name: users[id] };", "}", "console.log(getUser(7).status, getUser(999).status);"), output: "200 404", caption: "A tiny pretend endpoint that answers 200 when the user exists and 404 when it does not." },
      python: { code: L('users = {7: "Ada"}', "", "def get_user(user_id):", "    if user_id not in users:", '        return {"status": 404}', '    return {"status": 200, "name": users[user_id]}', "", 'print(get_user(7)["status"], get_user(999)["status"])'), output: "200 404", caption: "A tiny pretend endpoint that answers 200 when the user exists and 404 when it does not." },
    },
    successMessage: done,
    check: [
      q("What is an API?", ["A way for one program to use another through agreed requests and responses", "A type of database", "A programming language"], 0, "An API is an agreed interface between programs, so they can work together without knowing each other's insides.", "It is how programs talk to each other."),
      q("What does an HTTP status code of 404 mean?", ["Success", "The requested thing was not found", "The server is on fire"], 1, "404 means the server could not find what was asked for. 200 is success.", "You have probably seen this on a web page."),
      q("Why does an API publish a contract?", ["So both sides know what to send and expect, and can change independently", "So nobody can use it", "To make requests slower"], 0, "As long as the contract holds, the server and its clients can each change their insides without breaking the other.", "Remember the lesson on interfaces."),
    ],
  },
  // 57
  {
    id: "dependency-management", type: "concept", title: "Dependency management", summary: "Using other people's code safely.", topics: [],
    explanation: ["A dependency is code written by someone else that your project uses, such as a library.", "A package manager downloads dependencies, and a lock file records the exact versions so everyone gets the same ones.", "Each dependency is a trade-off: it saves time but can bring bugs, security problems and updates to keep up with."],
    illustration: "your app\n |- library A  (2.1.0)\n |   |- library C  (1.4.2)\n |- library B  (0.9.1)",
    illustrationCaption: "A dependency tree. Your app uses libraries A and B, and library A uses library C, so you depend on C indirectly.",
    snippets: {
      javascript: { code: L("function major(version) {", '  return Number(version.split(".")[0]);', "}", 'console.log(major("2.1.0") === major("2.9.3"));', 'console.log(major("2.1.0") === major("3.0.0"));'), output: "true\nfalse", caption: "Versions look like major.minor.patch. Within one major number updates should be safe, while a new major number may break your code." },
      python: { code: L("def major(version):", '    return int(version.split(".")[0])', "", 'print(major("2.1.0") == major("2.9.3"))', 'print(major("2.1.0") == major("3.0.0"))'), output: "True\nFalse", caption: "Versions look like major.minor.patch. Within one major number updates should be safe, while a new major number may break your code." },
    },
    successMessage: done,
    check: [
      q("What is a dependency?", ["Code written by someone else that your project uses", "A bug in your own code", "A file only the operating system reads"], 0, "A dependency is any library or package your project relies on that you did not write yourself.", "Think of a library you import."),
      q("What does a lock file do?", ["Stops anyone from editing your code", "Records the exact versions so everyone installs the same ones", "Encrypts your project"], 1, "The lock file makes installs repeatable, so the code that works on your machine works on everyone else's.", "It locks the versions."),
      q("Which change in a version number most likely breaks your code?", ["2.1.0 to 2.1.1", "2.1.0 to 2.2.0", "2.1.0 to 3.0.0"], 2, "A new major number signals changes that may not be compatible, so check the notes before updating.", "Which number is the major one?"),
    ],
  },
  // 58
  {
    id: "software-architecture", type: "concept", title: "Software architecture", summary: "Layers, coupling and cohesion.", topics: [],
    explanation: ["Software architecture is how a system is split into parts and how those parts depend on each other.", "A common design uses layers, such as presentation, logic and data, where each layer only talks to the one below it.", "Good architecture has low coupling, so parts depend on each other as little as possible, and high cohesion, so each part's contents belong together."],
    illustration: "presentation   screens, buttons\n      |\nlogic          rules, decisions\n      |\ndata           database, files",
    illustrationCaption: "A layered design. Each layer only talks to the layer below it, so a change in one layer rarely spreads to the others.",
    successMessage: done,
    check: [
      q("What is a layer in a layered architecture?", ["A group of related code that only talks to the layer below it", "A coat of paint on the user interface", "A backup copy of the database"], 0, "Layers group code by role, and limiting who talks to whom keeps dependencies under control.", "Look at the picture: who talks to whom?"),
      q("What does low coupling mean?", ["Parts depend on each other as little as possible", "Every part depends on every other part", "The program has few parts"], 0, "Low coupling means a change in one part rarely forces changes in others.", "Coupling is about how tightly parts are tied together."),
      q("What does high cohesion mean?", ["The contents of a part belong together and serve one purpose", "The part is very large", "The part is copied in many places"], 0, "A cohesive part has one clear purpose, so it is easier to understand, test and reuse.", "Think of how well a part's contents fit together."),
    ],
  },
  // 59
  {
    id: "performance-optimization", type: "concept", title: "Performance optimization", summary: "Profiling and caching.", topics: [],
    explanation: ["Performance work starts with measuring, because the slow part is often not where you expect.", "Profiling finds where time is spent, and caching saves the result of slow work so you can reuse it.", "Only optimize what the measurements show matters, because faster code is often harder to read."],
    illustration: "1. measure   find the slow part\n2. change    fix only that\n3. measure   did it help?",
    illustrationCaption: "The optimization loop. Measure first, change one thing, then measure again to check it really helped.",
    snippets: {
      javascript: { code: L("const cache = {};", "function fib(n) {", "  if (n < 2) return n;", "  if (cache[n] !== undefined) return cache[n];", "  cache[n] = fib(n - 1) + fib(n - 2);", "  return cache[n];", "}", "console.log(fib(40));"), output: "102334155", caption: "Without the cache this would make hundreds of millions of calls. With it, each value is worked out once." },
      python: { code: L("cache = {}", "", "def fib(n):", "    if n < 2:", "        return n", "    if n not in cache:", "        cache[n] = fib(n - 1) + fib(n - 2)", "    return cache[n]", "", "print(fib(40))"), output: "102334155", caption: "Without the cache this would make hundreds of millions of calls. With it, each value is worked out once." },
    },
    successMessage: done,
    check: [
      q("What should you do before optimizing?", ["Measure to find the slow part", "Rewrite everything in a faster language", "Remove all the comments"], 0, "Profiling shows where the time really goes, so you fix the right thing instead of guessing.", "You cannot fix what you have not found."),
      q("What does a cache do?", ["Saves the result of slow work so it can be reused", "Deletes old data", "Splits the program into modules"], 0, "A cache trades memory for speed by remembering answers you have already worked out.", "It remembers answers."),
      q("Why not optimize everything?", ["Faster code is often harder to read, so only the parts that matter are worth it", "Optimizing is not allowed", "Computers are always fast enough"], 0, "Optimizations have a cost in complexity, so spend them where the measurements say they pay off.", "What does extra speed often cost?"),
    ],
  },
  // 60
  {
    id: "build-deployment", type: "concept", title: "Build and deployment", summary: "Compilation, packaging and CI/CD.", topics: [],
    explanation: ["A build turns source code into something that can run, by compiling, bundling files and packaging them.", "Deployment puts that build where users can reach it, such as on a server.", "CI/CD automates the steps: continuous integration builds and tests every change, and continuous delivery ships the changes that pass."],
    illustration: "push --> build --> test --> deploy\n          |        |\n       fails?   fails?\n       stop and tell you",
    illustrationCaption: "A CI/CD pipeline. Every push is built and tested automatically, and a failure at any step stops the pipeline and tells the team.",
    successMessage: done,
    check: [
      q("What does a build do?", ["Turns source code into something that can run", "Deletes unused files", "Writes the tests for you"], 0, "Building compiles, bundles and packages your code into a form that can be run or shipped.", "It prepares the code to run."),
      q("What does continuous integration do?", ["Builds and tests every change automatically", "Deletes old branches", "Pays for the servers"], 0, "CI checks every change as it arrives, so problems are found while they are small.", "Remember the pipeline picture."),
      q("Why automate deployment?", ["It is repeatable and less likely to go wrong than manual steps", "It lets you skip testing", "It makes the code shorter"], 0, "A pipeline does the same steps every time, which removes a lot of human error.", "Humans forget steps, and scripts do not."),
    ],
  },
];
