import React, { useEffect, useMemo, useState } from "react";
import ChartMini from "../../components/ChartMini.jsx";

/* --- Solid 3D stat card with rainbow glow-on-hover --- */
function Stat({ label, value, sub, accent = "brand-grad-2" }) {
  return (
    <div className="relative group overflow-hidden rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl transition-all duration-300">
      {/* Rainbow aura layer (hidden until hover) */}
      <div
        className="pointer-events-none absolute -inset-14 opacity-0 group-hover:opacity-40 blur-2xl rounded-2xl transition-opacity duration-500 group-hover:animate-spin"
        style={{
          background:
            "conic-gradient(from 0deg at 50% 50%, #ec4899, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ec4899)",
        }}
      />
      {/* Content */}
      <div className="relative z-10 p-4">
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
        {sub && <div className="text-xs mt-1 text-slate-600 dark:text-slate-300">{sub}</div>}
        <div className={`mt-3 h-1 rounded-full ${accent}`} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [cand, setCand] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch("/jobs?page=1&pageSize=9999").then((r) => r.json()),
      fetch("/candidates?search=&page=1&pageSize=5000").then((r) => r.json()),
    ]).then(([j, c]) => {
      setJobs(j?.data || []);
      setCand(c?.data || []);
    }).catch(() => {
      setJobs([]);
      setCand([]);
    });
  }, []);

  const stats = useMemo(() => {
    // Raw counts from API
    const activeRaw = jobs.filter((j) => j.status === "active").length;
    const archivedRaw = Math.max(0, jobs.length - activeRaw);
    const totalJobs = activeRaw + archivedRaw;

    // Normalize so active + archived === 100 (percent-like values)
    let active = 0, archived = 0;
    if (totalJobs > 0) {
      active = Math.round((activeRaw / totalJobs) * 100);
      archived = 100 - active; // ensure exact sum of 100
    }

    // Candidate stages aggregation
    const stages = cand.reduce((acc, c) => {
      acc[c.stage] = (acc[c.stage] || 0) + 1;
      return acc;
    }, {});
    const totalCand = cand.length;

    // Synthetic chart data
    const trend = Array.from({ length: 12 }, (_, i) =>
      Math.round((Math.sin(i / 2) + 1) * 10 + 10 + Math.random() * 6)
    );

    return { active, archived, stages, totalCand, trend };
  }, [jobs, cand]);

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Active Jobs" value={stats.active} sub="(scaled to 100)" />
        <Stat label="Archived Jobs" value={stats.archived} sub="(scaled to 100)" />
        <Stat label="Total Candidates" value={stats.totalCand} />
        <Stat label="Unique Stages" value={Object.keys(stats.stages).length} />
      </div>

      {/* Chart */}
      <div className="card p-4 rounded-xl shadow-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">Monthly applications (synthetic)</h3>
          <div className="text-xs text-slate-500 dark:text-slate-400">(canvas chart, no libs)</div>
        </div>
        <ChartMini data={stats.trend} />
      </div>

      {/* Candidates by stage + Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-4 rounded-xl shadow-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Candidates by stage</h4>
          <ul className="grid grid-cols-2 gap-2">
            {Object.entries(stats.stages).map(([k, v]) => (
              <li
                key={k}
                className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900/40 rounded"
              >
                <span className="text-sm capitalize text-slate-800 dark:text-slate-200">{k}</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{v}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card p-4 rounded-xl shadow-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Quick tips</h4>
          <ul className="list-disc pl-5 text-sm space-y-1 text-slate-700 dark:text-slate-300">
            <li>Use the Candidates board to drag candidates across stages.</li>
            <li>Save jobs filters; they persist across sessions.</li>
            <li>Export CSV/JSON snapshots to share progress.</li>
            <li>Use Share Preview on assessments to test the form quickly.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
