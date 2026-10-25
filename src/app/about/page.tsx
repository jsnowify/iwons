import { creator } from "@/lib/creator";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Code2, HardDrive, ArrowRight, Compass } from "lucide-react";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "About Iwons",
  description:
    "A calm coding practice tool built around honest progress. Learn what Iwons Watch records, how guest mode and optional account sync work, and how runtimes execute.",
  alternates: { canonical: "/about/" },
};

const FAQ_ITEMS = [
  {
    q: "Is Iwons free to use?",
    a: "Yes. Iwons is completely free to use with no advertisements, paid tiers, or account walls. All 500 challenges and 9 chapters are open for practice.",
  },
  {
    q: "What programming languages are supported in Iwons?",
    a: "JavaScript, TypeScript, and Python run in browser Web Workers with automatic timeouts. The server judge supports Java for published server exercises; Java execution is not available for the browser-only challenges.",
  },
  {
    q: "Where is my progress and code stored?",
    a: "As a guest, your drafts, submissions, notes, and progress are stored entirely on your device in localStorage. You can create an optional free account with a username, email, and password to sync progress across devices. Your email stays private; email ownership is not verified.",
  },
  {
    q: "How do leaderboards work?",
    a: "Leaderboards are completely opt-in. To maintain fair rankings without compromising local guest privacy, only solutions submitted and verified through our server judge count toward public leaderboards—imported local data does not count.",
  },
  {
    q: "Is there a curriculum for beginners?",
    a: "Yes. An optional Foundation learning track is available at /foundation to build core problem-solving intuition. It is completely optional and never locks any practice challenges.",
  },
  {
    q: "Who created Iwons?",
    a: "Iwons was created by Joshua “Snowi” Cambronero, a web designer and developer (https://snowi-cambronero.vercel.app/).",
    renderVisible: () => (
      <span>
        Iwons was created by{" "}
        <a className="text-link" href="https://snowi-cambronero.vercel.app/">
          Joshua “Snowi” Cambronero
        </a>
        , a web designer and developer.
      </span>
    ),
  },
];

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
                "A calm coding practice tool built around honest progress. Learn what Iwons Watch records, how guest mode and optional account sync work, and how runtimes execute.",
              url: `${siteUrl}/about/`,
              author: creator,
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
              mainEntity: FAQ_ITEMS.map((item) => ({
                "@type": "Question",
                name: item.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.a,
                },
              })),
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
        calm coding practice tool built around honest progress: less noise,
        more practice, and skills you can genuinely call your own.
      </p>
      <h2 className="row">
        <Code2 size={20} className="accent" />
        Practice with purpose
      </h2>
      <p>
        Explore 500 original challenges across nine chapters of the Iwons
        Path, from your first loop to graphs, trees and dynamic programming.
        Every problem starts with a function signature in JavaScript, TypeScript, Python, or Java. Run
        visible examples, try your own edge cases, then submit against the
        complete test pack.
      </p>
      <p>
        Learn the pattern, leave a note, and come back through spaced
        repetition. Hints and editorials are here to help you learn, with
        assisted attempts clearly recorded.
      </p>
      <h2 className="row">
        <Compass size={20} className="accent" />
        Optional Foundation track
      </h2>
      <p>
        New to data structures or switching languages? An optional Foundation
        track is available at <Link href="/foundation/" className="text-link">/foundation</Link> to
        strengthen your fundamentals. Foundation never locks challenges—the entire catalog of 500
        problems remains completely open from day one.
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
        local data, which is why leaderboards are opt-in and only server-verified solves checked by our judge count toward public rankings—imported local solves do not count.
      </p>
      <h2 className="row">
        <HardDrive size={20} className="accent" />
        Guest mode and your data
      </h2>
      <p>
        In guest mode, your drafts, submissions, notes, lists, review dates, and custom problems
        live entirely in your browser’s local storage without an account. An optional free account with a username, email, and password is available
        if you want to sync progress across devices or join leaderboards. You can also export
        your data in Settings at any time to keep a local backup. Clearing site data removes un-synced guest progress.
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
        The server judge supports Java for published server exercises. Java
        execution is not available for the browser-only challenges.
      </p>
      <h2>Frequently Asked Questions</h2>
      <div className="faq-section" style={{ display: "grid", gap: "16px", margin: "20px 0" }}>
        {FAQ_ITEMS.map((item) => (
          <div key={item.q}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>{item.q}</h3>
            <p style={{ margin: 0 }}>{item.renderVisible ? item.renderVisible() : item.a}</p>
          </div>
        ))}
      </div>
      <h2>Ready when you are.</h2>
      <p>
        No pressure. Leaderboards are completely optional and opt-in. Just the next problem and a little more
        understanding.
      </p>
      <Link href="/problems/" className="btn">
        Find your next challenge <ArrowRight size={14} />
      </Link>
    </div>
  );
}
