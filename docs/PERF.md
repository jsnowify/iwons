# Performance pass

2026-10-16. Source: removal/performance brief d002c792-687c-4811-998f-86e1391ef587. Before measurements use the existing production webpack export; local static preview port 4174. New runtime dependencies: none.

## Safety and baseline

Full implementation preserved on branch `archive/learn-v1`, commit `63b10c152434b3e78dbdfc902dc5fbb9e31b6c78`. This includes the unfinished second-module candidate, data, tests, validators and historical documentation. No user storage is deleted by the removal.

| Measure | Before | After |
| --- | ---: | ---: |
| Next build, trace duration | 151.80 s | Pending |
| Prerender manifest entries | 1,641 | Pending |
| OG route entries | 518 | Pending |
| Learn route entries | 457 | Pending |
| .next size | 811,532,226 bytes | Pending |
| .next/cache size | 348,398,488 bytes | Pending |
| catalog.json | 398,817 bytes | Pending |
| curriculum.json | 376,748 bytes | Pending |

The trace measures Next itself, excluding npm prebuild validators and postprocessing. The full old npm pipeline additionally executes 244 native course cases. Raw artifact: artifacts/performance/before.json. These are static entries including image routes, not 1,641 distinct learner-facing HTML screens.

Webpack dev with a fresh isolated cache announced ready in 1.68 s, but the first request to / and the first problem both exceeded the 45 s measurement timeout. No cold-page compile number is claimed. The existing user dev server was left running. P3 will repeat with Turbopack. Logs: artifacts/performance/before-dev.{json,log}.

### Initial script bundles

Numbers sum scripts actually referenced by each exported HTML file; gzip is measured per file. They exclude later dynamic imports, CSS, fonts and runtime downloads.

| Route | Scripts | Raw bytes | Gzip bytes |
| --- | ---: | ---: | ---: |
| / | 15 | 639,841 | 201,936 |
| /path/ | 18 | 658,962 | 208,804 |
| /path/0/ | 17 | 658,808 | 208,645 |
| /problems/receipt-arithmetic-proof-strip/ | 19 | 704,512 | 224,577 |
| /progress/ | 17 | 1,141,401 | 246,275 |
| /settings/ | 16 | 664,403 | 209,717 |

### Lighthouse baseline

One local mobile/throttled run per URL, not a field percentile. Results on this shared machine can vary. A unit currently has no standalone route: its actual URL is a section anchor on its level page. Raw Lighthouse reports are under artifacts/performance/before-*-lighthouse.json.

| Page | Performance | Accessibility | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| home (/) | 92 | 100 | 2.96 s | 180 ms | 0.0020 |
| level (/path/0/) | 76 | 94 | 2.53 s | 390 ms | 0.2329 |
| unit (/path/0/#receipt-arithmetic) | 83 | 94 | 3.37 s | 348 ms | 0.0001 |
| problem (/problems/receipt-arithmetic-proof-strip/) | 90 | 100 | 2.71 s | 280 ms | 0.0004 |

### Diagnostic verification

- Confirmed: installed Next.js 16.4.1; output export, trailingSlash true; scripts explicitly select webpack; no custom webpack plugin/config was found. Local version-matched docs say Turbopack is the default and webpack build workers are already enabled without a custom webpack config. Compatibility will be tested, not inferred from an older Next version.
- Confirmed: 518 generated OG routes, 31.6% of static entries, and 457 Learn entries, 27.8%. The claim that OG costs 40% of elapsed build time is not established by page count; P2 will measure the effect.
- Confirmed: large catalog/curriculum JSON imports enter the module graph. Server-only reads and client slices are planned; a filesystem loader must never enter a client component.
- Live https://iwons.vercel.app/ returned 200. Its source has no /learn/ nav link; og:image and twitter:image use https://iwons-gxqlfrii4-snowis-projects.vercel.app/og/receipt-arithmetic-proof-strip/. Source captured in artifacts/performance/live-home.html. The production metadata default must replace this preview-domain fallback and give home its own image.
- Keep the existing 9 chapters, 500 challenges and 54 units. Page canonicals and redirects retain trailing slashes. Static image filenames will use their normal .png file URLs.
- The inspected export had a development cleanup service worker and dev HTML. Reapplying postbuild restored the production worker and removed dev output. Baseline browser probes then passed. The revised pipeline must keep this safeguard.

## Phase results

P0 complete apart from the recorded dev cold-request timeout limitation. Typecheck/lint passed, 600 unit tests passed, current build/export checks passed. Archive Learn browser probes passed; active removal checks will replace those in P1.

P1-P6 pending. Final report will fill the After column, record blockers and restoration instructions. No speedup is claimed yet.
