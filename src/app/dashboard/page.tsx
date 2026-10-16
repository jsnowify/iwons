import type { Metadata } from 'next';
import { Dashboard } from '@/components/dashboard';
export const metadata:Metadata={title:'Your desk',robots:{index:false,follow:false}};
export default function Page(){return <Dashboard/>;}
