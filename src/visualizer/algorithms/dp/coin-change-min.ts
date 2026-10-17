/**
 * Coin Change (Minimum Coins) - Engine 3 (Grid & Table)
 */

import { AlgoDefinition, GridTableStep, GridCell } from '../../core/types';
import { TargetAndNumbers } from '../../core/inputs';

export const coinChangeMinDefinition: AlgoDefinition<TargetAndNumbers> = {
  id: 'coin-change-min',
  name: 'Coin Change (Minimum Coins)',
  category: 'dynamic-programming',
  engine: 'grid-table',
  complexity: {
    best: 'O(n · amount)',
    average: 'O(n · amount)',
    worst: 'O(n · amount)',
    space: 'O(amount)',
  },
  inputKind: 'target-and-numbers',
  blurb: 'Determines the fewest number of coins needed to make up a given target amount by building an optimal subproblem table across all intermediate values from 0 up to amount.',
  pseudocode: [
    'procedure coinChange(coins, amount):',
    '  dp := array of size amount + 1 initialized to infinity',
    '  dp[0] := 0',
    '  for each coin in coins do:',
    '    for a := coin to amount do:',
    '      dp[a] := min(dp[a], dp[a - coin] + 1)',
    '  return dp[amount] if dp[amount] != infinity else -1',
  ],
  presets: [
    {
      name: 'standard-coins',
      label: 'Amount 11 with Coins [1, 2, 5]',
      description: 'Finds 3 coins (5 + 5 + 1 = 11).',
      input: { target: 11, numbers: [1, 2, 5] },
    },
    {
      name: 'greedy-fails',
      label: 'Greedy Fails (Amount 6 with [1, 3, 4])',
      description: 'Greedy chooses 4+1+1 (3 coins), but DP finds optimal 3+3 (2 coins).',
      input: { target: 6, numbers: [1, 3, 4] },
    },
    {
      name: 'impossible-amount',
      label: 'Impossible Amount (Amount 7 with [2, 4])',
      description: 'Odd amount with only even coins returns -1.',
      input: { target: 7, numbers: [2, 4] },
    },
  ],
  generate(input: TargetAndNumbers): GridTableStep[] {
    const rawCoins = [...(input.numbers || [1, 2, 5])];
    const coins = Array.from(new Set(rawCoins.map(c => Math.max(1, Math.round(c))))).sort((a, b) => a - b);
    const amount = Math.max(0, Math.min(12, Math.round(Number(input.target) || 11)));
    const numCoins = coins.length;
    const steps: GridTableStep[] = [];

    // 2D DP Table: (numCoins + 1) rows, (amount + 1) cols
    // Row 0: no coins, Row i: using coins[0..i-1]
    const INF = 999;
    const dp: (number | string)[][] = Array.from({ length: numCoins + 1 }, () =>
      new Array(amount + 1).fill('—')
    );

    const rowLabels = ['No coins', ...coins.map(c => `Coin (${c})`)];
    const colLabels = Array.from({ length: amount + 1 }, (_, a) => `Amt ${a}`);

    const record = (
      caption: string,
      line: number,
      activeCell?: [number, number],
      sourceCells?: [number, number][],
      vars?: Record<string, string | number | boolean>,
      tracebackPath?: [number, number][]
    ) => {
      const cells: GridCell[] = [];
      for (let r = 0; r <= numCoins; r++) {
        for (let c = 0; c <= amount; c++) {
          let mark: GridCell['mark'] = undefined;
          if (activeCell && activeCell[0] === r && activeCell[1] === c) {
            mark = 'current';
          } else if (sourceCells?.some(([sr, sc]) => sr === r && sc === c)) {
            mark = 'source';
          } else if (tracebackPath?.some(([tr, tc]) => tr === r && tc === c)) {
            mark = 'path';
          } else if (dp[r][c] !== '—') {
            mark = 'computed';
          }

          const val = dp[r][c];
          cells.push({ r, c, value: val === INF ? '∞' : val, mark });
        }
      }

      steps.push({
        engine: 'grid-table',
        caption,
        line,
        vars,
        grid: {
          rows: numCoins + 1,
          cols: amount + 1,
          cells,
          rowLabels,
          colLabels,
          tracebackPath,
        },
      });
    };

    record(
      `Initialize Coin Change DP table: target amount ${amount} with coin denominations [${coins.join(', ')}].`,
      2,
      undefined,
      undefined,
      { amount, coins: coins.join(', ') }
    );

    // Row 0: 0 coins can make amount 0 with 0 coins, all other amounts are impossible (INF)
    dp[0][0] = 0;
    for (let a = 1; a <= amount; a++) dp[0][a] = INF;

    record('Base case: 0 coins can make amount 0 with 0 coins; positive amounts without coins are ∞ (impossible).', 3, [0, 0]);

    for (let i = 1; i <= numCoins; i++) {
      const coin = coins[i - 1];
      dp[i][0] = 0;

      for (let a = 1; a <= amount; a++) {
        const withoutCoin = Number(dp[i - 1][a]);
        let withCoin = INF;
        if (a >= coin && dp[i][a - coin] !== INF) {
          withCoin = Number(dp[i][a - coin]) + 1;
        }

        const best = Math.min(withoutCoin, withCoin);
        dp[i][a] = best;

        record(
          `Coin ${coin} at amount ${a}: compare without coin (${withoutCoin === INF ? '∞' : withoutCoin}) vs with coin (${withCoin === INF ? '∞' : withCoin}). dp[${i}][${a}] = ${best === INF ? '∞' : best}.`,
          6,
          [i, a],
          [
            [i - 1, a],
            ...(a >= coin ? [[i, a - coin] as [number, number]] : []),
          ],
          { coin, amount: a, withoutCoin: withoutCoin === INF ? '∞' : withoutCoin, withCoin: withCoin === INF ? '∞' : withCoin, best: best === INF ? '∞' : best }
        );
      }
    }

    // Traceback to find chosen coins
    const finalAns = dp[numCoins][amount];
    const isPossible = finalAns !== INF;
    const chosenCoins: number[] = [];
    const path: [number, number][] = [];

    if (isPossible) {
      let curR = numCoins;
      let curA = amount;
      path.push([curR, curA]);

      while (curA > 0 && curR > 0) {
        const coin = coins[curR - 1];
        if (curA >= coin && Number(dp[curR][curA]) === Number(dp[curR][curA - coin]) + 1) {
          chosenCoins.push(coin);
          curA -= coin;
        } else {
          curR -= 1;
        }
        path.push([curR, curA]);
      }
    }

    record(
      isPossible
        ? `Minimal coin change found: ${finalAns} coins for amount ${amount} (using coins: [${chosenCoins.join(', ')}]).`
        : `Target amount ${amount} cannot be formed using coins [${coins.join(', ')}]. Return -1.`,
      7,
      [numCoins, amount],
      undefined,
      {
        targetAmount: amount,
        minCoins: isPossible ? finalAns : -1,
        coinsUsed: isPossible ? chosenCoins.join(', ') : 'none',
        result: isPossible ? finalAns : -1,
      },
      isPossible ? path : undefined
    );

    return steps;
  },
};

export default coinChangeMinDefinition;

