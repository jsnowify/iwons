/**
 * Greedy Activity Selection - Engine 2 (Array & Pointers)
 */

import { AlgoDefinition, ArrayPointersStep, ArrayPointer, ArrayCellMark } from '../../core/types';

interface Activity {
  id: string;
  start: number;
  finish: number;
  label: string;
}

export const activitySelectionDefinition: AlgoDefinition<number[]> = {
  id: 'activity-selection',
  name: 'Greedy Activity Selection',
  category: 'greedy',
  engine: 'array-pointers',
  complexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(1)',
  },
  inputKind: 'numbers',
  blurb: 'Selects the maximum number of mutually compatible activities by sorting by finish time and greedily selecting each compatible next activity.',
  pseudocode: [
    'procedure selectActivities(activities):',
    '  sort activities by finish time ascending',
    '  selected = [activities[0]]; lastFinish = activities[0].finish',
    '  for i = 1 to n - 1 do:',
    '    if activities[i].start >= lastFinish then',
    '      selected.append(activities[i])',
    '      lastFinish = activities[i].finish',
    '  return selected',
  ],
  presets: [
    {
      name: 'standard-six-tasks',
      label: '6 Activities [1,4, 3,5, 0,6, 5,7, 3,8, 5,9]',
      description: 'Pairs of [start, finish] times demonstrating greedy selection of non-overlapping intervals.',
      input: [1, 4, 3, 5, 0, 6, 5, 7, 3, 8, 5, 9],
    },
    {
      name: 'non-overlapping',
      label: 'Naturally Disjoint [1,2, 3,4, 5,6, 7,8]',
      description: 'All activities are compatible; greedy accepts all 4.',
      input: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    {
      name: 'heavy-overlap',
      label: 'All Overlapping [1,10, 2,5, 4,7, 6,9]',
      description: 'Activities overlap; greedy minimizes conflicts by picking shortest finish times.',
      input: [1, 10, 2, 5, 4, 7, 6, 9],
    },
  ],
  generate(input: number[]): ArrayPointersStep[] {
    const raw = input !== undefined && input.length >= 2 ? input : [1, 4, 3, 5, 0, 6, 5, 7, 3, 8, 5, 9];
    const steps: ArrayPointersStep[] = [];

    // Parse input pairs into activities
    const rawActivities: Activity[] = [];
    for (let i = 0; i < raw.length - 1; i += 2) {
      const start = Math.min(raw[i], raw[i + 1]);
      const finish = Math.max(raw[i], raw[i + 1]);
      const idx = Math.floor(i / 2);
      rawActivities.push({
        id: `act_${idx}`,
        start,
        finish,
        label: `[${start}-${finish}]`,
      });
    }

    if (rawActivities.length === 0) {
      steps.push({
        engine: 'array-pointers',
        caption: 'No valid activity pairs provided.',
        line: 1,
        array: { values: [], pointers: [] },
      });
      return steps;
    }

    // Sort by finish time ascending
    const activities = [...rawActivities].sort((a, b) => a.finish - b.finish);
    const values = activities.map(a => a.label);
    const marks: Record<number, ArrayCellMark> = {};
    const selected: string[] = [];

    const record = (
      caption: string,
      line: number,
      pointers: ArrayPointer[],
      vars?: Record<string, string | number | boolean>
    ) => {
      steps.push({
        engine: 'array-pointers',
        caption,
        line,
        vars,
        array: {
          values,
          pointers,
          marks: { ...marks },
          auxiliaryRow: {
            label: 'Selected Activities',
            values: selected.length > 0 ? [...selected] : ['None yet'],
          },
        },
      });
    };

    record(
      `Sorted ${activities.length} activities by finish time ascending: ${values.join(', ')}.`,
      2,
      [{ name: 'first', index: 0, color: 'accent' }],
      { total: activities.length, sorted: true }
    );

    // Pick first activity greedily
    selected.push(activities[0].label);
    marks[0] = 'found';
    let lastFinish = activities[0].finish;
    let lastIndex = 0;

    record(
      `Greedily select first activity ${activities[0].label} (earliest finish time = ${lastFinish}).`,
      3,
      [
        { name: 'curr', index: 0, color: 'primary' },
        { name: 'lastPick', index: 0, color: 'accent' },
      ],
      { selected: activities[0].label, finish: lastFinish, count: 1 }
    );

    for (let i = 1; i < activities.length; i++) {
      const act = activities[i];
      marks[i] = 'checking';

      record(
        `Check activity ${i} ${act.label}: start time ${act.start} vs last selected finish ${lastFinish}.`,
        4,
        [
          { name: 'curr', index: i, color: 'primary' },
          { name: 'lastPick', index: lastIndex, color: 'accent' },
        ],
        { start: act.start, lastFinish, compatible: act.start >= lastFinish }
      );

      if (act.start >= lastFinish) {
        // Compatible!
        marks[i] = 'found';
        selected.push(act.label);
        lastFinish = act.finish;
        lastIndex = i;

        record(
          `Compatible (${act.start} >= ${lastFinish - act.finish + lastFinish})! Greedily selected activity ${act.label}. Total selected: ${selected.length}.`,
          6,
          [
            { name: 'curr', index: i, color: 'primary' },
            { name: 'lastPick', index: i, color: 'accent' },
          ],
          { selected: act.label, newFinish: lastFinish, count: selected.length }
        );
      } else {
        // Conflict!
        marks[i] = 'eliminated';
        record(
          `Conflict (${act.start} < ${lastFinish})! Activity ${act.label} overlaps with previous selection. Rejected.`,
          5,
          [
            { name: 'curr', index: i, color: 'warning' },
            { name: 'lastPick', index: lastIndex, color: 'accent' },
          ],
          { rejected: act.label, count: selected.length }
        );
      }
    }

    record(
      `Activity selection complete. Maximum compatible set: [${selected.join(', ')}] (${selected.length} activities).`,
      8,
      [{ name: 'done', index: lastIndex, color: 'accent' }],
      { maxActivities: selected.length, optimal: true }
    );

    return steps;
  },
};

export default activitySelectionDefinition;

