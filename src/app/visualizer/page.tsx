import { VisualizerGallery } from "@/components/visualizer-gallery";
export const metadata={title:"Visualizer",description:"Predict and trace binary search, insertion sort and breadth-first grid search.",alternates:{canonical:"/visualizer/"}};
export default function Page(){return <div className="content"><div className="page-heading"><div><div className="eyebrow">ONE STEP. ONE USEFUL IDEA.</div><h1>See the pattern move.</h1><p>Predict a state, move a card and inspect what changed. Nothing plays until you choose Play.</p></div></div><VisualizerGallery/></div>;}
