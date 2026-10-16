import Link from "next/link";
import { DailyWarmup } from "@/components/daily-warmup";
import { recallCatalogue } from "@/lib/foundations/lesson-content";
export const metadata={title:"Daily Warm-up 3",robots:{index:false,follow:true}};
export default function Page(){return <div className="learn-page"><Link href="/learn/">Back to Learn</Link><DailyWarmup catalogue={recallCatalogue()}/></div>;}
