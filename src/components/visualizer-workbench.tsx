"use client";
import { useMemo, useState } from "react";
import { Visualizer } from "./visualizer";
import { binarySearchFrames, insertionSortFrames, gridBfsFrames } from "@/lib/visualizers";
export default function VisualizerWorkbench(){
 const [kind,setKind]=useState("binary");
 const frames=useMemo(()=>kind==="binary"?binarySearchFrames([3,8,14,22,29,41,56],29):kind==="sort"?insertionSortFrames([17,6,12,4]):gridBfsFrames([[0,0,1,0],[1,0,0,0],[0,0,1,0]],[0,0]),[kind]);
 return <><label>Algorithm<select value={kind} onChange={event=>setKind(event.target.value)}><option value="binary">Binary search</option><option value="sort">Insertion sort</option><option value="grid">BFS on a grid</option></select></label><Visualizer key={kind} title={kind==="binary"?"Binary search":kind==="sort"?"Insertion sort":"BFS on a grid"} frames={frames}/></>;
}
