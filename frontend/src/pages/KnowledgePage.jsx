import React, { useState } from "react";
import { Bullets, Card, Confidence, ErrorBox, Loading, Notes, PageHead } from "../components/ui.jsx";
import { postJson, useRun } from "../api.js";

const EXAMPLES = ["How long should I cure M25 concrete?", "What is the minimum cover for beams in a moderate exposure?", "Why is my plaster cracking?"];

export default function KnowledgePage() {
  const [q, setQ] = useState("");
  const { loading, error, data, run } = useRun();
  const ask = (question) => run(() => postJson("/api/knowledge/ask", { question }));
  const submit = (e) => { e.preventDefault(); ask(q.trim()); };
  const r = data?.result;

  return (
    <>
      <PageHead title="Ask the site engineer" intro="Ask about materials, methods, quality checks or codes. Answers are guidance; verify against the governing standard." />
      <form className="panel" onSubmit={submit}>
        <textarea rows={3} required minLength={3} maxLength={2000} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your construction question" aria-label="Question" />
        <div className="chips">{EXAMPLES.map((x) => <button type="button" key={x} className="chip" onClick={() => { setQ(x); ask(x); }}>{x}</button>)}</div>
        <button className="primary" disabled={loading || q.trim().length < 3}>Ask</button>
      </form>

      {loading && <Loading text="Looking that up" />}
      <ErrorBox message={error} />
      {r && (
        <div className="results">
          <Card title="Answer" wide>
            <p className="prose">{r.answer}</p>
            <Confidence value={r.confidence} />
            <Notes text={r.notes} />
          </Card>
          <Card title="Key points"><Bullets items={r.key_points} /></Card>
          <Card title="Standards referenced"><Bullets items={r.standards_referenced} empty="No specific standard cited." /></Card>
          <Card title="You might also ask">
            {r.follow_up_questions?.length ? <div className="chips">{r.follow_up_questions.map((x) => <button type="button" className="chip" key={x} onClick={() => { setQ(x); ask(x); }}>{x}</button>)}</div> : <p className="muted">None.</p>}
          </Card>
        </div>
      )}
    </>
  );
}
