import "server-only";
import sharp, { type Sharp } from "sharp";
import {
  AVATAR_MAX_INPUT_PIXELS, AVATAR_MAX_PROBES, AVATAR_MAX_UPLOAD_BYTES,
  AVATAR_MIN_SIZE, AVATAR_PROCESSING_MS, AVATAR_SIZE_STEP, AVATAR_VARIANTS,
} from "./policy";

type InputFormat = "jpeg" | "png" | "webp" | "gif";
type ErrorCode = "unsupported_type" | "invalid_image" | "upload_too_large" |
  "pixel_limit" | "budget_exceeded" | "processing_timeout";

export class AvatarCompressionError extends Error {
  constructor(public readonly code: ErrorCode, public readonly status: number, message: string) {
    super(message);
    this.name = "AvatarCompressionError";
  }
}

export function detectAvatarFormat(input: Uint8Array): InputFormat | null {
  const bytes = Buffer.from(input.buffer, input.byteOffset, Math.min(input.byteLength, 12));
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]))) return "png";
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))) return "gif";
  return null;
}

export interface AvatarVariantMeasurements {
  bytes: number;
  size: number;
  quality: number;
  probeCount: number;
  finalEncodeCount: number;
  degraded: boolean;
  durationMs: number;
}
export interface CompressedAvatar {
  small: Buffer;
  large: Buffer;
  mime: "image/webp";
  measurements: {
    small: AvatarVariantMeasurements;
    large: AvatarVariantMeasurements;
    durationMs: number;
  };
}

interface EncodingOptions {
  size: number;
  quality: number;
  effort: 2 | 4 | 6;
  byteBudget: number;
  timeoutSeconds: number;
  signal: AbortSignal;
}
// The injectable encoder exercises budget/search edge cases independently of
// libwebp's version-dependent output. Production always uses encodeWebp.
export type AvatarEncoder = (base: Buffer, options: EncodingOptions) => Promise<Buffer>;
interface CompressionDependencies {
  encode?: AvatarEncoder;
  now?: () => number;
  processingMs?: number;
}

const timedOut = () => new AvatarCompressionError("processing_timeout", 503, "Please try again.");

class ProcessingBudget {
  readonly controller = new AbortController();
  readonly startedAt: number;
  constructor(readonly now: () => number, readonly processingMs: number) {
    this.startedAt = now();
  }
  check() {
    if (this.controller.signal.aborted || this.now() - this.startedAt >= this.processingMs) throw timedOut();
  }
  secondsLeft() {
    this.check();
    return Math.max(1, Math.ceil((this.processingMs - (this.now() - this.startedAt)) / 1000));
  }
}

async function runSharp<T>(image: Sharp, signal: AbortSignal, operation: () => Promise<T>) {
  const abort = () => { image.destroy(); };
  signal.addEventListener("abort", abort, { once: true });
  try {
    if (signal.aborted) throw timedOut();
    return await operation();
  } finally {
    signal.removeEventListener("abort", abort);
    image.destroy();
  }
}

const encodeWebp: AvatarEncoder = (base, options) => {
  const image = sharp(base, { limitInputPixels: AVATAR_MAX_INPUT_PIXELS })
    .resize(options.size, options.size, { fit: "cover", position: "centre" })
    .webp({ quality: options.quality, effort: options.effort })
    .timeout({ seconds: options.timeoutSeconds });
  return runSharp(image, options.signal, () => image.toBuffer());
};

async function normalize(input: Buffer, format: InputFormat, budget: ProcessingBudget) {
  const settings = { limitInputPixels: AVATAR_MAX_INPUT_PIXELS, animated: false, failOn: "warning" } as const;
  const header = sharp(input, settings).timeout({ seconds: budget.secondsLeft() });
  const info = await runSharp(header, budget.controller.signal, () => header.metadata());
  budget.check();
  if (info.format !== format || !info.width || !info.height) {
    throw new AvatarCompressionError("invalid_image", 400, "This picture could not be read. Choose another image.");
  }
  if (info.width * info.height > AVATAR_MAX_INPUT_PIXELS) {
    throw new AvatarCompressionError("pixel_limit", 400, "Choose a picture up to 36 megapixels.");
  }
  // Decode the first frame only. Re-encoding strips EXIF, GPS, XMP, and ICC;
  // no keepMetadata/withMetadata operation belongs in the production pipeline.
  const image = sharp(input, settings).rotate()
    .resize(256, 256, { fit: "cover", position: "centre" })
    .png().timeout({ seconds: budget.secondsLeft() });
  const base = await runSharp(image, budget.controller.signal, () => image.toBuffer());
  budget.check();
  return base;
}

