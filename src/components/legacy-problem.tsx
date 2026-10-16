import Link from "next/link";
import { Archive, ArrowRight } from "lucide-react";
export function LegacyProblem() {
  return (
    <div className="content article">
      <span className="eyebrow">A NEW CHAPTER FOR IWONS.</span>
      <h1 style={{ marginTop: 16 }}>
        This page has turned<span className="accent">.</span>
      </h1>
      <p>
        The old exercise collection has retired. Its place is taken by the Iwons
        Path: original print-shop challenges that grow with you, starting with
        the basics.
      </p>
      <div className="archive-note">
        <strong className="row">
          <Archive size={17} />
          Your old work is still yours.
        </strong>
        <p>
          Previous submissions, drafts, notes, and progress are preserved on
          your device in the legacy archive. You can inspect or export them from
          Settings.
        </p>
      </div>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <Link href="/path/" className="btn">
          Meet the new Path <ArrowRight size={14} />
        </Link>
        <Link href="/settings/#archive" className="btn secondary">
          Open your archive
        </Link>
      </div>
    </div>
  );
}
