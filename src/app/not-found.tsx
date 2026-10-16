import Link from "next/link";
export default function NotFound() {
  return (
    <div className="content">
      <div className="empty">
        <span className="eyebrow">404 · UNDEFINED</span>
        <h1>This path needs a return statement.</h1>
        <p>Head back to your practice space and pick up a problem.</p>
        <Link href="/problems/" className="btn">
          Browse problems
        </Link>
      </div>
    </div>
  );
}
