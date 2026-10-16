"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
export function LearnNotFoundContext({modules,children}:{modules:string[];children:React.ReactNode}) {
 const [path,setPath]=useState<string|null>(null);
 // Static exports serve one 404 document. Inspect the requested URL only after
 // hydration so the initial HTML and client tree always match.
 useEffect(()=>setPath(window.location.pathname),[]);
 if(!path?.startsWith("/learn/"))return children;
 const pieces=path.split("/").filter(Boolean);
 const parent=`/${pieces.slice(0,4).join("/")}/`;
 const moduleUrl=modules.includes(parent)?parent:"/learn/";
 return <div className="content"><div className="empty"><h1>This lesson is not ready yet.</h1><p>Planned lessons are listed on the module map with a Coming soon stamp. Your saved progress is safe.</p><Link prefetch={false} className="btn" href={moduleUrl}>{moduleUrl==="/learn/"?"Return to Learn":"Return to the module"}</Link></div></div>;
}
