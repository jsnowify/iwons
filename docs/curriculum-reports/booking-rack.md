# Booking rack

10 problems; 90 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Booking rack: Proof strip

Half-open booking cards compete for a single press whose next job may start exactly when the previous one ends. Luz rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

Each booking is [start,end] with start < end and occupies [start,end). Sort by end then start ascending; accept a booking if it starts at or after the last accepted end. Produce accepted durations in acceptance order. Negative times are allowed.

Return the entire derived sequence, preserving its order.

Implement bookingRackProofStrip(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.

## Booking rack: Floor ticket

Half-open booking cards compete for a single press whose next job may start exactly when the previous one ends. Neri is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.

Each booking is [start,end] with start < end and occupies [start,end). Sort by end then start ascending; accept a booking if it starts at or after the last accepted end. Produce accepted durations in acceptance order. Negative times are allowed.

Return the smallest value in the derived sequence, or 0 for an empty sequence.

Implement bookingRackFloorTicket(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.

## Booking rack: Boss receipt

Half-open booking cards compete for a single press whose next job may start exactly when the previous one ends. Tomas adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

Each booking is [start,end] with start < end and occupies [start,end). Sort by end then start ascending; accept a booking if it starts at or after the last accepted end. Produce accepted durations in acceptance order. Negative times are allowed.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement bookingRackBossReceipt(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.
