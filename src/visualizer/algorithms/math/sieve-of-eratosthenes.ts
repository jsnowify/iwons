/**
 * Sieve of Eratosthenes - Engine 3 (Grid & Table)
 */

import { AlgoDefinition, GridTableStep, GridCell, GridCellMark } from '../../core/types';

export const sieveOfEratosthenesDefinition: AlgoDefinition<number[]> = {
  id: 'sieve-of-eratosthenes',
  name: 'Sieve of Eratosthenes',
  category: 'math',
  engine: 'grid-table',
  complexity: {
    best: 'O(n log log n)',
    average: 'O(n log log n)',
    worst: 'O(n log log n)',
    space: 'O(n)',
  },
  inputKind: 'numbers',
  blurb: 'Identifies all prime numbers up to N by iteratively marking the multiples of each discovered prime starting from 2. Multiples are crossed out on the 6×6 grid.',
  pseudocode: [
    'procedure sieve(n):',
    '  isPrime = array of true from 2 to n',
    '  mark 1 as non-prime',
    '  for p = 2 to sqrt(n) do:',
    '    if isPrime[p] is true then:',
    '      for multiple = p * p to n step p do:',
    '        isPrime[multiple] = false',
    '  return all numbers where isPrime is true',
  ],
  presets: [
    {
      name: 'grid-36',
      label: 'Primes up to 36 (6×6 grid)',
      description: 'Standard 6×6 grid finding primes [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31].',
      input: [36],
    },
    {
      name: 'grid-30',
      label: 'Primes up to 30 (5×6 grid)',
      description: 'Finds all 10 primes under 30.',
      input: [30],
    },
  ],
  generate(input: number[]): GridTableStep[] {
    const rawLimit = input && input.length > 0 ? Math.min(36, Math.max(10, input[0])) : 36;
    const ROWS = 6;
    const COLS = 6;
    const N = ROWS * COLS; // 36
    const steps: GridTableStep[] = [];

    // Cell marks map
    const marks: Record<number, GridCellMark> = {};
    marks[1] = 'wall'; // 1 is not prime

    const getCells = (): GridCell[] => {
      const cells: GridCell[] = [];
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const val = r * COLS + c + 1;
          cells.push({
            r,
            c,
            value: val,
            mark: marks[val],
          });
        }
      }
      return cells;
    };

    const record = (
      caption: string,
      line: number,
      vars?: Record<string, string | number | boolean>,
      auxiliary?: string
    ) => {
      steps.push({
        engine: 'grid-table',
        caption,
        line,
        vars,
        grid: {
          rows: ROWS,
          cols: COLS,
          cells: getCells(),
          auxiliary,
        },
      });
    };

    record(
      `Initialize numbers 1 to ${N} on a ${ROWS}×${COLS} grid. Marked 1 as non-prime.`,
      3,
      { limit: N, activePrime: 0 },
      'Primes: None found yet'
    );

    const isPrime = new Array(N + 1).fill(true);
    isPrime[0] = false;
    isPrime[1] = false;
    const confirmedPrimes: number[] = [];

    for (let p = 2; p <= Math.floor(Math.sqrt(N)); p++) {
      if (isPrime[p]) {
        confirmedPrimes.push(p);
        marks[p] = 'candidate';

        record(
          `Discovered prime number p = ${p}! Highlighting ${p} as prime candidate.`,
          5,
          { activePrime: p, isPrime: true },
          `Primes: ${confirmedPrimes.join(', ')}`
        );

        // Cross out multiples starting from p * p
        for (let multiple = p * p; multiple <= N; multiple += p) {
          if (isPrime[multiple]) {
            isPrime[multiple] = false;
            marks[multiple] = 'wall';

            record(
              `Cross out composite multiple ${multiple} (${p} × ${multiple / p}).`,
              7,
              { activePrime: p, eliminated: multiple },
              `Primes: ${confirmedPrimes.join(', ')}`
            );
          }
        }
      }
    }

    // Collect all remaining primes > sqrt(N)
    for (let i = 2; i <= N; i++) {
      if (isPrime[i]) {
        marks[i] = 'computed';
        if (!confirmedPrimes.includes(i)) {
          confirmedPrimes.push(i);
        }
      }
    }

    confirmedPrimes.sort((a, b) => a - b);

    record(
      `Sieve of Eratosthenes complete! Found ${confirmedPrimes.length} primes up to ${N}: [${confirmedPrimes.join(', ')}].`,
      8,
      { totalPrimes: confirmedPrimes.length, status: 'Done' },
      `Primes (total ${confirmedPrimes.length}): ${confirmedPrimes.join(', ')}`
    );

    return steps;
  },
};

export default sieveOfEratosthenesDefinition;
