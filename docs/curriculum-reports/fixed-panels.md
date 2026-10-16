# Fixed panels

9 problems; 81 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Fixed panels: Proof strip

A rectangular stencil reveals exactly k neighboring readings on the moving paper strip. Neri rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

For each contiguous window of exactly k readings, produce its sum from left to right. If fewer than k readings exist, produce no window sums.

Return the entire derived sequence, preserving its order.

Implement fixedPanelsProofStrip(readings, k). Use k exactly where specified above.

## Fixed panels: Peak ticket

A rectangular stencil reveals exactly k neighboring readings on the moving paper strip. Tomas is setting the upper stop on an old office gauge. The largest derived reading goes on its label, even if the whole tray is below zero.

For each contiguous window of exactly k readings, produce its sum from left to right. If fewer than k readings exist, produce no window sums.

Return the largest value in the derived sequence, or 0 for an empty sequence. Negative maxima must remain negative.

Implement fixedPanelsPeakTicket(readings, k). Use k exactly where specified above.

## Fixed panels: Boss receipt

A rectangular stencil reveals exactly k neighboring readings on the moving paper strip. Sol adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

For each contiguous window of exactly k readings, produce its sum from left to right. If fewer than k readings exist, produce no window sums.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement fixedPanelsBossReceipt(readings, k). Use k exactly where specified above.
