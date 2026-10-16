"use client";
import type { ProblemSummary } from "@/lib/types";
type CatalogEntry = Pick<ProblemSummary, "id" | "slug" | "title" | "difficulty" | "level" | "topics">;
import Link from "next/link";
import { useState } from "react";
import { Plus, Layers, ArrowRight, Trash2, ListChecks } from "lucide-react";
import { useStore } from "@/store/use-store";
import { problemUrl } from "@/lib/presentation";
import { Button, Modal, Empty, ProgressBar, useToast, Badge } from "./ui";
export function ListsPage({problems}:{problems:CatalogEntry[]}) {
  const store = useStore(),
    toast = useToast();
  const [creating, setCreating] = useState(false),
    [name, setName] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [editing, setEditing] = useState<string | null>(null);
  const all = [...problems, ...store.customProblems];
  const active = store.lists.find((l) => l.id === editing);
  function close() {
    setCreating(false);
    setEditing(null);
    setSelected([]);
    setName("");
  }
  return (
    <div className="content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">COLLECT THE ONES THAT CLICK.</div>
          <h1>
            Your own path through<span className="accent">.</span>
          </h1>
          <p>
            Build a collection. Follow a pattern. Come back when you’re ready.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={14} />
          New list
        </Button>
      </div>
      {store.lists.length ? (
        <div className="section-grid">
          {store.lists.map((l) => {
            const count = l.problemIds.filter(
              (id) => store.progress[id],
            ).length;
            return (
              <section className="card list-card" key={l.id}>
                <div className="between">
                  <Layers size={20} className="accent" />
                  <button
                    className="icon-button"
                    aria-label={`Delete ${l.name}`}
                    onClick={() => {
                      store.setLists(store.lists.filter((x) => x.id !== l.id));
                      toast(
                        "List removed. Your problems and progress are kept.",
                      );
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h2>{l.name}</h2>
                <p>
                  {l.problemIds.length} problems · {count} solved
                </p>
                <ProgressBar
                  value={
                    l.problemIds.length
                      ? (count / l.problemIds.length) * 100
                      : 0
                  }
                  label={`${l.name} progress`}
                />
                <div className="between">
                  <span className="eyebrow">
                    {count}/{l.problemIds.length} COMPLETE
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setEditing(l.id);
                      setName(l.name);
                      setSelected(l.problemIds);
                    }}
                  >
                    Open list <ArrowRight size={13} />
                  </Button>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <Empty
            title="A little collection of your own."
            description="Save problems that challenged you, taught you a pattern, or deserve another visit."
            icon={<Layers size={24} />}
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus size={14} />
                Create your first list
              </Button>
            }
          />
        </div>
      )}
      <Modal
        open={creating || !!editing}
        onClose={close}
        title={editing ? "Your problem collection" : "Make a little collection"}
      >
        <label>
          List name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Worth another look"
          />
        </label>
        <div style={{ maxHeight: 360, overflow: "auto", marginTop: 20 }}>
          {all.map((p) => (
            <label className="list-picker" key={p.id}>
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={(e) =>
                  setSelected((ids) =>
                    e.target.checked
                      ? [...ids, p.id]
                      : ids.filter((id) => id !== p.id),
                  )
                }
              />
              <span>{p.title}</span>
              {active ? (
                <Link
                  className="icon-button"
                  href={problemUrl(p)}
                  aria-label={`Solve ${p.title}`}
                >
                  <ArrowRight size={14} />
                </Link>
              ) : null}
              <Badge kind={p.difficulty}>{p.difficulty}</Badge>
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              const list = {
                id: editing ?? crypto.randomUUID(),
                name: name.trim(),
                problemIds: selected,
              };
              store.setLists(
                editing
                  ? store.lists.map((l) => (l.id === editing ? list : l))
                  : [...store.lists, list],
              );
              toast(editing ? "List updated." : "Your collection is ready.");
              close();
            }}
          >
            <ListChecks size={14} />
            Save {selected.length} problems
          </Button>
        </div>
      </Modal>
    </div>
  );
}
