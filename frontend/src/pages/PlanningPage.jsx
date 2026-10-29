import React, { useState } from "react";
import { Bullets, Card, Confidence, ErrorBox, Field, Loading, Notes, PageHead } from "../components/ui.jsx";
import { money, postJson, useRun } from "../api.js";

const init = { project_type: "residential", built_up_area_sqft: "", floors: "1", location: "", quality: "standard", budget: "", target_months: "", currency: "INR", notes: "" };

export default function PlanningPage() {
  const [f, setF] = useState(init);
  const { loading, error, data, run } = useRun();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    run(() => postJson("/api/planning/generate", {
      project_type: f.project_type, built_up_area_sqft: Number(f.built_up_area_sqft), floors: Number(f.floors || 1),
      location: f.location.trim(), quality: f.quality, budget: f.budget === "" ? null : Number(f.budget),
      target_months: f.target_months === "" ? null : Number(f.target_months),
      currency: f.currency.trim().toUpperCase() || "INR", notes: f.notes || null,
    }));
  };

  const r = data?.result;
  const total = r?.total_duration_weeks || 1;

  return (
    <>
      <PageHead title="Project plan" intro="Estimate materials, cost and a phase-by-phase schedule, plus a written description of the building." />
      <form className="panel" onSubmit={submit}>
        <div className="row">
          <Field label="Project type">
            <select value={f.project_type} onChange={set("project_type")}>
              <option value="residential">Residential</option><option value="commercial">Commercial</option><option value="industrial">Industrial</option>
              <option value="renovation">Renovation</option><option value="road_or_civil">Road / civil</option>
            </select>
          </Field>
          <Field label="Built-up area (sq ft)"><input required type="number" min="1" step="any" value={f.built_up_area_sqft} onChange={set("built_up_area_sqft")} /></Field>
          <Field label="Floors"><input type="number" min="1" value={f.floors} onChange={set("floors")} /></Field>
          <Field label="Quality">
            <select value={f.quality} onChange={set("quality")}><option value="basic">Basic</option><option value="standard">Standard</option><option value="premium">Premium</option></select>
          </Field>
        </div>
        <div className="row">
          <Field label="Location"><input required value={f.location} onChange={set("location")} placeholder="e.g. Bhopal" maxLength={200} /></Field>
          <Field label="Budget (optional)"><input type="number" min="1" step="any" value={f.budget} onChange={set("budget")} /></Field>
          <Field label="Target months (optional)"><input type="number" min="1" value={f.target_months} onChange={set("target_months")} /></Field>
          <Field label="Currency"><input value={f.currency} onChange={set("currency")} maxLength={3} /></Field>
        </div>
        <Field label="Requirements"><input value={f.notes} onChange={set("notes")} placeholder="e.g. 3 bedrooms, east-facing entrance, stilt parking" maxLength={500} /></Field>
        <button className="primary" disabled={loading}>Generate plan</button>
      </form>

      {loading && <Loading text="Building plan" />}
      <ErrorBox message={error} />
      {r && (
        <div className="results">
          <Card title="Cost" wide>
            <p className="big">{money(r.total_estimated_cost, r.currency)}</p>
            <div className="split">
              <span>{money(r.cost_per_sqft, r.currency)} per sq ft · {r.total_duration_weeks} weeks</span>
              {r.within_budget != null && <b className={r.within_budget ? "ok" : "flag"}>{r.within_budget ? "Within budget" : "Over budget"}</b>}
              <Confidence value={r.confidence} />
            </div>
            <div className="stack" aria-label="Cost breakdown">
              {r.cost_breakdown?.map((c, i) => <i key={i} className={`seg s${i % 6}`} style={{ width: `${Math.max(c.percent, 1)}%` }} title={`${c.category}: ${c.percent}%`} />)}
            </div>
            <ul className="legend">{r.cost_breakdown?.map((c, i) => (
              <li key={i}><i className={`seg s${i % 6}`} />{c.category} <b>{money(c.amount, r.currency)}</b> <span className="muted">({c.percent}%)</span></li>
            ))}</ul>
            <Notes text={r.notes} />
          </Card>
          <Card title="Schedule" wide>
            <div className="gantt">{r.schedule?.map((p, i) => (
              <div key={i} className="gantt-row">
                <div className="gantt-label"><b>{p.phase}</b><small>Week {p.start_week + 1} to {p.start_week + p.duration_weeks}</small></div>
                <div className="gantt-track"><i style={{ left: `${(p.start_week / total) * 100}%`, width: `${Math.max((p.duration_weeks / total) * 100, 2)}%` }} /></div>
                <small className="gantt-tasks">{p.tasks?.join(", ")}</small>
              </div>
            ))}</div>
          </Card>
          <Card title="Materials" wide>
            <div className="table-wrap"><table>
              <thead><tr><th>Item</th><th>Quantity</th><th>Cost</th></tr></thead>
              <tbody>{r.materials?.map((m, i) => <tr key={i}><td>{m.item}</td><td>{m.quantity.toLocaleString()} {m.unit}</td><td>{money(m.estimated_cost, r.currency)}</td></tr>)}</tbody>
            </table></div>
          </Card>
          <Card title="Building description" wide><p className="prose">{r.architectural_visualization}</p></Card>
          <Card title="Key risks"><Bullets items={r.key_risks} /></Card>
          <Card title="Assumptions"><Bullets items={r.assumptions} /></Card>
        </div>
      )}
    </>
  );
}
