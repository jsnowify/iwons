export function safeReturnTo(value: unknown): string {
  if (typeof value !== "string" || value.length > 2000 || !value.startsWith("/")) return "/";
  let decoded = value;
  try {
    for (let i = 0; i < 3; i++) {
      if (!decoded.startsWith("/") || decoded.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(decoded)) return "/";
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
    if (decoded.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(decoded)) return "/";
    const url = new URL(value, "https://iwons.invalid");
    if (url.origin !== "https://iwons.invalid" || /^\/(login|signup)(\/|$)/.test(url.pathname)) return "/";
    return url.pathname + url.search + url.hash;
  } catch { return "/"; }
}
