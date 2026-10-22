// Shared by Next's Node configuration and the server-only session config.
// This pure decoder never reads the environment or exposes the secret to UI.
export function decodeAuthSecret(encoded = ""): Uint8Array {
  const secret = /^[a-f0-9]{64,}$/i.test(encoded) && encoded.length % 2 === 0
    ? Buffer.from(encoded, "hex") : /^[a-z0-9+/_=-]+$/i.test(encoded) ? Buffer.from(encoded, "base64url") : Buffer.alloc(0);
  if (secret.byteLength < 32) throw new Error("AUTH_SECRET must contain at least 32 random bytes encoded as base64 or hex.");
  return secret;
}
