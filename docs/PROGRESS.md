# Learn removal and performance pass

Updated 2026-10-16. Active brief: attachment d002c792-687c-4811-998f-86e1391ef587. This replaces course expansion. English only; preserve all personal data and backup compatibility.

Current phase: P1 removal. P0 baseline and archive recorded in PERF.md; no feature removal started yet.

| Phase | State | Remaining |
| --- | --- | --- |
| P0 Safety/baseline | Done | Dev first requests timed out; repeat after P3 |
| P1 Remove Learn/locales | Planned | Preserve storage and reusable Path features |
| P2 OG/metadata | Planned | Incremental static PNGs, production URLs, home image |
| P3 Build/bundle | Planned | Server JSON, client slices, bundlers, dead code/cache |
| P4 Runtime | Planned | Lazy code, fonts, hydration, assets and measurements |
| P4b Footer | Planned | Bottom audit, shared server footer, safe areas, checks |
| P5 Engagement | Planned | Path/runners/Watch/XP/Tik/Warm-up/Visualizer/notes smoke |
| P5b Creator | Planned | Snowi portfolio credit and metadata |
| P6 Verify | Planned | Before/after, full tests, bottom matrix, final PERF report |

Baseline: Next trace 151.801507 seconds, 1,641 entries (518 OG, 457 Learn). .next 811,532,226 bytes; cache 348,398,488. Catalog 398,817 bytes; curriculum 376,748. Full unit suite 600 passed; typecheck/lint passed. Archived Learn browser probes passed after export postprocessing. The second module remains an unfinished verification candidate.

Live HTTP 200 confirms preview-domain image URLs and no Learn nav. Config is static export with trailing slashes. Units are level-page section anchors, not independent routes.

Blockers: none for removal. Java browser checks require a configured endpoint; keep this honest. Do not retry Docker. Leave user dev server alone.

NEXT ACTION: Remove Learn routes/UI/content/validators and locale support; retain storage archives, move reusable Visualizer/Warm-up onto Path, add static-host redirects, then run all P1 gates.
