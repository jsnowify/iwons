import { applyAuthoredModules } from "./learning-authoring.mjs";
// Structure only. This never authors or marks a lesson ready.
import { writeFileSync, readFileSync } from 'node:fs';
const cp1 = [
 ['Meet the language','The first message|How code runs|Reading a program|The input desk'],
 ['Variables and types','Names and values|Choosing a type|Changing a value|Constants|Converting text'],
 ['Operators','Arithmetic|Division and remainder|Comparisons|Combining expressions'],
 ['Input and output','Reading a line|Reading numbers|Formatting a report|Input boundaries'],
 ['Decisions','One decision|Choosing between paths|Several alternatives|Decision tables'],
 ['While loops','Repeating a task|Stopping safely|Sentinel input|Tracing a loop'],
 ['For loops','Counting repetitions|Traversing values|Nested loops|Break and continue'],
 ['Methods and functions','Naming a task|Parameters and returns|Scope|Values and references'],
 ['Arrays and sequences','Indexed storage|Traversal|Updating sequences|Searching a sequence'],
 ['Strings','Text and characters|Comparing text|Text immutability|Building a report'],
 ['Debugging and tracing','Reading errors|Following state|Finding a boundary bug|Testing an assumption'],
 ['Computer Programming 1 capstone','Plan a receipt desk|Build a shift log|Build a stock counter|Review the three programs'],
];
const cp2 = [
 ['Two-dimensional arrays','Rows and columns|Building independent rows|Traversing a grid|Grid boundaries'],
 ['Classes and objects','Model a desk item|Construct an object|Object identity|Describe an object'],
 ['Encapsulation','Protecting state|Accessors and properties|Class members|Maintaining invariants'],
 ['Object design','Composition|Responsibilities|Working with collaborators|Review a small model'],
 ['Inheritance','Shared behavior|Specializing a class|Calling a parent|Choosing composition'],
 ['Polymorphism and abstraction','One contract many objects|Dispatch|Abstract behavior|Substitution'],
 ['Interfaces and ordering','Behavior contracts|Implementing a contract|Ordering objects|Comparison strategies'],
 ['Exceptions','Failure paths|Handling errors|Custom exceptions|Resource cleanup'],
 ['Collections and generics','Resizable sequences|Maps and sets|Iteration|Generic contracts and type hints'],
 ['Functional style','Functions as values|Transform and filter|Aggregation|Readable pipelines'],
 ['Recursion searching and sorting','Base cases|The call stack|Search strategies|Sorting strategies'],
 ['Files and Computer Programming 2 capstone','Reading files|Writing safely|Plan a lending desk|Build and review the lending desk'],
];
const dsa = [
 ['Thinking in algorithms','A repeatable procedure|Pseudocode|Tracing state|Correctness examples',0],
 ['Big-O and cost','Counting operations|Growth rates|Space costs|Reading constraints',0],
 ['Arrays and strings in depth','Storage and indices|In-place changes|Grid traversal|Text traversal',1],
 ['Hash maps and sets','Hashing and collisions|Frequency tables|Membership and deduplication|Choosing a map',2],
 ['Sorting basics and comparators','Selection sort|Insertion sort|Stability|Custom ordering',2],
 ['Two pointers and sliding window','Opposite pointers|Fast and slow scans|Fixed windows|Variable windows',3],
 ['Prefix sums and difference arrays','Cumulative totals|Range queries|Range updates|Boundary accounting',3],
 ['Stacks queues and deques','Last in first out|First in first out|Double-ended queues|Monotonic stacks',4],
 ['Recursion and divide and conquer','Stack frames|Recursive contracts|Splitting work|Combining results',5],
 ['Merge sort quicksort and binary search','Merge sort|Partitioning|Binary search|Searching an answer',5],
 ['Bit manipulation','Binary representation|Masks|Bit operations|Bit counting',5],
 ['Linked lists','Nodes and links|Insertion and removal|Doubly linked lists|Fast and slow pointers',6],
 ['Trees and BSTs','Tree structure|Depth-first traversals|Breadth-first traversal|Search tree operations',6],
 ['Heaps and priority queues','The heap invariant|Push and pop|Building a heap|Priority scheduling',7],
 ['Graphs','Representations|BFS and grid search|DFS and topological order|Shortest paths',7],
 ['Union-find','Disjoint groups|Finding a representative|Union by size|Path compression',7],
 ['Tries','Prefix nodes|Insert and lookup|Prefix queries|Trie boundaries',7],
 ['Greedy thinking','Local choices|Exchange arguments|Counterexamples|Scheduling decisions',8],
 ['Dynamic programming','Choosing state|Memoization|Tabulation|Two-dimensional tables',8],
 ['Backtracking intervals and the pattern playbook','Decision trees|Undoing choices|Intervals|Choosing a pattern',8],
];
const curriculum = JSON.parse(readFileSync('src/data/curriculum.json','utf8'));
const practice = [
 ['receipt-arithmetic','stamp-gates','ribbon-totals','reset-tallies','digit-workshop'],
 ['receipt-arithmetic','ribbon-totals'],
 ['neighbor-notes','ribbon-runs','positive-trays','drawer-grids','word-slips'],
 ['frequency-files','first-arrivals','shared-drawers','remainder-boxes'],
 ['magnitude-order','insertion-tabs'],
 ['facing-cards','duplicate-carriage','fixed-panels','expanding-panels'],
 ['prefix-stencils','paired-drawers'],
 ['canceling-stamps','taller-keycaps','round-desk','window-pegs','undo-drawer'],
 ['recursive-shelves'],
 ['sorting-press','insertion-tabs','square-gauges'],
 ['bit-ribbons','xor-register'],
 ['chain-inspection','chain-turntable','midpoint-chain'],
 ['branch-notebook','floor-register','catalog-branches'],
 ['priority-basket'],
 ['switchboard-rings','dispatch-order','weighted-lines','island-ledgers'],
 ['cable-families'], ['prefix-cabinet'],
 ['booking-rack','selection-proof'],
 ['tiling-ribbon','postage-drawer','parcel-budget','rising-labels','paid-reservations'],
 ['press-parentheses','roster-proof','booking-rack'],
];
for (const unit of practice.flat()) if (!curriculum.some(problem=>problem.unit===unit)) throw new Error(`Unknown practice unit ${unit}`);

