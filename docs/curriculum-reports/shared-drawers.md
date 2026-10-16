# Shared drawers

10 problems; 90 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Shared drawers: Proof strip

Two departments have exchanged lists of reading tags for their shared equipment shelf. Ivo rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

The input contains exactly two drawers. Produce the distinct readings present in both drawers, in increasing numeric order.

Return the entire derived sequence, preserving its order.

Implement sharedDrawersProofStrip(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.

## Shared drawers: Floor ticket

Two departments have exchanged lists of reading tags for their shared equipment shelf. Tomas is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.

The input contains exactly two drawers. Produce the distinct readings present in both drawers, in increasing numeric order.

Return the smallest value in the derived sequence, or 0 for an empty sequence.

Implement sharedDrawersFloorTicket(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.

## Shared drawers: Boss receipt

Two departments have exchanged lists of reading tags for their shared equipment shelf. Sol adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

The input contains exactly two drawers. Produce the distinct readings present in both drawers, in increasing numeric order.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement sharedDrawersBossReceipt(drawers, k). k is part of the common inspection-card signature and does not affect this task's result.
