import React, { useEffect, useMemo, useState } from "react"
import { useParams, Link } from "react-router-dom"

const empty = jobId => ({ jobId: Number(jobId), title: "New Assessment", sections: [], conditions: [] })
const PRESETS = [
  { type:"single", label:"Are you available full-time?", required:true, options:["Yes","No"] },
  { type:"number", label:"Years of experience", min:0, max:40, required:true },
  { type:"multi", label:"Tech you know", options:["React","Node","SQL","Docker","AWS"], required:true },
  { type:"text", label:"One project you're proud of", maxLength: 200 },
  { type:"long", label:"Why are you a good fit?", maxLength: 600 }
]

export default function AssessmentBuilderPage() {
  const { jobId } = useParams()
  const [assess, setAssess] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(()=>{
    async function load() {
      const r = await fetch(`/assessments/${jobId}`)
      const j = await r.json()
      setAssess(j || empty(jobId))
    }
    load()
  }, [jobId])

  function addSection() {
    const title = prompt("Section title") || "Untitled"
    const id = "s" + Math.random().toString(36).slice(2,7)
    setAssess(a => ({ ...a, sections: [...a.sections, { id, title, questions: [] }] }))
  }

  function addQuestion(secId, preset=null) {
    let q
    if (preset) {
      q = { id: "q" + Math.random().toString(36).slice(2,7), ...preset }
    } else {
      const type = prompt("Type: single | multi | text | long | number | file", "single") || "single"
      const label = prompt("Question label", "Question")
      const id = "q" + Math.random().toString(36).slice(2,7)
      const base = { id, type, label }
      q = base
      if (type === "single" || type === "multi") {
        const opts = (prompt("Options (comma-separated)", "A,B,C")||"").split(",").map(s=>s.trim()).filter(Boolean)
        q = { ...base, options: opts, required: true }
      } else if (type === "number") {
        const min = Number(prompt("Min", "0")||"0")
        const max = Number(prompt("Max", "100")||"100")
        q = { ...base, min, max, required: true }
      } else if (type === "text" || type === "long") {
        const maxLength = Number(prompt("Max length", "200")||"200")
        q = { ...base, maxLength }
      }
    }
    setAssess(a => ({ ...a, sections: a.sections.map(s => s.id===secId ? { ...s, questions: [...s.questions, q] } : s) }))
  }

  function duplicateQuestion(secId, qid) {
    setAssess(a => ({ ...a, sections: a.sections.map(s => {
      if (s.id!==secId) return s
      const q = s.questions.find(x=>x.id===qid)
      const clone = { ...q, id: "q" + Math.random().toString(36).slice(2,7), label: (q.label || "Question") + " (copy)" }
      return { ...s, questions: [...s.questions, clone] }
    }) }))
  }

  function moveQuestion(secId, qid, dir) {
    setAssess(a => ({ ...a, sections: a.sections.map(s => {
      if (s.id!==secId) return s
      const idx = s.questions.findIndex(x=>x.id===qid); const to = idx + (dir==="up"?-1:1)
      if (to<0 || to>=s.questions.length) return s
      const copy = s.questions.slice(); const [m]=copy.splice(idx,1); copy.splice(to,0,m)
      return { ...s, questions: copy }
    }) }))
  }

  function removeQuestion(secId, qid) {
    if (!confirm("Delete question?")) return
    setAssess(a => ({ ...a, sections: a.sections.map(s => s.id===secId ? { ...s, questions: s.questions.filter(q=>q.id!==qid) } : s) }))
  }

  async function save() {
    setSaving(true)
    const r = await fetch(`/assessments/${jobId}`, { method:"PUT", body: JSON.stringify(assess) })
    setSaving(false)
    if (r.ok) alert("Saved"); else alert("Failed to save")
  }

  function setTitle() {
    const t = prompt("Assessment title", assess.title) || assess.title
    setAssess(a => ({ ...a, title: t }))
  }

  return assess ? (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Builder panel */}
      <div className="card p-4 space-y-3 bg-white dark:bg-slate-800 border dark:border-slate-700">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{assess.title}</h2>
          <button onClick={setTitle} className="btn">Rename</button>
          <button onClick={addSection} className="ml-auto btn-primary">+ Section</button>
          <button onClick={save} disabled={saving} className="btn">{saving ? "Saving…" : "Save"}</button>
          <Link to={`/assessments/${jobId}`} className="btn">Refresh</Link>
          <Link to={`/assessments/${jobId}?take=1`} className="btn-primary">Share Preview</Link>
        </div>

        {assess.sections.map(s => (
          <div
            key={s.id}
            className="border rounded-xl p-3 bg-white/90 dark:bg-slate-800/80 dark:border-slate-700 backdrop-blur"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="font-medium text-slate-900 dark:text-slate-100">{s.title}</div>
              <div className="ml-auto flex gap-2">
                <div className="hidden md:flex gap-1">
                  {PRESETS.map((p,i)=>(
                    <button key={i} onClick={()=>addQuestion(s.id, p)} className="btn text-xs">+ {p.type}</button>
                  ))}
                </div>
                <button onClick={()=>addQuestion(s.id)} className="btn">+ Question</button>
              </div>
            </div>
            <ul className="space-y-2">
              {s.questions.map(q => (
                <li key={q.id} className="text-sm flex items-center gap-2">
                  <span className="pill pill-gray">{q.type}</span>
                  <span className="flex-1 text-slate-800 dark:text-slate-200">{q.label}</span>
                  <button className="btn" onClick={()=>moveQuestion(s.id, q.id, "up")}>↑</button>
                  <button className="btn" onClick={()=>moveQuestion(s.id, q.id, "down")}>↓</button>
                  <button className="btn" onClick={()=>duplicateQuestion(s.id, q.id)}>⎘</button>
                  <button className="btn" onClick={()=>removeQuestion(s.id, q.id)}>✕</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Preview panel */}
      <div className="card p-4 bg-white dark:bg-slate-800 border dark:border-slate-700">
        <h3 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">Live Preview</h3>
        <AssessmentPreview assess={assess} jobId={jobId} />
      </div>
    </div>
  ) : <p>Loading…</p>
}

function useVisibility(assess, values) {
  return useMemo(() => {
    const visible = new Set()
    for (const s of assess.sections) for (const q of s.questions) visible.add(q.id)
    for (const c of (assess.conditions||[])) {
      const v = values[c.if.questionId]
      const match = String(v) === String(c.if.equals)
      for (const qid of c.show) { if (!match) visible.delete(qid); else visible.add(qid) }
    }
    return visible
  }, [assess, values])
}

function AssessmentPreview({ assess, jobId }) {
  const [values, setValues] = useState({})
  const visible = useVisibility(assess, values)
  const [error, setError] = useState("")

  function setVal(id, v) { setValues(x => ({ ...x, [id]: v })) }

  function validate() {
    setError("")
    for (const s of assess.sections) {
      for (const q of s.questions) {
        if (!visible.has(q.id)) continue
        const v = values[q.id]
        if (q.required && (v == null || (Array.isArray(v) ? v.length===0 : String(v).trim()===""))) {
          setError(`Please fill required question: ${q.label}`); return false
        }
        if (q.type === "number") {
          const n = Number(v)
          if (Number.isNaN(n) || (q.min!=null && n<q.min) || (q.max!=null && n>q.max)) { setError(`Number out of range for: ${q.label}`); return false }
        }
        if ((q.type==="text"||q.type==="long") && q.maxLength && String(v||"").length > q.maxLength) { setError(`Too long: ${q.label}`); return false }
      }
    }
    return true
  }

  async function submit() {
    if (!validate()) return
    const candidateId = Number(prompt("Enter Candidate ID to submit for", "1") || "1")
    const r = await fetch(`/assessments/${jobId}/submit`, { method:"POST", body: JSON.stringify({ candidateId, answers: values }) })
    alert(r.ok ? "Submitted (saved locally)" : "Failed to submit")
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2 rounded border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-800">
          {error}
        </div>
      )}
      {assess.sections.map(s => (
        <div
          key={s.id}
          className="border rounded-xl p-3 bg-white/80 dark:bg-slate-800/80 dark:border-slate-700 backdrop-blur"
        >
          <div className="font-medium mb-2 text-slate-900 dark:text-slate-100">{s.title}</div>
          <form className="space-y-3">
            {s.questions.map(q => visible.has(q.id) && (
              <div key={q.id} className="space-y-1">
                <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
                  {q.label}{q.required && <span className="text-rose-600 dark:text-rose-400">*</span>}
                </label>

                {q.type === "single" && (
                  <select
                    value={values[q.id]||""}
                    onChange={e=>setVal(q.id, e.target.value)}
                    className="px-3 py-2 border rounded w-full bg-white text-slate-900 placeholder-slate-400 border-slate-300
                               dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-700"
                  >
                    <option value="">Select…</option>
                    {(q.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}

                {q.type === "multi" && (
                  <div className="flex flex-wrap gap-2">
                    {(q.options||[]).map(o => (
                      <label key={o} className="inline-flex items-center gap-1 text-sm text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={(values[q.id]||[]).includes(o)}
                          onChange={e=>{
                            const arr = new Set(values[q.id]||[])
                            if (e.target.checked) arr.add(o); else arr.delete(o)
                            setVal(q.id, Array.from(arr))
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                        />
                        <span>{o}</span>
                      </label>
                    ))}
                  </div>
                )}

                {(q.type === "text" || q.type === "long") && (
                  q.type === "text" ? (
                    <input
                      value={values[q.id]||""}
                      onChange={e=>setVal(q.id, e.target.value)}
                      className="px-3 py-2 border rounded w-full bg-white text-slate-900 placeholder-slate-400 border-slate-300
                                 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-700"
                    />
                  ) : (
                    <textarea
                      value={values[q.id]||""}
                      onChange={e=>setVal(q.id, e.target.value)}
                      className="px-3 py-2 border rounded w-full bg-white text-slate-900 placeholder-slate-400 border-slate-300
                                 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-700"
                      rows={4}
                    />
                  )
                )}

                {q.type === "number" && (
                  <input
                    type="number"
                    value={values[q.id]||""}
                    onChange={e=>setVal(q.id, e.target.value)}
                    className="px-3 py-2 border rounded w-full bg-white text-slate-900 placeholder-slate-400 border-slate-300
                               dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-400 dark:border-slate-700"
                  />
                )}

                {q.type === "file" && (
                  <input
                    type="file"
                    onChange={e=>setVal(q.id, e.target.files?.[0]?.name || "uploaded-file.pdf")}
                    className="block text-slate-800 dark:text-slate-200 file:mr-3 file:px-3 file:py-2 file:rounded file:border
                               file:bg-white file:border-slate-300 dark:file:bg-slate-900 dark:file:border-slate-700"
                  />
                )}
              </div>
            ))}
          </form>
        </div>
      ))}
      <button onClick={submit} className="btn-primary">Submit Assessment</button>
    </div>
  )
}