const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
const availability = () => Object.fromEntries(['java','javascript','typescript','python'].map(t=>[t,'planned']));
const course = (id,title,description,rows,recommended) => ({id,title,description,recommended,modules:rows.map(([name,lessons,level],i)=>({
 id:`${id}-m${i+1}`,slug:slug(name),title:name,status:'planned',availability:availability(),
 lessons:lessons.split('|').map((title,j)=>({id:`${id}-m${i+1}-l${j+1}`,slug:slug(title),title,status:'planned',availability:availability(),languages:['en'],variants:{}})),
 practiceUnits: level === undefined ? [] : practice[i],
 ...(id==='dsa' && [11,12,14].includes(i)?{beforeYouStart:'Computer Programming 2 classes and objects are recommended before building nodes. This is advice, not a lock.'}:{}),
 }))});
const manifest = {schemaVersion:2,courses:[
 course('cp1','Computer Programming 1','Structured fundamentals, from your first message to small complete programs.',cp1,'Start here if you are new to coding.'),
 course('cp2','Computer Programming 2','Objects, collections, recursion and thoughtful program design.',cp2,'Computer Programming 1 is recommended; you can explore freely.'),
 course('dsa','Data Structures and Algorithms','Learn the structures and patterns, then practise on the Iwons Path.',dsa,'Computer Programming 1 is recommended. Computer Programming 2 helps with nodes, trees and graphs.'),
]};
const authoredCount=applyAuthoredModules(manifest);
writeFileSync('src/data/foundations.json',JSON.stringify(manifest,null,2)+'\n');
console.log(`Learn structure: 3 courses, 44 modules, ${manifest.courses.reduce((sum,course)=>sum+course.modules.reduce((count,station)=>count+station.lessons.length,0),0)} lessons; ${authoredCount} authored modules restored from seed sources.`);
await import("./prepare-learn-assets.mjs");
