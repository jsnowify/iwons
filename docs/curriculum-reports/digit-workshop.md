# Digit workshop

6 problems; 54 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Digit workshop: Proof strip

Loose digit wheels from an old numbering machine need a handwritten inspection ledger. Mina rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

For each reading, produce the sum of the decimal digits of its absolute value; the digit sum of 0 is 0.

Return the entire derived sequence, preserving its order.

Implement digitWorkshopProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Digit workshop: First qualifying slip

Loose digit wheels from an old numbering machine need a handwritten inspection ledger. Neri needs the first qualifying slip while the courier waits at the door. Later matches must not jump ahead in the tray.

For each reading, produce the sum of the decimal digits of its absolute value; the digit sum of 0 is 0.

Return the first value in the derived sequence that is at least k, or -1 if there is none. Return the value, not its index.

Implement digitWorkshopFirstQualifyingSlip(readings, k). Use k exactly where specified above.

## Digit workshop: Boss receipt

Loose digit wheels from an old numbering machine need a handwritten inspection ledger. Rafi adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

For each reading, produce the sum of the decimal digits of its absolute value; the digit sum of 0 is 0.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement digitWorkshopBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
