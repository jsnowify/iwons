# Round desk

9 problems; 81 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Round desk: Proof strip

One busy clerk rotates unfinished print jobs around a circular service desk. Alma rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

Jobs arrive together in input order and need the given nonnegative service times. A clerk serves up to k time units, appends unfinished jobs to the queue, and records each job's completion time in original job order. A zero-time job is complete at time 0.

Return the entire derived sequence, preserving its order.

Implement roundDeskProofStrip(readings, k). Use k exactly where specified above.

## Round desk: Peak ticket

One busy clerk rotates unfinished print jobs around a circular service desk. Luz is setting the upper stop on an old office gauge. The largest derived reading goes on its label, even if the whole tray is below zero.

Jobs arrive together in input order and need the given nonnegative service times. A clerk serves up to k time units, appends unfinished jobs to the queue, and records each job's completion time in original job order. A zero-time job is complete at time 0.

Return the largest value in the derived sequence, or 0 for an empty sequence. Negative maxima must remain negative.

Implement roundDeskPeakTicket(readings, k). Use k exactly where specified above.

## Round desk: Boss receipt

One busy clerk rotates unfinished print jobs around a circular service desk. Ivo adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

Jobs arrive together in input order and need the given nonnegative service times. A clerk serves up to k time units, appends unfinished jobs to the queue, and records each job's completion time in original job order. A zero-time job is complete at time 0.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement roundDeskBossReceipt(readings, k). Use k exactly where specified above.
