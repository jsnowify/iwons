/** Hand-drawn 48×48 line emblems, one per Path level. Static markup, drawn with currentColor. */
export const levelEmblems: Record<number, string> = {
  // Hello, Keys: a single keycap
  0: '<rect x="8" y="9" width="32" height="26" rx="5"/><rect x="14" y="14" width="20" height="13" rx="3"/><path d="M8 35v3a3 3 0 0 0 3 3h26a3 3 0 0 0 3-3v-3"/>',
  // Typebars: arms fanning from the pivot to the platen
  1: '<path d="M24 38 10 14M24 38V10M24 38 38 14"/><circle cx="10" cy="12" r="3.5"/><circle cx="24" cy="8" r="3.5"/><circle cx="38" cy="12" r="3.5"/><path d="M8 43h32"/>',
  // Card Catalog: a drawer with a label card
  2: '<path d="M13 15V8h22v7"/><rect x="7" y="15" width="34" height="26" rx="3"/><rect x="16" y="21" width="16" height="8" rx="1.5"/><circle cx="24" cy="35" r="1.6"/>',
  // Two Fingers: two pointers over an array
  3: '<rect x="6" y="28" width="36" height="12" rx="2"/><path d="M15 28v12M24 28v12M33 28v12"/><path d="M10.5 16v-8M7 13l3.5 4 3.5-4M37.5 16v-8M34 13l3.5 4 3.5-4"/>',
  // Paper Stack: three sheets
  4: '<rect x="6" y="18" width="26" height="24" rx="2"/><path d="M11 26h16M11 31h16M11 36h9"/><path d="M12 18v-6a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2h-6"/><path d="M18 10V6a2 2 0 0 1 2-2h24a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2h-4"/>',
  // Carriage Return: the return arrow under a typed line
  5: '<path d="M10 11h20"/><path d="M38 20v8a4 4 0 0 1-4 4H12"/><path d="m18 25-7 7 7 7"/><path d="M8 44h32"/>',
  // Chain and Tree: a small binary tree
  6: '<path d="m21.3 13.6-6.6 8.8M26.7 13.6l6.6 8.8M10.2 30.1 7.8 35.9M13.8 30.1l2.4 5.8M34.2 30.1l6 5.8"/><circle cx="24" cy="10" r="4"/><circle cx="12" cy="26" r="4"/><circle cx="36" cy="26" r="4"/><circle cx="6" cy="40" r="4"/><circle cx="18" cy="40" r="4"/><circle cx="42" cy="40" r="4"/>',
  // Switchboard: patch panel with a cable between two jacks
  7: '<rect x="5" y="7" width="38" height="17" rx="2"/><circle cx="14" cy="15.5" r="2.5"/><circle cx="24" cy="15.5" r="2.5"/><circle cx="34" cy="15.5" r="2.5"/><rect x="11" y="24" width="6" height="6" rx="1"/><rect x="31" y="24" width="6" height="6" rx="1"/><path d="M14 30c0 14 20 14 20 0"/>',
  // Master Printer: the typewriter itself
  8: '<rect x="14" y="5" width="20" height="14" rx="1.5"/><path d="M19 10h10M19 14h6"/><rect x="5" y="21" width="38" height="20" rx="3"/><path d="M14 28h.01M20 28h.01M26 28h.01M32 28h.01M38 28h.01M15 35h18"/>',
};
