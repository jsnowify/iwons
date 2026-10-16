# Receipt arithmetic

6 problems; 54 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Receipt arithmetic: Proof strip

The carbon-copy till records every ink adjustment in a narrow numbered column. Mina rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

For each reading x, produce 2*x + 3. The readings are signed ink adjustments.

Return the entire derived sequence, preserving its order.

Implement receiptArithmeticProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Receipt arithmetic: First qualifying slip

The carbon-copy till records every ink adjustment in a narrow numbered column. Neri needs the first qualifying slip while the courier waits at the door. Later matches must not jump ahead in the tray.

For each reading x, produce 2*x + 3. The readings are signed ink adjustments.

Return the first value in the derived sequence that is at least k, or -1 if there is none. Return the value, not its index.

Implement receiptArithmeticFirstQualifyingSlip(readings, k). Use k exactly where specified above.

## Receipt arithmetic: Boss receipt

The carbon-copy till records every ink adjustment in a narrow numbered column. Rafi adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

For each reading x, produce 2*x + 3. The readings are signed ink adjustments.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement receiptArithmeticBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
