// Decimal byte budgets, shared with the future browser uploader and HTTP layer.
export const AVATAR_MAX_UPLOAD_BYTES = 5_000_000;
export const AVATAR_MAX_INPUT_PIXELS = 36_000_000;
export const AVATAR_PROCESSING_MS = 8_000;
export const AVATAR_MAX_PROBES = 5;
export const AVATAR_MIN_SIZE = 96;
export const AVATAR_SIZE_STEP = 32;
export const AVATAR_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const AVATAR_VARIANTS = {
  small: { size: 128, byteBudget: 20_000 },
  large: { size: 256, byteBudget: 40_000 },
} as const;
