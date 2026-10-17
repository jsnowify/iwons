/**
 * Fractional Knapsack (Greedy by Value/Weight Ratio) - Engine 1 (Bars)
 */

import { AlgoDefinition, BarsStep, BarMark } from '../../core/types';

interface Item {
  id: number;
  value: number;
  weight: number;
  ratio: number;
}

export const fractionalKnapsackDefinition: AlgoDefinition<number[]> = {
  id: 'fractional-knapsack',
  name: 'Fractional Knapsack',
  category: 'greedy',
  engine: 'bars',
  complexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Maximizes total knapsack value by greedily packing items in descending order of value-to-weight ratio (value density), taking fractional portions of items when capacity is limited.',
  pseudocode: [
    'procedure fractionalKnapsack(items, capacity):',
    '  sort items by ratio (value / weight) descending',
    '  totalVal := 0; remainingCap := capacity',
    '  for each item in items do:',
    '    if item.weight <= remainingCap then:',
    '      totalVal += item.value; remainingCap -= item.weight',
    '    else:',
    '      fraction = remainingCap / item.weight',
    '      totalVal += item.value * fraction; break',
    '  return totalVal',
  ],
  presets: [
    {
      name: 'standard-three-items',
      label: '3 Items (Capacity 50)',
      description: 'Items: [value, weight] = [60, 10, 100, 20, 120, 30]. Best ratios taken first.',
      input: [60, 10, 100, 20, 120, 30],
    },
    {
      name: 'four-items-fraction',
      label: '4 Items [40, 10, 30, 20, 50, 25, 20, 5]',
      description: 'Greedily fills capacity 40 with whole items and fractional remainder.',
      input: [40, 10, 30, 20, 50, 25, 20, 5],
    },
    {
      name: 'single-item-fits',
      label: 'Single Item [50, 20]',
      description: 'Single item that easily fits within capacity.',
      input: [50, 20],
    },
  ],
  generate(input: number[]): BarsStep[] {
    const raw = input !== undefined && input.length >= 2 ? input : [60, 10, 100, 20, 120, 30];
    const CAPACITY = 50;
    const steps: BarsStep[] = [];

    // Parse pairs of value, weight
    const rawItems: Item[] = [];
    for (let i = 0; i < raw.length - 1; i += 2) {
      const val = Math.max(1, Math.abs(raw[i]));
      const wt = Math.max(1, Math.abs(raw[i + 1]));
      rawItems.push({
        id: Math.floor(i / 2) + 1,
        value: val,
        weight: wt,
        ratio: Math.round((val / wt) * 100) / 100,
      });
    }

    if (rawItems.length === 0) {
      steps.push({
        engine: 'bars',
        caption: 'No items provided for knapsack.',
        line: 1,
        bars: { values: [] },
      });
      return steps;
    }

    // Sort descending by value density (ratio)
    const items = [...rawItems].sort((a, b) => b.ratio - a.ratio);
    const values = items.map(it => it.value);
    const marks: Record<number, BarMark> = {};
    let totalValue = 0;
    let remainingCapacity = CAPACITY;

    const record = (
      caption: string,
      line: number,
      activeIdx?: number,
      vars?: Record<string, string | number | boolean>
    ) => {
      const stepMarks: Record<number, BarMark> = { ...marks };
      if (activeIdx !== undefined && !stepMarks[activeIdx]) {
        stepMarks[activeIdx] = 'compared';
      }

      steps.push({
        engine: 'bars',
        caption,
        line,
        vars,
        bars: {
          values: [...values],
          marks: stepMarks,
          counters: {
            comparisons: CAPACITY - remainingCapacity,
            swaps: Math.round(totalValue),
          },
          auxiliary: {
            label: 'Knapsack Contents',
            values: items.map(it => (marks[it.id - 1] === 'sorted' ? it.value : null)),
          },
        },
      });
    };

    record(
      `Sorted ${items.length} items by value density (ratio = value/weight) descending. Knapsack capacity = ${CAPACITY} kg.`,
      2,
      undefined,
      { capacity: CAPACITY, totalItems: items.length }
    );

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      record(
        `Evaluating item ${item.id}: value $${item.value}, weight ${item.weight} kg, density $${item.ratio}/kg.`,
        4,
        i,
        { item: item.id, weight: item.weight, remainingCapacity, totalValue: Math.round(totalValue) }
      );

      if (item.weight <= remainingCapacity) {
        // Take 100% of the item
        totalValue += item.value;
        remainingCapacity -= item.weight;
        marks[i] = 'sorted';

        record(
          `Item ${item.id} fully fits (${item.weight} kg <= ${remainingCapacity + item.weight} kg). Packed 100%. Total value: $${totalValue}.`,
          6,
          i,
          {
            taken: '100%',
            addedValue: item.value,
            totalValue: Math.round(totalValue),
            remainingCapacity,
          }
        );

        if (remainingCapacity === 0) {
          record(
            `Knapsack is completely full (remaining capacity = 0 kg).`,
            6,
            undefined,
            { status: 'Full', totalValue: Math.round(totalValue) }
          );
          break;
        }
      } else {
        // Take fraction of item
        const fraction = Math.round((remainingCapacity / item.weight) * 100) / 100;
        const fractionalValue = Math.round(item.value * fraction * 10) / 10;
        totalValue += fractionalValue;
        marks[i] = 'pivot';

        record(
          `Item ${item.id} (${item.weight} kg) exceeds remaining capacity (${remainingCapacity} kg). Packed fraction ${(fraction * 100).toFixed(0)}% (+$${fractionalValue}).`,
          8,
          i,
          {
            fraction: `${(fraction * 100).toFixed(0)}%`,
            addedValue: fractionalValue,
            totalValue: Math.round(totalValue),
            remainingCapacity: 0,
          }
        );
        remainingCapacity = 0;
        break;
      }
    }

    record(
      `Fractional Knapsack complete! Final optimal value packed: $${Math.round(totalValue * 100) / 100} using capacity ${CAPACITY - remainingCapacity}/${CAPACITY} kg.`,
      10,
      undefined,
      { optimalValue: Math.round(totalValue), packedWeight: CAPACITY - remainingCapacity }
    );

    return steps;
  },
};

export default fractionalKnapsackDefinition;