async function variant(base: Buffer, spec: { size: number; byteBudget: number }, budget: ProcessingBudget, encode: AvatarEncoder) {
  const startedAt = budget.now();
  let probeCount = 0, finalEncodeCount = 0;
  async function encodeAt(size: number, quality: number, effort: 2 | 4 | 6) {
    budget.check();
    if (effort === 6) finalEncodeCount++;
    else {
      if (probeCount >= AVATAR_MAX_PROBES) throw new AvatarCompressionError("budget_exceeded", 422, "This picture is too detailed. Please choose another image.");
      probeCount++;
    }
    const data = await encode(base, { size, quality, effort, byteBudget: spec.byteBudget,
      timeoutSeconds: budget.secondsLeft(), signal: budget.controller.signal });
    budget.check();
    if (!data.length) throw new AvatarCompressionError("invalid_image", 400, "This picture could not be read. Choose another image.");
    return data;
  }
  const fits = (data: Buffer) => data.length <= spec.byteBudget;
  function result(data: Buffer, size: number, quality: number) {
    return { data, measurements: { bytes: data.length, size, quality, probeCount, finalEncodeCount,
      degraded: size < spec.size, durationMs: Math.max(0, budget.now() - startedAt) } };
  }

  const fast = await encodeAt(spec.size, 85, 4);
  if (fits(fast)) {
    const final = await encodeAt(spec.size, 85, 6);
    if (fits(final)) return result(final, spec.size, 85);
  }

  // Verify a real final-quality floor before spending the remaining probes.
  // It is a safe fallback if effort 6 grows a promising cheap encode.
  const floor = await encodeAt(spec.size, 60, 2);
  const fallback = fits(floor) ? await encodeAt(spec.size, 60, 6) : null;
  if (fallback && fits(fallback)) {
    const passing: number[] = [];
    let low = 61, high = 84;
    while (low <= high && probeCount < AVATAR_MAX_PROBES) {
      const quality = Math.floor((low + high) / 2);
      if (fits(await encodeAt(spec.size, quality, 2))) {
        passing.push(quality);
        low = quality + 1;
      } else high = quality - 1;
    }
    for (const quality of passing.sort((a, b) => b - a)) {
      const final = await encodeAt(spec.size, quality, 6);
      if (fits(final)) return result(final, spec.size, quality);
    }
    return result(fallback, spec.size, 60);
  }

  for (let size = spec.size - AVATAR_SIZE_STEP; size >= AVATAR_MIN_SIZE && probeCount < AVATAR_MAX_PROBES; size -= AVATAR_SIZE_STEP) {
    if (!fits(await encodeAt(size, 60, 2))) continue;
    const final = await encodeAt(size, 60, 6);
    if (fits(final)) return result(final, size, 60);
  }
  throw new AvatarCompressionError("budget_exceeded", 422, "This picture is too detailed. Please choose another image.");
}

/** Server-only image processing. This module performs no HTTP, storage, or logging. */
export function createAvatarCompressor(deps: CompressionDependencies = {}) {
  const now = deps.now ?? (() => performance.now());
  const processingMs = deps.processingMs ?? AVATAR_PROCESSING_MS;
  if (!Number.isFinite(processingMs) || processingMs <= 0 || processingMs > AVATAR_PROCESSING_MS) {
    throw new RangeError("Avatar processing must have a deadline of at most 8 seconds.");
  }
  return async (input: Buffer): Promise<CompressedAvatar> => {
    if (input.length > AVATAR_MAX_UPLOAD_BYTES) throw new AvatarCompressionError("upload_too_large", 413, "Choose a picture up to 5 MB.");
    const format = detectAvatarFormat(input);
    if (!format) throw new AvatarCompressionError("unsupported_type", 400, "Choose a JPEG, PNG, WebP, or GIF picture.");
    const budget = new ProcessingBudget(now, processingMs);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { budget.controller.abort(); reject(timedOut()); }, processingMs);
    });
    const work = async (): Promise<CompressedAvatar> => {
      const base = await normalize(input, format, budget);
      const small = await variant(base, AVATAR_VARIANTS.small, budget, deps.encode ?? encodeWebp);
      const large = await variant(base, AVATAR_VARIANTS.large, budget, deps.encode ?? encodeWebp);
      budget.check();
      return { small: small.data, large: large.data, mime: "image/webp", measurements: {
        small: small.measurements, large: large.measurements, durationMs: Math.max(0, now() - budget.startedAt),
      } };
    };
    try {
      // libvips' native timeout excludes its queue wait. The wall-clock guard
      // also bounds queue time and prevents starting further encodes after expiry.
      return await Promise.race([work(), deadline]);
    } catch (error) {
      if (error instanceof AvatarCompressionError) throw error;
      budget.check();
      const message = error instanceof Error ? error.message : "";
      if (/timeout|timed out/i.test(message)) throw timedOut();
      if (/pixel limit/i.test(message)) throw new AvatarCompressionError("pixel_limit", 400, "Choose a picture up to 36 megapixels.");
      throw new AvatarCompressionError("invalid_image", 400, "This picture could not be read. Choose another image.");
    } finally {
      clearTimeout(timer);
      budget.controller.abort();
    }
  };
}

export const compressAvatar = createAvatarCompressor();
