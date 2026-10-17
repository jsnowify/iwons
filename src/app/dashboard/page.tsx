import { problems } from "@/lib/catalog";
import type { Metadata } from 'next';
import { Dashboard } from '@/components/dashboard';
export const metadata: Metadata = {
  title: "Your desk",
  description: "Your personal Iwons practice desk and problem workspace.",
  alternates: { canonical: "/dashboard/" },
};
export default function Page(){return <Dashboard problems={problems.map(({id,slug,title,difficulty,level,topics,patterns})=>({id,slug,title,difficulty,level,topics,patterns}))}/>;}
