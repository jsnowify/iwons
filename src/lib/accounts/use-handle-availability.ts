"use client";
import { useEffect, useState } from "react";
import { handleAvailabilityResponse, invalidHandleReason } from "./contracts";
type Availability = "unchecked" | "checking" | "available" | "taken" | "invalid" | "reserved";
export function useHandleAvailability(handle: string, userId?: string) {
  const [result, setResult] = useState<{ handle: string; status: Availability }>({ handle: "", status: "unchecked" });
  useEffect(() => {
    if (!userId || invalidHandleReason(handle)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setResult({ handle, status: "checking" });
      void fetch(`/api/handle/available/?handle=${encodeURIComponent(handle)}`, { cache: "no-store", credentials: "same-origin",
        headers: { "X-Iwons-Account": userId }, signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) })
        .then(async response => {
          if (!response.ok) throw new Error("availability");
          return handleAvailabilityResponse.parse(await response.json());
        }).then(data => {
          if (!controller.signal.aborted) setResult({ handle, status: data.available ? "available" : data.reason ?? "unchecked" });
        }).catch(() => { if (!controller.signal.aborted) setResult({ handle, status: "unchecked" }); });
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [handle, userId]);
  if (!handle || !userId) return "unchecked";
  const invalid = invalidHandleReason(handle);
  return invalid ?? (result.handle === handle ? result.status : "checking");
}
