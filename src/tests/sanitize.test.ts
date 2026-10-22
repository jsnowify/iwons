import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { cleanBlock, cleanLine, cleanText } from "@/lib/text";
import { credentialSignupSchema } from "@/lib/accounts/credentials";
import { validateProblem } from "@/lib/validate-problem";

const char = (point: number) => String.fromCodePoint(point);
const RLO = char(0x202e), ZWSP = char(0x200b), ZWJ = char(0x200d), BEL = char(7), NUL = char(0), LS = char(0x2028);
const base = { username: "snowi", email: "a@b.co", password: "a-long-passphrase" };
const problem = (extra: Record<string, unknown> = {}) => ({
  title: "Sum", descriptionMd: "Add numbers.", functionName: "sum", difficulty: "easy",
  starterCode: { javascript: "", typescript: "", python: "", java: "" },
  cases: [{ input: [1], expected: 1 }], ...extra });

describe("shared text hygiene", () => {
  it("removes bidirectional, zero-width and control characters and collapses whitespace", () => {
    expect(cleanLine(`  Ada${RLO}  Lovelace${ZWSP}${BEL}  `)).toBe("Ada Lovelace");
    expect(cleanLine(`a${LS}b\n\tc`)).toBe("a b c");
    expect(cleanLine("e" + char(0x301))).toBe(char(0xe9));
  });
  it("keeps emoji joiners, caps by characters not UTF-16 units, and preserves block line breaks", () => {
    const family = ["👨", "👩", "👧"].join(ZWJ);
    expect(cleanLine(family)).toBe(family);
    expect(Array.from(cleanText("😀".repeat(50), 30))).toHaveLength(30);
    expect(cleanBlock(`one\r\ntwo${NUL}\tthree${RLO}`, 100)).toBe("one\ntwo\tthree");
    expect(cleanBlock("x".repeat(50), 10)).toHaveLength(10);
  });
});
describe("account display names", () => {
  it("strips spoofing characters and rejects over-long names", () => {
    expect(credentialSignupSchema.parse({ ...base, displayName: `Sno${RLO}wi${ZWSP}` }).displayName).toBe("Snowi");
    expect(credentialSignupSchema.parse(base).displayName).toBe("snowi");
    // Names made only of invisible characters, or containing line breaks, are rejected.
    expect(credentialSignupSchema.safeParse({ ...base, displayName: ZWSP + RLO }).success).toBe(false);
    expect(credentialSignupSchema.safeParse({ ...base, displayName: "A" + char(10) + "B" }).success).toBe(false);
    expect(credentialSignupSchema.safeParse({ ...base, displayName: "x".repeat(31) }).success).toBe(false);
    expect(credentialSignupSchema.safeParse({ ...base, displayName: "x".repeat(500) }).success).toBe(false);
  });
});
describe("custom problem validation", () => {
  it("cleans text fields and bounds sizes", () => {
    const clean = validateProblem(problem({ title: ` Sum${RLO} it `, topics: [`a${ZWSP}`, "", ...Array(20).fill("t")] }));
    expect(clean.title).toBe("Sum it");
    expect(clean.topics.length).toBeLessThanOrEqual(10);
    expect(clean.topics[0]).toBe("a");
    expect(() => validateProblem(problem({ descriptionMd: "x".repeat(20_001) }))).toThrow(/20,000/);
    expect(() => validateProblem(problem({ title: "x".repeat(401) }))).toThrow();
    expect(() => validateProblem(problem({ starterCode: { javascript: "x".repeat(20_001), typescript: "", python: "", java: "" } }))).toThrow(/starter/);
  });
});
describe("site-wide security headers", () => {
  it("are configured for every route without blocking the runners", () => {
    const headers = JSON.parse(readFileSync("vercel.json", "utf8")).headers as { source: string; headers: { key: string; value: string }[] }[];
    const all = Object.fromEntries(headers.find(item => item.source === "/(.*)")!.headers.map(item => [item.key, item.value]));
    expect(all["X-Content-Type-Options"]).toBe("nosniff");
    expect(all["X-Frame-Options"]).toBe("DENY");
    expect(all["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(all["Referrer-Policy"]).toBeTruthy();
    expect(all["Strict-Transport-Security"]).toContain("max-age=");
    // Cross-origin isolation would block the CDN-hosted Python runtime.
    expect(all["Cross-Origin-Embedder-Policy"]).toBeUndefined();
  });
});
