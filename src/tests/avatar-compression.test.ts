import { beforeAll, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import {
  AvatarCompressionError, compressAvatar, createAvatarCompressor, detectAvatarFormat,
  type AvatarEncoder, type CompressedAvatar,
} from "@/lib/avatar/compressAvatar";
import { AVATAR_MAX_UPLOAD_BYTES, AVATAR_VARIANTS } from "@/lib/avatar/policy";

let photo: Buffer, transparent: Buffer, rotated: Buffer, animation: Buffer;
let detailed: Buffer, noisy: Buffer;
const formats: Record<string, Buffer> = {};

function noise(amplitude: number, channels: 3 | 4 = 3) {
  const pixels = Buffer.alloc(256 * 256 * channels);
  let seed = 0x12345678;
  for (let i = 0; i < pixels.length; i++) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    pixels[i] = Math.round(128 + ((seed & 255) - 128) * amplitude);
  }
  return sharp(pixels, { raw: { width: 256, height: 256, channels } }).png().toBuffer();
}

async function assertOutputs(result: CompressedAvatar) {
  for (const name of ["small", "large"] as const) {
    const data = result[name], measured = result.measurements[name];
    const info = await sharp(data).metadata();
    expect(info.format).toBe("webp");
    expect(info.width).toBe(info.height);
    expect(info.width).toBe(measured.size);
    expect(info.width).toBeGreaterThanOrEqual(96);
    expect(info.width).toBeLessThanOrEqual(AVATAR_VARIANTS[name].size);
    expect(data.length).toBeLessThanOrEqual(AVATAR_VARIANTS[name].byteBudget);
    expect(measured.bytes).toBe(data.length);
    expect(measured.quality).toBeGreaterThanOrEqual(60);
    expect(measured.quality).toBeLessThanOrEqual(85);
    expect(measured.probeCount).toBeLessThanOrEqual(5);
    expect(measured.finalEncodeCount).toBeGreaterThanOrEqual(1);
    expect(measured.degraded).toBe(measured.size < AVATAR_VARIANTS[name].size);
    expect(info.exif).toBeUndefined();
    expect(info.xmp).toBeUndefined();
    expect(info.icc).toBeUndefined();
    expect(info.orientation).toBeUndefined();
    expect(info.pages ?? 1).toBe(1);
  }
  expect(result.measurements.durationMs).toBeLessThan(8000);
}

beforeAll(async () => {
  // Generated fixtures are deterministic; none are a user's uploaded photograph.
  const pixels = Buffer.alloc(1200 * 800 * 3);
  for (let y = 0; y < 800; y++) for (let x = 0; x < 1200; x++) {
    const i = (y * 1200 + x) * 3;
    pixels[i] = Math.round(x / 1200 * 240);
    pixels[i + 1] = Math.round(y / 800 * 240);
    pixels[i + 2] = Math.round(128 + Math.sin(x / 30) * Math.cos(y / 40) * 100);
  }
  photo = await sharp(pixels, { raw: { width: 1200, height: 800, channels: 3 } }).jpeg().toBuffer();
  for (const format of ["jpeg", "png", "webp", "gif"] as const) {
    formats[format] = await sharp(photo).resize(40, 30).toFormat(format).toBuffer();
  }
  const alpha = Buffer.alloc(256 * 256 * 4);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const i = (y * 256 + x) * 4;
    alpha[i] = 80; alpha[i + 1] = 140; alpha[i + 2] = 210; alpha[i + 3] = x < 128 ? 0 : 255;
  }
  transparent = await sharp(alpha, { raw: { width: 256, height: 256, channels: 4 } }).png().toBuffer();
  const stripe = Buffer.alloc(400 * 200 * 3);
  for (let y = 0; y < 200; y++) for (let x = 0; x < 400; x++) stripe[(y * 400 + x) * 3 + (x < 200 ? 0 : 2)] = 255;
  rotated = await sharp(stripe, { raw: { width: 400, height: 200, channels: 3 } })
    .withMetadata({ orientation: 6 })
    .withExifMerge({ IFD3: { GPSLatitudeRef: "N", GPSLatitude: "14/1 35/1 59/1",
      GPSLongitudeRef: "E", GPSLongitude: "121/1 0/1 0/1" } })
    .withXmp('<x:xmpmeta xmlns:x="adobe:ns:meta/">Private source metadata</x:xmpmeta>')
    .jpeg().toBuffer();
  const frames = Buffer.alloc(32 * 64 * 3);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 32; x++) frames[(y * 32 + x) * 3 + (y < 32 ? 0 : 2)] = 255;
  animation = await sharp(frames, { raw: { width: 32, height: 64, channels: 3, pageHeight: 32 } })
    .gif({ delay: [100, 100], loop: 0 }).toBuffer();
  detailed = await noise(0.6);
  noisy = await noise(1);
}, 20_000);

