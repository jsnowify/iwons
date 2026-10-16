import Link from "next/link";
import { TenMinuteSession } from "@/components/ten-minute-session";
import { recallCatalogue, sessionEntries } from "@/lib/foundations/lesson-content";
export const metadata={title:"A short learning session",robots:{index:false,follow:true}};
export default function Page(){return <div className="learn-page"><Link href="/learn/">Back to Learn</Link><TenMinuteSession entries={sessionEntries()} catalogue={recallCatalogue()}/></div>;}
