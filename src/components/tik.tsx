export function Tik({ large = false }: { large?: boolean }) {
  const keys = [0, 1, 2].flatMap((row) =>
    Array.from({ length: row === 2 ? 9 : 10 }, (_, column) => ({
      x: 94 + row * 7 + column * 29,
      y: 205 + row * 26,
    })),
  );
  const keyPath = (x: number, y: number, height = 18) =>
    `M${x + 4} ${y}h14q4 0 4 4v${height - 8}q0 4-4 4H${x + 4}q-4 0-4-4V${y + 4}q0-4 4-4z`;
  return (
    <svg
      className={large ? "typewriter-art" : "tik-mascot"}
      viewBox="0 0 480 370"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Tik, a little typewriter with a page of code"
    >
      <ellipse
        cx="243"
        cy="345"
        rx="195"
        ry="9"
        fill="var(--ink)"
        opacity=".08"
      />
      <path
        d="M83 182h316l33 118-21 28H63l-19-28z"
        fill="var(--accent-3)"
        stroke="var(--ink)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M87 182h305l24 84H64z"
        fill="var(--surface)"
        stroke="var(--ink)"
        strokeWidth="4"
      />
      <rect x="107" y="120" width="266" height="76" rx="7" fill="var(--ink)" />
      <path
        d="M133 33h203v129H133z"
        fill="var(--elevated)"
        stroke="var(--ink)"
        strokeWidth="3"
        transform="rotate(-4 235 100)"
      />
      <path
        d="M153 57h62M151 77h139M150 97h115M148 117h153"
        stroke="var(--accent-3)"
        strokeWidth="3"
        opacity=".7"
      />
      <text
        x="151"
        y="145"
        fill="var(--ink)"
        style={{ fontFamily: "var(--font-ui)", fontSize: 12 }}
        transform="rotate(-4 200 100)"
      >
        return a little better;
      </text>
      <rect
        x="85"
        y="159"
        width="310"
        height="24"
        rx="5"
        fill="var(--accent-2)"
        stroke="var(--ink)"
        strokeWidth="4"
      />
      <path
        d="M66 172H34v-25h32M395 172h43"
        stroke="var(--ink)"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={keys.map(({ x, y }) => keyPath(x + 2, y + 3, 20)).join("")}
        fill="var(--ink)"
      />
      <path
        d={keys.map(({ x, y }) => keyPath(x, y)).join("")}
        fill="var(--bg)"
        stroke="var(--ink)"
        strokeWidth="2"
      />
      <path
        d={keys.map(({ x, y }) => `M${x + 8} ${y + 8}h6`).join("")}
        stroke="var(--muted)"
        strokeWidth="2"
      />
      <rect
        x="145"
        y="288"
        width="187"
        height="16"
        rx="4"
        fill="var(--surface)"
        stroke="var(--ink)"
        strokeWidth="3"
      />
      <circle cx="390" cy="305" r="6" fill="var(--ink)" />
      <text
        x="76"
        y="311"
        fill="var(--on-accent)"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        tik.
      </text>
      <path
        d="M121 333v7M365 333v7"
        stroke="var(--ink)"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
