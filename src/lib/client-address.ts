import { isIP } from "node:net";

/** Parses an IPv6 address into eight 16-bit groups, or null when it is not valid. */
function groupsOf(address: string): number[] | null {
  let text = address.split("%")[0].toLowerCase();
  const dotted = /(\d+\.\d+\.\d+\.\d+)$/.exec(text);
  if (dotted) {
    const parts = dotted[1].split(".").map(Number);
    if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return null;
    text = `${text.slice(0, -dotted[1].length)}${((parts[0] << 8) | parts[1]).toString(16)}:${((parts[2] << 8) | parts[3]).toString(16)}`;
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [], tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? head.length !== 8 : missing < 1) return null;
  const all = halves.length === 1 ? head : [...head, ...Array(missing).fill("0"), ...tail];
  const groups = all.map(item => (/^[0-9a-f]{1,4}$/.test(item) ? parseInt(item, 16) : NaN));
  return groups.length === 8 && groups.every(Number.isFinite) ? groups : null;
}

/**
 * The key used to rate limit one client. IPv4 addresses are used as they are, IPv4-mapped IPv6 addresses
 * become their IPv4 form, and every other IPv6 address is reduced to its /64 prefix. One subscriber normally
 * owns a whole /64, so limiting individual IPv6 addresses would let a single machine rotate through billions
 * of them. Returns null for anything that is not a valid address.
 */
export function normalizeClientAddress(raw: string | null | undefined): string | null {
  const value = raw?.split(",")[0]?.trim();
  if (!value) return null;
  const kind = isIP(value);
  if (kind === 4) return value;
  if (kind !== 6) return null;
  const groups = groupsOf(value);
  if (!groups) return null;
  if (groups.slice(0, 5).every(group => group === 0) && groups[5] === 0xffff)
    return `${groups[6] >> 8}.${groups[6] & 255}.${groups[7] >> 8}.${groups[7] & 255}`;
  return `${groups.slice(0, 4).map(group => group.toString(16)).join(":")}::/64`;
}
