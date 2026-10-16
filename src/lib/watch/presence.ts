let tabId: string;
let channel: BroadcastChannel | null = null;
export function probePresence() {
  channel?.postMessage({ type: "hello", id: tabId });
}
export function startPresence() {
  if (typeof BroadcastChannel === "undefined") return () => {};
  tabId ??= crypto.randomUUID();
  channel = new BroadcastChannel("iwons-watch");
  channel.onmessage = (e) => {
    if (!e.data || e.data.id === tabId) return;
    if (e.data.type === "hello") {
      window.dispatchEvent(new Event("iwons:multi-tab"));
      channel?.postMessage({ type: "present", id: tabId });
    } else if (e.data.type === "present")
      window.dispatchEvent(new Event("iwons:multi-tab"));
  };
  probePresence();
  return () => {
    channel?.close();
    channel = null;
  };
}
