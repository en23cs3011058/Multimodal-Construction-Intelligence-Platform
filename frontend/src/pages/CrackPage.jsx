import React, { useState } from "react";
import ImageUpload from "../components/ImageUpload.jsx";
import { Bullets, Card, Confidence, ErrorBox, Field, Loading, Notes, PageHead, Severity, UnusableBanner } from "../components/ui.jsx";
import { postForm, useRun } from "../api.js";

const pretty = (s) => (s || "").replace(/_/g, " ");

export default function CrackPage() {
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState("");
  const [element, setElement] = useState("");
  const { loading, error, data, run } = useRun();

  const submit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    files.forEach((f) => fd.append("images", f));
    fd.append("description", description);
    fd.append("element", element);
    run(() => postForm("/api/crack/analyze", fd));
  };

  const r = data?.result;
  return (
    <>
      <PageHead title="Crack analysis" intro="Photograph a crack (include a coin or ruler for scale) to get its type, severity, likely causes and next steps." />
      <form className="panel" onSubmit={submit}>
        <ImageUpload files={files} onChange={setFiles} />
        <div className="row">
          <Field label="Where is it?"><input value={element} onChange={(e) => setElement(e.target.value)} placeholder="e.g. Beam, ground floor wall" maxLength={200} /></Field>
          <Field label="History"><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Appeared after monsoon" maxLength={500} /></Field>
        </div>
        <button className="primary" disabled={loading || files.length === 0}>Analyse crack</button>
        {files.length === 0 && <small className="muted"> Add at least one photo to begin.</small>}
      </form>

      {loading && <Loading text="Examining crack" />}
      <ErrorBox message={error} />
      {r && (
        <div className="results">
          <UnusableBanner show={!r.image_usable} />
          <Card title="Finding" wide>
            <div className="split">
              <Severity level={r.severity} label={r.crack_detected ? `${r.severity} severity` : "no crack found"} />
              <Confidence value={r.confidence} />
            </div>
            <dl className="facts">
              <div><dt>Crack type</dt><dd>{pretty(r.crack_type)}</dd></div>
              <div><dt>Estimated width</dt><dd>{r.estimated_width_mm != null ? `${r.estimated_width_mm} mm` : "Not measurable"}</dd></div>
              <div><dt>Structural concern</dt><dd>{r.structural_concern ? "Yes" : "No"}</dd></div>
              <div><dt>Engineer inspection</dt><dd className={r.needs_engineer_inspection ? "flag" : ""}>{r.needs_engineer_inspection ? "Required" : "Not required"}</dd></div>
            </dl>
            <Notes text={r.notes} />
          </Card>
          <Card title="Probable causes"><Bullets items={r.probable_causes} /></Card>
          <Card title="Recommended actions"><Bullets items={r.recommended_actions} /></Card>
        </div>
      )}
    </>
  );
}
