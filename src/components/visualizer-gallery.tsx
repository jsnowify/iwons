"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
const Workbench=dynamic(()=>import("./visualizer-workbench"),{ssr:false,loading:()=> <p role="status">Opening the workbench…</p>});
export function VisualizerGallery(){
 const [open,setOpen]=useState(false);
 return <section><button className="btn" type="button" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{open?"Close the workbench":"Open the workbench"}</button>{open?<Workbench/>:<p>Binary search, insertion sort and a grid search. Choose when to load the interactive tools.</p>}</section>;
}
