export class ListNode {
  constructor(
    public val = 0,
    public next: ListNode | null = null,
  ) {}
}
export class TreeNode {
  constructor(
    public val = 0,
    public left: TreeNode | null = null,
    public right: TreeNode | null = null,
  ) {}
}
export function buildList(values: number[], pos = -1) {
  const nodes = values.map((v) => new ListNode(v));
  nodes.forEach((n, i) => (n.next = nodes[i + 1] ?? null));
  if (nodes.length && pos >= 0) nodes[nodes.length - 1].next = nodes[pos];
  return nodes[0] ?? null;
}
export function buildTree(a: (number | null)[]) {
  if (!a.length || a[0] === null) return null;
  const root = new TreeNode(a[0]),
    q = [root];
  let i = 1;
  for (let j = 0; j < q.length && i < a.length; j++)
    for (const side of ["left", "right"] as const) {
      const v = a[i++];
      if (v != null) {
        q[j][side] = new TreeNode(v);
        q.push(q[j][side]!);
      }
    }
  return root;
}
export function serializeNode(value: unknown, kind?: "list" | "tree"): unknown {
  if (kind === "list") {
    const out: number[] = [];
    let n = value as ListNode | null;
    const seen = new Set<ListNode>();
    while (n) {
      if (seen.has(n) || out.length > 10000)
        throw new Error("Result contains a cycle.");
      seen.add(n);
      out.push(n.val);
      n = n.next;
    }
    return out;
  }
  if (kind === "tree") {
    if (!value) return [];
    const q: (TreeNode | null)[] = [value as TreeNode],
      a: (number | null)[] = [];
    for (let i = 0; i < q.length; i++) {
      if (i > 20000) throw new Error("Tree result is too large or cyclic.");
      const n = q[i];
      a.push(n ? n.val : null);
      if (n) q.push(n.left, n.right);
    }
    while (a.at(-1) === null) a.pop();
    return a;
  }
  return value === undefined ? null : value;
}
