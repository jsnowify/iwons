import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Code2, HardDrive, ArrowRight } from "lucide-react";
export const metadata: Metadata = {
  title: "About Iwons",
  description:
    "A calm coding practice tool built around honest progress. Learn what Iwons Watch records, how your data stays local, and how the runtimes work.",
  alternates: { canonical: "/about/" },
};
export default function About() {
  return (
    <div className="content article">
      <div className="eyebrow" style={{ marginBottom: 16 }}>
        THE WORK BEHIND THE WIN.
      </div>
      <h1>
        Type it. Test it. Own it<span className="accent">.</span>
      </h1>
      <p>
        There’s a particular feeling when a problem finally clicks. Iwons is a
        little space for more of those moments: less noise, more practice, and
        progress you can honestly call your own.
      </p>
      <h2 className="row">
        <Code2 size={20} className="accent" />
        Practice with purpose
      </h2>
      <p>
        Explore 500 original challenges across nine chapters of the Iwons
        Path, from your first loop to graphs, trees and dynamic programming.
        Every problem starts with a
        function signature in JavaScript, TypeScript, Python, or Java. Run
        visible examples, try your own edge cases, then submit against the
        complete test pack.
      </p>
      <p>
        Learn the pattern, leave a note, and come back through spaced
        repetition. Hints and editorials are here to help you learn, with
        assisted attempts clearly recorded.
      </p>
      <h2 className="row">
        <ShieldCheck size={20} className="accent" />
        Honest by design
      </h2>
      <p>
        Iwons Watch records when the Iwons tab becomes hidden, when its window
        loses focus, how long you’re away, paste sizes, large typing bursts,
        fullscreen exits, and other Iwons tabs. It does not record individual
        keystrokes or send monitoring data anywhere.
      </p>
      <p>
        A page cannot see what other sites, browsers, apps, or devices you use.
        The welcome-back question is optional and every response is labeled
        self-reported. Watch scores are an honor-system signal, never evidence
        of cheating. Browser-size heuristics for developer tools are
        intentionally omitted because they are unreliable.
      </p>
      <p>
        Clean solves require an accepted submission, no hints or viewed
        editorial, and an integrity score of 100. A determined person can edit
        local data; Iwons is a practice tool, not a secure assessment system.
      </p>
      <h2 className="row">
        <HardDrive size={20} className="accent" />
        Your device is your account
      </h2>
      <p>
        Drafts, submissions, notes, lists, review dates, and custom problems
        live in your browser’s local storage. There is no Iwons backend or
        database. Use export in Settings to back up or move your data. Clearing
        site data removes your progress.
      </p>
      <h2>About the runtimes</h2>
      <p>
        JavaScript and TypeScript run in disposable web workers. Python uses
        Pyodide, downloaded lazily from jsDelivr. Each execution has a hard
        timeout so an infinite loop cannot freeze the interface. Workers protect
        responsiveness; code is not a security sandbox and should only be run
        when you trust it.
      </p>
      <p>
        Java is Beta and uses an optional self-hosted Judge0 CE endpoint
        configured in Settings. Java code and test inputs are sent to that
        endpoint only when you run Java. Browser-native Java compilation through
        CheerpJ is not bundled.
      </p>
      <h2>Ready when you are.</h2>
      <p>
        No race. No leaderboard. Just the next problem and a little more
        understanding.
      </p>
      <Link href="/problems/" className="btn">
        Find your next challenge <ArrowRight size={14} />
      </Link>
      <section aria-label="Made by Snowi"><h2>Made by Snowi</h2><p>Made by <a className="text-link" href="https://snowi-cambronero.vercel.app/">Snowi</a>, a creative web designer and developer.</p></section>
    </div>
  );
}
