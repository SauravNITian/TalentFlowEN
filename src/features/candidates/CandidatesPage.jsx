import React, { useEffect, useMemo, useState } from "react"
import { FixedSizeList as List } from "react-window"
import { Link } from "react-router-dom"

function Avatar({ name }) {
  const initials = (name || "")
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
  return (
    <div
      className="w-9 h-9 rounded-full brand-grad text-white grid place-content-center text-xs font-semibold shadow-sm"
      aria-hidden
    >
      {initials}
    </div>
  )
}

const STAGE_COLORS = {
  applied:
    "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  screen:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  tech:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  offer:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  hired:
    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  rejected:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
}

export default function CandidatesPage() {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ page: 1, pageSize: 200, total: 0 })
  const [stage, setStage] = useState("")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("id-asc")
  const [shortlist, setShortlist] = useState(
    () => new Set(JSON.parse(localStorage.getItem("tf_shortlist") || "[]"))
  )

  async function load(page = 1) {
    const r = await fetch(
      `/candidates?stage=${encodeURIComponent(stage)}&search=${encodeURIComponent(
        search
      )}&page=${page}&pageSize=${meta.pageSize}`
    )
    const j = await r.json()
    let data = j.data
    if (sort === "id-desc") data.sort((a, b) => b.id - a.id)
    if (sort === "name") data.sort((a, b) => a.name.localeCompare(b.name))
    setItems(data)
    setMeta(j.meta)
  }

  useEffect(() => {
    load(1)
  }, [stage, search, sort])

  function toggleShortlist(id) {
    setShortlist((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem("tf_shortlist", JSON.stringify(Array.from(next)))
      return next
    })
  }

  function exportCSV() {
    const header = ["id", "name", "email", "stage"]
    const rows = items.map((c) => [c.id, `"${c.name}"`, c.email, c.stage])
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "candidates.csv"
    a.click()
  }

  const Row = ({ index, style }) => {
    const c = items[index]
    if (!c) return null
    return (
      <div
        style={{
          ...style,
          top: style.top + 8, // spacing between rows
          height: style.height - 8,
        }}
        className="mx-2 px-4 py-3 flex items-center gap-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/70"
      >
        <div className="text-xs text-gray-500 dark:text-slate-400 w-14">
          #{c.id}
        </div>
        <Avatar name={c.name} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
            <Link className="hover:underline" to={`/candidates/${c.id}`}>
              {c.name}
            </Link>
          </div>
          <div className="text-sm text-gray-600 dark:text-slate-300 truncate">
            {c.email}
          </div>
        </div>
        <span
          className={`pill ${STAGE_COLORS[c.stage] || "pill-gray"}`}
        >
          {c.stage}
        </span>
        <button
          onClick={() => toggleShortlist(c.id)}
          className={`ml-2 btn ${
            shortlist.has(c.id)
              ? "!border-amber-300 !bg-amber-50 dark:!bg-amber-900/30 dark:!border-amber-800"
              : ""
          }`}
        >
          {shortlist.has(c.id) ? "★" : "☆"}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="toolbar flex flex-wrap gap-2 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded w-64
                     bg-white text-slate-900 placeholder-slate-400 border-slate-300
                     dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-700"
          placeholder="Search name/email..."
        />
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          className="px-3 py-2 border rounded
                     bg-white text-slate-900 border-slate-300
                     dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
        >
          <option value="">All stages</option>
          <option value="applied">applied</option>
          <option value="screen">screen</option>
          <option value="tech">tech</option>
          <option value="offer">offer</option>
          <option value="hired">hired</option>
          <option value="rejected">rejected</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 border rounded
                     bg-white text-slate-900 border-slate-300
                     dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
        >
          <option value="id-asc">ID ↑</option>
          <option value="id-desc">ID ↓</option>
          <option value="name">Name A→Z</option>
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn" onClick={exportCSV}>
            Export CSV
          </button>
          <Link to="/assessments/1" className="btn">
            Quick Assess
          </Link>
        </div>
      </div>

      {/* Virtualized List */}
      <List
        height={520}
        itemCount={items.length}
        itemSize={80} // taller row for card look
        width="100%"
      >
        {Row}
      </List>
    </div>
  )
}
