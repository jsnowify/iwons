"use client";
import { useStore } from "@/store/use-store";
export function PracticeProgress({ids}:{ids:string[]}) {
  const progress = useStore(state => state.progress);
  return <span>({ids.filter(id=>progress[id]).length}/{ids.length} solved)</span>;
}
