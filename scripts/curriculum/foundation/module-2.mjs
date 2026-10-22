import { TRIP, L, readAll, readLines, jsNumbers, pyNumbers, q } from "./helpers.mjs";

// Module 2: Data structures and algorithms (topics 15 to 27).
export const lessons = [
  // 15
  {
    id: "arrays-lists", type: "code", title: "Arrays and lists", summary: "Keep many values in order.", topics: ["Arrays"],
    explanation: ["An array (a list in Python) keeps many values in order.", "Each value has a position called an index, and the first index is 0.", "You can read an item by its index, add items, and ask how many there are."],
    exampleOutput: "banana",
    task: "The program reads some numbers. Make it print the last number instead of the first.", expectedOutput: "40",
    cases: [{ stdin: "10 20 30 40\n", expected: "40" }, { stdin: "5 9\n", expected: "9" }, { stdin: "7\n", expected: "7" }],
    successMessage: "You found the last item, whatever the length of the list. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, fruits[1] reads the second item, and fruits.length tells how many items there are.",
        exampleCode: L('const fruits = ["apple", "banana", "cherry"];', "console.log(fruits[1]);"),
        starterCode: L(`const numbers = ${jsNumbers};`, "console.log(numbers[0]);"),
        answerCode: L(`const numbers = ${jsNumbers};`, "console.log(numbers[numbers.length - 1]);"),
        hints: ["The program prints the item at index 0. Which index is the last item?", "The last index is one less than the length: numbers.length - 1.", TRIP + "Counting starts at 0, so the last index is length minus 1. Here is the complete code."],
      },
      python: {
        note: "In Python, fruits[1] reads the second item, len(fruits) tells how many items there are, and fruits[-1] is the last item.",
        exampleCode: L('fruits = ["apple", "banana", "cherry"]', "print(fruits[1])"),
        starterCode: L(`numbers = ${pyNumbers}`, "print(numbers[0])"),
        answerCode: L(`numbers = ${pyNumbers}`, "print(numbers[-1])"),
        hints: ["The program prints the item at index 0. Which index is the last item?", "Python lets you count from the end: numbers[-1] is the last item, or use numbers[len(numbers) - 1].", TRIP + "Counting starts at 0, and -1 counts from the end. Here is the complete code."],
      },
    },
  },
  // 16
  {
    id: "strings-text", type: "code", title: "Strings and text processing", summary: "Search, slice and format text.", topics: ["Strings"],
    explanation: ["A string is text, and each character has an index just like an item in an array.", "You can slice out a piece, search for text inside it, and format it, for example by changing the case.", "Under the hood each character is stored as a number using an encoding such as Unicode."],
    exampleOutput: "ana",
    task: "The program reads a word. Make it print only the first three letters, in capital letters.", expectedOutput: "BAN",
    cases: [{ stdin: "banana\n", expected: "BAN" }, { stdin: "kiwi\n", expected: "KIW" }, { stdin: "ab\n", expected: "AB" }],
    successMessage: "You sliced the word and changed its case. Lesson done; text tools like these are everywhere.",
    languages: {
      javascript: {
        note: "In JavaScript, word.slice(0, 3) takes the first three characters, and word.toUpperCase() changes the case.",
        exampleCode: L('const word = "banana";', "console.log(word.slice(1, 4));"),
        starterCode: L(`const word = ${readAll}.trim();`, "console.log(word.toUpperCase());"),
        answerCode: L(`const word = ${readAll}.trim();`, "console.log(word.slice(0, 3).toUpperCase());"),
        hints: ["The program already makes capital letters. It still prints the whole word.", "Take the first three characters with word.slice(0, 3), then change the case.", TRIP + "slice(0, 3) stops just before index 3, so it keeps three characters. Here is the complete code."],
      },
      python: {
        note: "In Python, word[:3] takes the first three characters, and word.upper() changes the case.",
        exampleCode: L('word = "banana"', "print(word[1:4])"),
        starterCode: L("word = input()", "print(word.upper())"),
        answerCode: L("word = input()", "print(word[:3].upper())"),
        hints: ["The program already makes capital letters. It still prints the whole word.", "Take the first three characters with word[:3], then change the case.", TRIP + "word[:3] stops just before index 3, so it keeps three characters. Here is the complete code."],
      },
    },
  },
  // 17
  {
    id: "stacks-queues", type: "code", title: "Stacks and queues", summary: "Last in first out, and first in first out.", topics: ["Stacks", "Queues"],
    explanation: ["A stack is last in, first out, like a pile of plates where you take from the top.", "A queue is first in, first out, like a line at a shop where you serve the front.", "Both are lists with a rule about which end you add to and which end you take from."],
    exampleOutput: "b",
    task: "The program takes words from the front, like a queue, so they print in the same order. Change it to take from the end, like a stack, so the words print in reverse.", expectedOutput: "c\nb\na",
    cases: [{ stdin: "a b c\n", expected: "c\nb\na" }, { stdin: "one two\n", expected: "two\none" }, { stdin: "x\n", expected: "x" }],
    successMessage: "Taking from the end made it a stack, so the last word in came out first. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, push adds to the end, pop removes from the end, and shift removes from the front.",
        exampleCode: L("const stack = [];", 'stack.push("a");', 'stack.push("b");', "console.log(stack.pop());"),
        starterCode: L(`const words = ${readAll}.trim().split(" ");`, "const stack = [];", "for (const word of words) {", "  stack.push(word);", "}", "while (stack.length > 0) {", "  console.log(stack.shift());", "}"),
        answerCode: L(`const words = ${readAll}.trim().split(" ");`, "const stack = [];", "for (const word of words) {", "  stack.push(word);", "}", "while (stack.length > 0) {", "  console.log(stack.pop());", "}"),
        hints: ["Look at the method inside the while loop. Which end of the list does it take from?", "shift takes from the front. A stack takes from the end, so use pop instead.", TRIP + "A stack adds and removes at the same end. Here is the complete code."],
      },
      python: {
        note: "In Python, append adds to the end, pop() removes from the end, and pop(0) removes from the front.",
        exampleCode: L("stack = []", 'stack.append("a")', 'stack.append("b")', "print(stack.pop())"),
        starterCode: L('words = input().split(" ")', "stack = []", "for word in words:", "    stack.append(word)", "while len(stack) > 0:", "    print(stack.pop(0))"),
        answerCode: L('words = input().split(" ")', "stack = []", "for word in words:", "    stack.append(word)", "while len(stack) > 0:", "    print(stack.pop())"),
        hints: ["Look at the pop call inside the while loop. Which end of the list does it take from?", "pop(0) takes from the front. A stack takes from the end, so use pop() with no number.", TRIP + "A stack adds and removes at the same end. Here is the complete code."],
      },
    },
  },
  // 18
  {
    id: "maps-dictionaries", type: "code", title: "Maps and dictionaries", summary: "Look things up by a key.", topics: ["Maps", "Frequency"],
    explanation: ["A map (a dictionary in Python, an object in JavaScript) stores values under keys, so you can look one up by name.", "Looking up a key is fast, even when the map holds many items.", "Counting is a classic use: each word is a key and its count is the value."],
    exampleOutput: "9",
    task: "The program should count how many times each word appears, then print the count for apple. Right now every count stays at 1. Fix the counting.", expectedOutput: "2",
    cases: [{ stdin: "apple pear apple\n", expected: "2" }, { stdin: "pear pear\n", expected: "0" }, { stdin: "apple apple apple apple\n", expected: "4" }],
    successMessage: "Each word now adds one to its own count. Lesson done; counting with a map shows up everywhere.",
    languages: {
      javascript: {
        note: "In JavaScript, counts[word] reads a key, and (counts[word] || 0) gives 0 when the key is missing.",
        exampleCode: L("const ages = { Ada: 12, Mia: 9 };", 'console.log(ages["Mia"]);'),
        starterCode: L(`const words = ${readAll}.trim().split(" ");`, "const counts = {};", "for (const word of words) {", "  counts[word] = 1;", "}", 'console.log(counts["apple"] || 0);'),
        answerCode: L(`const words = ${readAll}.trim().split(" ");`, "const counts = {};", "for (const word of words) {", "  counts[word] = (counts[word] || 0) + 1;", "}", 'console.log(counts["apple"] || 0);'),
        hints: ["The line inside the loop always stores 1. What should it store instead?", "Add 1 to the count the word already has: (counts[word] || 0) + 1.", TRIP + "A missing key gives undefined, so || 0 makes the first count start from zero. Here is the complete code."],
      },
      python: {
        note: "In Python, counts.get(word, 0) gives 0 when the key is missing.",
        exampleCode: L('ages = {"Ada": 12, "Mia": 9}', 'print(ages["Mia"])'),
        starterCode: L("words = input().split()", "counts = {}", "for word in words:", "    counts[word] = 1", 'print(counts.get("apple", 0))'),
        answerCode: L("words = input().split()", "counts = {}", "for word in words:", "    counts[word] = counts.get(word, 0) + 1", 'print(counts.get("apple", 0))'),
        hints: ["The line inside the loop always stores 1. What should it store instead?", "Add 1 to the count the word already has: counts.get(word, 0) + 1.", TRIP + "get(word, 0) gives 0 for a new word, so the first count starts from zero. Here is the complete code."],
      },
    },
  },
  // 19
  {
    id: "sets", type: "code", title: "Sets", summary: "A collection with no duplicates.", topics: ["Set"],
    explanation: ["A set holds values with no duplicates, and adding a value that is already there changes nothing.", "Checking whether a value is in a set is fast.", "Sets are handy for removing duplicates and for asking whether you have seen something before."],
    exampleOutput: "3",
    task: "The program reads some numbers. Make it print how many different numbers there are, counting each value once.", expectedOutput: "3",
    cases: [{ stdin: "1 2 2 3 3 3\n", expected: "3" }, { stdin: "5 5 5\n", expected: "1" }, { stdin: "4 8\n", expected: "2" }],
    successMessage: "A set keeps each value once, so its size is the number of different values. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, new Set(numbers) removes duplicates, and its size property says how many values remain.",
        exampleCode: L("const seen = new Set([1, 2, 2, 3]);", "console.log(seen.size);"),
        starterCode: L(`const numbers = ${jsNumbers};`, "console.log(numbers.length);"),
        answerCode: L(`const numbers = ${jsNumbers};`, "console.log(new Set(numbers).size);"),
        hints: ["The program counts every item, including repeats. What collection ignores repeats?", "Make a set from the numbers with new Set(numbers) and print its size.", TRIP + "length counts items, but size counts the values left after duplicates are removed. Here is the complete code."],
      },
      python: {
        note: "In Python, set(numbers) removes duplicates, and len(...) says how many values remain.",
        exampleCode: L("seen = set([1, 2, 2, 3])", "print(len(seen))"),
        starterCode: L(`numbers = ${pyNumbers}`, "print(len(numbers))"),
        answerCode: L(`numbers = ${pyNumbers}`, "print(len(set(numbers)))"),
        hints: ["The program counts every item, including repeats. What collection ignores repeats?", "Make a set from the numbers with set(numbers) and print its length.", TRIP + "len of the list counts repeats, but len of the set counts each value once. Here is the complete code."],
      },
    },
  },
  // 20
  {
    id: "linked-lists", type: "code", title: "Linked lists", summary: "Values chained together, one link at a time.", topics: ["Linked"],
    explanation: ["A linked list is a chain of nodes, and each node holds a value and a link to the next node.", "The last node links to nothing (null or None), which is how you know the chain has ended.", "To visit every node you start at the head and keep following the links."],
    exampleOutput: "b",
    task: "The program builds a linked list from the words it reads but only prints the first one. Walk the chain by following next links, and print every value on its own line.", expectedOutput: "1\n2\n3",
    cases: [{ stdin: "1 2 3\n", expected: "1\n2\n3" }, { stdin: "7\n", expected: "7" }, { stdin: "4 5\n", expected: "4\n5" }],
    successMessage: "You followed the links from the head until there were none left. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, a while loop that runs until current is null is the usual way to walk a chain.",
        exampleCode: L("class Node {", "  constructor(value, next = null) {", "    this.value = value;", "    this.next = next;", "  }", "}", 'const head = new Node("a", new Node("b", new Node("c")));', "console.log(head.next.value);"),
        starterCode: L("class Node {", "  constructor(value, next = null) {", "    this.value = value;", "    this.next = next;", "  }", "}", `const values = ${readAll}.trim().split(" ");`, "let head = null;", "for (let i = values.length - 1; i >= 0; i--) {", "  head = new Node(values[i], head);", "}", "let current = head;", "console.log(current.value);"),
        answerCode: L("class Node {", "  constructor(value, next = null) {", "    this.value = value;", "    this.next = next;", "  }", "}", `const values = ${readAll}.trim().split(" ");`, "let head = null;", "for (let i = values.length - 1; i >= 0; i--) {", "  head = new Node(values[i], head);", "}", "let current = head;", "while (current !== null) {", "  console.log(current.value);", "  current = current.next;", "}"),
        hints: ["The last line prints one value and stops. You need a loop.", "Loop while current is not null: print current.value, then move on with current = current.next.", TRIP + "If you forget to move current forward, the loop never ends. Here is the complete code."],
      },
      python: {
        note: "In Python, a while loop that runs until current is None is the usual way to walk a chain.",
        exampleCode: L("class Node:", "    def __init__(self, value, next=None):", "        self.value = value", "        self.next = next", "", 'head = Node("a", Node("b", Node("c")))', "print(head.next.value)"),
        starterCode: L("class Node:", "    def __init__(self, value, next=None):", "        self.value = value", "        self.next = next", "", "values = input().split()", "head = None", "for value in reversed(values):", "    head = Node(value, head)", "current = head", "print(current.value)"),
        answerCode: L("class Node:", "    def __init__(self, value, next=None):", "        self.value = value", "        self.next = next", "", "values = input().split()", "head = None", "for value in reversed(values):", "    head = Node(value, head)", "current = head", "while current is not None:", "    print(current.value)", "    current = current.next"),
        hints: ["The last line prints one value and stops. You need a loop.", "Loop while current is not None: print current.value, then move on with current = current.next.", TRIP + "If you forget to move current forward, the loop never ends. Here is the complete code."],
      },
    },
  },
  // 21
  {
    id: "trees", type: "code", title: "Trees", summary: "Hierarchies, and binary search trees.", topics: ["Trees"],
    explanation: ["A tree is a hierarchy with one root node at the top, and each node can have children below it.", "In a binary tree each node has at most two children, called left and right.", "In a binary search tree smaller values go left and larger values go right, so visiting left, then the node, then right gives the values in sorted order."],
    exampleOutput: "1\n2\n3",
    task: "The program builds a binary search tree from the numbers it reads, but inOrder only prints the root. Make inOrder visit the left side first, then the node, then the right side, so the numbers print in sorted order.", expectedOutput: "1\n3\n4\n5\n8",
    cases: [{ stdin: "5 3 8 1 4\n", expected: "1\n3\n4\n5\n8" }, { stdin: "2 1 3\n", expected: "1\n2\n3" }, { stdin: "9\n", expected: "9" }],
    successMessage: "Left, node, right: the recursion walked the whole tree in sorted order. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, a function that calls itself on node.left and node.right walks the tree one branch at a time.",
        exampleCode: L("class Node {", "  constructor(value) {", "    this.value = value;", "    this.left = null;", "    this.right = null;", "  }", "}", "function insert(node, value) {", "  if (node === null) return new Node(value);", "  if (value < node.value) node.left = insert(node.left, value);", "  else node.right = insert(node.right, value);", "  return node;", "}", "function inOrder(node) {", "  if (node === null) return;", "  inOrder(node.left);", "  console.log(node.value);", "  inOrder(node.right);", "}", "let root = null;", "for (const number of [2, 1, 3]) root = insert(root, number);", "inOrder(root);"),
        starterCode: L("class Node {", "  constructor(value) {", "    this.value = value;", "    this.left = null;", "    this.right = null;", "  }", "}", "function insert(node, value) {", "  if (node === null) return new Node(value);", "  if (value < node.value) node.left = insert(node.left, value);", "  else node.right = insert(node.right, value);", "  return node;", "}", "function inOrder(node) {", "  if (node === null) return;", "  console.log(node.value);", "}", `const numbers = ${jsNumbers};`, "let root = null;", "for (const number of numbers) root = insert(root, number);", "inOrder(root);"),
        answerCode: L("class Node {", "  constructor(value) {", "    this.value = value;", "    this.left = null;", "    this.right = null;", "  }", "}", "function insert(node, value) {", "  if (node === null) return new Node(value);", "  if (value < node.value) node.left = insert(node.left, value);", "  else node.right = insert(node.right, value);", "  return node;", "}", "function inOrder(node) {", "  if (node === null) return;", "  inOrder(node.left);", "  console.log(node.value);", "  inOrder(node.right);", "}", `const numbers = ${jsNumbers};`, "let root = null;", "for (const number of numbers) root = insert(root, number);", "inOrder(root);"),
        hints: ["inOrder prints the node but never looks at its children.", "Call inOrder(node.left) before the console.log line, and inOrder(node.right) after it.", TRIP + "The print sits between the two calls, which is what puts the values in order. Here is the complete code."],
      },
      python: {
        note: "In Python, a function that calls itself on node.left and node.right walks the tree one branch at a time.",
        exampleCode: L("class Node:", "    def __init__(self, value):", "        self.value = value", "        self.left = None", "        self.right = None", "", "def insert(node, value):", "    if node is None:", "        return Node(value)", "    if value < node.value:", "        node.left = insert(node.left, value)", "    else:", "        node.right = insert(node.right, value)", "    return node", "", "def in_order(node):", "    if node is None:", "        return", "    in_order(node.left)", "    print(node.value)", "    in_order(node.right)", "", "root = None", "for number in [2, 1, 3]:", "    root = insert(root, number)", "in_order(root)"),
        starterCode: L("class Node:", "    def __init__(self, value):", "        self.value = value", "        self.left = None", "        self.right = None", "", "def insert(node, value):", "    if node is None:", "        return Node(value)", "    if value < node.value:", "        node.left = insert(node.left, value)", "    else:", "        node.right = insert(node.right, value)", "    return node", "", "def in_order(node):", "    if node is None:", "        return", "    print(node.value)", "", `numbers = ${pyNumbers}`, "root = None", "for number in numbers:", "    root = insert(root, number)", "in_order(root)"),
        answerCode: L("class Node:", "    def __init__(self, value):", "        self.value = value", "        self.left = None", "        self.right = None", "", "def insert(node, value):", "    if node is None:", "        return Node(value)", "    if value < node.value:", "        node.left = insert(node.left, value)", "    else:", "        node.right = insert(node.right, value)", "    return node", "", "def in_order(node):", "    if node is None:", "        return", "    in_order(node.left)", "    print(node.value)", "    in_order(node.right)", "", `numbers = ${pyNumbers}`, "root = None", "for number in numbers:", "    root = insert(root, number)", "in_order(root)"),
        hints: ["in_order prints the node but never looks at its children.", "Call in_order(node.left) before the print line, and in_order(node.right) after it.", TRIP + "The print sits between the two calls, which is what puts the values in order. Here is the complete code."],
      },
    },
  },
  // 22
  {
    id: "graphs", type: "code", title: "Graphs", summary: "Nodes, edges and how to walk them.", topics: ["Graph"],
    explanation: ["A graph is a set of nodes joined by edges, such as people and friendships or cities and roads.", "Traversal means visiting every node you can reach, and breadth-first search visits the nearest nodes first.", "A visited set stops you from going round in circles."],
    exampleOutput: "B C",
    task: "The program starts a breadth-first walk from the node it reads, but never adds any neighbours to the queue. Add each neighbour that has not been visited yet, so every reachable node is printed.", expectedOutput: "A\nB\nC\nD",
    cases: [{ stdin: "A\n", expected: "A\nB\nC\nD" }, { stdin: "B\n", expected: "B\nD" }, { stdin: "D\n", expected: "D" }],
    successMessage: "The queue visited the nearest nodes first, and the visited set kept D from printing twice. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, a Set remembers visited nodes, and an array used as a queue gives the order with push and shift.",
        exampleCode: L('const graph = { A: ["B", "C"], B: ["D"], C: ["D"], D: [] };', 'console.log(graph["A"].join(" "));'),
        starterCode: L('const graph = { A: ["B", "C"], B: ["D"], C: ["D"], D: [] };', `const start = ${readAll}.trim();`, "const visited = new Set([start]);", "const queue = [start];", "while (queue.length > 0) {", "  const node = queue.shift();", "  console.log(node);", "  // add each neighbour that has not been visited yet", "}"),
        answerCode: L('const graph = { A: ["B", "C"], B: ["D"], C: ["D"], D: [] };', `const start = ${readAll}.trim();`, "const visited = new Set([start]);", "const queue = [start];", "while (queue.length > 0) {", "  const node = queue.shift();", "  console.log(node);", "  for (const next of graph[node]) {", "    if (!visited.has(next)) {", "      visited.add(next);", "      queue.push(next);", "    }", "  }", "}"),
        hints: ["Only the start node ever enters the queue. Where should the others come from?", "Loop over graph[node]. For each neighbour not in visited, add it to visited and push it onto the queue.", TRIP + "Mark a node as visited when you queue it, not when you print it, or D would be queued twice. Here is the complete code."],
      },
      python: {
        note: "In Python, a set remembers visited nodes, and a list used as a queue gives the order with append and pop(0).",
        exampleCode: L('graph = {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}', 'print(" ".join(graph["A"]))'),
        starterCode: L('graph = {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}', "start = input()", "visited = {start}", "queue = [start]", "while len(queue) > 0:", "    node = queue.pop(0)", "    print(node)", "    # add each neighbour that has not been visited yet"),
        answerCode: L('graph = {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}', "start = input()", "visited = {start}", "queue = [start]", "while len(queue) > 0:", "    node = queue.pop(0)", "    print(node)", "    for next_node in graph[node]:", "        if next_node not in visited:", "            visited.add(next_node)", "            queue.append(next_node)"),
        hints: ["Only the start node ever enters the queue. Where should the others come from?", "Loop over graph[node]. For each neighbour not in visited, add it to visited and append it to the queue.", TRIP + "Mark a node as visited when you queue it, not when you print it, or D would be queued twice. Here is the complete code."],
      },
    },
  },
  // 23
  {
    id: "searching-algorithms", type: "code", title: "Searching algorithms", summary: "Linear and binary search.", topics: ["Search"],
    explanation: ["Searching means finding where a value is, or finding out that it is missing.", "Linear search checks items one by one, so it can take as many steps as there are items.", "Binary search works on sorted data and halves the search area each step, so it needs only a handful of steps."],
    exampleOutput: "2",
    task: "Finish the binary search. The program reads sorted numbers and a target, and prints the target's index or -1. In each branch, throw away the half that cannot hold the target.", expectedOutput: "3",
    cases: [{ stdin: "1 3 5 7 9\n7\n", expected: "3" }, { stdin: "1 3 5 7 9\n4\n", expected: "-1" }, { stdin: "2 4 6\n4\n", expected: "1" }],
    successMessage: "Each step threw away half of what was left. Lesson done; that is why binary search is so fast.",
    languages: {
      javascript: {
        note: "In JavaScript, Math.floor((low + high) / 2) finds the middle index, and low and high mark the part still being searched.",
        exampleCode: L("const numbers = [4, 8, 15, 16];", "console.log(numbers.indexOf(15));"),
        starterCode: L(`const lines = ${readLines};`, 'const numbers = lines[0].split(" ").map(Number);', "const target = Number(lines[1]);", "let low = 0;", "let high = numbers.length - 1;", "let answer = -1;", "while (low <= high) {", "  const middle = Math.floor((low + high) / 2);", "  if (numbers[middle] === target) {", "    answer = middle;", "    break;", "  } else if (numbers[middle] < target) {", "    // the target can only be in the right half", "  } else {", "    // the target can only be in the left half", "  }", "}", "console.log(answer);"),
        answerCode: L(`const lines = ${readLines};`, 'const numbers = lines[0].split(" ").map(Number);', "const target = Number(lines[1]);", "let low = 0;", "let high = numbers.length - 1;", "let answer = -1;", "while (low <= high) {", "  const middle = Math.floor((low + high) / 2);", "  if (numbers[middle] === target) {", "    answer = middle;", "    break;", "  } else if (numbers[middle] < target) {", "    low = middle + 1;", "  } else {", "    high = middle - 1;", "  }", "}", "console.log(answer);"),
        hints: ["If the middle number is too small, the target is to its right. If it is too big, the target is to its left.", "In the first branch set low = middle + 1, and in the second set high = middle - 1.", TRIP + "The +1 and -1 skip the middle, which you already checked, so the loop always makes progress. Here is the complete code."],
      },
      python: {
        note: "In Python, (low + high) // 2 finds the middle index, and low and high mark the part still being searched.",
        exampleCode: L("numbers = [4, 8, 15, 16]", "print(numbers.index(15))"),
        starterCode: L(`numbers = ${pyNumbers}`, "target = int(input())", "low = 0", "high = len(numbers) - 1", "answer = -1", "while low <= high:", "    middle = (low + high) // 2", "    if numbers[middle] == target:", "        answer = middle", "        break", "    elif numbers[middle] < target:", "        pass  # the target can only be in the right half", "    else:", "        pass  # the target can only be in the left half", "print(answer)"),
        answerCode: L(`numbers = ${pyNumbers}`, "target = int(input())", "low = 0", "high = len(numbers) - 1", "answer = -1", "while low <= high:", "    middle = (low + high) // 2", "    if numbers[middle] == target:", "        answer = middle", "        break", "    elif numbers[middle] < target:", "        low = middle + 1", "    else:", "        high = middle - 1", "print(answer)"),
        hints: ["If the middle number is too small, the target is to its right. If it is too big, the target is to its left.", "Replace the first pass with low = middle + 1, and the second pass with high = middle - 1.", TRIP + "The +1 and -1 skip the middle, which you already checked, so the loop always makes progress. Here is the complete code."],
      },
    },
  },
  // 24
  {
    id: "sorting-algorithms", type: "code", title: "Sorting algorithms", summary: "Bubble, insertion, merge and quick sort.", topics: ["Sorting"],
    explanation: ["Sorting puts items in order, which makes searching and comparing much easier.", "Bubble sort swaps neighbours that are out of order, and insertion sort slides each item into its place.", "Merge sort and quicksort split the work into smaller parts, which is much faster on big lists."],
    exampleOutput: "1 2 3",
    task: "This bubble sort compares neighbours but never swaps them. Add the swap so the numbers print in order, smallest first.", expectedOutput: "1 2 3",
    cases: [{ stdin: "3 1 2\n", expected: "1 2 3" }, { stdin: "5 4 3 2 1\n", expected: "1 2 3 4 5" }, { stdin: "1 2\n", expected: "1 2" }],
    successMessage: "Each pass pushed the biggest remaining number to the end, and the list came out sorted. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, swapping two items needs a temporary variable so neither value is lost.",
        exampleCode: L("const numbers = [3, 1, 2];", "numbers.sort((a, b) => a - b);", 'console.log(numbers.join(" "));'),
        starterCode: L(`const numbers = ${jsNumbers};`, "for (let pass = 0; pass < numbers.length; pass++) {", "  for (let i = 0; i < numbers.length - 1; i++) {", "    if (numbers[i] > numbers[i + 1]) {", "      // swap numbers[i] and numbers[i + 1]", "    }", "  }", "}", 'console.log(numbers.join(" "));'),
        answerCode: L(`const numbers = ${jsNumbers};`, "for (let pass = 0; pass < numbers.length; pass++) {", "  for (let i = 0; i < numbers.length - 1; i++) {", "    if (numbers[i] > numbers[i + 1]) {", "      const temp = numbers[i];", "      numbers[i] = numbers[i + 1];", "      numbers[i + 1] = temp;", "    }", "  }", "}", 'console.log(numbers.join(" "));'),
        hints: ["The if finds neighbours in the wrong order, but its block is empty.", "Swap the two neighbours: save numbers[i] in temp, copy numbers[i + 1] into numbers[i], then put temp into numbers[i + 1].", TRIP + "Without the temporary variable, the first assignment overwrites a value before you saved it. Here is the complete code."],
      },
      python: {
        note: "In Python, a, b = b, a swaps two values in one line.",
        exampleCode: L("numbers = [3, 1, 2]", "numbers.sort()", 'print(" ".join(map(str, numbers)))'),
        starterCode: L(`numbers = ${pyNumbers}`, "for _ in range(len(numbers)):", "    for i in range(len(numbers) - 1):", "        if numbers[i] > numbers[i + 1]:", "            pass  # swap numbers[i] and numbers[i + 1]", 'print(" ".join(map(str, numbers)))'),
        answerCode: L(`numbers = ${pyNumbers}`, "for _ in range(len(numbers)):", "    for i in range(len(numbers) - 1):", "        if numbers[i] > numbers[i + 1]:", "            numbers[i], numbers[i + 1] = numbers[i + 1], numbers[i]", 'print(" ".join(map(str, numbers)))'),
        hints: ["The if finds neighbours in the wrong order, but it does nothing about it.", "Replace the pass with a swap: numbers[i], numbers[i + 1] = numbers[i + 1], numbers[i].", TRIP + "Both sides of the swap are worked out before either assignment happens, so no value is lost. Here is the complete code."],
      },
    },
  },
  // 25
  {
    id: "recursion", type: "code", title: "Recursion", summary: "A function that solves a smaller version of itself.", topics: ["Recursion"],
    explanation: ["Recursion means a function calls itself to solve a smaller version of the same problem.", "Every recursive function needs a base case that stops the calls, and a recursive case that moves toward it.", "Without a base case it would call itself forever."],
    exampleOutput: "3\n2\n1",
    task: "factorial(n) multiplies n by every whole number below it, so factorial(5) is 120. The base case is done, but the recursive case just returns 0. Replace it with a call to factorial on a smaller number.", expectedOutput: "120",
    cases: [{ stdin: "5\n", expected: "120" }, { stdin: "0\n", expected: "1" }, { stdin: "3\n", expected: "6" }],
    successMessage: "Each call handled one number and left the rest to a smaller call. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, a function can call itself by name inside its own body.",
        exampleCode: L("function countdown(n) {", "  if (n === 0) return;", "  console.log(n);", "  countdown(n - 1);", "}", "countdown(3);"),
        starterCode: L("function factorial(n) {", "  if (n === 0) {", "    return 1;", "  }", "  return 0;", "}", `console.log(factorial(Number(${readAll}.trim())));`),
        answerCode: L("function factorial(n) {", "  if (n === 0) {", "    return 1;", "  }", "  return n * factorial(n - 1);", "}", `console.log(factorial(Number(${readAll}.trim())));`),
        hints: ["The recursive case should use the answer for a smaller number.", "factorial(n) is n times factorial(n - 1). Return that.", TRIP + "The base case makes the calls stop, and n - 1 makes each call smaller, so it always reaches the base. Here is the complete code."],
      },
      python: {
        note: "In Python, a function can call itself by name inside its own body.",
        exampleCode: L("def countdown(n):", "    if n == 0:", "        return", "    print(n)", "    countdown(n - 1)", "", "countdown(3)"),
        starterCode: L("def factorial(n):", "    if n == 0:", "        return 1", "    return 0", "", "print(factorial(int(input())))"),
        answerCode: L("def factorial(n):", "    if n == 0:", "        return 1", "    return n * factorial(n - 1)", "", "print(factorial(int(input())))"),
        hints: ["The recursive case should use the answer for a smaller number.", "factorial(n) is n times factorial(n - 1). Return that.", TRIP + "The base case makes the calls stop, and n - 1 makes each call smaller, so it always reaches the base. Here is the complete code."],
      },
    },
  },
  // 26
  {
    id: "algorithmic-complexity", type: "concept", title: "Algorithmic complexity", summary: "Big O: how time and space grow with the input.", topics: [],
    explanation: [
      "Big O describes how the time or memory a program needs grows as its input gets bigger.",
      "O(1) stays the same, O(n) grows in step with the input, and O(n squared) grows much faster, such as a loop inside a loop.",
      "Time is how many steps a program takes, and space is how much extra memory it uses.",
    ],
    illustration: "items       10    1,000    1 million\nO(1)         1        1        1\nO(log n)     4       10       20\nO(n)        10    1,000    1 million\nO(n^2)     100    1 million  too slow",
    illustrationCaption: "How many steps each kind of growth needs as the input gets bigger. O(1) and O(log n) barely change, O(n) grows in step with the input, and O(n squared) quickly becomes far too slow.",
    snippets: {
      javascript: { code: L("const numbers = [1, 2, 3];", "let steps = 0;", "for (const a of numbers) {", "  steps += 1; // one pass: O(n)", "}", "for (const a of numbers) {", "  for (const b of numbers) {", "    steps += 1; // a pass inside a pass: O(n squared)", "  }", "}", "console.log(steps);"), output: "12", caption: "With three items, the single loop takes 3 steps and the nested loops take 9, 12 in all. With a thousand items it would be 1,000 and 1,000,000." },
      python: { code: L("numbers = [1, 2, 3]", "steps = 0", "for a in numbers:", "    steps += 1  # one pass: O(n)", "for a in numbers:", "    for b in numbers:", "        steps += 1  # a pass inside a pass: O(n squared)", "print(steps)"), output: "12", caption: "With three items, the single loop takes 3 steps and the nested loops take 9, 12 in all. With a thousand items it would be 1,000 and 1,000,000." },
    },
    successMessage: "You got them all. Lesson done; Big O gets easier the more programs you read.",
    check: [
      q("Which describes O(n)?", ["The time stays the same however big the input is", "The time grows in step with the size of the input", "The time grows with the square of the input"], 1, "O(n) is linear: double the input and the work roughly doubles. O(1) would stay the same, and O(n squared) would quadruple.", "n is the size of the input, and the work grows in proportion to it."),
      q("A loop inside another loop, each going over all n items, is usually which?", ["O(1)", "O(log n)", "O(n squared)"], 2, "The inner loop runs n times for each of the n outer turns, so about n times n steps. That is why nested loops get slow so fast.", "Count the steps: n turns of the outer loop, each running the inner loop n times."),
      q("Binary search halves the data at each step. How does its time grow?", ["Logarithmically: doubling the data adds only one more step", "Linearly, in step with the data", "It does not depend on the data at all"], 0, "Halving again and again reaches one item in about log n steps, so a million items need only about 20. That is far better than linear.", "Think about how many times you can halve a million before one item is left."),
    ],
  },
  // 27
  {
    id: "problem-solving-techniques", type: "code", title: "Problem-solving techniques", summary: "Decomposition, two pointers, sliding window, divide and conquer.", topics: ["Pointers", "Windows", "Prefix"],
    explanation: ["Problem-solving techniques are reusable ideas: decomposition splits a big problem into small steps, two pointers walk in from both ends, a sliding window moves over a range, and divide and conquer splits the data in half.", "Most of them turn slow repeated work into a single careful pass.", "Naming the technique helps you spot the same shape in a new problem."],
    exampleOutput: "5\n5",
    task: "Use two pointers to check whether any two different numbers in a sorted list add up to the target. Finish the two branches: move the left pointer up when the sum is too small, and the right pointer down when it is too big.", expectedOutput: "yes",
    cases: [{ stdin: "1 2 4 7 11\n9\n", expected: "yes" }, { stdin: "1 2 3\n10\n", expected: "no" }, { stdin: "2 5\n7\n", expected: "yes" }],
    successMessage: "Two pointers closed in from both ends and checked each pair once. Lesson done.",
    languages: {
      javascript: {
        note: "In JavaScript, two index variables, left and right, start at the ends and move toward each other.",
        exampleCode: L("const numbers = [1, 2, 3, 4];", "let left = 0;", "let right = numbers.length - 1;", "while (left < right) {", "  console.log(numbers[left] + numbers[right]);", "  left += 1;", "  right -= 1;", "}"),
        starterCode: L(`const lines = ${readLines};`, 'const numbers = lines[0].split(" ").map(Number);', "const target = Number(lines[1]);", "let left = 0;", "let right = numbers.length - 1;", "let found = false;", "while (left < right) {", "  const sum = numbers[left] + numbers[right];", "  if (sum === target) {", "    found = true;", "    break;", "  } else if (sum < target) {", "    // the sum is too small", "  } else {", "    // the sum is too big", "  }", "}", 'console.log(found ? "yes" : "no");'),
        answerCode: L(`const lines = ${readLines};`, 'const numbers = lines[0].split(" ").map(Number);', "const target = Number(lines[1]);", "let left = 0;", "let right = numbers.length - 1;", "let found = false;", "while (left < right) {", "  const sum = numbers[left] + numbers[right];", "  if (sum === target) {", "    found = true;", "    break;", "  } else if (sum < target) {", "    left += 1;", "  } else {", "    right -= 1;", "  }", "}", 'console.log(found ? "yes" : "no");'),
        hints: ["Since the list is sorted, a bigger left number makes the sum bigger, and a smaller right number makes it smaller.", "Too small: left += 1. Too big: right -= 1.", TRIP + "If neither pointer moves, the loop never ends. Here is the complete code."],
      },
      python: {
        note: "In Python, two index variables, left and right, start at the ends and move toward each other.",
        exampleCode: L("numbers = [1, 2, 3, 4]", "left = 0", "right = len(numbers) - 1", "while left < right:", "    print(numbers[left] + numbers[right])", "    left += 1", "    right -= 1"),
        starterCode: L(`numbers = ${pyNumbers}`, "target = int(input())", "left = 0", "right = len(numbers) - 1", "found = False", "while left < right:", "    total = numbers[left] + numbers[right]", "    if total == target:", "        found = True", "        break", "    elif total < target:", "        pass  # the sum is too small", "    else:", "        pass  # the sum is too big", 'print("yes" if found else "no")'),
        answerCode: L(`numbers = ${pyNumbers}`, "target = int(input())", "left = 0", "right = len(numbers) - 1", "found = False", "while left < right:", "    total = numbers[left] + numbers[right]", "    if total == target:", "        found = True", "        break", "    elif total < target:", "        left += 1", "    else:", "        right -= 1", 'print("yes" if found else "no")'),
        hints: ["Since the list is sorted, a bigger left number makes the sum bigger, and a smaller right number makes it smaller.", "Too small: left += 1. Too big: right -= 1.", TRIP + "If neither pointer moves, the loop never ends. Here is the complete code."],
      },
    },
  },
];
