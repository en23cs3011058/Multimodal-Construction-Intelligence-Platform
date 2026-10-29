import React, { useEffect, useState } from "react";
import SafetyPage from "./pages/SafetyPage.jsx";
import CrackPage from "./pages/CrackPage.jsx";
import ValuationPage from "./pages/ValuationPage.jsx";
import PlanningPage from "./pages/PlanningPage.jsx";
import DailyPage from "./pages/DailyPage.jsx";
import KnowledgePage from "./pages/KnowledgePage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import { getJson } from "./api.js";

const NAV = [
  { id: "safety", label: "Site safety", Page: SafetyPage },
  { id: "crack", label: "Crack analysis", Page: CrackPage },
  { id: "planning", label: "Project plan", Page: PlanningPage },
  { id: "valuation", label: "Property valuation", Page: ValuationPage },
  { id: "daily", label: "Today on site", Page: DailyPage },
  { id: "knowledge", label: "Ask an engineer", Page: KnowledgePage },
  { id: "history", label: "History", Page: HistoryPage },
];

export default function App() {
  const [tab, setTab] = useState(() => window.location.hash.slice(1) || "safety");
  const [health, setHealth] = useState(null);

  useEffect(() => { window.location.hash = tab; }, [tab]);
  useEffect(() => { getJson("/api/health").then(setHealth).catch(() => setHealth({ status: "down" })); }, []);

  const current = NAV.find((n) => n.id === tab) || NAV[0];
  const Page = current.Page;

  return (
    <div className="shell">
      <aside className="rail">
        <h1>Site Intelligence</h1>
        <nav aria-label="Features">
          {NAV.map((n) => (
            <button key={n.id} className={n.id === current.id ? "nav on" : "nav"} aria-current={n.id === current.id ? "page" : undefined} onClick={() => setTab(n.id)}>{n.label}</button>
          ))}
        </nav>
        <div className="status">
          {health?.status === "ok" ? (health.mock_mode ? "Demo mode: sample AI answers" : "AI connected") : health ? "Backend offline" : "Connecting…"}
        </div>
      </aside>
      <main>
        <div className="tape" aria-hidden="true" />
        {/* key resets each page's form state when switching tabs */}
        <div className="content"><Page key={current.id} /></div>
      </main>
    </div>
  );
}
