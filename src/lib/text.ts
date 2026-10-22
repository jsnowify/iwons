// Shared text hygiene for anything a person types and other people (or later
// sessions) may see. React already escapes markup, so this targets what escaping
// cannot: invisible and bidirectional characters that spoof names, control
// characters, runaway whitespace and unbounded length.
// The zero-width joiner (U+200D) is kept so emoji sequences still render.
const chars = (ranges: [number, number][]) => ranges
  .map(([from, to]) => (from === to ? String.fromCodePoint(from) : `${String.fromCodePoint(from)}-${String.fromCodePoint(to)}`)).join("");
// Soft hyphen, combining grapheme joiner, Arabic letter mark, zero-width space/non-joiner,
// left/right marks, bidi embeddings and overrides, word joiner, invisible operators,
// bidi isolates and the byte order mark.
const HIDDEN = new RegExp(`[${chars([[0xad, 0xad], [0x34f, 0x34f], [0x61c, 0x61c], [0x200b, 0x200c], [0x200e, 0x200f],
  [0x202a, 0x202e], [0x2060, 0x2064], [0x2066, 0x2069], [0xfeff, 0xfeff]])}]`, "g");
const CONTROL = new RegExp(String.raw`[\p{Cc}\p{Co}\p{Cs}` + chars([[0x2028, 0x2029]]) + "]", "gu");

/** One-line text: normalised, no control/hidden characters, single spaces, trimmed. */
export function cleanLine(value: string): string {
  return value.normalize("NFC").replace(HIDDEN, "").replace(CONTROL, " ").replace(/\s+/g, " ").trim();
}
/** One-line text capped to `max` Unicode characters (not UTF-16 units). */
export function cleanText(value: string, max: number): string {
  return Array.from(cleanLine(value)).slice(0, max).join("").trim();
}
/** Multi-line text: same hygiene, but keeps line breaks and tabs. */
export function cleanBlock(value: string, max: number): string {
  const kept = value.normalize("NFC").replace(/\r\n?/g, "\n").replace(HIDDEN, "")
    .replace(CONTROL, character => (character === "\n" || character === "\t" ? character : ""));
  return Array.from(kept).slice(0, max).join("").trim();
}
