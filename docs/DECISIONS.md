# Performance-pass decisions

The 2026-10-16 removal brief replaces earlier course and translation plans. Historical docs and full code are on archive/learn-v1 (63b10c1).

| Date | Decision | Reason | Reverse |
| --- | --- | --- | --- |
| 2026-10-16 | Archive full current Learn before removing it | Nothing permanently lost | Restore selected files from archive/learn-v1, applying English-only page budget |
| 2026-10-16 | Keep output export and trailing slashes | Browser-only static architecture | Explicit future hosting change |
| 2026-10-16 | Host-config redirects plus local preview equivalents | Export has no runtime redirects | Transfer rules to another static host |
| 2026-10-16 | Keep storage versions/migrations/archive records | No personal data loss or broken backups | Restore feature without rewriting stored IDs |
| 2026-10-16 | Production metadata default, no VERCEL_URL | Live source confirms preview-domain leakage | Set NEXT_PUBLIC_SITE_URL for a new production domain |
| 2026-10-16 | Benchmark a unit through its level-page anchor | No standalone unit route exists | Benchmark a real route if later introduced |
| 2026-10-16 | Isolated owned dev benchmark caches; leave user dev running | Avoid hot/cold cache mixing and workspace disruption | Stop only owned processes and clean verified temporary paths |
| 2026-10-16 | Reapply export postprocessing before browser baseline | Inspected output contained cleanup worker and dev output; postprocessing fixes production worker/404 behavior | Preserve equivalent postprocessing in revised pipeline |

No color, font or layout token changes. No new runtime dependencies. English UI only; unused legacy stored language preferences remain compatible.

| 2026-10-16 | Remove active courses and locale UI, retain compatibility-only v4-v6 schemas | Preserve backup import/export and original namespaces without shipping course content | Restore from archive/learn-v1 |
| 2026-10-16 | Move Warm-up to existing Path SRS and Visualizer to an on-demand standalone tool | Keep reusable engagement after course removal | Restore archived wrappers |
| 2026-10-16 | Remove one obsolete generated dev route type before rebuilding | Deleted source left stale Next-generated imports; fresh build regenerates current route types | Regenerate with Next |

| 2026-10-16 | Bottom audit before layout edits: 80 route/width/theme observations; 70 lack a footer, only homepage has one; zero horizontal overflows | Shared footer missing on seven main route views; problem workspace uses bounded inner scroll regions | Before screenshots and JSON in artifacts/bottom-layout/before.* |
| 2026-10-16 | Keep individual problem OG images with content-hashed filenames and stable compatibility aliases | Retains problem-specific social previews; recurring build skips Satori for unchanged content | Restore archived route handler |
