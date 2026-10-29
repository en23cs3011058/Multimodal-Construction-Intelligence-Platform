import React from "react";

const LEVEL = { none: 0, low: 1, moderate: 2, high: 3, critical: 4 };

/** Severity shown as a spirit-level style gauge: 4 segments fill as risk rises. */
export function Severity({ level = "low", label }) {
  const n = LEVEL[level] ?? 1;
  return (
    <span className={`sev sev-${level}`} title={`Severity: ${level}`}>
      <span className="sev-bar" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <i key={i} className={i <= n ? "on" : ""} />
        ))}
      </span>
      <b>{label ?? level}</b>
    </span>
  );
}

export function Confidence({ value = 0 }) {
  const pct = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div className="confidence" title="Model's own confidence; not a guarantee">
      <span>Confidence</span>
      <div className="track"><div style={{ width: `${pct}%` }} /></div>
      <b>{pct}%</b>
    </div>
  );
}

export function Bullets({ items, empty = "None reported." }) {
  if (!items?.length) return <p className="muted">{empty}</p>;
  return <ul className="bullets">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>;
}

export function Card({ title, children, wide }) {
  return (
    <section className={`card ${wide ? "wide" : ""}`}>
      {title && <h3>{title}</h3>}
      {children}
    </section>
  );
}

export function Notes({ text }) {
  return text ? <p className="notes">{text}</p> : null;
}

export function ErrorBox({ message }) {
  return message ? <div className="error" role="alert"><b>Something went wrong.</b> {message}</div> : null;
}

export function Loading({ text = "Analysing" }) {
  return <div className="loading" role="status"><span className="spinner" />{text}…</div>;
}

export function UnusableBanner({ show }) {
  return show ? (
    <div className="warn" role="alert">
      <b>Image could not be assessed.</b> It may be blurry, too dark, cropped or not a construction scene. Retake the photo
      in good light, with the area in frame, and try again.
    </div>
  ) : null;
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function PageHead({ title, intro }) {
  return (
    <header className="page-head">
      <h2>{title}</h2>
      <p>{intro}</p>
    </header>
  );
}
