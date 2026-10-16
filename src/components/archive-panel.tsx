"use client";
import { useEffect, useState } from "react";
import { Archive, Download } from "lucide-react";
import { storage } from "@/lib/storage";
import { useStore } from "@/store/use-store";
import type { Submission, LegacyArchive } from "@/lib/types";
import { Button, Modal } from "./ui";
export function ArchivePanel() {
  const archive = useStore((s) => s.archive);
  const [resolved, setResolved] = useState<LegacyArchive | null>(null);
  useEffect(() => { setResolved(archive ? storage.readArchive() : null); }, [archive]);
  if (!resolved) return null;
  const editions: LegacyArchive[] = [];
  let current: LegacyArchive | undefined = resolved;
  while (current?.data) {
    editions.push(current);
    current = current.data.archive as LegacyArchive | undefined;
  }
  return <div id="archive">{editions.map(edition => <ArchiveEdition key={edition.schemaVersion} edition={edition} />)}</div>;
}
function ArchiveEdition({ edition }: { edition: LegacyArchive }) {
  const data = edition.data!;
  const [view, setView] = useState<Submission | null>(null);
  const submissions = Array.isArray(data.submissions)
    ? (data.submissions as Submission[])
    : [];
  const drafts = Object.entries(data).filter(
    ([key, value]) => key.startsWith("drafts:") && typeof value === "string",
  );
  const notes =
    data.notes && typeof data.notes === "object"
      ? Object.entries(data.notes)
      : [];
  return (
    <section className="settings-section">
      <div>
        <h2 className="row">
          <Archive size={18} />
          Edition {edition.schemaVersion}
        </h2>
        <p>Old pages. Still your story.</p>
      </div>
      <div className="settings-fields">
        <div className="screen-note">
          Your previous collection is archived, including its submissions,
          drafts, notes, lists, and progress. It does not count toward the new
          Path.
        </div>
        <p>
          {submissions.length} submissions · {drafts.length} drafts ·{" "}
          {notes.length} notes
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob(
                [
                  JSON.stringify(
                    {
                      app: "Iwons",
                      schemaVersion: edition.schemaVersion,
                      exportedAt: new Date().toISOString(),
                      data,
                    },
                    null,
                    2,
                  ),
                ],
                { type: "application/json" },
              ),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `Iwons-edition-${edition.schemaVersion}-archive.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}
        >
          <Download size={14} />
          Export edition {edition.schemaVersion}
        </Button>
        {submissions.length ? (
          <details>
            <summary className="text-link">Browse archived submissions</summary>
            {submissions.map((s, i) => (
              <div className="review-mini" key={s.id ?? i}>
                <div>
                  <strong>Retired exercise {s.problemId}</strong>
                  <small>
                    {s.language} · {s.verdict.replaceAll("_", " ")} ·{" "}
                    {new Date(s.at).toLocaleDateString()}
                  </small>
                </div>
                <Button
                  variant="ghost"
                  className="small"
                  onClick={() => setView(s)}
                >
                  Read code →
                </Button>
              </div>
            ))}
          </details>
        ) : null}
        {drafts.length ? (
          <details>
            <summary className="text-link">Browse archived drafts</summary>
            {drafts.map(([key, value]) => (
              <details className="hint-item" key={key}>
                <summary>
                  {key.replace("drafts:", "").replaceAll(":", " · ")}
                </summary>
                <pre className="code-view" style={{ marginTop: 12 }}>
                  {String(value)}
                </pre>
              </details>
            ))}
          </details>
        ) : null}
        {notes.length ? (
          <details>
            <summary className="text-link">Browse archived notes</summary>
            {notes.map(([key, note]) => (
              <div className="hint-item" key={key}>
                <strong>Retired exercise {key}</strong>
                <pre className="prose-code">{String(note)}</pre>
              </div>
            ))}
          </details>
        ) : null}
        <Modal
          open={!!view}
          onClose={() => setView(null)}
          title={`A page from edition ${edition.schemaVersion}`}
        >
          <p>
            {view?.language} · {view?.verdict.replaceAll("_", " ")} ·{" "}
            {view?.passed}/{view?.total} cases
          </p>
          <pre className="code-view">{view?.code}</pre>
        </Modal>
      </div>
    </section>
  );
}
