import React, { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"

export default function AssessmentsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    let alive = true
    ;(async function load() {
      setLoading(true)
      const r = await fetch(`/jobs?page=1&pageSize=9999`)
      const j = await r.json()
      if (!alive) return
      setJobs(j.data || [])
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs
    const s = search.toLowerCase()
    return jobs.filter(j =>
      j.title.toLowerCase().includes(s) ||
      (j.location || "").toLowerCase().includes(s) ||
      (j.tags || []).join(" ").toLowerCase().includes(s)
    )
  }, [jobs, search])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Assessments</h2>
        <div className="ml-auto text-sm text-slate-500 dark:text-slate-400">
          {loading ? "Loading…" : `${filtered.length} job${filtered.length!==1?"s":""}`}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          placeholder="Search jobs, tags, location…"
          className="px-3 py-2 border rounded w-full sm:w-80
                     bg-white text-slate-900 placeholder-slate-400 border-slate-300
                     dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-700"
        />
      </div>

      {/* Grid */}
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="rounded border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800 animate-pulse">
                <div className="h-4 w-2/3 rounded bg-slate-200/70 dark:bg-slate-700/60 mb-2" />
                <div className="h-3 w-1/3 rounded bg-slate-200/70 dark:bg-slate-700/60 mb-4" />
                <div className="h-8 w-28 rounded bg-slate-200/70 dark:bg-slate-700/60" />
              </li>
            ))
          : filtered.length === 0
            ? (
              <li className="md:col-span-2 lg:col-span-3">
                <div className="rounded border border-dashed bg-white/70 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 p-8 text-center">
                  <div className="text-sm text-slate-700 dark:text-slate-200">No matching jobs</div>
                </div>
              </li>
            )
            : filtered.map(j => (
              <li
                key={j.id}
                className="rounded border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/60"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {j.title}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {j.location || "Remote · India"}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border
                    ${j.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700/40 dark:text-slate-200 dark:border-slate-600"}`}>
                    {j.status}
                  </span>
                </div>

                {j.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {j.tags.slice(0,4).map(t => (
                      <span key={t} className="px-2 py-0.5 rounded text-xs border
                        bg-slate-100 text-slate-700 border-slate-200
                        dark:bg-slate-700/50 dark:text-slate-200 dark:border-slate-600">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={`/assessments/${j.id}`}
                    className="px-3 py-2 rounded border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200
                               bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    Open Builder
                  </Link>
                  <Link
                    to={`/assessments/${j.id}?take=1`}
                    className="px-3 py-2 rounded text-white bg-blue-600 hover:bg-blue-700"
                    title="Open shareable preview"
                  >
                    Preview
                  </Link>
                </div>
              </li>
            ))
        }
      </ul>
    </div>
  )
}
