# Prefix stencils

9 problems; 81 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Prefix stencils: Proof strip

A running account lets the stationery desk recover trailing totals without rereading the full tape. Neri rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

For each index i, produce the sum from max(0,i-k+1) through i inclusive. These are trailing ranges that may be shorter than k near the left edge.

Return the entire derived sequence, preserving its order.

Implement prefixStencilsProofStrip(readings, k). Use k exactly where specified above.

## Prefix stencils: Peak ticket

A running account lets the stationery desk recover trailing totals without rereading the full tape. Tomas is setting the upper stop on an old office gauge. The largest derived reading goes on its label, even if the whole tray is below zero.

For each index i, produce the sum from max(0,i-k+1) through i inclusive. These are trailing ranges that may be shorter than k near the left edge.

Return the largest value in the derived sequence, or 0 for an empty sequence. Negative maxima must remain negative.

Implement prefixStencilsPeakTicket(readings, k). Use k exactly where specified above.

## Prefix stencils: Boss receipt

A running account lets the stationery desk recover trailing totals without rereading the full tape. Sol adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

For each index i, produce the sum from max(0,i-k+1) through i inclusive. These are trailing ranges that may be shorter than k near the left edge.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement prefixStencilsBossReceipt(readings, k). Use k exactly where specified above.
