import next from "eslint-config-next/core-web-vitals";
export default [
  ...next,
  { ignores: ["out/**", ".next/**", "artifacts/**", "public/**", "scripts/references.json", "node_modules/**"] },
  { rules: {
    // Hydration, URL filters and browser clocks intentionally synchronize after mount.
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/refs": "off",
    "react-hooks/purity": "off",
  } },
  { files: ["src/lib/watch/use-watch.ts"], rules: {
    // This existing event is also held in the Watch journal; keep its self-report behavior.
    "react-hooks/immutability": "off",
  } },
];
