"use client";
import { useId, useState } from "react";
import type { RecallCard as Card, RecallAnswer } from "@/lib/foundations/lesson-engine";
import { matchesRecall } from "@/lib/foundations/lesson-engine";
import { translated } from "@/lib/foundations/translations";
import type { Rating } from "@/lib/srs";
import { useStore } from "@/store/use-store";

export function RecallCard({ card, getAnswer, onRate, preview=false }: {
  card: Card; getAnswer: () => Promise<RecallAnswer>;
  onRate: (correct: boolean, rating: Rating) => void;
  preview?: boolean;
}) {
  const id = useId();
  const language = useStore(state => state.settings.lessonLanguage);
  const copy = translated(card.copy, language);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ correct: boolean; key: RecallAnswer } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [rated, setRated] = useState(false);
  async function check() {
    if (!answer.trim() || busy) return;
    setBusy(true); setError("");
    try { const key = await getAnswer(); setResult({ correct: matchesRecall(answer, key), key }); }
    catch { setError("The recall check could not load. Keep your answer and try Check again."); }
    finally { setBusy(false); }
  }
  return <section className="learning-recall" aria-labelledby={id}>
    <h3 id={id}>{copy.content.prompt}</h3>
    {copy.missing ? <p className="muted">Not translated yet. This card uses English.</p> : null}
    <form onSubmit={event => { event.preventDefault(); void check(); }}>
      {copy.content.options ? <fieldset disabled={!!result || busy}><legend>Your recall</legend>{copy.content.options.map(option => <label className="learning-option" key={option}><input type="radio" name={id} value={option} checked={answer === option} onChange={() => setAnswer(option)}/>{option}</label>)}</fieldset>
        : <label>Your recall<input value={answer} disabled={!!result || busy} onChange={event => setAnswer(event.target.value)} autoComplete="off"/></label>}
      {!result ? <button className="btn secondary" disabled={busy || !answer.trim()}>{busy ? "Checking…" : "Check recall"}</button> : null}
    </form>
    {error ? <p role="alert">{error}</p> : null}
    {result ? <div role="status"><strong>{result.correct ? "Recalled" : "Not yet"}</strong><p>{result.key.reason}</p>{!result.correct ? <p>Answer: {result.key.answer}</p> : null}<p>{result.key.nextStep}</p></div> : null}
    {result && !rated ? <fieldset><legend>How did recalling it feel?</legend><div className="learning-actions">{(["Again", "Hard", "Good", "Easy"] as Rating[]).map(rating => <button className="btn secondary" key={rating} type="button" onClick={() => { onRate(result.correct, rating); setRated(true); }}>{rating}</button>)}</div></fieldset> : null}
    {rated&&!result?.correct?<button className="btn secondary" type="button" onClick={()=>{setAnswer("");setResult(null);setRated(false);}}>Try recalling again</button>:null}
    {rated ? <p role="status">{preview?"Demo rating complete. No learning records changed.":"Saved on this device. Continue when you are ready."}</p> : null}
  </section>;
}
