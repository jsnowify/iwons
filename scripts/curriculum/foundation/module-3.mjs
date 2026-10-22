import { TRIP, L, readAll, jsNumbers, pyNumbers, q } from "./helpers.mjs";

// Module 3: Programming principles and design (topics 28 to 38).
const done = "You got them all. Lesson done; come back whenever you want a refresher.";
export const lessons = [
  // 28
  {
    id: "abstraction", type: "concept", title: "Abstraction", summary: "Hide the details, keep the idea.", topics: [],
    explanation: ["Abstraction means hiding the details and showing only what you need to use something.", "You press a button on a microwave without knowing how it heats food, and a function works the same way.", "Good abstractions let you think about what a piece of code does, not how it does it."],
    illustration: "you call:        average(list)\n                    |\nhidden inside:   add them up\n                 count them\n                 divide",
    illustrationCaption: "The caller only sees the name average and what it returns. The adding, counting and dividing stay hidden inside the function.",
    snippets: {
      javascript: { code: L("function average(numbers) {", "  let total = 0;", "  for (const n of numbers) total += n;", "  return total / numbers.length;", "}", "console.log(average([2, 4, 6]));"), output: "4", caption: "You use average without caring how it adds and divides." },
      python: { code: L("def average(numbers):", "    total = 0", "    for n in numbers:", "        total += n", "    return total / len(numbers)", "", "print(average([2, 4, 6]))"), output: "4.0", caption: "You use average without caring how it adds and divides." },
    },
    successMessage: done,
    check: [
      q("What does abstraction do?", ["Makes code run faster", "Hides details so you can focus on what something does", "Removes the need for functions"], 1, "Abstraction hides the how so you can work with the what. It does not make code faster, and functions are one of the main ways to build it.", "Think of the microwave button."),
      q("Which is an example of abstraction?", ["Copying the same code into three places", "Naming every variable x", "Calling sort() without knowing which sorting algorithm it uses"], 2, "You use sort() through its name and what it promises, and the algorithm inside stays hidden. The other two make code harder to understand.", "Look for the one where details are hidden behind a simple name."),
      q("Why is hiding the details useful?", ["The inside can change later without breaking the people who use it", "It makes the program shorter in every case", "It means nobody needs to test it"], 0, "If callers only rely on what the function promises, you can improve the inside freely. Abstraction does not remove the need to test.", "What can you do to the inside if nobody depends on it?"),
    ],
  },
  // 29
  {
    id: "encapsulation", type: "concept", title: "Encapsulation", summary: "Keep data and the code that guards it together.", topics: [],
    explanation: ["Encapsulation keeps data and the code that works on it together, and controls how outsiders can reach it.", "Other code uses a small set of methods instead of changing the data directly.", "That way the data can be protected from invalid changes."],
    illustration: "+------------------------+\n| Account                |\n|   balance  (hidden)    |\n|   deposit(amount)      |\n|   get balance          |\n+------------------------+\n   only these are public",
    illustrationCaption: "An Account object keeps its balance private. The outside can only use the methods the account offers, so every change goes through its checks.",
    snippets: {
      javascript: { code: L("class Account {", "  #balance = 0;", "  deposit(amount) {", "    if (amount > 0) {", "      this.#balance += amount;", "    }", "  }", "  get balance() {", "    return this.#balance;", "  }", "}", "const account = new Account();", "account.deposit(50);", "account.deposit(-20);", "console.log(account.balance);"), output: "50", caption: "The # makes the balance private. deposit rejects the negative amount, so the balance stays 50." },
      python: { code: L("class Account:", "    def __init__(self):", "        self._balance = 0", "", "    def deposit(self, amount):", "        if amount > 0:", "            self._balance += amount", "", "    @property", "    def balance(self):", "        return self._balance", "", "account = Account()", "account.deposit(50)", "account.deposit(-20)", "print(account.balance)"), output: "50", caption: "The leading underscore marks the balance as private by habit. deposit rejects the negative amount, so the balance stays 50." },
    },
    successMessage: done,
    check: [
      q("What is the main idea of encapsulation?", ["Make every variable public so anyone can change it", "Keep data with the code that works on it, and control how it is reached", "Put each function in its own file"], 1, "Encapsulation bundles data with its behaviour and limits direct access. It is about control, not file layout.", "Think about the account that guards its balance."),
      q("Why does the Account hide its balance?", ["To save memory", "So it prints faster", "So nothing can set it to an invalid value by accident"], 2, "If the balance is private, all changes go through deposit, which can check them. Hiding it has nothing to do with speed or memory.", "What does deposit check that a direct change would not?"),
      q("In the example, what happens to account.deposit(-20)?", ["The balance stays 50, because deposit rejects negative amounts", "The balance becomes 30", "The program crashes"], 0, "deposit only adds amounts above zero, so the negative deposit is ignored and the balance stays 50.", "Read the if inside deposit."),
    ],
  },
  // 30
  {
    id: "modularity", type: "concept", title: "Modularity", summary: "Build programs from small, swappable parts.", topics: [],
    explanation: ["Modularity means building a program from small, separate parts called modules, each with one clear purpose.", "A module can be changed, tested or replaced without rewriting everything else.", "Parts connect through a few clear entry points."],
    illustration: "main\n |-- input    (read the data)\n |-- rules    (decide)\n |-- output   (show the result)",
    illustrationCaption: "A program split into three modules. Each one does a single job, and main joins them together.",
    snippets: {
      javascript: { code: L("function parse(text) {", '  return text.split(" ").map(Number);', "}", "function total(numbers) {", "  return numbers.reduce((a, b) => a + b, 0);", "}", "function show(value) {", '  console.log("Total: " + value);', "}", 'show(total(parse("1 2 3")));'), output: "Total: 6", caption: "Three small functions, each with one job, joined in one line." },
      python: { code: L("def parse(text):", "    return [int(part) for part in text.split()]", "", "def total(numbers):", "    return sum(numbers)", "", "def show(value):", '    print("Total: " + str(value))', "", 'show(total(parse("1 2 3")))'), output: "Total: 6", caption: "Three small functions, each with one job, joined in one line." },
    },
    successMessage: done,
    check: [
      q("What is a module?", ["A small, separate part of a program with one clear purpose", "Another name for a bug", "The slowest part of a program"], 0, "A module groups related code behind a clear purpose, so it can be understood, tested and changed on its own.", "Think of the three boxes under main."),
      q("Why is modularity helpful?", ["It makes every program faster", "It lets you change one part without rewriting the rest", "It removes the need to test"], 1, "Because each part has a narrow job, a change stays local. It does not guarantee speed, and tests are still needed.", "What happens to the other boxes if you rewrite one?"),
      q("In the example, what does total need to know about parse?", ["Nothing: it only needs a list of numbers", "How parse splits the text", "The name of the file parse lives in"], 0, "total accepts any list of numbers, from any source. That is what keeps the parts swappable.", "What does total receive?"),
    ],
  },
  // 31
  {
    id: "object-oriented-programming", type: "code", title: "Object-oriented programming", summary: "Classes, objects, inheritance, composition and polymorphism.", topics: [],
    explanation: ["A class is a blueprint, and an object is one thing built from it, with its own data and behaviour.", "Inheritance lets a class reuse another class's code, composition builds a class by holding other objects, and polymorphism lets different classes answer the same method call in their own way.", "Use inheritance when something truly is a kind of something, and composition when it has something."],
    exampleOutput: "Woof",
    task: "The program reads animal kinds and asks each one to speak. Cat does not have its own speak yet, so it prints ... Give Cat a speak method that returns Meow.", expectedOutput: "Woof\nMeow",
    cases: [{ stdin: "dog cat\n", expected: "Woof\nMeow" }, { stdin: "cat\n", expected: "Meow" }, { stdin: "dog dog\n", expected: "Woof\nWoof" }],
    successMessage: "Each class answered speak in its own way, and the loop did not need to know which was which. That is polymorphism. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, class Dog extends Animal inherits from Animal, and a method with the same name overrides it.",
        exampleCode: L("class Animal {", "  speak() {", '    return "...";', "  }", "}", "class Dog extends Animal {", "  speak() {", '    return "Woof";', "  }", "}", "console.log(new Dog().speak());"),
        starterCode: L("class Animal {", "  speak() {", '    return "...";', "  }", "}", "class Dog extends Animal {", "  speak() {", '    return "Woof";', "  }", "}", "class Cat extends Animal {}", "const makers = { dog: () => new Dog(), cat: () => new Cat() };", `for (const kind of ${readAll}.trim().split(" ")) {`, "  console.log(makers[kind]().speak());", "}"),
        answerCode: L("class Animal {", "  speak() {", '    return "...";', "  }", "}", "class Dog extends Animal {", "  speak() {", '    return "Woof";', "  }", "}", "class Cat extends Animal {", "  speak() {", '    return "Meow";', "  }", "}", "const makers = { dog: () => new Dog(), cat: () => new Cat() };", `for (const kind of ${readAll}.trim().split(" ")) {`, "  console.log(makers[kind]().speak());", "}"),
        hints: ["Dog overrides speak, but Cat is empty, so it uses Animal's version.", 'Give Cat its own speak method, just like Dog has, and return "Meow".', TRIP + "A subclass only replaces a method if it defines one with the same name. Here is the complete code."],
      },
      python: {
        note: "In Python, class Dog(Animal) inherits from Animal, and a method with the same name overrides it.",
        exampleCode: L("class Animal:", "    def speak(self):", '        return "..."', "", "class Dog(Animal):", "    def speak(self):", '        return "Woof"', "", "print(Dog().speak())"),
        starterCode: L("class Animal:", "    def speak(self):", '        return "..."', "", "class Dog(Animal):", "    def speak(self):", '        return "Woof"', "", "class Cat(Animal):", "    pass", "", 'makers = {"dog": Dog, "cat": Cat}', "for kind in input().split():", "    print(makers[kind]().speak())"),
        answerCode: L("class Animal:", "    def speak(self):", '        return "..."', "", "class Dog(Animal):", "    def speak(self):", '        return "Woof"', "", "class Cat(Animal):", "    def speak(self):", '        return "Meow"', "", 'makers = {"dog": Dog, "cat": Cat}', "for kind in input().split():", "    print(makers[kind]().speak())"),
        hints: ["Dog overrides speak, but Cat only says pass, so it uses Animal's version.", 'Give Cat its own speak method, just like Dog has, and return "Meow".', TRIP + "A subclass only replaces a method if it defines one with the same name. Here is the complete code."],
      },
    },
  },
  // 32
  {
    id: "functional-programming", type: "code", title: "Functional programming", summary: "Pure functions, higher-order functions and immutability.", topics: [],
    explanation: ["A pure function always returns the same result for the same inputs and changes nothing outside itself.", "A higher-order function takes a function as an argument or returns one, as map and filter do.", "Building new values instead of changing old ones makes code easier to follow."],
    exampleOutput: "2 4 6",
    task: "The program prints the square of every number. Change it so it only squares the even numbers, by filtering first and then mapping, and prints those squares.", expectedOutput: "4 16",
    cases: [{ stdin: "1 2 3 4\n", expected: "4 16" }, { stdin: "2 3\n", expected: "4" }, { stdin: "6\n", expected: "36" }],
    successMessage: "filter chose the even numbers and map squared them, with no loop and no changes to the original list. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, numbers.filter(test) keeps the items that pass, and numbers.map(change) builds a new list of results.",
        exampleCode: L("const numbers = [1, 2, 3];", "const doubled = numbers.map(n => n * 2);", 'console.log(doubled.join(" "));'),
        starterCode: L(`const numbers = ${jsNumbers};`, "const result = numbers.map(n => n * n);", 'console.log(result.join(" "));'),
        answerCode: L(`const numbers = ${jsNumbers};`, "const result = numbers.filter(n => n % 2 === 0).map(n => n * n);", 'console.log(result.join(" "));'),
        hints: ["The program squares everything. Which method keeps only some items?", "Call numbers.filter(n => n % 2 === 0) first, then .map(n => n * n) on the result.", TRIP + "Filter first, then map, because mapping first would square the odd numbers too. Here is the complete code."],
      },
      python: {
        note: "In Python, filter(test, numbers) keeps the items that pass, and map(change, numbers) builds the results.",
        exampleCode: L("numbers = [1, 2, 3]", "doubled = list(map(lambda n: n * 2, numbers))", 'print(" ".join(map(str, doubled)))'),
        starterCode: L(`numbers = ${pyNumbers}`, "result = list(map(lambda n: n * n, numbers))", 'print(" ".join(map(str, result)))'),
        answerCode: L(`numbers = ${pyNumbers}`, "result = list(map(lambda n: n * n, filter(lambda n: n % 2 == 0, numbers)))", 'print(" ".join(map(str, result)))'),
        hints: ["The program squares everything. Which function keeps only some items?", "Wrap numbers in filter(lambda n: n % 2 == 0, numbers) before mapping the squares.", TRIP + "Filter first, then map, because mapping first would square the odd numbers too. Here is the complete code."],
      },
    },
  },
  // 33
  {
    id: "declarative-imperative", type: "concept", title: "Declarative vs imperative", summary: "Say what you want, or say how to get it.", topics: [],
    explanation: ["Imperative code spells out how to do something, step by step.", "Declarative code states what result you want and lets the language or library work out the steps.", "Most programs mix both styles."],
    illustration: "imperative:\n  take a number, is it even?\n  if yes, put it in a new list...\n\ndeclarative:\n  give me the even numbers",
    illustrationCaption: "The same job described two ways. The imperative version lists every step, while the declarative version only says what is wanted.",
    snippets: {
      javascript: { code: L("const numbers = [1, 2, 3, 4, 5, 6];", "const evens = [];", "for (const n of numbers) {", "  if (n % 2 === 0) {", "    evens.push(n);", "  }", "}", 'console.log(evens.join(" "));', 'console.log(numbers.filter(n => n % 2 === 0).join(" "));'), output: "2 4 6\n2 4 6", caption: "Both print the even numbers. The loop says how, and filter says what." },
      python: { code: L("numbers = [1, 2, 3, 4, 5, 6]", "evens = []", "for n in numbers:", "    if n % 2 == 0:", "        evens.append(n)", 'print(" ".join(map(str, evens)))', 'print(" ".join(str(n) for n in numbers if n % 2 == 0))'), output: "2 4 6\n2 4 6", caption: "Both print the even numbers. The loop says how, and the comprehension says what." },
    },
    successMessage: done,
    check: [
      q("Which best describes imperative code?", ["It states the result you want and nothing else", "It spells out the steps to get the result", "It cannot use loops"], 1, "Imperative code is a recipe of steps. Loops are a very common part of it.", "Think of the recipe versus the order at a restaurant."),
      q("SQL's SELECT name FROM users WHERE age > 18 is mostly which style?", ["Declarative: it says what rows you want, not how to find them", "Imperative: it lists each step of the search", "Neither: it is not code"], 0, "You describe the result and the database decides how to find it. That is the declarative style.", "Did you say how the database should search?"),
      q("Why might you choose the declarative version of the even-number example?", ["It is always faster", "It is shorter and shows the intent clearly", "It uses no memory"], 1, "It states what you want in one line, which is easier to read. It is not always faster, and it still uses memory.", "Which version tells you the goal at a glance?"),
    ],
  },
  // 34
  {
    id: "separation-of-concerns", type: "concept", title: "Separation of concerns", summary: "One part, one job.", topics: [],
    explanation: ["Separation of concerns means each part of a program deals with one kind of problem.", "A common split is the screen (how it looks), the rules (what it decides) and the data (where it is stored).", "When the concerns are separate, a change to one rarely forces changes to the others."],
    illustration: "screen   how it looks\n   |\nrules    what it decides\n   |\ndata     where it is kept",
    illustrationCaption: "Three concerns stacked in layers. The screen shows results, the rules decide them, and the data layer stores them.",
    snippets: {
      javascript: { code: L("function priceWithTax(price) {", "  return price * 1.1;", "}", "function format(value) {", '  return "$" + value.toFixed(2);', "}", "console.log(format(priceWithTax(10)));"), output: "$11.00", caption: "priceWithTax is a rule and format is presentation. You can change the tax rate or the currency symbol independently." },
      python: { code: L("def price_with_tax(price):", "    return price * 1.1", "", "def format_price(value):", '    return f"${value:.2f}"', "", "print(format_price(price_with_tax(10)))"), output: "$11.00", caption: "price_with_tax is a rule and format_price is presentation. You can change the tax rate or the currency symbol independently." },
    },
    successMessage: done,
    check: [
      q("What does separation of concerns mean?", ["Each part deals with one kind of problem", "All code goes in one big file", "Only one person may edit the code"], 0, "Keeping one concern per part means each part is simpler and can change on its own.", "Think about the layers in the picture."),
      q("In the example, which function is presentation?", ["priceWithTax", "format", "Both of them"], 1, "format decides how a number looks, which is presentation. priceWithTax decides the amount, which is a rule.", "Which one produces the dollar sign?"),
      q("Why is it handy that the tax rule is separate from the formatting?", ["You can change one without touching the other", "It makes the program run twice as fast", "It means you never need to test the rule"], 0, "A change to the tax rate does not touch the formatting code, and the other way round. That is the benefit of separation.", "What would you have to edit to change only the currency symbol?"),
    ],
  },
  // 35
  {
    id: "solid-principles", type: "concept", title: "SOLID principles", summary: "Five habits for code that is easy to change.", topics: [],
    explanation: ["SOLID is five habits for object-oriented code: single responsibility, open/closed, Liskov substitution, interface segregation and dependency inversion.", "Each one is a way of keeping parts small, replaceable and loosely connected.", "They are guidelines, not laws, so use them when they make code simpler."],
    illustration: "S  one class, one job\nO  extend it, don't edit it\nL  a subclass can stand in\nI  small, focused interfaces\nD  depend on abstractions",
    illustrationCaption: "The five SOLID habits, one line each. Together they aim to make code easy to extend and hard to break.",
    snippets: {
      javascript: { code: L("class ConsoleSender {", "  send(text) {", "    console.log(text);", "  }", "}", "class Notifier {", "  constructor(sender) {", "    this.sender = sender;", "  }", "  notify(text) {", "    this.sender.send(text);", "  }", "}", 'new Notifier(new ConsoleSender()).notify("Hello");'), output: "Hello", caption: "Notifier depends on anything that has a send method, so ConsoleSender could be swapped for an email sender without changing Notifier. That is dependency inversion." },
      python: { code: L("class ConsoleSender:", "    def send(self, text):", "        print(text)", "", "class Notifier:", "    def __init__(self, sender):", "        self.sender = sender", "", "    def notify(self, text):", "        self.sender.send(text)", "", 'Notifier(ConsoleSender()).notify("Hello")'), output: "Hello", caption: "Notifier depends on anything that has a send method, so ConsoleSender could be swapped for an email sender without changing Notifier. That is dependency inversion." },
    },
    successMessage: done,
    check: [
      q("What does the S in SOLID stand for?", ["Speed", "Single responsibility: a class should have one job", "Simple syntax"], 1, "Single responsibility means a class has one reason to change, which keeps it small and focused.", "It is about how many jobs one class does."),
      q("Dependency inversion says high-level code should depend on what?", ["The most complex class available", "Global variables", "Abstractions, such as an interface, rather than concrete details"], 2, "Depending on a promise instead of a specific class lets you swap the details, like the sender in the example.", "Look at what Notifier depends on."),
      q("The O in SOLID means code should be open to extension but closed to modification. What does that suggest?", ["Add new behaviour by adding new code, instead of editing code that already works", "Never change any code after it is written", "Always copy and paste existing classes"], 0, "You extend behaviour, for example with a new sender class, without editing code that already works and is tested.", "How did the example add a new kind of sender?"),
    ],
  },
  // 36
  {
    id: "dry-kiss-yagni", type: "concept", title: "DRY, KISS, YAGNI", summary: "Three reminders to keep things simple.", topics: [],
    explanation: ["DRY means don't repeat yourself, so each piece of knowledge lives in one place.", "KISS means keep it simple, because the simplest solution that works is the easiest to understand and fix.", "YAGNI means you aren't going to need it, so don't build features before you need them."],
    illustration: "DRY    one rule, one place\nKISS   the simple way first\nYAGNI  build it when needed",
    illustrationCaption: "Three short reminders. Avoid repeating yourself, prefer simple solutions, and do not build things you do not need yet.",
    snippets: {
      javascript: { code: L("const TAX_RATE = 0.1;", "function withTax(price) {", "  return price + price * TAX_RATE;", "}", "console.log(withTax(10), withTax(20));"), output: "11 22", caption: "The tax rate lives in one place. Change it once, and every price follows." },
      python: { code: L("TAX_RATE = 0.1", "", "def with_tax(price):", "    return price + price * TAX_RATE", "", "print(with_tax(10), with_tax(20))"), output: "11.0 22.0", caption: "The tax rate lives in one place. Change it once, and every price follows." },
    },
    successMessage: done,
    check: [
      q("You find the same tax calculation copied in five places. Which principle does that break?", ["YAGNI", "DRY", "KISS"], 1, "DRY says each piece of knowledge should live in one place. Five copies mean five places to fix when the rate changes.", "Which principle is about repetition?"),
      q("You add a plugin system for features nobody has asked for. Which principle does that break?", ["YAGNI: you aren't going to need it", "DRY", "SOLID"], 0, "Building ahead of need adds code to write, test and maintain for a benefit that may never arrive.", "Which principle says to build only what you need?"),
      q("Which solution does KISS favour?", ["The cleverest one that uses the newest tricks", "The simplest one that works and is easy to explain", "The one with the most layers"], 1, "KISS prefers simple, readable solutions. Clever code is harder to understand and fix.", "Easy to understand and fix is the goal."),
    ],
  },
  // 37
  {
    id: "design-patterns", type: "concept", title: "Design patterns", summary: "Named solutions to problems that keep coming back.", topics: [],
    explanation: ["A design pattern is a named, reusable solution to a problem that keeps coming up.", "Examples are the observer, where listeners are told when something changes, and the factory, which creates objects for you.", "Patterns give a team shared words, but they should solve a real problem, not decorate the code."],
    illustration: "publisher --> listener A\n          --> listener B\n          --> listener C\n\n(the observer pattern)",
    illustrationCaption: "The observer pattern. One publisher tells every listener when something happens, and the listeners can come and go without the publisher changing.",
    snippets: {
      javascript: { code: L("const listeners = [];", "function subscribe(listener) {", "  listeners.push(listener);", "}", "function publish(message) {", "  for (const listener of listeners) listener(message);", "}", 'subscribe(message => console.log("A got " + message));', 'subscribe(message => console.log("B got " + message));', 'publish("hi");'), output: "A got hi\nB got hi", caption: "Both listeners are told when the message is published." },
      python: { code: L("listeners = []", "", "def subscribe(listener):", "    listeners.append(listener)", "", "def publish(message):", "    for listener in listeners:", "        listener(message)", "", 'subscribe(lambda message: print("A got " + message))', 'subscribe(lambda message: print("B got " + message))', 'publish("hi")'), output: "A got hi\nB got hi", caption: "Both listeners are told when the message is published." },
    },
    successMessage: done,
    check: [
      q("What is a design pattern?", ["A rule that every program must follow", "A named, reusable solution to a common problem", "A way of decorating a user interface"], 1, "A pattern is a proven way to solve a problem that keeps appearing, with a name so people can talk about it.", "Patterns are solutions with names."),
      q("In the observer pattern, what happens when the publisher publishes?", ["Every subscribed listener is told", "Only the first listener is told", "The publisher stops running"], 0, "The publisher notifies everyone who subscribed, without knowing who they are or what they do.", "Look at the output of the snippet."),
      q("When is a pattern worth using?", ["Always, in every program", "When it solves a real problem you actually have", "Only in very large programs"], 1, "A pattern helps when it fits a real problem. Using one for show only adds complexity.", "Remember the last sentence of the explanation."),
    ],
  },
  // 38
  {
    id: "interfaces-contracts", type: "concept", title: "Interfaces and contracts", summary: "Agree on what a part promises, not how it works.", topics: [],
    explanation: ["An interface lists what something can do, and a contract is the promise about how it behaves.", "Code that relies on the interface works with any part that keeps the promise.", "The inside of a part can change safely as long as the contract stays the same."],
    illustration: "caller  -->  [ area() ]  -->  Square\n                         -->  Circle\n\nthe promise: area() gives a number",
    illustrationCaption: "The caller only knows the promise, that area() returns a number. Any shape that keeps the promise can be used.",
    snippets: {
      javascript: { code: L("class Square {", "  constructor(side) {", "    this.side = side;", "  }", "  area() {", "    return this.side * this.side;", "  }", "}", "class Rectangle {", "  constructor(width, height) {", "    this.width = width;", "    this.height = height;", "  }", "  area() {", "    return this.width * this.height;", "  }", "}", "for (const shape of [new Square(3), new Rectangle(3, 4)]) {", "  console.log(shape.area());", "}"), output: "9\n12", caption: "The loop only relies on every shape having an area method. It works for any new shape that keeps that promise." },
      python: { code: L("class Square:", "    def __init__(self, side):", "        self.side = side", "", "    def area(self):", "        return self.side * self.side", "", "class Rectangle:", "    def __init__(self, width, height):", "        self.width = width", "        self.height = height", "", "    def area(self):", "        return self.width * self.height", "", "for shape in [Square(3), Rectangle(3, 4)]:", "    print(shape.area())"), output: "9\n12", caption: "The loop only relies on every shape having an area method. It works for any new shape that keeps that promise." },
    },
    successMessage: done,
    check: [
      q("What is a contract in this sense?", ["A legal document signed by the team", "A promise about what a part accepts and returns", "A comment at the top of a file"], 1, "A contract states what a part takes in and what it gives back, so other code can rely on it.", "It is a promise about behaviour."),
      q("Why does the loop work for both Square and Rectangle?", ["They share the same class", "They both keep the same promise: they have an area method", "Rectangle inherits from Square"], 1, "The loop only relies on area existing, and both shapes provide it. They do not even need a shared parent.", "What does the loop call on each shape?"),
      q("What can you safely change inside Square?", ["How it works out the area, as long as area still returns the right number", "The name of its area method", "Whether area returns a number or a word"], 0, "Callers depend only on the contract, so the inside is free to change while the promise holds.", "Which change keeps the promise?"),
    ],
  },
];
