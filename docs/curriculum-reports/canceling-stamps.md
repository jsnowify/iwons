# Canceling stamps

9 problems; 81 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Canceling stamps: Proof strip

Matching cancellation stamps erase each other when they meet at the top of the paper pile. Alma rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

Read stamps left to right. If a stamp equals the top stamp, remove that top stamp; otherwise push it. Produce the final stack from bottom to top.

Return the entire derived sequence, preserving its order.

Implement cancelingStampsProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Canceling stamps: Peak ticket

Matching cancellation stamps erase each other when they meet at the top of the paper pile. Luz is setting the upper stop on an old office gauge. The largest derived reading goes on its label, even if the whole tray is below zero.

Read stamps left to right. If a stamp equals the top stamp, remove that top stamp; otherwise push it. Produce the final stack from bottom to top.

Return the largest value in the derived sequence, or 0 for an empty sequence. Negative maxima must remain negative.

Implement cancelingStampsPeakTicket(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Canceling stamps: Boss receipt

Matching cancellation stamps erase each other when they meet at the top of the paper pile. Ivo adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

Read stamps left to right. If a stamp equals the top stamp, remove that top stamp; otherwise push it. Produce the final stack from bottom to top.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement cancelingStampsBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
