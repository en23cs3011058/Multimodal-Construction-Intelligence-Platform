import React, { useState } from "react";
import { Bullets, Card, Confidence, ErrorBox, Field, Loading, Notes, PageHead } from "../components/ui.jsx";
import { money, postJson, useRun } from "../api.js";

const init = { location: "", property_type: "apartment", area_sqft: "", age_years: "0", bedrooms: "", condition: "good", amenities: "", currency: "INR", notes: "" };

export default function ValuationPage() {
  const [f, setF] = useState(init);
  const { loading, error, data, run } = useRun();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    run(() => postJson("/api/valuation/estimate", {
      location: f.location.trim(), property_type: f.property_type, area_sqft: Number(f.area_sqft),
      age_years: Number(f.age_years || 0), bedrooms: f.bedrooms === "" ? null : Number(f.bedrooms),
      condition: f.condition, amenities: f.amenities.split(",").map((s) => s.trim()).filter(Boolean),
      currency: f.currency.trim().toUpperCase() || "INR", notes: f.notes || null,
    }));
  };

  const r = data?.result;
  const span = r ? Math.max(r.estimated_value_high - r.estimated_value_low, 1) : 1;
  const midPos = r ? ((r.estimated_value_mid - r.estimated_value_low) / span) * 100 : 50;

  return (
    <>
      <PageHead title="Property valuation" intro="Get an indicative market value range for a property from its location, size, age and condition." />
      <form className="panel" onSubmit={submit}>
        <div className="row">
          <Field label="Location"><input required value={f.location} onChange={set("location")} placeholder="e.g. Vijay Nagar, Indore" maxLength={200} /></Field>
          <Field label="Property type">
            <select value={f.property_type} onChange={set("property_type")}>
              <option value="apartment">Apartment</option><option value="independent_house">Independent house</option>
              <option value="villa">Villa</option><option value="plot">Plot</option><option value="commercial">Commercial</option>
            </select>
          </Field>
        </div>
        <div className="row">
          <Field label="Area (sq ft)"><input required type="number" min="1" step="any" value={f.area_sqft} onChange={set("area_sqft")} /></Field>
          <Field label="Age (years)"><input type="number" min="0" step="any" value={f.age_years} onChange={set("age_years")} /></Field>
          <Field label="Bedrooms"><input type="number" min="0" value={f.bedrooms} onChange={set("bedrooms")} /></Field>
          <Field label="Condition">
            <select value={f.condition} onChange={set("condition")}>
              <option value="poor">Poor</option><option value="average">Average</option><option value="good">Good</option><option value="excellent">Excellent</option>
            </select>
          </Field>
        </div>
        <div className="row">
          <Field label="Amenities" hint="Separate with commas"><input value={f.amenities} onChange={set("amenities")} placeholder="Parking, lift, garden" /></Field>
          <Field label="Currency"><input value={f.currency} onChange={set("currency")} maxLength={3} /></Field>
        </div>
        <button className="primary" disabled={loading}>Estimate value</button>
      </form>

      {loading && <Loading text="Estimating value" />}
      <ErrorBox message={error} />
      {r && (
        <div className="results">
          <Card title="Estimated value" wide>
            <p className="big">{money(r.estimated_value_mid, r.currency)}</p>
            <div className="range" aria-label="Value range">
              <div className="range-bar"><i style={{ left: `${midPos}%` }} /></div>
              <div className="range-ends"><span>Low {money(r.estimated_value_low, r.currency)}</span><span>High {money(r.estimated_value_high, r.currency)}</span></div>
            </div>
            <div className="split"><span>{money(r.price_per_sqft, r.currency)} per sq ft</span><Confidence value={r.confidence} /></div>
            <Notes text={r.notes} />
            <p className="muted">{r.disclaimer}</p>
          </Card>
          <Card title="What moves the price">
            <ul className="factors">{r.factors?.map((x, i) => (
              <li key={i} className={`imp-${x.impact}`}><b>{x.factor}</b><span>{x.explanation}</span></li>
            ))}</ul>
          </Card>
          <Card title="Assumptions"><Bullets items={r.assumptions} /></Card>
        </div>
      )}
    </>
  );
}
