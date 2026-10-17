// Plain-language teaching rules shared by all 54 units. No algorithm or test logic lives here.
export const plainRules = {
 arithmetic: 'For each number x in readings, multiply x by 2, then add 3. Put each answer in the result list. Keep the original order. For example, 4 becomes 11, and -2 becomes -1.',
 gates: 'Read readings from left to right. Change each number below 0 to 0. Keep every other number as it is. Put the numbers in the result list in the same order.',
 prefix: 'Start a total at 0. Read readings from left to right. Add each number to the total, then put the new total in the result list. For [2, 3, -1], the result list is [2, 5, 4].',
 reset: 'Start a total at 0. Read readings from left to right. If the next number is 0, reset the total to 0. Otherwise, add that number to the total. Put the total in the result list after each number.',
 digits: 'Find the digit sum of each number in readings. Ignore a minus sign, then add the digits. For example, -305 gives 3 + 0 + 5 = 8. The digit sum of 0 is 0. Keep the answers in input order.',
 differences: 'Start at the second number in readings. Subtract the number just before it from the current number. Repeat for each later number. Put the answers in order. For [5, 8, 2], the result list is [3, -6]. A list with fewer than two numbers gives an empty result list.',
 runs: 'A run is a group of matching characters next to each other. End a run only when the character changes or the text ends. Record the length of each run, from left to right. Spaces count as characters too. For "aa bb", the result list is [2, 1, 2].',
 filter: 'Keep only numbers greater than 0 from readings. Put them in the result list in their original order. Keep repeated numbers. Leave out 0 and negative numbers.',
 rows: 'drawers is a list of rows. Add the numbers in each row. Put one total per row in the result list, in row order. An empty row has a total of 0.',
 words: 'Read line from left to right. Here, a word is a group of characters with no spaces inside it. Record the length of each word. Ignore extra spaces before, after, or between words. For "a  cat", the result list is [1, 3].',
 frequency: 'Count how many times each different number appears in readings. Sort the different numbers from smallest to largest. Put their counts in that order in the result list. For [5, 2, 5], the numbers are 2 and 5, so the result list is [1, 2].',
 unique: 'Keep the first copy of each number in readings. Skip any later copies of the same number. Keep the order in which the numbers first appear. For [4, 2, 4, 3, 2], the result list is [4, 2, 3].',
 intersection: 'drawers contains two lists of numbers. Find the numbers that appear in both lists. Put each matching number in the result list only once. Sort the result list from smallest to largest.',
 residues: 'There are five boxes, numbered 0 to 4. For each number x in readings, find its box with ((x % 5) + 5) % 5. The % symbol means remainder. This formula also gives a box for negative numbers: -1 goes in box 4. Count the numbers in each box. The result list must contain five counts, in box order 0, 1, 2, 3, 4.',
 absoluteSort: 'Sort readings by distance from 0, from nearest to farthest. This distance is called absolute value: both -4 and 4 have distance 4. When two numbers have the same distance, put the smaller number first. Keep all repeated numbers. For [3, -2, 2, -3], the result list is [-2, 2, -3, 3].',
 mirror: 'readings is already sorted from smallest to largest. Pair its first and last numbers, then its second and second-last numbers. Keep moving toward the middle. Add the two numbers in each pair and record that sum. If one middle number is left, record it by itself. Keep this pair order in the result list.',
 compact: 'readings is already sorted from smallest to largest. Keep only one copy of each number. Put these numbers in the result list in sorted order.',
 windowSum: 'A window is a group of numbers next to each other. Take each window of exactly k numbers in readings, moving one place right each time. Record each window sum from left to right. If the whole input has fewer than k numbers, the result list is empty.',
 shortWindow: 'All numbers in readings are 0 or greater. For each position, find the shortest group that ends at that position and has a sum of at least k. The group must contain at least one number, and its numbers must be next to each other. Record the length of that group. Record 0 if no such group exists. Put one answer per position in the result list.',
 prefixRanges: 'For each position in readings, add the current number and up to k - 1 numbers just before it. Stop at the start of the input if needed. Record each sum, from left to right. For readings = [2, 3, 4] and k = 2, the result list is [2, 5, 7].',
 merge: 'drawers contains two lists, each already sorted from smallest to largest. Combine their numbers into one sorted result list. Keep all repeated numbers, including copies from both input lists.',
 cancel: 'Treat readings as a row of stamps. Keep a stack, which is a pile where you can add or remove only the top stamp. Read the stamps from left to right. If the next stamp matches the top stamp, remove the top stamp and do not add the new one. Otherwise, put the new stamp on top. The result list is the final stack, from bottom to top.',
 greater: 'For each number in readings, look to its right. Find the first number that is larger, not equal. Record how many places to the right it is. Record 0 if no larger number is found. Keep the answers in input order.',
 roundRobin: 'Each number in readings is the work time needed by a job. All jobs are ready at time 0, in input order. The worker gives the first job up to k time units. If it still needs work, put it at the back of the line. Then serve the next job. Record when each job finishes, measured from time 0. Return these finish times in original job order. A job needing 0 time finishes at time 0 and uses no worker time.',
 windowMax: 'Take every group of exactly k numbers next to each other in readings. Move the group one place right each time. Record the largest number in each group, from left to right. If k is larger than the input length, the result list is empty.',
 undo: 'Use a stack, which is a pile where you add and remove items only at the top. Read readings from left to right. A number of 0 or more adds that number to the top. A negative number tells you how many top items to remove: -3 means remove up to three items. Stop if the stack becomes empty. The result list is the final stack, from bottom to top.',
 recursive: 'Start with the whole readings list as a section. Record the sum of that section. If it has more than one number, split it into a left half and a right half. Use the same steps on the left half first, then on the right half. When a section has an odd length, the left half has one fewer number. A section with one number is not split. Do not record empty sections. The result list contains the sums in the order you record them.',
 mergeSort: 'Sort readings from smallest to largest using merge sort. To use merge sort, split the list into smaller parts, sort those parts, then join the sorted parts in order. Keep all repeated numbers. The result list is the sorted list.',
 lowerBound: 'drawers contains two rows: a sorted number list, then a list of queries. Each query is a number to look up. For each query, find the first position in the sorted list whose number is at least the query. Positions, also called indexes, start at 0. If no number is large enough, record the length of the sorted list. Put the answers in query order.',
 sqrt: 'For each number x in readings, find the largest whole number r whose square is at most x. A square means a number multiplied by itself. For example, x = 10 gives 3, because 3 * 3 = 9 but 4 * 4 = 16. Use whole-number comparisons, not rounded decimal square roots. Keep the answers in input order.',
 bits: 'Write each number in readings in binary, the number system that uses only 0 and 1. Count the 1s in that form. For example, 5 is 101 in binary, so its count is 2. The count for 0 is 0. Put the counts in input order.',
 xor: 'Start a stored number at 0. Read readings from left to right. Combine the stored number and the next number with bitwise XOR. XOR compares their binary digits: matching digits give 0, and different digits give 1. Use leading zeros when needed. For example, 3 XOR 5 is 6 because 011 XOR 101 gives 110. Record the stored number after each update.',
 list: 'head is the first node of a linked list. A node holds a number in val and a link to the next node in next. Follow next until there are no more nodes. Record each val in order. The list has no loops. An empty list gives an empty result list.',
 reverseList: 'Reverse the links in the linked list given by head. Each node has a number in val and a link in next. After the links are reversed, follow the new list from start to end. Record its values in that order. An empty list gives an empty result list.',
 middleList: 'Find the middle node of the linked list given by head. Each node stores a number in val and a link in next. Use two pointers: one moves one link at a time, and the other moves two. If there are two middle nodes, choose the second one. Record the values from that middle node to the end. An empty list gives an empty result list.',
 treeDfs: 'A binary tree is a set of nodes, each with a value and up to two children: left and right. root is the top node. Visit a node by recording its value, then visit its whole left branch, then its whole right branch. Use this same rule at every node. Skip missing children. The result list is the recorded values. An empty tree gives an empty result list.',
 treeBfs: 'root is the top node of a binary tree. Each node has a value and up to two children. The root is at depth 0, its children are at depth 1, and so on. Add the values at each depth. Put one sum per depth in the result list, starting at depth 0. Missing children add nothing. An empty tree gives an empty result list.',
 bst: 'root is a binary search tree with no repeated values. In this tree, all values in a left branch are smaller than its parent, and all values in a right branch are larger. Find values from k through k + 12, including both ends. Put them in the result list from smallest to largest. Skip branches whose values cannot be in this range. An empty tree gives an empty result list.',
 bfs: 'A graph is a set of points joined by paths. Here, paths go in one direction. Start at point 0. For each point, find the fewest paths you must follow to reach it. Record these distances in point order: 0, 1, 2, and so on. The distance to point 0 is 0. Record -1 for a point you cannot reach. A graph with no points gives an empty result list.',
 topo: 'Each point in this graph is a task. A path from task a to task b means a must happen before b. Put all tasks with no paths coming into them in a queue, in number order. A queue serves the task at its front first. Remove that task, record its number, and remove its outgoing paths. Check its next tasks in number order. Add a task to the back of the queue as soon as it has no paths left coming in. If you cannot record every task, the rules contain a loop: use an empty result list instead.',
 dijkstra: 'Each point in this graph is a place, and each one-way path has a travel cost. Start at point 0. Find the lowest total travel cost to each point. Put these costs in point order. The cost to point 0 is 0. Record -1 for any point you cannot reach. A graph with no points gives an empty result list.',
 heap: 'Put all numbers from readings into a min-heap. A min-heap is a tree-shaped collection that keeps its smallest number at the top. Remove the smallest number, record it, and repeat until the heap is empty. Keep repeated numbers. The result list is the removal order.',
 union: 'This graph has two-way links between points. Points belong to the same group if you can travel between them, even through other points. Use union-find: start with one group per point, then join groups when a link connects them. For each point, count all points in its group, including itself. Record these counts in point order. A link from a point to itself does not make a larger group. A graph with no points gives an empty result list.',
 trie: 'A prefix is the start of a word. For example, "c", "ca", and "cat" are the prefixes with at least one letter of "cat". For each word in words, look at all its prefixes with at least one letter. Count how many input words start with each prefix, then add those counts. Count repeated input words separately, and include the word itself. Put one total per word in the result list, in input order.',
 components: 'This graph has two-way links between points. A group, also called a connected component, contains all points that can reach one another. Start at point 0, then check the other points in number order. Whenever a point has not been visited, explore its whole group depth first: follow a path as far as you can before going back. Record how many points are in that group. The result list follows the order in which you first find the groups. A graph with no points gives an empty result list.',
 intervalGreedy: 'Each booking is [start, end]. It uses time from start up to, but not including, end. Sort bookings by end time, from earliest to latest. For matching end times, put the earlier start first. Accept the first booking. Then accept a booking only if it starts at or after the end of the last one accepted. Record the length, end - start, of each accepted booking. Keep acceptance order. Negative times are allowed. With no bookings, the result list is empty.',
 tiling: 'Each number x in readings is the width of a one-row strip. Fill it exactly using pieces of width 1 or 3. Count the different orders of pieces that work. For width 4, the orders are [1,1,1,1], [1,3], and [3,1], so the count is 3. Width 0 has one way: use no pieces. Record one count per input width, in order.',
 coins: 'Each number in readings is an amount of postage. You can use as many stamps of value 1, 4, or 9 as you need. Find the fewest stamps whose values add up to each amount exactly. For amount 8, two stamps of value 4 are enough. Amount 0 needs 0 stamps. Put the answers in input order.',
 knapsack: 'Each row of drawers is a parcel: [weight, value]. The weight is positive, and the value is 0 or more. A bag can hold a total weight up to its capacity. For every capacity from 0 through k, find the largest total value you can pack. You may use each parcel at most once. You may leave parcels out. Put one answer per capacity in the result list, including capacity 0.',
 lis: 'A subsequence keeps numbers in their original order but may skip some numbers. For each position in readings, find the longest strictly increasing subsequence that ends at that position. Strictly increasing means each next number must be larger; equal numbers do not count as an increase. Record the length, not the chosen numbers. Put one length per position in the result list.',
 matrixChain: 'readings lists matrix sizes. A matrix is a table of numbers with rows and columns. Matrix 0 has readings[0] rows and readings[1] columns. Matrix 1 has readings[1] rows and readings[2] columns, and so on. Multiplying an a-by-b matrix by a b-by-c matrix costs a * b * c number multiplications. You may group the matrices with brackets, but must keep their order. Different groups can have different costs. For the first matrix alone, record 0. Then record the least total cost for the first two matrices, the first three, and so on. Fewer than two size numbers means there are no matrices, so the result list is empty.',
 subsets: 'Choose any positions from readings, or choose none. Add the numbers at those positions. List every different total you can make, from smallest to largest. Choosing no positions gives a total of 0. Each position can be chosen at most once. Equal numbers at different positions are separate choices, but each total appears only once in the result list.',
 assignments: 'There are n desks and n clerks, both numbered from 0. Here, n is the length of readings. Each number in readings is a permission mask for one desk. A mask uses binary digits. Each digit is called a bit: a 1 in bit c allows clerk c to use that desk. Bit 0 is the rightmost digit. Assign exactly one clerk to each desk, with no clerk used twice. Follow every permission mask. For each clerk c, count the complete assignments where clerk c gets desk 0. Put those counts in clerk order. A forbidden first choice has count 0. With no desks, the result list is empty.',
 weightedIntervals: 'Each row of drawers is a booking: [start, end, reward]. It uses time from start up to, but not including, end. A booking may start exactly when another one ends. Sort the bookings by end time, then start time, then reward, all from smallest to largest. Look at the first booking, then the first two bookings, and so on. For each of these groups, choose bookings that do not overlap and give the largest total reward. Record that reward. You may choose no bookings for a reward of 0. With no bookings, the result list is empty.',
};
export const plainTasks = [
 'Return the whole result list in the order you built it. If it is empty, return [].',
 'Add all numbers in the result list. Return the total. An empty list has a total of 0.',
 'Count the numbers in the result list that are at least k (greater than or equal to k). Return that count. An empty list gives 0.',
 'Read the result list from left to right. Return the first number that is at least k (greater than or equal to k). Return the number, not its position. If none matches, return -1.',
 'Return the largest number in the result list. If the list is empty, return 0. If all numbers are negative, return the largest negative number; do not replace it with 0.',
 'Return the smallest number in the result list. If the list is empty, return 0.',
 'Count the even numbers in the result list. An even number divides by 2 with no remainder. Count 0 and negative even numbers too. Return the count. An empty list gives 0.',
 'Add only numbers greater than 0 from the result list. Do not add 0 or negative numbers. Return the total, or 0 if no numbers match.',
 'Return only numbers greater than 0 from the result list. Keep their order and any repeated numbers. If none matches, return [].',
 'Multiply the first number in the result list by 1, the second by 2, the third by 3, and so on. Add these products and return the total. An empty list gives 0.',
];

