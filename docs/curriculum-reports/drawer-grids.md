# Drawer grids

10 problems; 90 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Drawer grids: Proof strip

The supply cabinet has uneven rows of drawers, including a few rows left entirely empty. Sol rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

For each row of drawers, produce the sum of that row. Empty rows contribute 0.

Return the entire derived sequence, preserving its order.

Implement drawerGridsProofStrip(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.

## Drawer grids: Floor ticket

The supply cabinet has uneven rows of drawers, including a few rows left entirely empty. Pia is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.

For each row of drawers, produce the sum of that row. Empty rows contribute 0.

Return the smallest value in the derived sequence, or 0 for an empty sequence.

Implement drawerGridsFloorTicket(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.

## Drawer grids: Boss receipt

The supply cabinet has uneven rows of drawers, including a few rows left entirely empty. Mina adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

For each row of drawers, produce the sum of that row. Empty rows contribute 0.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement drawerGridsBossReceipt(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.
