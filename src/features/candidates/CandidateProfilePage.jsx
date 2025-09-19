import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

export default function CandidateProfilePage() {
  const { id } = useParams()
  const [candidate, setCandidate] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [stage, setStage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const r = await fetch(`/candidates?search=&page=1&pageSize=100000`)
      const j = await r.json()
      const c = j.data.find(x=>String(x.id)===String(id))
      setCandidate(c); setStage(c?.stage || "")
      const t = await fetch(`/candidates/${id}/timeline`).then(r=>r.json())
      setTimeline(t.data || [])
      setLoading(false)
    }
    load()
  }, [id])

  async function updateStage() {
    const res = await fetch(`/candidates/${id}`, { method:"PATCH", body: JSON.stringify({ stage }) })
    alert(res.ok ? "Stage updated" : "Failed to update stage")
  }

  if (loading) return <p>Loading…</p>
  if (!candidate) return <p>Not found</p>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded p-4">
        <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">{candidate.name}</h3>
        <div className="text-gray-700 dark:text-slate-300">{candidate.email}</div>
        <div className="mt-2">
          <label className="text-sm text-gray-600 dark:text-slate-400">Stage</label>
          <div className="flex items-center gap-2 mt-1">
            <select
              value={stage}
              onChange={e=>setStage(e.target.value)}
              className="px-3 py-2 border rounded
                         bg-white text-slate-900 border-slate-300
                         dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            >
              <option value="applied">applied</option>
              <option value="screen">screen</option>
              <option value="tech">tech</option>
              <option value="offer">offer</option>
              <option value="hired">hired</option>
              <option value="rejected">rejected</option>
            </select>
            <button
              onClick={updateStage}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="md:col-span-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded p-4">
        <h4 className="font-semibold mb-3 text-slate-900 dark:text-slate-100">Timeline</h4>
        <ul className="space-y-2">
          {timeline.map((t,i)=> (
            <li key={i} className="flex items-start gap-2">
              <div className="w-24 text-xs text-gray-500 dark:text-slate-400">
                {new Date(t.ts).toLocaleString()}
              </div>
              <div className="text-sm text-slate-800 dark:text-slate-200">{t.text}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
