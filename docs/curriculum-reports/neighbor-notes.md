# Neighbor notes

10 problems; 90 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Neighbor notes: Proof strip

Two adjacent gauge readings describe how the press changed between successive sheets. Sol rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

Produce readings[i] - readings[i-1] for i from 1 onward, preserving that order.

Return the entire derived sequence, preserving its order.

Implement neighborNotesProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Neighbor notes: Floor ticket

Two adjacent gauge readings describe how the press changed between successive sheets. Pia is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.

Produce readings[i] - readings[i-1] for i from 1 onward, preserving that order.

Return the smallest value in the derived sequence, or 0 for an empty sequence.

Implement neighborNotesFloorTicket(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Neighbor notes: Boss receipt

Two adjacent gauge readings describe how the press changed between successive sheets. Mina adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

Produce readings[i] - readings[i-1] for i from 1 onward, preserving that order.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement neighborNotesBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
