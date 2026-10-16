# Stamp gates

6 problems; 54 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Stamp gates: Proof strip

A damaged approval stamp has been replacing rejected readings with blanks on the dispatch form. Mina rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

Replace each negative reading with 0; leave every other reading unchanged.

Return the entire derived sequence, preserving its order.

Implement stampGatesProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Stamp gates: First qualifying slip

A damaged approval stamp has been replacing rejected readings with blanks on the dispatch form. Neri needs the first qualifying slip while the courier waits at the door. Later matches must not jump ahead in the tray.

Replace each negative reading with 0; leave every other reading unchanged.

Return the first value in the derived sequence that is at least k, or -1 if there is none. Return the value, not its index.

Implement stampGatesFirstQualifyingSlip(readings, k). Use k exactly where specified above.

## Stamp gates: Boss receipt

A damaged approval stamp has been replacing rejected readings with blanks on the dispatch form. Rafi adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

Replace each negative reading with 0; leave every other reading unchanged.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement stampGatesBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
