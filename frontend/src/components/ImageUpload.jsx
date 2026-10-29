import React, { useEffect, useRef, useState } from "react";

const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_MB = 5;
const MAX_FILES = 4;

/** Drag-and-drop image picker with previews and client-side checks (the server re-checks everything). */
export default function ImageUpload({ files, onChange }) {
  const input = useRef(null);
  const [msg, setMsg] = useState("");
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    const u = files.map((f) => URL.createObjectURL(f));
    setUrls(u);
    return () => u.forEach(URL.revokeObjectURL);
  }, [files]);

  const add = (list) => {
    const incoming = Array.from(list);
    const ok = [];
    let problem = "";
    for (const f of incoming) {
      if (!TYPES.includes(f.type)) problem = `${f.name}: use JPEG, PNG, WebP or GIF.`;
      else if (f.size > MAX_MB * 1024 * 1024) problem = `${f.name}: larger than ${MAX_MB} MB.`;
      else ok.push(f);
    }
    const merged = [...files, ...ok];
    if (merged.length > MAX_FILES) problem = `Only ${MAX_FILES} images allowed per analysis.`;
    setMsg(problem);
    onChange(merged.slice(0, MAX_FILES));
  };

  return (
    <div>
      <div
        className="drop"
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
      >
        <strong>Drop photos here or click to browse</strong>
        <small>JPEG, PNG, WebP or GIF · up to {MAX_FILES} images · {MAX_MB} MB each</small>
        <input ref={input} type="file" accept={TYPES.join(",")} multiple hidden
               onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>
      {msg && <p className="field-error" role="alert">{msg}</p>}
      {files.length > 0 && (
        <div className="thumbs">
          {files.map((f, i) => (
            <figure key={f.name + i}>
              <img src={urls[i]} alt={f.name} />
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => onChange(files.filter((_, j) => j !== i))}>×</button>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
