import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Code2,
  HardDrive,
} from "lucide-react";
import { getLevels, getProblems } from "@/lib/problems";
import { Tik } from "./tik";
export function Landing() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <div>
          <div className="hero-kicker">THE IWONS PRACTICE CLUB</div>
          <h1>
            Good ideas
            <br />
            start with a<br />
            <em>keystroke.</em>
          </h1>
          <p className="hero-copy">
            A playful little place to learn to code.
            <br />
            Follow the patterns, make a few mistakes,
            <br />
            and leave a little better than you arrived.
          </p>
          <div className="hero-actions">
            <Link prefetch={false} href="/path/0/" className="btn">
              Start Level 0 <ArrowRight size={16} />
            </Link>
            <Link prefetch={false} href="/path/" className="btn secondary">
              Explore the Path <ArrowUpRight size={15} />
            </Link>
          </div>
          <p className="hero-note">
            <HardDrive size={12} />
            No account. No pressure. Your progress stays with you.
          </p>
        </div>
        <div className="hero-art">
          <span className="hero-seal">
            ORIGINAL IDEAS.
            <br />
            HONEST PRACTICE.
          </span>
          <Tik large />
          <p className="art-caption">Meet Tik. Big fan of your next attempt.</p>
        </div>
      </section>
      <div className="hero-ticker">
        <span>
          <i>✳</i>{getProblems().length} ORIGINAL CHALLENGES
        </span>
        <span>
          <i>✳</i>4 WAYS TO WRITE IT
        </span>
        <span>
          <i>✳</i>NO COPY-PASTE GLORY
        </span>
        <span>
          <i>✳</i>100% YOUR PACE
        </span>
      </div>
      <section className="path-entry-keys" aria-labelledby="starting-point-heading">
        <h2 id="starting-point-heading">Choose your starting point.</h2>
        <nav aria-label="Choose your starting point">
          <Link prefetch={false} href="/path/0/"><span>New to coding?</span><strong>Start Level 0 <ArrowUpRight size={18} aria-hidden="true"/></strong><small>Build your first useful patterns</small></Link>
          <Link prefetch={false} href="/visualizer/"><span>See the idea move.</span><strong>Open the Visualizer <ArrowUpRight size={18} aria-hidden="true"/></strong><small>Trace one step at a time</small></Link>
          <Link prefetch={false} href="/path/"><span>Ready to practice?</span><strong>Jump to the Path <ArrowUpRight size={18} aria-hidden="true"/></strong><small>500 original coding challenges</small></Link>
        </nav>
      </section>
      <section className="landing-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">SMALL CHAPTERS. REAL PROGRESS.</div>
            <h2>Find your own type.</h2>
            <p>Start with the basics. The big ideas can wait their turn.</p>
          </div>
          <Link prefetch={false} href="/path/" className="text-link">
            See the whole Path <ArrowUpRight size={12} />
          </Link>
        </div>
        <div className="chapter-grid">
          {getLevels()
            .slice(0, 3)
            .map((level) => (
              <Link
                prefetch={false}
                href={`/path/${level.id}/`}
                className="chapter-card"
                key={level.id}
              >
                <div
                  className="between"
                  style={{ border: 0, margin: 0, padding: 0 }}
                >
                  <span className="level-key">0{level.id}</span>
                  <span className="eyebrow">CHAPTER {level.id + 1}</span>
                </div>
                <h3>{level.name}</h3>
                <p>
                  {level.subtitle}
                  <br />
                  {level.concepts.join(" / ")}
                </p>
                <div className="between">
                  <span>{level.count} little challenges</span>
                  <ArrowRight size={17} />
                </div>
              </Link>
            ))}
        </div>
        <p className="release-note">
          All nine chapters are ready: 500 original challenges in 54 focused units.
        </p>
      </section>
      <section className="landing-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">TYPE IT. TEST IT. OWN IT.</div>
            <h2>A good habit, in three acts.</h2>
          </div>
        </div>
        <div className="how-grid">
          {[
            [
              "01",
              "Get your bearings.",
              "A short primer, a clear task, and just enough direction. Pick your language and find the first thread.",
            ],
            [
              "02",
              "Make it click.",
              "Type an idea. Run a test. Follow the little clues. Hints are here when you need a nudge.",
            ],
            [
              "03",
              "Own the solve.",
              "Your notes, your progress, your honest attempts. Come back later and make the pattern stick.",
            ],
          ].map(([n, title, copy]) => (
            <div className="how-step" key={n}>
              <span className="step-no">{n}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="landing-footer">
        <Link prefetch={false} className="wordmark" href="/">
          Iwons
          <span className="brand-dot" />
        </Link>
        <span className="muted">A little ink. A lot of possibility.</span>
        <div className="landing-footer-links">
          <Link prefetch={false} href="/about/">
            Our little manifesto
          </Link>
          <Link prefetch={false} href="/dashboard/">
            Your desk ↗
          </Link>
        </div>
      </footer>
    </div>
  );
}
