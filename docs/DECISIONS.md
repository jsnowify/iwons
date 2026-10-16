# Build decisions

2026-10-16. The continuous-build brief replaces the earlier authoring gate. Decisions below are reversible without deleting learner data.

| Decision | Reason | How to reverse |
| --- | --- | --- |
| D1: Write Java content using local `javac --release 8`; keep browser Java Beta and explicitly unavailable without a configured Judge0 URL | New brief expressly permits this fallback; browser-only architecture retained | Configure a working endpoint and pass Hello World, Scanner and two-class browser probes before enabling runnable status |
| D2: No new runtime dependencies | Existing React, compiler, workers and CSS suffice | Requires a later explicit scope change |
| D3: Full descriptive course slugs; internal ids remain stable | Preserve stored progress while removing learner-facing abbreviations | Route aliases can be retained; never rewrite stored lesson ids |
| D4: Do not decide the page-budget fallback before translated content exists; measure the full matrix first | A projected URL count alone does not establish that the 12-minute budget is exceeded. Current missing translations use explicit English fallback, not fake locale pages | If the measured full build exceeds the budget, keep English lesson URLs and translated locale maps, switching lesson bodies on the client |
| D5: English course first in all tracks, then Tagalog and Bisaya draft translations | Keep code/cases shared and review honest | Later reviewed translations can replace draft prose without changing code |
| D6: Preserve 12/12/20 module maps and adapt idioms per track | Already matches requested course structure | Change planned entries in the seed source with a recorded teaching reason |
| D7: Full first-track exercise XP, quarter other tracks; reward successful recall/completion, never attempts/time | Avoid incentives for repetitive submission | Adjust reward constants, retaining recorded events |
| D8: Shared concept then Java, Python, JavaScript, TypeScript | Requested authoring/review order | Reorder future authoring only |
| D9: Keep the existing 500 Path problems and locks intact | Learning features must be additive | Separate explicit curriculum request |
| D10: Existing Part 7 tokens and established retro components | Preserve Paper/Night readability and recent UI fixes | Change shared tokens only under a later design request |
| Static redirects use host configuration plus exported fallback pages | Next static export cannot perform HTTP redirects by itself | On a different static host import the generated redirect map; no application backend needed |
| Minimum ready lesson prose: 250 words, individual reading segments at most 150 words | Enough explanation for beginners without a passive wall of text; interactions and code do not count toward prose | Adjust validator with documented rendered-lesson evidence |

The separate review agent is authorized by section 0.3 and will be used for content module reviews. Existing unfinished code must not be represented as a reviewed module.

- Draft lesson slips and Parsons arrangements use existing versioned string draft keys (`lesson-` / `parsons-` prefixes), so schema-6 backups retain them without another namespace migration. Preview inputs remain component-local.
- Natural-language recall terminology may explicitly opt into case-insensitive matching and accepted synonyms. Actual code/output recall stays case-sensitive by default.
- Fill, repair and Parsons exercises use a small meaningful test set when output is static. The three-visible/five-hidden rule remains mandatory for code, program, build and project exercises; duplicate static-output inputs would add no coverage.
- Authored module sources live in scripts/learning-content and are restored by seed-learn; draft modules are excluded from public ready assets, canonical lesson routes and the sitemap. Independent review evidence hashes content and keys, separate from execution/browser gates.

- Learning reward defaults: 5 XP for a successful card once per local day, 100 XP per finished module/track, plus existing first-solve/quarter-track exercise credit. Learning totals are separate from Path totals. A weekly optional freeze is allocated by the calendar week of the missed day, bridges one day, and earns no XP. These constants can change without rewriting stored outcomes.

- New successful-check records capture their local calendar day. Older records without a day use a stable UTC fallback; travelling or changing system timezone does not reallocate historical reward credit. The progress screen refreshes its current day at local midnight and on focus/visibility changes.
