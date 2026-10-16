# Positive trays

10 problems; 90 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Positive trays: Proof strip

The corrections desk files usable ink adjustments in a tray without changing their arrival order. Sol rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

Keep only readings strictly greater than 0, in their original order. Repeated readings remain repeated.

Return the entire derived sequence, preserving its order.

Implement positiveTraysProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Positive trays: Floor ticket

The corrections desk files usable ink adjustments in a tray without changing their arrival order. Pia is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.

Keep only readings strictly greater than 0, in their original order. Repeated readings remain repeated.

Return the smallest value in the derived sequence, or 0 for an empty sequence.

Implement positiveTraysFloorTicket(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Positive trays: Boss receipt

The corrections desk files usable ink adjustments in a tray without changing their arrival order. Mina adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

Keep only readings strictly greater than 0, in their original order. Repeated readings remain repeated.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement positiveTraysBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
