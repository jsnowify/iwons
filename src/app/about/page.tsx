import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Code2, HardDrive, ArrowRight } from "lucide-react";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "About Iwons",
  description:
    "A calm coding practice tool built around honest progress. Learn what Iwons Watch records, how your data stays local, and how the runtimes work.",
  alternates: { canonical: "/about/" },
};
export default function About() {
  return (
    <div className="content article">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "AboutPage",
              name: "About Iwons",
              description:
                "A calm coding practice tool built around honest progress. Learn what Iwons Watch records, how your data stays local, and how the runtimes work.",
              url: `${siteUrl}/about/`,
              author: {
                "@type": "Person",
                name: "Snowi",
                url: "https://snowi-cambronero.vercel.app/",
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: `${siteUrl}/`,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "About",
                  item: `${siteUrl}/about/`,
                },
              ],
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "Is Iwons free to use?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Iwons is completely free to use with no advertisements, paid tiers, or account requirements. All 500 challenges and 9 chapters are open.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What programming languages are supported in Iwons?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Iwons supports four runtimes: JavaScript, TypeScript, Python, and Java. Code execution happens locally inside dedicated Web Workers.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Where is my progress and code stored?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Your drafts, submissions, notes, and progress are stored entirely in your browser's localStorage. There is no remote database or user tracking backend.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Who created Iwons?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Iwons was created by Snowi, a web designer and developer (https://snowi-cambronero.vercel.app/).",
                  },
                },
              ],
            },
          ]),
        }}
      />
      <div className="eyebrow" style={{ marginBottom: 16 }}>
        THE WORK BEHIND THE WIN.
      </div>
      <h1>
        Type it. Test it. Own it<span className="accent">.</span>
      </h1>
      <p>
        There’s a particular feeling when a problem finally clicks. Iwons is a
        calm, browser-only coding practice tool built around honest progress: less noise,
        more practice, and skills you can genuinely call your own.
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
      <h2>Frequently Asked Questions</h2>
      <div className="faq-section" style={{ display: "grid", gap: "16px", margin: "20px 0" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Is Iwons free to use?</h3>
          <p style={{ margin: 0 }}>Yes. Iwons is completely free with no advertisements, subscriptions, or account walls. All 500 challenges across 9 chapters are unlocked for practice.</p>
        </div>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>What programming languages can I practice in?</h3>
          <p style={{ margin: 0 }}>You can practice in JavaScript, TypeScript, Python, and Java. User code runs safely in browser Web Workers with automatic timeouts.</p>
        </div>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Where is my data and code stored?</h3>
          <p style={{ margin: 0 }}>All progress, code drafts, and test submissions remain strictly on your local device in localStorage. No user code is ever transmitted to a remote database.</p>
        </div>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>Who created Iwons?</h3>
          <p style={{ margin: 0 }}>Iwons was designed and built by <a className="text-link" href="https://snowi-cambronero.vercel.app/">Snowi</a>, a creative web designer and developer.</p>
        </div>
      </div>
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
