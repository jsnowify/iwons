"use client";
import { useEffect, useRef, useState } from "react";
import { storage } from "@/lib/storage";
import { assembleParsons } from "@/lib/foundations/lesson-engine";
import type { Track } from "@/lib/foundations/model-v2";
import type { RunResult, TestCase } from "@/lib/types";
import { useStore } from "@/store/use-store";
import { runCode } from "@/lib/runners";

export function Parsons({ blocks, initialOrder, track, getCases, canSubmit=true, onResult, mode="program", functionName="main", javaParams, draftId }: {
  blocks: { id: string; code: string; indent: number }[]; initialOrder: string[];
  track: Track; getCases: () => Promise<TestCase[]>;
  draftId?:string; canSubmit?: boolean; onResult?:(result:RunResult)=>void;
  mode?:"function"|"operations"|"program";functionName?:string;javaParams?:string[];
}) {
  const settings = useStore(state => state.settings);
  const [order, setOrder] = useState(initialOrder), [busy, setBusy] = useState(false), [status, setStatus] = useState("");
  const [result, setResult] = useState<RunResult | null>(null);
  const controller = useRef<AbortController | null>(null);
  const blockRefs=useRef<Record<string,HTMLLIElement|null>>({});
  const currentOrder=useRef(order);currentOrder.current=order;
  useEffect(()=>{if(!draftId)return;const saved=storage.read(`drafts:parsons-${draftId}:${track}`, "");try{const value:unknown=JSON.parse(saved);if(Array.isArray(value)&&value.length===initialOrder.length&&new Set(value).size===value.length&&value.every(id=>typeof id==="string"&&initialOrder.includes(id)))setOrder(value);}catch{/* No saved arrangement yet. */}return()=>{storage.write(`drafts:parsons-${draftId}:${track}`,JSON.stringify(currentOrder.current));};},[draftId,track,initialOrder]);
  useEffect(()=>{if(!draftId)return;const flush=()=>storage.write(`drafts:parsons-${draftId}:${track}`,JSON.stringify(currentOrder.current));window.addEventListener("pagehide",flush);return()=>window.removeEventListener("pagehide",flush);},[draftId,track]);
  const dragging = useRef<string | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  function move(id: string, destination: number) {
    setOrder(current => { const next = current.filter(item => item !== id); next.splice(Math.max(0, Math.min(destination, next.length)), 0, id); return next; });
    requestAnimationFrame(()=>blockRefs.current[id]?.focus());
    setResult(null); setStatus(`Block moved to position ${destination+1}. Check the program when the order looks right.`);
  }
  async function check() {
    if(busy||!canSubmit)return;
    setBusy(true); setResult(null); controller.current = new AbortController();
    const signal = controller.current.signal;
    try {
      const cases = await getCases(); if (signal.aborted) return;
      const result = await runCode(track, { code: assembleParsons(blocks, order, track), functionName, mode, javaParams, cases, timeLimitMs: 5000, strictTypes: track === "typescript", action: "submit" }, settings, setStatus, signal);
      if (!signal.aborted) { setResult(result); onResult?.(result); setStatus(result.verdict === "accepted" ? "Your arrangement passes the tests. Explain why output must follow the lines that create its values." : "Not yet. Trace the first failing case, then move a block and check again."); }
    } catch { if (!signal.aborted) setStatus("The checks could not load. Keep your arrangement and try again."); }
    finally { if (!signal.aborted) setBusy(false); }
  }
  const unavailable = track === "java" && !settings.judgeUrl.trim();
  return <section className="learning-parsons" aria-label="Arrange the program">
    <p>Move the blocks into a working program. Use the Move up/down keys, or drag a block. Checks run your arrangement against tests; more than one working order can pass.</p>
    <ol>{order.map((id, index) => <li key={id} tabIndex={-1} ref={element=>{blockRefs.current[id]=element;}} draggable={!busy} onDragStart={() => { dragging.current = id; }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (dragging.current && !busy) move(dragging.current, index); dragging.current = null; }}>
      <pre>{"    ".repeat(blocks.find(block => block.id === id)!.indent)}{blocks.find(block => block.id === id)!.code}</pre>
      <div className="learning-actions"><button className="btn secondary" type="button" aria-label={`Move block ${index + 1} up`} disabled={busy || index === 0} onClick={() => move(id, index - 1)}>Move up</button><button className="btn secondary" type="button" aria-label={`Move block ${index + 1} down`} disabled={busy || index === order.length - 1} onClick={() => move(id, index + 1)}>Move down</button></div>
    </li>)}</ol>
    {unavailable ? <p>Run on your computer or set a Java backend in Settings. Browser checks are unavailable.</p> : null}
    <div className="learning-actions"><button className="btn" disabled={busy || unavailable || !canSubmit} onClick={() => void check()}>{busy ? "Checking…" : "Check arrangement"}</button><button className="btn secondary" disabled={busy} onClick={() => { setOrder(initialOrder); setResult(null); setStatus("Reset. Move a block to start again."); }}>Reset blocks</button></div>
    <p role="status">{status}</p>{result?.compileError ? <pre>{result.compileError.message}</pre> : null}
  </section>;
}
