# Window pegs

9 problems; 81 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Window pegs: Proof strip

The inspection frame keeps only pegs that could still be the tallest in its current window. Alma rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

For every contiguous window of exactly k readings, produce its maximum from left to right. Produce no values if k exceeds the number of readings.

Return the entire derived sequence, preserving its order.

Implement windowPegsProofStrip(readings, k). Use k exactly where specified above.

## Window pegs: Peak ticket

The inspection frame keeps only pegs that could still be the tallest in its current window. Luz is setting the upper stop on an old office gauge. The largest derived reading goes on its label, even if the whole tray is below zero.

For every contiguous window of exactly k readings, produce its maximum from left to right. Produce no values if k exceeds the number of readings.

Return the largest value in the derived sequence, or 0 for an empty sequence. Negative maxima must remain negative.

Implement windowPegsPeakTicket(readings, k). Use k exactly where specified above.

## Window pegs: Boss receipt

The inspection frame keeps only pegs that could still be the tallest in its current window. Ivo adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

For every contiguous window of exactly k readings, produce its maximum from left to right. Produce no values if k exceeds the number of readings.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement windowPegsBossReceipt(readings, k). Use k exactly where specified above.
