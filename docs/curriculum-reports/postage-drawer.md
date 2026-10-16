# Postage drawer

10 problems; 90 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Postage drawer: Proof strip

An old postage drawer contains unlimited stamps valued at one, four and nine units. Luz rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

For each nonnegative postage amount, produce the smallest number of stamps needed using unlimited denominations 1, 4 and 9. Zero postage uses zero stamps.

Return the entire derived sequence, preserving its order.

Implement postageDrawerProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Postage drawer: Floor ticket

An old postage drawer contains unlimited stamps valued at one, four and nine units. Neri is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.

For each nonnegative postage amount, produce the smallest number of stamps needed using unlimited denominations 1, 4 and 9. Zero postage uses zero stamps.

Return the smallest value in the derived sequence, or 0 for an empty sequence.

Implement postageDrawerFloorTicket(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Postage drawer: Boss receipt

An old postage drawer contains unlimited stamps valued at one, four and nine units. Tomas adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

For each nonnegative postage amount, produce the smallest number of stamps needed using unlimited denominations 1, 4 and 9. Zero postage uses zero stamps.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement postageDrawerBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
