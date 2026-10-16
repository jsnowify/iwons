import { problems } from "@/lib/catalog";
import { WarmUp } from "@/components/warm-up";
export const metadata={title:"Daily Warm-up 3",robots:{index:false,follow:false}};
export default function Page(){return <WarmUp problems={problems.map(({id,slug,title,difficulty,level,topics,patterns,overview,complexity})=>({id,slug,title,difficulty,level,topics,patterns,overview,complexity}))}/>;}
