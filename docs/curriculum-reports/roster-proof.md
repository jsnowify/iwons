# Roster proof

10 problems; 90 cases; all checks passed.

JavaScript and TypeScript ran in the actual worker. Python used the exact harness. Java compiled and ran locally; the app runtime remains Beta.

## Roster proof: Proof strip

Permission masks list which clerks may occupy each desk on the day's assignment roster. Luz rolls a fresh proof strip into the office typewriter. The supervisor wants the readings in their precise working order before signing the file.

There are n desks and n clerks. readings[row] is an n-bit permission mask for desk row. Assign one distinct clerk to each desk, using only allowed bits. For each possible clerk at desk 0, produce the number of complete assignments with that first clerk; forbidden first choices contribute 0. An empty roster produces no counts.

Return the entire derived sequence, preserving its order.

Implement rosterProofProofStrip(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Roster proof: Floor ticket

Permission masks list which clerks may occupy each desk on the day's assignment roster. Neri is checking the lower stop before the ribbon press opens. A negative reading is a real measurement and must not be replaced by an invented zero.

There are n desks and n clerks. readings[row] is an n-bit permission mask for desk row. Assign one distinct clerk to each desk, using only allowed bits. For each possible clerk at desk 0, produce the number of complete assignments with that first clerk; forbidden first choices contribute 0. An empty roster produces no counts.

Return the smallest value in the derived sequence, or 0 for an empty sequence.

Implement rosterProofFloorTicket(readings, k). k is part of the common inspection-card signature and does not affect this task's result.

## Roster proof: Boss receipt

Permission masks list which clerks may occupy each desk on the day's assignment roster. Tomas adds numbered weights to the final receipt at the unit's inspection desk. The first derived reading has weight one, so its position matters as much as its value.

There are n desks and n clerks. readings[row] is an n-bit permission mask for desk row. Assign one distinct clerk to each desk, using only allowed bits. For each possible clerk at desk 0, produce the number of complete assignments with that first clerk; forbidden first choices contribute 0. An empty roster produces no counts.

Return the weighted sum of the derived sequence: multiply its first value by 1, its second by 2, and so on, then add the products. Return 0 for an empty sequence.

Implement rosterProofBossReceipt(readings, k). k is part of the common inspection-card signature and does not affect this task's result.