describe("avatar signatures and image validation", () => {
  for (const format of ["jpeg", "png", "webp", "gif"]) {
    it(`accepts real ${format} bytes and produces bounded WebP variants`, async () => {
      expect(detectAvatarFormat(formats[format])).toBe(format);
      await assertOutputs(await compressAvatar(formats[format]));
    });
  }

  it("accepts both GIF signatures without trusting an extension or MIME label", () => {
    expect(detectAvatarFormat(Buffer.from("GIF87a"))).toBe("gif");
    expect(detectAvatarFormat(Buffer.from("GIF89a"))).toBe("gif");
    const backed = Buffer.concat([Buffer.from("ignored"), formats.png]);
    expect(detectAvatarFormat(backed.subarray(7))).toBe("png");
  });

  for (const [name, data] of [
    ["empty file", Buffer.alloc(0)],
    ["renamed executable", Buffer.from("MZ executable renamed to photo.png")],
    ["SVG", Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')],
    ["HEIC", Buffer.from("\0\0\0\x18ftypheic")],
    ["fake RIFF", Buffer.from("RIFF1234WAVE")],
  ] as const) {
    it(`rejects ${name} before encoding`, async () => {
      const encode = vi.fn<AvatarEncoder>();
      await expect(createAvatarCompressor({ encode })(data)).rejects.toMatchObject({ code: "unsupported_type", status: 400 });
      expect(encode).not.toHaveBeenCalled();
    });
  }

  it("rejects a supported signature with truncated image data", async () => {
    await expect(compressAvatar(formats.png.subarray(0, 16))).rejects.toMatchObject({ code: "invalid_image", status: 400 });
  });

  it("rejects over 5 MB before calling the encoder", async () => {
    const encode = vi.fn<AvatarEncoder>();
    const input = Buffer.alloc(AVATAR_MAX_UPLOAD_BYTES + 1);
    input.set([0xff, 0xd8, 0xff]);
    await expect(createAvatarCompressor({ encode })(input)).rejects.toMatchObject({ code: "upload_too_large", status: 413 });
    expect(encode).not.toHaveBeenCalled();
  });

  it("rejects a 10000 × 10000 pixel-bomb header before raster decoding", async () => {
    const input = Buffer.from(formats.png);
    input.writeUInt32BE(10000, 16); input.writeUInt32BE(10000, 20);
    // Keep IHDR's CRC valid after changing its claimed dimensions.
    let crc = 0xffffffff;
    for (const byte of input.subarray(12, 29)) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    input.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 29);
    const encode = vi.fn<AvatarEncoder>();
    await expect(createAvatarCompressor({ encode })(input)).rejects.toMatchObject({ code: "pixel_limit", status: 400 });
    expect(encode).not.toHaveBeenCalled();
  });
});

