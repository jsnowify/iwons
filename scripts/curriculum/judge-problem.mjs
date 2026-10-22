import fs from "node:fs";

// Original Phase 1A stdin exercise. This module is used by authoring/DB seeding
// only; clients receive the explicit public projection below.
export function judgeDemoProblem() {
  return {
    _id: "server-add-two-numbers", slug: "server-add-two-numbers", title: "Add Two Numbers",
    published: true, format: "stdin", difficulty: "easy",
    description: "Read two whole numbers separated by whitespace. Print their sum on one line. Each number is between -1,000,000 and 1,000,000.",
    starters: {
      java: "import java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner input = new Scanner(System.in);\n    int first = input.nextInt();\n    int second = input.nextInt();\n    // Print the sum of first and second.\n  }\n}\n",
      python: "import sys\n\nfirst, second = map(int, sys.stdin.read().split())\n# Print the sum of first and second.\n",
      javascript: "const fs = require('fs');\nconst [first, second] = fs.readFileSync(0, 'utf8').trim().split(/\\s+/).map(Number);\n// Print the sum of first and second.\n",
    },
    cases: [
      { id: "example-1", stdin: "2 3\n", expected: "5\n", hidden: false },
      { id: "example-2", stdin: "-7 4\n", expected: "-3\n", hidden: false },
      { id: "private-zero", stdin: "0 0\n", expected: "0\n", hidden: true },
      { id: "private-large", stdin: "1000000 999999\n", expected: "1999999\n", hidden: true },
      { id: "private-negative", stdin: "-1000000 -999999\n", expected: "-1999999\n", hidden: true },
    ],
  };
}
export function seedJudgeDemo() {
  const { _id: id, title, description, starters, cases } = judgeDemoProblem();
  fs.writeFileSync("src/data/judge-demo.json", JSON.stringify({ id, title, description, starters,
    cases: cases.filter(item => !item.hidden).map(({ id, stdin, expected }) => ({ id, stdin, expected })) }, null, 2) + "\n");
}
