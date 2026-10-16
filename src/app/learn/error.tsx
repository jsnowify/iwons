"use client";
export default function LearnError({reset}:{reset:()=>void}) { return <div className="learn-page" role="alert"><h1>The course index could not load.</h1><p>Your saved progress is still on this device.</p><button className="btn" onClick={reset}>Retry loading courses</button></div>; }