describe("real Sharp normalization and adaptive compression", () => {
  it("keeps quality 85 with a single probe for a generated photo", async () => {
    const result = await compressAvatar(photo);
    await assertOutputs(result);
    for (const name of ["small", "large"] as const) expect(result.measurements[name]).toMatchObject({
      quality: 85, probeCount: 1, finalEncodeCount: 1, degraded: false, size: AVATAR_VARIANTS[name].size,
    });
  });

  it("searches quality 60–84 for a detailed generated image without downscaling", async () => {
    const result = await compressAvatar(detailed);
    await assertOutputs(result);
    expect(result.measurements.large).toMatchObject({ size: 256, degraded: false });
    expect(result.measurements.large.quality).toBeLessThanOrEqual(84);
    expect(result.measurements.large.probeCount).toBeGreaterThan(1);
  });

  it("downscales a noisy fixture in 32 px steps within the probe and byte budgets", async () => {
    const result = await compressAvatar(noisy);
    await assertOutputs(result);
    expect(result.measurements.large.degraded).toBe(true);
    expect((256 - result.measurements.large.size) % 32).toBe(0);
  });

  it("preserves transparency", async () => {
    const result = await compressAvatar(transparent);
    await assertOutputs(result);
    const { data, info } = await sharp(result.large).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    expect(data[(128 * info.width + 30) * 4 + 3]).toBe(0);
    expect(data[(128 * info.width + 220) * 4 + 3]).toBe(255);
  });

  it("orients before cropping and strips EXIF/GPS, XMP, ICC, and orientation", async () => {
    const source = await sharp(rotated).metadata();
    expect(source.orientation).toBe(6);
    expect(source.exif).toBeDefined(); expect(source.xmp).toBeDefined(); expect(source.icc).toBeDefined();
    const result = await compressAvatar(rotated);
    await assertOutputs(result);
    const { data, info } = await sharp(result.large).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const top = (40 * info.width + 128) * 3, bottom = (216 * info.width + 128) * 3;
    expect(data[top]).toBeGreaterThan(data[top + 2] + 100);
    expect(data[bottom + 2]).toBeGreaterThan(data[bottom] + 100);
  });

  it("center-crops away the outside thirds of a wide image", async () => {
    const pixels = Buffer.alloc(600 * 200 * 3);
    for (let y = 0; y < 200; y++) for (let x = 0; x < 600; x++) pixels[(y * 600 + x) * 3 + Math.floor(x / 200)] = 255;
    const image = await sharp(pixels, { raw: { width: 600, height: 200, channels: 3 } }).png().toBuffer();
    const result = await compressAvatar(image);
    const { channels } = await sharp(result.large).stats();
    expect(channels[1].mean).toBeGreaterThan(240);
    expect(channels[0].mean).toBeLessThan(15); expect(channels[2].mean).toBeLessThan(15);
  });

  it("uses only the first frame of an animated GIF", async () => {
    expect((await sharp(animation, { animated: true }).metadata()).pages).toBe(2);
    const result = await compressAvatar(animation);
    await assertOutputs(result);
    const { channels } = await sharp(result.large).stats();
    expect(channels[0].mean).toBeGreaterThan(240);
    expect(channels[2].mean).toBeLessThan(15);
  });
});

