"use client";
import { useState, useRef } from "react";
import {
  Download,
  Upload,
  Sun,
  Moon,
  ShieldCheck,
  HardDrive,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useStore } from "@/store/use-store";
import { storage, downloadExport } from "@/lib/storage";
import { languageNames } from "@/lib/presentation";
import type { Language } from "@/lib/types";
import { Button, Modal, ProgressBar, useToast } from "./ui";
import { Onboarding } from "./onboarding";
import { ArchivePanel } from "./archive-panel";
export function SettingsPage() {
  const store = useStore(),
    toast = useToast();
  const [reset, setReset] = useState(false),
    [confirmation, setConfirmation] = useState(""),
    [importText, setImportText] = useState<string | null>(null),
    [error, setError] = useState(""),
    [onboard, setOnboard] = useState(false),
    [usageVersion, setUsageVersion] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const bytes = store.hydrated ? storage.usage() : 0;
  void usageVersion;
  function importFile(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an Iwons JSON backup under 5 MB.");
      return;
    }
    void file
      .text()
      .then((text) => {
        setImportText(text);
        setError("");
      })
      .catch(() => setError("Could not read that file."));
  }
  return (
    <div className="content settings-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR SPACE, YOUR WAY.</div>
          <h1>
            Make yourself at home<span className="accent">.</span>
          </h1>
          <p>A few preferences. A little more focus.</p>
        </div>
      </div>
      {error ? (
        <div className="error-box" role="alert">
          {error}
        </div>
      ) : null}
      <section className="settings-section">
        <div>
          <h2>Your profile</h2>
          <p>A familiar face in your practice space.</p>
        </div>
        <div className="settings-fields">
          <label>
            Display name
            <input
              maxLength={32}
              value={store.profile.name}
              onChange={(e) =>
                store.updateProfile({
                  name: e.target.value,
                  avatar: e.target.value.slice(0, 1).toUpperCase() || "I",
                })
              }
            />
          </label>
          <label>
            Default language
            <select
              value={store.settings.language}
              onChange={(e) =>
                store.updateSettings({ language: e.target.value as Language })
              }
            >
              {Object.entries(languageNames).map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>
      <section className="settings-section">
        <div>
          <h2>Appearance</h2>
          <p>Comfort for those one-more-problem evenings.</p>
        </div>
        <div className="settings-fields">
          <label>Theme</label>
          <div className="option-row">
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                className={`option-button row ${store.settings.theme === t ? "active" : ""}`}
                onClick={() => store.updateSettings({ theme: t })}
              >
                {t === "dark" ? <Moon size={15} /> : <Sun size={15} />}{" "}
                {t === "dark" ? "Night" : "Paper"}
              </button>
            ))}
          </div>
          <label className="check-row">
            <input
              type="checkbox" role="switch"
              checked={store.settings.readableText}
              onChange={(e) =>
                store.updateSettings({ readableText: e.target.checked })
              }
            />
            <span>
              Readable text{" "}
              <small>Use a clean sans font for longer reading.</small>
            </span>
          </label>
          <label className="check-row">
            <input
              type="checkbox" role="switch"
              checked={store.settings.motion}
              onChange={(e) =>
                store.updateSettings({ motion: e.target.checked })
              }
            />
            <span>
              A little motion{" "}
              <small>
                Key presses and stamped verdicts. Your
                system’s reduced-motion preference takes priority.
              </small>
            </span>
          </label>
          <label className="check-row">
            <input
              type="checkbox" role="switch"
              checked={store.settings.sound}
              onChange={(e) =>
                store.updateSettings({ sound: e.target.checked })
              }
            />
            <span>
              A tiny carriage bell{" "}
              <small>Play a soft bell on Accepted. Off by default.</small>
            </span>
          </label>
          <label className="check-row">
            <input
              type="checkbox" role="switch"
              checked={store.settings.freeBrowse}
              onChange={(e) =>
                store.updateSettings({ freeBrowse: e.target.checked })
              }
            />
            <span>
              Free browse{" "}
              <small>
                Open all released Path chapters without the 70% prerequisite.
              </small>
            </span>
          </label>
          <div className="field-grid">
            <label>
              Editor font size
              <select
                value={store.settings.fontSize}
                onChange={(e) =>
                  store.updateSettings({ fontSize: Number(e.target.value) })
                }
              >
                {[12, 13, 14, 16, 18, 20].map((n) => (
                  <option value={n} key={n}>
                    {n} px
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tab width
              <select
                value={store.settings.tabSize}
                onChange={(e) =>
                  store.updateSettings({ tabSize: Number(e.target.value) })
                }
              >
                {[2, 4, 8].map((n) => (
                  <option value={n} key={n}>
                    {n} spaces
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Practice countdown <small>0 uses a stopwatch</small>
            <input
              type="number"
              min={0}
              max={180}
              value={store.settings.countdownMinutes}
              onChange={(e) =>
                store.updateSettings({
                  countdownMinutes: Math.min(
                    180,
                    Math.max(0, Number(e.target.value)),
                  ),
                })
              }
            />
          </label>
        </div>
      </section>
      <ArchivePanel />
      <section className="settings-section">
        <div>
          <h2>Iwons Watch</h2>
          <p>A little accountability. Always transparent.</p>
        </div>
        <div className="settings-fields">
          <div className="row success">
            <ShieldCheck size={18} />
            <strong>
              {store.profile.onboarded
                ? "Enabled with your consent"
                : "Not enabled yet"}
            </strong>
          </div>
          <p>
            Watch records focus changes, time away, editor paste sizes, typing
            bursts, fullscreen exits, second Iwons tabs, and problem-text
            copies. It never records individual keystrokes.
          </p>
          <p>
            It cannot see which site, app, or browser you visit. No screenshots,
            camera access, or background uploads. Scores reflect signals and
            self-reports, not proof. All Watch data stays on this device.
          </p>
          <div className="option-row">
            {!store.profile.onboarded ? (
              <Button variant="secondary" onClick={() => setOnboard(true)}>
                Set up profile & Watch
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  store.updateProfile({ onboarded: false });
                  toast("Watch paused. Solving requires renewed consent.");
                }}
              >
                Withdraw consent
              </Button>
            )}
          </div>
          <label className="check-row">
            <input
              type="checkbox" role="switch"
              checked={store.settings.autoSubmit}
              onChange={(e) =>
                store.updateSettings({ autoSubmit: e.target.checked })
              }
            />
            <span>
              In a contest, submit automatically on the fourth fullscreen exit.
              Sessions are flagged after three exits.
            </span>
          </label>
        </div>
      </section>
      <section className="settings-section">
        <div>
          <h2>
            Java runtime <span className="badge minor">Beta</span>
          </h2>
          <p>Bring your own execution endpoint.</p>
        </div>
        <div className="settings-fields">
          <label>
            Backend
            <select
              value={store.settings.javaBackend}
              onChange={(e) =>
                store.updateSettings({
                  javaBackend: e.target.value as "remote" | "cheerpj",
                })
              }
            >
              <option value="remote">Self-hosted Judge0 CE</option>
              <option value="cheerpj" disabled>
                CheerpJ · not available
              </option>
            </select>
          </label>
          <label>
            Judge0 CE URL
            <input
              type="url"
              placeholder="https://judge.your-domain.com"
              value={store.settings.judgeUrl}
              onChange={(e) =>
                store.updateSettings({ judgeUrl: e.target.value.trim() })
              }
            />
          </label>
          <p>
            Running Java sends your solution and cases to this endpoint. Use a
            CORS-enabled instance you control. Iwons discovers the available
            Java language ID and polls for results. This integration has not
            been verified against your server.
          </p>
          <p>
            CheerpJ is not bundled: compiling source in-browser requires
            additional compiler distribution and a license suitable for your
            use.
          </p>
          <a
            href="https://ce.judge0.com/"
            target="_blank"
            rel="noreferrer"
            className="text-link accent"
          >
            Judge0 CE documentation <ExternalLink size={12} />
          </a>
        </div>
      </section>
      <section className="settings-section">
        <div>
          <h2>Local storage</h2>
          <p>Your progress belongs to you. Keep a backup.</p>
        </div>
        <div className="settings-fields">
          <div className="between">
            <span className="row">
              <HardDrive size={15} className="muted" />
              <strong className="mono" style={{ fontSize: 12 }}>
                {(bytes / 1024).toFixed(1)} KB used
              </strong>
            </span>
            <span className="muted" style={{ fontSize: 11 }}>
              ~5 MB browser limit
            </span>
          </div>
          <ProgressBar
            value={(bytes / (5 * 1024 * 1024)) * 100}
            label="Browser storage usage"
          />
          <p>
            Drafts, notes, submissions, and study data live in this browser.
            Clearing site data removes them. Only the last 20 submissions per
            problem are kept.
          </p>
          <div className="option-row">
            <Button variant="secondary" onClick={downloadExport}>
              <Download size={14} />
              Export everything
            </Button>
            <Button variant="secondary" onClick={() => input.current?.click()}>
              <Upload size={14} />
              Import backup
            </Button>
            <input
              ref={input}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                importFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              store.cleanup();
              setUsageVersion((v) => v + 1);
              toast("Kept the latest submissions and accepted solves.");
            }}
          >
            Clean up old submissions
          </Button>
        </div>
      </section>
      <section className="settings-section">
        <div>
          <h2 className="danger">Reset everything</h2>
          <p>A completely fresh start.</p>
        </div>
        <div className="settings-fields">
          <p>
            Delete all Iwons data on this device. Export a backup first if you
            might want it later.
          </p>
          <div>
            <Button variant="danger" onClick={() => setReset(true)}>
              <Trash2 size={14} />
              Reset everything
            </Button>
          </div>
        </div>
      </section>
      <Modal
        open={reset}
        onClose={() => setReset(false)}
        title="Reset your entire practice space?"
      >
        <p>
          This removes all drafts, submissions, notes, custom problems, lists,
          and profile settings on this device.
        </p>
        <Button variant="secondary" onClick={downloadExport}>
          Export a backup first
        </Button>
        <label style={{ marginTop: 20 }}>
          Type IWONS to confirm
          <input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="IWONS"
          />
        </label>
        <div className="modal-actions">
          <Button variant="secondary" onClick={() => setReset(false)}>
            Keep my data
          </Button>
          <Button
            variant="danger"
            disabled={confirmation !== "IWONS"}
            onClick={() => {
              storage.clear();
              window.location.href = "/";
            }}
          >
            Delete everything
          </Button>
        </div>
      </Modal>
      <Modal
        open={importText !== null}
        onClose={() => setImportText(null)}
        title="Restore an Iwons backup?"
      >
        <p>
          Importing replaces the Iwons data currently stored on this device.
          Export your current data if you want to keep it.
        </p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={downloadExport}>
            Export current data
          </Button>
          <Button
            onClick={() => {
              try {
                storage.import(importText!);
                window.location.reload();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Invalid backup.");
                setImportText(null);
              }
            }}
          >
            Replace with backup
          </Button>
        </div>
      </Modal>
      <Onboarding open={onboard} onClose={() => setOnboard(false)} />
    </div>
  );
}
