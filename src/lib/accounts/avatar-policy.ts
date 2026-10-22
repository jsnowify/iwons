export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_HELP = "JPG, PNG, or WebP, up to 2 MB. Photos are cropped to a square.";
export const avatarUrl = (version: string) => `/api/me/avatar/?v=${encodeURIComponent(version)}`;
