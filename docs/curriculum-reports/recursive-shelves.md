# Recursive shelves

9 problems; 81 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Recursive shelves: Proof strip

A shelf audit divides each occupied range in half and records its subtotal before opening smaller ranges. Rafi rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

Recursively inspect half-open ranges [left,right), starting with the whole array. For each nonempty range, record its sum, then inspect its left half and right half using mid=floor((left+right)/2); stop splitting a one-element range. Produce the recorded sums in that preorder.

Return the entire derived sequence, preserving its order.

Implement recursiveShelvesProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Recursive shelves: Peak ticket

A shelf audit divides each occupied range in half and records its subtotal before opening smaller ranges. Ada is setting the upper stop on an old office gauge. The largest derived reading goes on its label, even if the whole tray is below zero.

Recursively inspect half-open ranges [left,right), starting with the whole array. For each nonempty range, record its sum, then inspect its left half and right half using mid=floor((left+right)/2); stop splitting a one-element range. Produce the recorded sums in that preorder.

Return the largest value in the derived sequence, or 0 for an empty sequence. Negative maxima must remain negative.

Implement recursiveShelvesPeakTicket(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Recursive shelves: Boss receipt

A shelf audit divides each occupied range in half and records its subtotal before opening smaller ranges. Neri adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

Recursively inspect half-open ranges [left,right), starting with the whole array. For each nonempty range, record its sum, then inspect its left half and right half using mid=floor((left+right)/2); stop splitting a one-element range. Produce the recorded sums in that preorder.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement recursiveShelvesBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
