# Avatar compression — Step 2 results

The server-only utility is implemented in `src/lib/avatar/compressAvatar.ts`,
with browser-safe constants in `src/lib/avatar/policy.ts` and tests in
`src/tests/avatar-compression.test.ts`. It uses the installed Sharp 0.35.5.

This step does not connect the new utility to upload routes or MongoDB yet.
The figures below describe output buffers, not images already stored in MongoDB.
The existing uploader retains its previous behavior until the later stages.

## Measured generated fixtures

All fixtures are generated, deterministic images. The photo fixture is a
1200 × 800 gradient/wave pattern encoded as JPEG, not a real phone photo.
Noise uses a seeded xorshift generator; tests contain the fixture construction.
Times are one local run and vary with machine load.

| Fixture | Small output | Large output | Quality, small / large | Probes, small / large | Final encodes, small / large | Total time |
| --- | --- | --- | --- | --- | --- | --- |
| Generated photo pattern | 1,578 B, 128 px | 3,374 B, 256 px | 85 / 85 | 1 / 1 | 1 / 1 | 65 ms |
| Transparent PNG | 210 B, 128 px | 246 B, 256 px | 85 / 85 | 1 / 1 | 1 / 1 | 404 ms |
| Rotated JPEG with GPS EXIF | 182 B, 128 px | 300 B, 256 px | 85 / 85 | 1 / 1 | 1 / 1 | 59 ms |
| Detailed RGB noise, amplitude 0.6 | 7,258 B, 128 px | 36,814 B, 256 px | 85 / 81 | 1 / 5 | 1 / 2 | 280 ms |
| Full-amplitude RGB noise | 9,194 B, 128 px | 25,512 B, 224 px | 85 / 60 | 1 / 3 | 1 / 1 | 136 ms |

The last large variant is marked `degraded: true` in internal measurements.
Its dimensions fall by 32 px; degradation is not user-facing copy. Every
successful final buffer is checked against the exact 20,000 / 40,000-byte limit.

The approved five-probe policy counts all effort-2/4 trial encodes, including
the quality-85 fast path, per variant. Effort-6 final encodes are counted
separately. The search keeps the highest tested quality whose final encode
passes, with a previously verified quality-60 fallback. It does not promise
the mathematical highest untested integer quality. An image that cannot meet
the budget within five trials is rejected rather than saved oversized.

Review artifacts from this run are under `artifacts/avatar-compression/`:
the variant WebPs and `measurements.json`. These artifacts are ignored by Git.
File suffixes identify the requested variant; inspect the recorded dimensions
because a degraded output can be smaller than the requested size.

## Verification

Passed:

- 28 new tests for signatures, JPEG/PNG/WebP/GIF decoding, renamed non-images,
  truncated input, >5 MB input, and a CRC-valid 10000 × 10000 pixel-bomb header.
- Square crop, auto-orientation before cropping, transparency, GIF first-frame
  selection, EXIF/GPS/XMP/ICC removal, fast path, real quality search, and
  a real downscale path.
- Controlled encoder tests for probe exhaustion, minimum 96 px, sharing one
  normalized PNG base, final-encode size growth, safe fallback, and deadline
  expiration without launching another encode.
- A wall-clock deadline test with a deliberately unresolved encoder, in addition
  to the injected-clock test. Production defaults to 8 seconds and cannot be
  configured above that value. Native Sharp operations also receive timeouts.
- The 5 existing avatar HTTP tests, confirming this isolated module does not
  change the current upload/remove flow: 33 relevant tests total.
- Typecheck and ESLint for the new module and tests.

Commands:

```text
npx vitest run src/tests/avatar-compression.test.ts src/tests/avatars.test.ts
npx next typegen
npm run typecheck
npx eslint src/lib/avatar src/tests/avatar-compression.test.ts --quiet
```

No browser verification is claimed for this stage: the new pipeline has no
HTTP/UI entry point yet. No database migration has been run. Build and browser
verification belong to the subsequent integration stages.