const kKernels=new Set(['windowSum','shortWindow','prefixRanges','windowMax','roundRobin','bst','knapsack']);
export function inputHelp(kernel,name) {
 const family=kernel.family;
 const help={
  text:`${name} is text. A character is one letter, digit, space, or punctuation mark.`,
  words:`${name} is a list of words.`,
  list:`${name} is the first node of a linked list. In examples, [4, 7] means nodes 4 then 7, linked in that order. [] means no nodes. The runner builds the nodes for you.`,
  tree:`${name} is the top node of a binary tree. Examples list nodes one level at a time, from left to right. null marks a missing child; [] means no tree. Each node stores its number in val. Its left and right links point to children. The runner builds the nodes for you.`,
  bst:`${name} is the top node of a binary search tree. Examples list nodes one level at a time, from left to right. null marks a missing child; [] means no tree. Each node stores its number in val. Its left and right links point to children. The runner builds the nodes for you.`,
  pair:`${name} contains exactly two lists of numbers. The first list is ${name}[0]; the second is ${name}[1].`,
  queries:`${name} contains exactly two lists: the sorted numbers in ${name}[0], then the query numbers in ${name}[1].`,
  matrix:`${name} is a list of rows. Each row is a list of numbers and may be empty.`,
  graph:`${name} is a square table of 0s and 1s. Points are numbered from 0. A 1 at ${name}[a][b] means a one-way path goes from point a to point b. A 0 means no path.`,
  weightedGraph:`${name} is a square table of travel costs. Points are numbered from 0. A positive number at ${name}[a][b] is the cost to go from point a to point b. A 0 means no path, not a free path.`,
  undirected:`${name} is a square table of 0s and 1s. Points are numbered from 0. A 1 at ${name}[a][b] joins points a and b in both directions. A 0 means no link.`,
  intervals:`${name} is a list of bookings. Each row is [start, end].`,
  reservations:`${name} is a list of bookings. Each row is [start, end, reward].`,
  items:`${name} is a list of parcels. Each row is [weight, value].`,
  dimensions:`${name} is a list of positive whole numbers that describe matrix sizes.`,
  masks:`${name} is a list of permission masks, one per desk. A mask is a whole number whose binary digits show which clerks are allowed.`,
 };
 return help[family]??`${name} is a list of integers (numbers with no decimal part). It may be empty, and numbers may repeat unless Step 1 says otherwise.`;
}
const show=value=>JSON.stringify(value);
export function explainResult(sequence,expected,mode,k) {
 const prefix=`Step 1 gives the result list ${show(sequence)}.`;
 const matches=sequence.filter(x=>x>=k),positive=sequence.filter(x=>x>0),even=sequence.filter(x=>x%2===0);
 const actions=[
  `Step 2 asks for that whole list, so return ${show(expected)}.`,
  `Add its numbers to get ${expected}. Return ${expected}.`,
  `Here k = ${k}. The numbers at least ${k} are ${show(matches)}. There are ${expected}, so return ${expected}.`,
  matches.length?`Here k = ${k}. The first number at least ${k} is ${expected}. Return that value.`:`Here k = ${k}. No number is at least ${k}, so return -1.`,
  sequence.length?`The largest number is ${expected}. Return ${expected}.`:'The list is empty, so return 0.',
  sequence.length?`The smallest number is ${expected}. Return ${expected}.`:'The list is empty, so return 0.',
  `The even numbers are ${show(even)}. There are ${expected}, so return ${expected}.`,
  `Keep ${show(positive)} and add those numbers. Return ${expected}.`,
  `Keep only numbers greater than 0, without changing their order. Return ${show(expected)}.`,
  sequence.length?`Multiply by positions that start at 1: ${sequence.map((x,i)=>`${i+1} * (${x})`).join(' + ')} = ${expected}. Return ${expected}.`:'There are no numbers to multiply or add, so return 0.',
 ];
 return `${prefix} ${actions[mode]}`;
}
function plainConstraint(text) {
 return text.replace(/Numeric readings lie between -1,000,000 and 1,000,000, subject to the task's shape and ordering rules\./,'Input numbers have no decimal part. They range from -1,000,000 to 1,000,000. Follow any extra input rules in Step 1.')
  .replace('1 <= k <= 8. All arithmetic results fit a signed 32-bit integer.','k is a whole number from 1 to 8. Answers fit in a signed 32-bit integer: -2,147,483,648 through 2,147,483,647.')
  .replace('The line contains ASCII characters; the only word separator is a space.','The text uses ASCII characters (a basic character set). Only an ordinary space separates words.')
  .replace('Readings are integers from','Input numbers are whole numbers from')
  .replace('Lists are acyclic. Trees use level-order JSON with null for missing children; [] is an empty root. The runner supplies nodes with val/next or val/left/right.','Linked lists do not loop back to an earlier node. Tree examples list nodes by level; null means a missing child. The runner builds the nodes shown in the examples.')
  .replace('The adjacency matrix is square and has at most 16 vertices; binary entries are 0 or 1, weighted entries are 0 through 13.','The graph has at most 16 points. Its table has the same number of rows and columns. Link entries are 0 or 1; cost entries are 0 through 13.')
  .replace('There are at most 6 desks. Every mask is between 0 and (1 << n) - 1.','There are at most 6 desks. Each permission mask is from 0 to 2 to the power n, minus 1, where n is the number of desks. For n = 3, masks range from 0 to 7.')
  .replace('JSON null placeholders do not count as nodes.','null marks a missing child and does not count as a node.');
}
export function rewriteProblem(p,{unit,kernel,mode,input,sequences}) {
 const usesK=kKernels.has(unit.kernel)||mode===2||mode===3;
 const kHelp=usesK?'k is a whole number. Use it as described in the steps below.':'k is included in the function call, but this task does not use it. You can ignore it.';
 const glossary={n:'n is the input length',d:'d is the number of different values',q:'q is the number of queries',M:'M is the largest input number',V:'V is the number of graph points',E:'E is the number of graph links',h:'h is the longest root-to-leaf path in the tree; a leaf is a node with no children',r:'r is the number of tree values found',total:'total is all job work time added together'};
 if(kernel.family==='queries')glossary.n='n is the length of the sorted number list';
 if(kernel.family==='pair')glossary.n='n is the combined length of the two lists';
 if(['tree','bst','list'].includes(kernel.family))glossary.n='n is the number of nodes';
 if(unit.kernel==='trie')glossary.total='total characters means all word lengths added together';
 const symbols=Object.entries(glossary).filter(([symbol])=>new RegExp(`\\b${symbol}\\b`).test(`${unit.time} ${unit.space}`)).map(([,meaning])=>meaning);
 const efficiency=`Efficiency goal: time ${unit.time}; extra memory, including the result list, ${unit.space}. ${symbols.length?symbols.join('; ')+'. ':''}These labels describe how work and memory grow with the input.`;
 const intro=`${unit.definition} Each card first builds this result list, then asks for a different answer. Start with the first card. The last card also uses position numbers that start at 1.`;
 return {...p,parameterNames:[input.name,'k'],summary:`${unit.idea}. ${plainTasks[mode].split('. ')[0].replace(/\.$/,'')}.`,descriptionMd:[
  'Your task\nBuild a result list using Step 1. Then use that list to find the answer in Step 2.',
  `Inputs\n${inputHelp(kernel,input.name)} ${kHelp}`,
  `Step 1: Build the result list\n${unit.definition}`,
  `Step 2: Return the answer\n${plainTasks[mode]}`,
  `Write your function\nComplete ${p.functionName}(${input.name}, k). Return the answer from Step 2. Do not print it or read keyboard input. In examples, positions (indexes) start at 0 unless a rule says otherwise.`,
 ].join('\n\n'),unitIntro:intro,constraints:[...p.constraints.filter(text=>!text.startsWith('Target time')).map(plainConstraint),efficiency],
 hints:[`Try a small example by hand. Follow Step 1 and write down its result list.`,`${unit.definition} Keep track of the numbers or places you have already checked.`,`${plainTasks[mode]} Check what to do if the result list is empty.`],
 overview:`The two steps ask different things: first build a list, then return the answer requested. Follow the order, keep repeated values when required, and check the empty case.`,
 starterCode:Object.fromEntries(Object.entries(p.starterCode).map(([language,code])=>[language,code.replaceAll('Derive the sequence, then compute the requested receipt.','Build the result list, then return the answer from Step 2.')])),
 cases:p.cases.map((c,i)=>({...c,explanation:explainResult(sequences[i],c.expected,mode,c.input[1])})),
 workedExamples:p.workedExamples.map((c,i)=>({...c,explanation:explainResult(sequences[i],c.expected,mode,c.input[1])})),
 privateData:{...p.privateData,editorialMd:`Build the result list\n\n${unit.definition}\n\nReturn the answer\n\n${plainTasks[mode]}\n\nWhy this works\n\nEach value in the result list follows Step 1. Step 2 uses only those values. Keeping these steps separate helps avoid returning the list when the question asks for one number. Check empty input, one item, repeated values, and the largest allowed input.\n\n${efficiency}\n\n${Object.entries(p.referenceSolutions).map(([language,code])=>`${language}\n${code}`).join('\n\n')}`},
 };
}
