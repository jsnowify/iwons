# Selection proof

10 problems; 90 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Selection proof: Proof strip

A sample tray allows each physical slip to be either included or excluded from a signed total. Luz rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

Choose any subset of reading positions, including the empty subset, and sum its readings. Produce every distinct achievable sum in ascending order. Equal readings at different positions remain separate choices.

Return the entire derived sequence, preserving its order.

Implement selectionProofProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Selection proof: Floor ticket

A sample tray allows each physical slip to be either included or excluded from a signed total. Neri is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.

Choose any subset of reading positions, including the empty subset, and sum its readings. Produce every distinct achievable sum in ascending order. Equal readings at different positions remain separate choices.

Return the smallest value in the derived sequence, or 0 for an empty sequence.

Implement selectionProofFloorTicket(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Selection proof: Boss receipt

A sample tray allows each physical slip to be either included or excluded from a signed total. Tomas adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

Choose any subset of reading positions, including the empty subset, and sum its readings. Produce every distinct achievable sum in ascending order. Equal readings at different positions remain separate choices.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement selectionProofBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
