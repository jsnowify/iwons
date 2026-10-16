"use client";
import { useState } from "react";
import { Check, Plus, ShieldCheck, Search } from "lucide-react";
import { Button, Badge, Empty, Modal, ProgressBar, useToast } from "./ui";
import { useStore } from "@/store/use-store";
import { Sidebar } from "./sidebar";
export function DesignPage() {
  const [dialog, setDialog] = useState(false),
    [tab, setTab] = useState("Components"),
    [specimens, setSpecimens] = useState([false, true, true, true, true]);
  const store = useStore(),
    toast = useToast();
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE DETAILS DO THE WORK.</div>
          <h1>Iwons design system.</h1>
          <p>Tokens, components, and states in one place.</p>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            store.updateSettings({
              theme: store.settings.theme === "dark" ? "light" : "dark",
            })
          }
        >
          Switch theme
        </Button>
      </div>
      <div className="tabs" style={{ marginBottom: 24 }}>
        {["Components", "States"].map((t) => (
          <button
            className={`tab ${t === tab ? "active" : ""}`}
            onClick={() => setTab(t)}
            key={t}
          >
            {t}
          </button>
        ))}
      </div>
      <section className="card stack" style={{ marginBottom: 28 }}>
        <span className="eyebrow">PAPER & NIGHT / THE IWONS TYPE SPECIMEN</span>
        <p className="poster-specimen">
          A little ink.
          <br />A lot of possibility.
        </p>
        <p>Courier Prime keeps the margins friendly and the buttons tactile.</p>
        <span className="stamp success">Ding! Accepted.</span>
        <code>{"function helloIwons(name) { /* your next idea */ }"}</code>
        <div className="palette-grid">
          {[
            "--bg",
            "--surface",
            "--accent",
            "--accent-2",
            "--accent-3",
            "--accent-4",
            "--success",
            "--danger",
          ].map((token) => (
            <div
              className="palette-swatch"
              key={token}
              style={{
                background: `var(${token})`,
                color:
                  token === "--accent-4"
                    ? "var(--surface)"
                    : "var(--on-accent)",
              }}
            >
              <span className="swatch-label">{token}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="section-grid">
        <section className="card stack fullspan">
          <h2>Navigation and scrolling</h2>
          <p>Active keys have a heavy left edge. Locked entries keep their label. Focus or hover an icon in the compact rail to read its note.</p>
          <div className="sidebar-specimens">{specimens.map((collapsed, index) => <div className="sidebar-state-example" key={index}><p>{["Expanded", "Collapsed", "Hover", "Focus", "Pressed"][index]}</p><Sidebar specimen specimenLabel={index === 0 ? "First sidebar example" : index === 1 ? "Second sidebar example" : `${["", "", "Hover", "Focus", "Pressed"][index]} sidebar example`} toggleState={index === 2 ? "hover" : index === 3 ? "focus" : index === 4 ? "pressed" : undefined} collapsed={collapsed} onCollapse={() => setSpecimens(values => values.map((value, i) => i === index ? !value : value))} current="The Path" due={3} count={500} profile={{ name: "Mina, the office archivist", avatar: "M" }} xp={240} level={2} /></div>)}</div>
          <div className="scroll-specimen" tabIndex={0} aria-label="Scrollable paper specimen">{Array.from({ length: 20 }, (_, i) => <p key={i}>Drawer {i + 1}: a line of ink for testing native scrolling.</p>)}</div>
        </section>
        <section className="card stack">
          <h2>Buttons</h2>
          <Button onClick={() => toast("Action completed.")}>
            <Plus size={14} />
            Primary
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </section>
        <section className="card stack">
          <h2>Inputs & badges</h2>
          <label>
            Input
            <input placeholder="Focus to see the ring" />
          </label>
          <label>
            Select
            <select>
              <option>JavaScript</option>
              <option>Python</option>
            </select>
          </label>
          <div className="option-row">
            {["easy", "medium", "hard", "clean", "minor", "flagged"].map(
              (s) => (
                <Badge key={s} kind={s}>
                  {s}
                </Badge>
              ),
            )}
          </div>
          <span className="chip">Hash map</span>
          <kbd>Ctrl Enter</kbd>
        </section>
        <section className="card stack">
          <h2>Feedback</h2>
          <ProgressBar value={62} label="Example progress" />
          <div className="skeleton" style={{ height: 48 }} />
          <div className="error-box" role="status">
            An error with a useful explanation.
          </div>
          <div className="screen-note">
            Helpful context, right where you need it.
          </div>
          <Button variant="secondary" onClick={() => setDialog(true)}>
            Open dialog
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast("Saved on this device.")}
          >
            Show toast
          </Button>
        </section>
        <section className="card fullspan">
          <Empty
            title="An empty state has a next step."
            description="The right amount of context and a clear action."
            action={
              <Button onClick={() => toast("You’re ready to start.")}>
                <Check size={14} />
                Take the next step
              </Button>
            }
            icon={<ShieldCheck size={22} />}
          />
        </section>
      </div>
      <Modal
        open={dialog}
        onClose={() => setDialog(false)}
        title="A focused dialog"
      >
        <p>
          Keyboard focus stays in this dialog. Press Escape or use the close
          button to return.
        </p>
        <input aria-label="Example input" placeholder="An input to focus" />
        <div className="modal-actions">
          <Button onClick={() => setDialog(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
