import Link from 'next/link';
export function Footer(){
 return <footer className="site-footer"><div className="footer-inner"><Link href="/" className="wordmark" aria-label="Iwons home">Iwons<span className="brand-dot"/></Link><nav aria-label="Footer"><Link href="/path/">The Path</Link><Link href="/problems/">The problems</Link><Link href="/dashboard/">Your desk</Link><Link href="/about/">About</Link></nav><p className="footer-credit">Made by <a href="https://snowi-cambronero.vercel.app/">Snowi</a></p></div></footer>;
}
