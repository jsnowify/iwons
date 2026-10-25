// Guided task wording. Every problem names one helper list for the learner to build first.
// These names are guidance only: the judge checks the returned value, never the learner's variables.
export const listNames = {
 arithmetic:'adjusted', gates:'clamped', prefix:'runningTotals', reset:'tallies', digits:'digitSums',
 differences:'differences', runs:'runLengths', filter:'kept', rows:'rowTotals', words:'wordLengths',
 frequency:'counts', unique:'firstCopies', intersection:'shared', residues:'boxCounts', absoluteSort:'byDistance',
 mirror:'pairSums', compact:'distinctSorted', windowSum:'windowSums', shortWindow:'shortestLengths', prefixRanges:'rangeSums',
 merge:'merged', cancel:'remaining', greater:'stepsToTaller', roundRobin:'finishTimes', windowMax:'windowMaxes',
 undo:'stack', recursive:'sectionSums', mergeSort:'sorted', lowerBound:'positions', sqrt:'roots',
 bits:'oneCounts', xor:'xorValues', list:'values', reverseList:'reversedValues', middleList:'middleValues',
 treeDfs:'visitOrder', treeBfs:'levelSums', bst:'foundValues', bfs:'distances', topo:'taskOrder',
 dijkstra:'costs', heap:'removalOrder', union:'groupSizes', trie:'prefixTotals', components:'componentSizes',
 intervalGreedy:'acceptedLengths', tiling:'tilingCounts', coins:'fewestStamps', knapsack:'bestValues', lis:'risingLengths',
 matrixChain:'leastCosts', subsets:'subsetTotals', assignments:'clerkCounts', weightedIntervals:'bestRewards',
};
const code = name => `\`${name}\``;
// Second-step tasks. Each mode returns a named answer built from the helper list.
// traits says what the helper list can actually hold, so rules that can never apply are left out.
export function modeTasks(mode, list, traits = { canEmpty: true, canNegative: true, canZero: true, canRepeat: true, canAllNegative: true, canNegativeEven: true }) {
 const L = code(list), { canEmpty, canNegative, canZero, canRepeat, canAllNegative, canNegativeEven } = traits;
 const when = (condition, text) => condition ? [text] : [];
 const nonPositive = canZero && canNegative ? '0 and negative numbers' : canZero ? 'zeros' : 'negative numbers';
 return [
  { steps: [], answer: list, rules: when(canEmpty, `If ${L} is empty, return [].`), summary: 'Return the whole list' },
  { steps: [`Add up every number in ${L}. Store the sum in ${code('total')}.`], answer: 'total', rules: when(canEmpty, `If ${L} is empty, ${code('total')} is 0.`), summary: 'Return the total' },
  { steps: [`Count the numbers in ${L} that are at least ${code('k')} (greater than or equal to ${code('k')}). Store the count in ${code('atLeastK')}.`], answer: 'atLeastK', rules: when(canEmpty, `If ${L} is empty, the count is 0.`), summary: 'Count the numbers at least k' },
  { steps: [`Read ${L} from left to right. Find the first number that is at least ${code('k')} and store that number, not its position, in ${code('firstMatch')}.`], answer: 'firstMatch', rules: [`If no number is at least ${code('k')}, return -1.`], summary: 'Find the first number at least k' },
  { steps: [`Find the largest number in ${L}. Store it in ${code('largest')}.`], answer: 'largest', rules: [...when(canEmpty, `If ${L} is empty, return 0.`), ...when(canAllNegative, 'If every number is negative, return the largest negative number. Do not replace it with 0.')], summary: 'Return the largest number' },
  { steps: [`Find the smallest number in ${L}. Store it in ${code('smallest')}.`], answer: 'smallest', rules: when(canEmpty, `If ${L} is empty, return 0.`), summary: 'Return the smallest number' },
  { steps: [`Count the even numbers in ${L}. Store the count in ${code('evenCount')}. A number is even when it divides by 2 with no remainder.`], answer: 'evenCount', rules: [...when(canZero && canNegativeEven, '0 and negative even numbers count too.'), ...when(canZero && !canNegativeEven, '0 counts as an even number.'), ...when(canNegativeEven && !canZero, 'Negative even numbers count too.'), ...when(canEmpty, `If ${L} is empty, return 0.`)], summary: 'Count the even numbers' },
  { steps: [`Add only the numbers in ${L} that are greater than 0. Store the sum in ${code('positiveTotal')}.`], answer: 'positiveTotal', rules: canZero || canNegative ? [`Skip ${nonPositive}.`, 'If no number is greater than 0, return 0.'] : when(canEmpty, `If ${L} is empty, return 0.`), summary: 'Add the positive numbers' },
  { steps: [`Create a list ${code('positiveValues')} that keeps only the numbers in ${L} that are greater than 0, in the same order.`], answer: 'positiveValues', rules: [...when(canRepeat, 'Keep repeated numbers.'), ...(canZero || canNegative ? ['If no number is greater than 0, return [].'] : when(canEmpty, `If ${L} is empty, return [].`))], summary: 'Keep the positive numbers' },
  { steps: [`Multiply each number in ${L} by its position, counting from 1: the first number by 1, the second by 2, and so on.`, `Add those products. Store the sum in ${code('weightedTotal')}.`], answer: 'weightedTotal', rules: when(canEmpty, `If ${L} is empty, return 0.`), summary: 'Return the position-weighted total' },
 ][mode];
}
// One line on what k means for a problem that keeps it.
const kRoles = { windowSum: 'the window size in task 1', shortWindow: 'the sum each group in task 1 must reach', prefixRanges: 'the most numbers each sum in task 1 may include', windowMax: 'the window size in task 1', roundRobin: 'the most time units a job gets in one turn', bst: 'the lowest value to find in task 1; the range ends at `k` + 12', knapsack: 'the largest bag capacity to check in task 1' };
export function kNote(kernelName, mode) {
 const role = kRoles[kernelName], threshold = mode === 2 || mode === 3;
 if (role && threshold) return `${code('k')} (a whole number from 1 to 8) is ${role}, and also the threshold in task 2.`;
 if (role) return `${code('k')} (a whole number from 1 to 8) is ${role}.`;
 return `${code('k')} (a whole number from 1 to 8) is the threshold in task 2: compare each number with it.`;
}
// Puts the learner's names in backticks and names the helper list instead of "the result list".
export function guidedRule(rule, list, inputName) {
 return rule
  .replace(/\b(an|a) empty result list\b/g, `an empty ${code(list)}`)
  .replace(/\b[Tt]he result list\b/g, code(list))
  .replace(/\bresult list\b/g, code(list))
  .replace(new RegExp(`(^|[^\\w\`])(${inputName})((?:\\[\\d+\\])?)(?![\\w\`])`, 'g'), (_, before, name, index) => `${before}\`${name}${index}\``)
  .replace(/(^|[^\w`])k(?![\w`])/g, (_, before) => `${before}${code('k')}`)
  .replace(/\bReturn these\b/g, 'Record these');
}
