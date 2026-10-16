# Paired drawers

10 problems; 90 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Paired drawers: Proof strip

Two sorted dispatch trays must feed one shared label printer without losing repeated tags. Neri rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

The input contains exactly two sorted drawers. Produce all their readings in one sorted sequence, preserving duplicates.

Return the entire derived sequence, preserving its order.

Implement pairedDrawersProofStrip(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.

## Paired drawers: Floor ticket

Two sorted dispatch trays must feed one shared label printer without losing repeated tags. Luz is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.

The input contains exactly two sorted drawers. Produce all their readings in one sorted sequence, preserving duplicates.

Return the smallest value in the derived sequence, or 0 for an empty sequence.

Implement pairedDrawersFloorTicket(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.

## Paired drawers: Boss receipt

Two sorted dispatch trays must feed one shared label printer without losing repeated tags. Ivo adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

The input contains exactly two sorted drawers. Produce all their readings in one sorted sequence, preserving duplicates.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement pairedDrawersBossReceipt(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.
