import React, { useState } from "react";
import { Bullets, Card, Confidence, ErrorBox, Field, Loading, Notes, PageHead } from "../components/ui.jsx";
import { postJson, useRun } from "../api.js";

const PRESETS = ["Concrete pour", "Crane lifting", "Excavation", "Roofing", "Brick masonry", "Painting", "Scaffolding"];
const DECISION = { go: "Go", caution: "Caution", postpone: "Postpone" };

export default function DailyPage() {
  const [location, setLocation] = useState("");
  const [acts, setActs] = useState([]);
  const [custom, setCustom] = useState("");
  const [crew, setCrew] = useState("");
  const { loading, error, data, run } = useRun();

  const toggle = (a) => setActs(acts.includes(a) ? acts.filter((x) => x !== a) : [...acts, a]);
  const addCustom = () => {
    const v = custom.trim();
    if (v && !acts.includes(v)) setActs([...acts, v]);
    setCustom("");
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => postJson("/api/daily/advise", { site_location: location.trim(), activities: acts, crew_size: crew === "" ? null : Number(crew) }));
  };

  const r = data?.result;
  const w = r?.weather;
  return (
    <>
      <PageHead title="Today on site" intro="Pick today's activities to get a go, caution or postpone call for each, based on live weather at your site." />
      <form className="panel" onSubmit={submit}>
        <div className="row">
          <Field label="Site location" hint="City or town name works best"><input required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Indore" maxLength={200} /></Field>
          <Field label="Crew size (optional)"><input type="number" min="1" value={crew} onChange={(e) => setCrew(e.target.value)} /></Field>
        </div>
        <fieldset className="chips"><legend>Activities today</legend>
          {[...PRESETS, ...acts.filter((a) => !PRESETS.includes(a))].map((a) => (
            <button type="button" key={a} className={acts.includes(a) ? "chip on" : "chip"} aria-pressed={acts.includes(a)} onClick={() => toggle(a)}>{a}</button>
          ))}
        </fieldset>
        <div className="row inline">
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add another activity" maxLength={80}
                 onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} />
          <button type="button" className="secondary" onClick={addCustom}>Add</button>
        </div>
        <button className="primary" disabled={loading || acts.length === 0}>Get today's advice</button>
        {acts.length === 0 && <small className="muted"> Choose at least one activity.</small>}
      </form>

      {loading && <Loading text="Checking weather and planning" />}
      <ErrorBox message={error} />
      {r && (
        <div className="results">
          {!r.weather_available && <div className="warn" role="alert"><b>Live weather unavailable.</b> Advice below is cautious and not based on current conditions. Check the place name and try again.</div>}
          {w && (
            <Card title={`Weather in ${w.place}`} wide>
              <dl className="facts">
                <div><dt>Now</dt><dd>{w.temperature_c ?? "-"}°C {w.description ? `· ${w.description}` : ""}</dd></div>
                <div><dt>Wind</dt><dd>{w.wind_kmh ?? "-"} km/h</dd></div>
                <div><dt>Rain today</dt><dd>{w.precipitation_mm_today ?? "-"} mm ({w.rain_probability_pct ?? "-"}%)</dd></div>
                <div><dt>High / low</dt><dd>{w.max_temp_c ?? "-"}° / {w.min_temp_c ?? "-"}°</dd></div>
              </dl>
            </Card>
          )}
          <Card title="Overall call" wide>
            <div className="split"><span className={`decision d-${r.advice.overall_decision}`}>{DECISION[r.advice.overall_decision]}</span><Confidence value={r.advice.confidence} /></div>
            <p>{r.advice.summary}</p>
            <Notes text={r.advice.notes} />
          </Card>
          <Card title="By activity" wide>
            <ul className="acts">{r.advice.activity_advice?.map((a, i) => (
              <li key={i}><span className={`decision d-${a.decision}`}>{DECISION[a.decision]}</span><div><b>{a.activity}</b><span>{a.reason}</span></div></li>
            ))}</ul>
          </Card>
          <Card title="Priorities"><Bullets items={r.advice.priorities} /></Card>
          <Card title="Safety reminders"><Bullets items={r.advice.safety_reminders} /></Card>
          <Card title="Weather precautions"><Bullets items={r.advice.weather_precautions} /></Card>
        </div>
      )}
    </>
  );
}
