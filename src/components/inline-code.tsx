/** Renders `names` in backticks as inline code; everything else stays plain text. */
export function Inline({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/).map((part, i) => part.length > 2 && part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : part)}</>;
}
