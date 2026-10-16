# Learn removal and performance pass

Updated 2026-10-16. Active brief: attachment d002c792-687c-4811-998f-86e1391ef587. This replaces course expansion. English only; preserve all personal data and backup compatibility.

Current phase: P5 engagement verification. P1 removal is complete; archived personal data remains compatible.

| Phase | State | Remaining |
| --- | --- | --- |
| P0 Safety/baseline | Done | Dev first requests timed out; repeat after P3 |
| P1 Remove Learn/locales | Done | 544 unit tests, typecheck/lint/build and six browser checks passed |
| P2 OG/metadata | Done | 501 cached images; 644 route entries; metadata browser check passed |
| P3 Build/bundle | Done | Turbopack export + static workers; 56.9s build, 544 tests, five browser checks pass |
| P4 Runtime | Done | Editor/runtime interaction gates, seven Lighthouse audits and bundle graph; final repeat P6 |
| P4b Footer | Done | 80 route/width/theme observations pass; server footer and clean document flow |
| P5 Engagement | Planned | Path/runners/Watch/XP/Tik/Warm-up/Visualizer/notes smoke |
| P5b Creator | Done | About section and shared footer link to Snowi portfolio; browser check passed |
| P6 Verify | Planned | Before/after, full tests, bottom matrix, final PERF report |

Baseline: Next trace 151.801507 seconds, 1,641 entries (518 OG, 457 Learn). .next 811,532,226 bytes; cache 348,398,488. Catalog 398,817 bytes; curriculum 376,748. Full unit suite 600 passed; typecheck/lint passed. Archived Learn browser probes passed after export postprocessing. The second module remains an unfinished verification candidate.

Live HTTP 200 confirms preview-domain image URLs and no Learn nav. Config is static export with trailing slashes. Units are level-page section anchors, not independent routes.

Blockers: none for removal. Java browser checks require a configured endpoint; keep this honest. Do not retry Docker. Leave user dev server alone.

NEXT ACTION: Run full browser suite including Path/Warm-up/Visualizer/rewards/Watch/runners; finish creator credit and final performance report.
