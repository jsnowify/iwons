# First arrivals

10 problems; 90 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## First arrivals: Proof strip

The reception stamp should acknowledge each visitor's tag only on its first arrival. Ivo rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

Keep the first occurrence of each distinct reading, preserving encounter order.

Return the entire derived sequence, preserving its order.

Implement firstArrivalsProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## First arrivals: Floor ticket

The reception stamp should acknowledge each visitor's tag only on its first arrival. Tomas is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.

Keep the first occurrence of each distinct reading, preserving encounter order.

Return the smallest value in the derived sequence, or 0 for an empty sequence.

Implement firstArrivalsFloorTicket(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## First arrivals: Boss receipt

The reception stamp should acknowledge each visitor's tag only on its first arrival. Sol adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

Keep the first occurrence of each distinct reading, preserving encounter order.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement firstArrivalsBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
