import "server-only";
import sharp from "sharp";
import { AVATAR_MAX_BYTES, AVATAR_TYPES } from "./avatar-policy";
import { JudgeError } from "../judge0/errors";

export async function avatarBytes(request: Request) {
  if (!AVATAR_TYPES.includes(request.headers.get("content-type") ?? ""))
    throw new JudgeError(400, "Choose a JPG, PNG, or WebP photo.");
  const reader = request.body?.getReader();
  if (!reader) throw new JudgeError(400, "Choose a photo to upload.");
  const parts: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > AVATAR_MAX_BYTES) { await reader.cancel(); throw new JudgeError(413, "Choose a photo smaller than 2 MB."); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(parts);
}
export async function prepareAvatar(input: Buffer) {
  if (!input.length || input.byteLength > AVATAR_MAX_BYTES) throw new JudgeError(400, "Choose a photo up to 2 MB.");
  // Reject vector/document input before handing bytes to an image decoder.
  const signature = input.subarray(0, 12);
  const raster = signature.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ||
    signature.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    signature.toString("ascii", 0, 4) === "RIFF" && signature.toString("ascii", 8, 12) === "WEBP";
  if (!raster) throw new JudgeError(400, "This photo could not be read. Choose a JPG, PNG, or WebP.");
  try {
    const image = sharp(input, { limitInputPixels: 16_000_000, failOn: "warning" });
    const info = await image.metadata();
    if (!["jpeg", "png", "webp"].includes(info.format ?? "") || (info.pages ?? 1) > 1)
      throw new Error("Unsupported photo.");
    // Re-encoding strips EXIF/location metadata. Original files are never kept.
    const result = await image.autoOrient().resize(256, 256, { fit: "cover" })
      .webp({ quality: 82 }).timeout({ seconds: 5 }).toBuffer();
    if (result.length > 128 * 1024) throw new Error("Photo too large.");
    return result;
  } catch { throw new JudgeError(400, "This photo could not be read. Use a still image under 16 megapixels."); }
}
