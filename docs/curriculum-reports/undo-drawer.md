# Undo drawer

9 problems; 81 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Undo drawer: Proof strip

An experimental filing machine records both new cards and requests to undo recent cards. Alma rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

A nonnegative event pushes that value onto a stack. A negative event removes up to abs(event) values from its top. Produce the final stack from bottom to top.

Return the entire derived sequence, preserving its order.

Implement undoDrawerProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Undo drawer: Peak ticket

An experimental filing machine records both new cards and requests to undo recent cards. Luz is setting the upper stop on an old office gauge. The largest derived reading goes on its label, even if the whole tray is below zero.

A nonnegative event pushes that value onto a stack. A negative event removes up to abs(event) values from its top. Produce the final stack from bottom to top.

Return the largest value in the derived sequence, or 0 for an empty sequence. Negative maxima must remain negative.

Implement undoDrawerPeakTicket(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Undo drawer: Boss receipt

An experimental filing machine records both new cards and requests to undo recent cards. Ivo adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

A nonnegative event pushes that value onto a stack. A negative event removes up to abs(event) values from its top. Produce the final stack from bottom to top.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement undoDrawerBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
