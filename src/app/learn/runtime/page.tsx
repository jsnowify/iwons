import { RuntimeCheck } from "@/components/runtime-check";
import Link from "next/link";
export const metadata={title:"Learning runtime checks",robots:{index:false,follow:false}};
export default function Page() {return <div className="learn-page"><Link prefetch={false} href="/learn/">Back to Learn</Link><h1>Before the first program.</h1><RuntimeCheck/></div>;}
