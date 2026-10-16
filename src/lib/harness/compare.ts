export function compare(
  actual: unknown,
  expected: unknown,
  options: { unordered?: boolean; floatTolerance?: number } = {},
): boolean {
  if (typeof actual === "number" && typeof expected === "number")
    return Math.abs(actual - expected) <= (options.floatTolerance ?? 0);
  if (actual === expected) return true;
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    if (options.unordered) {
      const used = new Set<number>();
      return expected.every((e) => {
        const i = actual.findIndex(
          (a, j) => !used.has(j) && compare(a, e, options),
        );
        if (i < 0) return false;
        used.add(i);
        return true;
      });
    }
    return expected.every((e, i) => compare(actual[i], e, options));
  }
  if (
    actual &&
    expected &&
    typeof actual === "object" &&
    typeof expected === "object"
  ) {
    const a = actual as Record<string, unknown>,
      e = expected as Record<string, unknown>;
    const keys = Object.keys(e);
    return (
      Object.keys(a).length === keys.length &&
      keys.every((k) => Object.hasOwn(a, k) && compare(a[k], e[k], options))
    );
  }
  return false;
}
