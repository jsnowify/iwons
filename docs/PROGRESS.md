# Learn removal and performance pass

Updated 2026-10-17. Active brief: attachment d002c792-687c-4811-998f-86e1391ef587. This replaces course expansion. English only; preserve all personal data and backup compatibility.

Current phase: Complete including navigation follow-up. Default production navigation prefetch restored, Path payload trimmed, list derivations memoized and footer credit removed.

| Phase | State | Remaining |
| --- | --- | --- |
| P0 Safety/baseline | Done | Full archive and baseline retained |
| P1 Remove Learn/locales | Done | 544 unit tests, typecheck/lint/build and six browser checks passed |
| P2 OG/metadata | Done | 501 cached images; 644 route entries; metadata browser check passed |
| P3 Build/bundle | Done | Turbopack export + static workers; 56.9s build, 544 tests, five browser checks pass |
| P4 Runtime | Done | Editor/runtime interaction gates, seven Lighthouse audits and bundle graph; final repeat recorded |
| P4b Footer | Done | 80 route/width/theme observations pass; server footer and clean document flow |
| P5 Engagement | Done | 547 unit tests and all 44 browser tests pass; real JS/TS/Python, honest Java guard |
| P5b Creator | Done | About credit retained; footer credit removed by later user instruction |
| P6 Verify | Done | 44.66s build, 644 entries, final measurements and restoration instructions |

Baseline: Next trace 151.801507 seconds, 1,641 entries (518 OG, 457 Learn). .next 811,532,226 bytes; cache 348,398,488. Catalog 398,817 bytes; curriculum 376,748. Full unit suite 600 passed; typecheck/lint passed. Archived Learn browser probes passed after export postprocessing. The archived Learn snapshot includes an unfinished second module; no course work is active.

Live HTTP 200 confirms preview-domain image URLs and no Learn nav. Config is static export with trailing slashes. Units are level-page section anchors, not independent routes.

Limits: Java live execution needs a configured endpoint; its unavailable guard is verified. Some mobile LCP/TBT targets remain unmet in the recorded lab run. No deployment was performed.

NEXT ACTION: None. Navigation comparison averages 997.5 ms before / 630.5 ms after under the recorded throttled lab conditions. Build, lint, typecheck, 547 unit tests and 45 browser tests pass. See PERF.md.
