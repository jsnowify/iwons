"use client";
import { useMemo, useState } from "react";
import { Visualizer } from "./visualizer";
import { binarySearchFrames, linearSearchFrames, insertionSortFrames, bubbleSortFrames, selectionSortFrames, mergeSortFrames, quickSortFrames, gridBfsFrames, gridDfsFrames } from "@/lib/visualizers";

const algorithms = [
  {id:"binary",title:"Binary search",description:"Halve a sorted search interval with each comparison.",complexity:"O(log n) time · O(1) space"},
  {id:"linear",title:"Linear search",description:"Check each card in order until the target is found.",complexity:"O(n) time · O(1) space"},
  {id:"sort",title:"Insertion sort",description:"Grow a sorted prefix by inserting one card at a time.",complexity:"O(n²) worst-case time · O(1) space"},
  {id:"bubble",title:"Bubble sort",description:"Swap adjacent cards and carry the largest to the right.",complexity:"O(n²) worst-case time · O(1) space"},
  {id:"selection",title:"Selection sort",description:"Select the smallest remaining card for each position.",complexity:"O(n²) time · O(1) space"},
  {id:"merge",title:"Merge sort",description:"Split into halves, then merge the sorted halves.",complexity:"O(n log n) time · O(n) extra space"},
  {id:"quick",title:"Quicksort",description:"Partition around a pivot, then sort each side.",complexity:"O(n log n) average · O(n²) worst-case time"},
  {id:"grid",title:"BFS on a grid",description:"Use a queue to visit reachable squares by distance.",complexity:"O(rows × columns) time and space"},
  {id:"dfs",title:"DFS on a grid",description:"Use a stack to follow each branch before returning.",complexity:"O(rows × columns) time and space"},
];
const grid=[[0,0,1,0],[1,0,0,0],[0,0,1,0]];
export default function VisualizerWorkbench() {
  const [kind,setKind]=useState("binary");
  const [sound,setSound]=useState(true);
  const algorithm=algorithms.find(item=>item.id===kind)!;
  const frames=useMemo(()=>{
    const cards=[17,6,12,4,23,9];
    switch(kind){
      case "binary":return binarySearchFrames([3,8,14,22,29,41,56],29);
      case "linear":return linearSearchFrames([17,6,12,4,23,9],23);
      case "sort":return insertionSortFrames(cards);
      case "bubble":return bubbleSortFrames(cards);
      case "selection":return selectionSortFrames(cards);
      case "merge":return mergeSortFrames(cards);
      case "quick":return quickSortFrames(cards);
      case "dfs":return gridDfsFrames(grid,[0,0]);
      default:return gridBfsFrames(grid,[0,0]);
    }
  },[kind]);
  return <div className="visualizer-workbench">
    <div className="visualizer-toolbar"><label>Algorithm<select value={kind} onChange={event=>setKind(event.target.value)}>{algorithms.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></label><div className="algorithm-summary"><p>{algorithm.description}</p><small>{algorithm.complexity}</small></div></div>
    <Visualizer key={kind} title={algorithm.title} frames={frames} sound={sound} onSoundChange={setSound}/>
  </div>;
}