describe("compression bounds and final-encode safety", () => {
  it("keeps the best tested passing quality with no more than five trial encodes", async () => {
    const encode = vi.fn<AvatarEncoder>(async (_, options) => Buffer.alloc(options.quality <= 75 ? 1000 : options.byteBudget + 1));
    const result = await createAvatarCompressor({ encode })(photo);
    for (const name of ["small", "large"] as const) {
      expect(result.measurements[name]).toMatchObject({ quality: 75, probeCount: 5, bytes: 1000, degraded: false });
      expect(encode.mock.calls.filter(([, o]) => o.byteBudget === AVATAR_VARIANTS[name].byteBudget && o.effort !== 6)).toHaveLength(5);
    }
    const bases = encode.mock.calls.map(([base]) => base);
    expect(new Set(bases).size).toBe(1); // Normalize once and reuse the same base.
    expect((await sharp(bases[0]).metadata()).format).toBe("png");
  });

  it("does not save an oversized final encode even when its cheap probe fits", async () => {
    const encode = vi.fn<AvatarEncoder>(async (_, o) => Buffer.alloc(
      o.quality === 85 || o.effort === 6 && o.quality > 60 ? o.byteBudget + 1 : 1000,
    ));
    const result = await createAvatarCompressor({ encode })(photo);
    for (const name of ["small", "large"] as const) expect(result.measurements[name]).toMatchObject({
      quality: 60, bytes: 1000, probeCount: 5, degraded: false,
    });
  });

  it("leaves the fast path if its final effort-6 encode grows past the budget", async () => {
    const encode = vi.fn<AvatarEncoder>(async (_, o) => Buffer.alloc(o.quality === 85 && o.effort === 6 ? o.byteBudget + 1 : 1000));
    const result = await createAvatarCompressor({ encode })(photo);
    expect(result.measurements.large.quality).toBeLessThan(85);
    expect(result.large.length).toBe(1000);
  });

  it("can degrade the small variant to 96 px without changing the large variant", async () => {
    const encode = vi.fn<AvatarEncoder>(async (_, o) => Buffer.alloc(o.size === 128 ? o.byteBudget + 1 : 1000));
    const result = await createAvatarCompressor({ encode })(photo);
    expect(result.measurements.small).toMatchObject({ size: 96, quality: 60, degraded: true, probeCount: 3 });
    expect(result.measurements.large).toMatchObject({ size: 256, quality: 85, degraded: false, probeCount: 1 });
    expect(encode.mock.calls.every(([, o]) => o.size >= 96)).toBe(true);
  });

  it("fails cleanly when five trials cannot meet the budget", async () => {
    const encode = vi.fn<AvatarEncoder>(async (_, o) => Buffer.alloc(o.byteBudget === 40_000 ? o.byteBudget + 1 : 1000));
    await expect(createAvatarCompressor({ encode })(photo)).rejects.toMatchObject({ code: "budget_exceeded", status: 422 });
    const trials = encode.mock.calls.filter(([, o]) => o.byteBudget === 40_000 && o.effort !== 6);
    expect(trials).toHaveLength(5);
    expect(trials.map(([, o]) => o.size)).toEqual([256, 256, 224, 192, 160]);
  });

  it("stops subsequent work when an injected deadline expires during encoding", async () => {
    let clock = 0;
    const encode = vi.fn<AvatarEncoder>(async () => { clock = 8000; return Buffer.alloc(1000); });
    await expect(createAvatarCompressor({ now: () => clock, encode })(photo)).rejects.toMatchObject({ code: "processing_timeout", status: 503 });
    expect(encode).toHaveBeenCalledTimes(1);
  });

  it("bounds an encoder that never resolves with a wall-clock deadline", async () => {
    const encode = vi.fn<AvatarEncoder>(() => new Promise(() => {}));
    const startedAt = performance.now();
    await expect(createAvatarCompressor({ encode, processingMs: 500 })(photo)).rejects.toMatchObject({ code: "processing_timeout", status: 503 });
    expect(performance.now() - startedAt).toBeLessThan(1500);
    expect(encode.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it("does not expose native decoder errors and cannot disable the processing guard", async () => {
    const encode: AvatarEncoder = async () => { throw new Error("private decoder state"); };
    await expect(createAvatarCompressor({ encode })(photo)).rejects.toBeInstanceOf(AvatarCompressionError);
    await expect(createAvatarCompressor({ encode })(photo)).rejects.toThrow("This picture could not be read");
    for (const processingMs of [0, -1, Infinity, 8001]) expect(() => createAvatarCompressor({ processingMs })).toThrow(RangeError);
  });
});
