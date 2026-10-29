import React, { useEffect, useState } from "react";
import { Card, ErrorBox, Loading, PageHead } from "../components/ui.jsx";
import { getJson } from "../api.js";

const NAMES = { safety: "Safety check", crack: "Crack analysis", valuation: "Valuation", planning: "Project plan", daily: "Daily advice", knowledge: "Question" };

function headline(item) {
  const r = item.result || {};
  switch (item.feature) {
    case "safety": return `${r.overall_risk} risk, ${r.hazards?.length ?? 0} hazards`;
    case "crack": return r.crack_detected ? `${r.crack_type} crack, ${r.severity}` : "No crack detected";
    case "valuation": return `${Math.round(r.estimated_value_mid ?? 0).toLocaleString()} ${r.currency}`;
    case "planning": return `${Math.round(r.total_estimated_cost ?? 0).toLocaleString()} ${r.currency}, ${r.total_duration_weeks} weeks`;
    case "daily": return `${r.advice?.overall_decision ?? ""}: ${r.advice?.summary ?? ""}`;
    case "knowledge": return item.input?.question ?? "";
    default: return "";
  }
}

export default function HistoryPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setItems(null);
    getJson(`/api/history${filter ? `?feature=${filter}` : ""}`).then((d) => setItems(d.items)).catch((e) => setError(e.message));
  }, [filter]);

  return (
    <>
      <PageHead title="History" intro="Your earlier analyses, newest first." />
      <div className="chips">
        <button className={!filter ? "chip on" : "chip"} onClick={() => setFilter("")}>All</button>
        {Object.entries(NAMES).map(([k, v]) => <button key={k} className={filter === k ? "chip on" : "chip"} onClick={() => setFilter(k)}>{v}</button>)}
      </div>
      <ErrorBox message={error} />
      {!items && !error && <Loading text="Loading history" />}
      {items && items.length === 0 && <Card><p className="muted">Nothing here yet. Run an analysis and it will appear in this list.</p></Card>}
      {items && items.length > 0 && (
        <div className="results">
          <Card wide>
            <ul className="history">{items.map((it) => (
              <li key={it.id}><b>{NAMES[it.feature] ?? it.feature}</b><span>{headline(it)}</span><time>{new Date(it.created_at).toLocaleString()}</time></li>
            ))}</ul>
          </Card>
        </div>
      )}
    </>
  );
}
