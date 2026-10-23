"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ArrowLeft, CheckCircle2, Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { jobResponse, type JudgeLanguage } from "@/lib/judge0/contracts";
import { Badge, Button, ProgressBar } from "./ui";
import { ErrorRetry, ListSkeleton, RoomsGate } from "./rooms-ui";
import { verdictMeta } from "./judge-ui";
import { api, messageOf, roomPath, useResource, type CustomProblem, type CustomTestCase, type Difficulty } from "@/lib/rooms/client";

const MAX_CASES = 20;
const languages: { key: JudgeLanguage; name: string }[] = [{ key: "javascript", name: "JavaScript" }, { key: "python", name: "Python" }, { key: "java", name: "Java" }];
const blank = (): CustomProblem => ({ id: "", title: "", statement: "", difficulty: "easy", validated: false, testsLocked: false, updatedAt: "",
  starterCode: { javascript: "const input = require('fs').readFileSync(0, 'utf8');\n// print your answer\n", python: "import sys\ndata = sys.stdin.read()\n# print your answer\n",
    java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner in = new Scanner(System.in);\n    }\n}\n" },
  testCases: [{ input: "", expectedOutput: "", isHidden: false }, { input: "", expectedOutput: "", isHidden: true }] });
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function Editor({ code, initial, reload }: { code: string; initial: CustomProblem; reload: () => void }) {
  const id = useId(), router = useRouter(), isNew = !initial.id, locked = initial.testsLocked;
  const [draft, setDraft] = useState<CustomProblem>(initial);
  const [starter, setStarter] = useState<JudgeLanguage>("javascript"), [errors, setErrors] = useState<string[]>([]), [saving, setSaving] = useState(false), [saved, setSaved] = useState("");
  const [language, setLanguage] = useState<JudgeLanguage>("javascript"), [reference, setReference] = useState("");
  const [validating, setValidating] = useState(false), [progress, setProgress] = useState<{ done: number; total: number } | null>(null), [outcome, setOutcome] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => setDraft(initial), [initial]);
  const change = (patch: Partial<CustomProblem>) => { setDraft(current => ({ ...current, ...patch })); setSaved(""); setErrors([]); };
  const setCase = (index: number, patch: Partial<CustomTestCase>) => change({ testCases: draft.testCases.map((item, position) => position === index ? { ...item, ...patch } : item) });
  const hidden = draft.testCases.filter(item => item.isHidden).length, visible = draft.testCases.length - hidden;
  function problems() {
    const found: string[] = [];
    if (draft.title.trim().length < 3) found.push("Give the problem a title of at least 3 characters.");
    if (draft.statement.trim().length < 10) found.push("Describe the problem in at least 10 characters.");
    if (draft.testCases.length < 2) found.push("Add at least two test cases.");
    if (!visible) found.push("Include at least one visible example.");
    if (!hidden) found.push("Include at least one hidden test.");
    if (draft.testCases.some(item => !item.expectedOutput.trim())) found.push("Every test case needs an expected output.");
    if (draft.testCases.some(item => item.input.length > 10_000 || item.expectedOutput.length > 10_000)) found.push("Keep each input and output under 10,000 characters.");
    return found;
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const found = locked ? [] : problems();
    if (found.length) { setErrors(found); return; }
    setSaving(true); setErrors([]); setSaved("");
    try {
      const body = locked ? { title: draft.title, statement: draft.statement } : { title: draft.title, statement: draft.statement, difficulty: draft.difficulty, starterCode: draft.starterCode, testCases: draft.testCases };
      if (isNew) { const created = await api<CustomProblem>(`/api/rooms/${code}/custom-problems/`, "POST", body); router.replace(roomPath(code, `custom/${created.id}/`)); return; }
      await api<CustomProblem>(`/api/rooms/${code}/custom-problems/${draft.id}/`, "PATCH", body);
      setSaved(locked ? "Title and statement saved." : "Saved. Run validation again if you changed any tests."); reload();
    } catch (cause) { setErrors([messageOf(cause)]); } finally { setSaving(false); }
  }
  async function validate() {
    if (!reference.trim()) { setOutcome({ ok: false, text: "Paste your reference solution first." }); return; }
    setValidating(true); setOutcome(null); setProgress(null);
    try {
      const { jobId } = await api<{ jobId: string }>(`/api/rooms/${code}/custom-problems/${draft.id}/validate/`, "POST", { language, code: reference });
      for (let attempt = 0; attempt < 45; attempt++) {
        await sleep(Math.min(2500, 1000 + attempt * 150));
        const state = jobResponse.parse(await api(`/api/judge/${jobId}/`));
        if (state.state === "running") { setProgress({ done: state.done, total: state.total }); continue; }
        if (state.state === "canceled") throw new Error("The check was canceled. Try again.");
        const result = state.result;
        if (result.verdict === "accepted" && result.passed === result.total) { setOutcome({ ok: true, text: `All ${result.total} test cases passed. This problem is validated.` }); reload(); return; }
        setOutcome({ ok: false, text: `${verdictMeta[result.verdict].label}: ${result.passed} of ${result.total} cases passed. ${result.failureSource === "platform" ? result.message : "Fix the reference solution or the expected outputs, then validate again."}` });
        return;
      }
      throw new Error("The check is taking longer than expected. Try again in a moment.");
    } catch (cause) { setOutcome({ ok: false, text: messageOf(cause) }); } finally { setValidating(false); setProgress(null); }
  }
  return <div className="stack">
    <form className="card auth-form room-editor" aria-label="Custom problem" noValidate onSubmit={save}>
      <div className="between wrap"><h2>{isNew ? "New custom problem" : "Edit custom problem"}</h2>
        <span className="row wrap">{draft.validated ? <Badge kind="clean"><ShieldCheck size={11} aria-hidden="true" /> Validated</Badge> : !isNew ? <Badge kind="medium">Needs validation</Badge> : null}
          {locked ? <Badge><Lock size={11} aria-hidden="true" /> Tests locked</Badge> : null}</span></div>
      {locked ? <p className="muted" role="note">Members have submitted, so the tests and starters are locked. You can still edit the title and statement.</p> : null}
      <div className="auth-field"><label htmlFor={`${id}-title`}>Title</label><input id={`${id}-title`} value={draft.title} maxLength={100} disabled={saving} onChange={event => change({ title: event.target.value })} /></div>
      <div className="auth-field"><label htmlFor={`${id}-statement`}>Statement</label>
        <textarea id={`${id}-statement`} rows={6} value={draft.statement} maxLength={10_000} disabled={saving} onChange={event => change({ statement: event.target.value })}
          aria-describedby={`${id}-statement-help`} placeholder="Describe the input, the output and any limits." />
        <small id={`${id}-statement-help`} className="muted">Plain text. Leave a blank line between paragraphs. Links and HTML are shown as text.</small></div>
      <div className="auth-field"><label htmlFor={`${id}-difficulty`}>Difficulty</label>
        <select id={`${id}-difficulty`} value={draft.difficulty} disabled={saving || locked} onChange={event => change({ difficulty: event.target.value as Difficulty })}>
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
      <fieldset className="room-starters" disabled={saving || locked}>
        <legend>Starter code</legend>
        <div className="tabs" role="tablist" aria-label="Starter language">{languages.map(item => <button key={item.key} type="button" role="tab" className={`tab ${starter === item.key ? "active" : ""}`}
          aria-selected={starter === item.key} aria-controls={`${id}-starter`} onClick={() => setStarter(item.key)}>{item.name}</button>)}</div>
        <div id={`${id}-starter`} role="tabpanel"><label htmlFor={`${id}-starter-code`} className="visually-hidden">{languages.find(item => item.key === starter)?.name} starter code</label>
          <textarea id={`${id}-starter-code`} className="mono" rows={8} maxLength={20_000} spellCheck={false} value={draft.starterCode[starter]} onChange={event => change({ starterCode: { ...draft.starterCode, [starter]: event.target.value } })} /></div>
        <small className="muted">Programs read standard input and print standard output. Java uses <code>public class Main</code>.</small>
      </fieldset>
      <fieldset className="stack" disabled={saving || locked}>
        <legend>Test cases <small className="muted">({draft.testCases.length} of {MAX_CASES} · {visible} visible · {hidden} hidden)</small></legend>
        <p className="muted">Visible cases are shown to members as examples. Hidden cases are only used for judging, and members only see whether they passed.</p>
        <ol className="room-cases">{draft.testCases.map((item, index) => <li key={index} className="room-case card">
          <div className="between"><strong>Case {index + 1}</strong>
            <span className="row"><label className="check-row"><input type="checkbox" checked={item.isHidden} onChange={event => setCase(index, { isHidden: event.target.checked })} /><span>Hidden</span></label>
              <Button type="button" variant="ghost" className="small" disabled={draft.testCases.length <= 2} onClick={() => change({ testCases: draft.testCases.filter((_, position) => position !== index) })} aria-label={`Remove case ${index + 1}`}><Trash2 size={14} aria-hidden="true" /></Button></span></div>
          <div className="room-case-fields">
            <div className="auth-field"><label htmlFor={`${id}-in-${index}`}>Input</label><textarea id={`${id}-in-${index}`} className="mono" rows={3} maxLength={10_000} spellCheck={false} value={item.input} onChange={event => setCase(index, { input: event.target.value })} /></div>
            <div className="auth-field"><label htmlFor={`${id}-out-${index}`}>Expected output</label><textarea id={`${id}-out-${index}`} className="mono" rows={3} maxLength={10_000} spellCheck={false} value={item.expectedOutput} onChange={event => setCase(index, { expectedOutput: event.target.value })} /></div>
          </div></li>)}</ol>
        <div><Button type="button" variant="secondary" className="small" disabled={draft.testCases.length >= MAX_CASES} onClick={() => change({ testCases: [...draft.testCases, { input: "", expectedOutput: "", isHidden: true }] })}><Plus size={13} aria-hidden="true" />Add test case</Button></div>
      </fieldset>
      {errors.length ? <ul className="error-box" role="alert">{errors.map(item => <li key={item}>{item}</li>)}</ul> : null}
      <p className="success" role="status">{saved}</p>
      <div className="row wrap"><Button type="submit" loading={saving}>{isNew ? "Create problem" : "Save changes"}</Button><Link className="btn secondary" href={roomPath(code)}>Back to the room</Link></div>
    </form>
    {!isNew ? <section className="card stack" aria-label="Validate">
      <h3>Validate with a reference solution</h3>
      <p className="muted">Run your own solution against every test case, including the hidden ones. A problem can be added to the room only after all cases pass{draft.validated ? "" : ", and changing a test later means validating again"}.</p>
      {draft.validated ? <p className="success" role="status"><CheckCircle2 size={15} aria-hidden="true" /> This problem is validated. {locked ? "Its tests are locked." : "Editing the tests will require validating again."}</p> : null}
      {!draft.validated ? <>
        <div className="row wrap"><label htmlFor={`${id}-language`}>Language</label>
          <select id={`${id}-language`} value={language} disabled={validating} onChange={event => setLanguage(event.target.value as JudgeLanguage)}>{languages.map(item => <option key={item.key} value={item.key}>{item.name}</option>)}</select></div>
        <div className="auth-field"><label htmlFor={`${id}-reference`}>Reference solution</label><textarea id={`${id}-reference`} className="mono" rows={8} maxLength={20_000} spellCheck={false} value={reference} disabled={validating} onChange={event => setReference(event.target.value)} /></div>
        <div><Button loading={validating} onClick={() => void validate()}>{validating ? "Validating…" : "Validate"}</Button></div>
      </> : null}
      <div aria-live="polite" aria-busy={validating}>
        {validating ? <div className="judge-running"><p className="mono">{progress && progress.total ? `Checking cases: ${progress.done} of ${progress.total} finished…` : "Sending your solution to the judge…"}</p>
          {progress && progress.total ? <ProgressBar value={(progress.done / progress.total) * 100} label="Cases finished" /> : <div className="progress-track judge-indeterminate" aria-hidden="true"><div className="progress-fill" /></div>}</div> : null}
        {outcome ? <p className={outcome.ok ? "success" : "error-box"} role={outcome.ok ? "status" : "alert"}>{outcome.text}</p> : null}
      </div>
    </section> : null}
  </div>;
}

function Custom({ code, id }: { code: string; id: string }) {
  const isNew = id === "new";
  const problem = useResource(() => isNew ? Promise.resolve(blank()) : api<CustomProblem>(`/api/rooms/${code}/custom-problems/${id}/`), [code, id]);
  return <div className="content">
    <Link href={roomPath(code)} className="text-link"><ArrowLeft size={13} aria-hidden="true" /> Back to the room</Link>
    <div className="page-heading"><div><div className="eyebrow">CUSTOM PROBLEM</div><h1>{isNew ? "Write a problem" : "Your problem"}<span className="accent">.</span></h1>
      <p>Only members of this room can see it. It never appears in the public catalog.</p></div></div>
    {problem.loading && !problem.data ? <ListSkeleton label="Loading the problem" rows={2} />
      : !problem.data ? <ErrorRetry message={problem.error ?? "This problem could not be loaded."} onRetry={problem.reload} />
        : <Editor code={code} initial={problem.data} reload={problem.reload} />}
  </div>;
}
export function RoomCustomEditor({ code, id }: { code: string; id: string }) { return <RoomsGate><Custom code={code} id={id} /></RoomsGate>; }
