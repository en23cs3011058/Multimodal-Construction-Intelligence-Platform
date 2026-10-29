import React, { useState } from "react";
import ImageUpload from "../components/ImageUpload.jsx";
import { Bullets, Card, Confidence, ErrorBox, Field, Loading, Notes, PageHead, Severity, UnusableBanner } from "../components/ui.jsx";
import { postForm, useRun } from "../api.js";

const PPE_LABEL = { helmet: "Helmet", safety_vest: "Safety vest", gloves: "Gloves", safety_boots: "Safety boots", harness: "Harness" };
const PPE_TEXT = { worn: "Worn", missing: "Missing", not_visible: "Can't tell" };

export default function SafetyPage() {
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const { loading, error, data, run } = useRun();

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    fd.append("description", description);
    fd.append("location", location);
    run(() => postForm("/api/safety/analyze", fd));
  };

  const r = data?.result;
  return (
    <>
      <PageHead title="Site safety check" intro="Upload site photos to find hazards and missing protective equipment, with a fix for each." />
      <form className="panel" onSubmit={submit}>
        <ImageUpload files={files} onChange={setFiles} />
        <div className="row">
          <Field label="Site area"><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Block B, 3rd floor slab" maxLength={200} /></Field>
          <Field label="What should we know?"><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Shuttering work in progress" maxLength={500} /></Field>
        </div>
        <button className="primary" disabled={loading || files.length === 0}>Check safety</button>
        {files.length === 0 && <small className="muted"> Add at least one photo to begin.</small>}
      </form>

      {loading && <Loading text="Inspecting photos" />}
      <ErrorBox message={error} />
      {r && (
        <div className="results">
          <UnusableBanner show={!r.image_usable} />
          <Card title="Overall" wide>
            <div className="split">
              <Severity level={r.overall_risk} label={`${r.overall_risk} risk`} />
              <Confidence value={r.confidence} />
            </div>
            <p>{r.site_summary}</p>
            <Notes text={r.notes} />
          </Card>
          <Card title="Hazards found" wide>
            {r.hazards?.length ? (
              <div className="table-wrap"><table>
                <thead><tr><th>Hazard</th><th>Severity</th><th>Where</th><th>Fix</th></tr></thead>
                <tbody>{r.hazards.map((h, i) => (
                  <tr key={i}><td>{h.hazard}</td><td><Severity level={h.severity} /></td><td>{h.location}</td><td>{h.recommended_action}</td></tr>
                ))}</tbody>
              </table></div>
            ) : <p className="muted">No hazards identified.</p>}
          </Card>
          <Card title="Protective equipment (PPE)">
            <ul className="ppe">{Object.entries(PPE_LABEL).map(([k, label]) => (
              <li key={k} className={`ppe-${r.ppe?.[k] ?? "not_visible"}`}><span>{label}</span><b>{PPE_TEXT[r.ppe?.[k] ?? "not_visible"]}</b></li>
            ))}</ul>
            <Bullets items={r.ppe_violations} empty="No PPE violations reported." />
          </Card>
          <Card title="Do now"><Bullets items={r.immediate_actions} empty="No urgent actions." /></Card>
        </div>
      )}
    </>
  );
}
