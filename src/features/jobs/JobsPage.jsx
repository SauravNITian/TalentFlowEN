import React, { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import Modal from "../../ui/Modal.jsx"
import { useToast } from "../../ui/ToastProvider.jsx"
import { JOB_TEMPLATES } from "./jobTemplates.js"

const TAGS = ["remote","hybrid","onsite","contract","full-time","jr","sr","urgent","india","us"]

function Pagination({ meta, onPage }) {
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.pageSize))
  return (
    <div className="flex items-center gap-2 justify-end">
      <button className="btn" onClick={()=>onPage(1)} disabled={meta.page===1}>« First</button>
      <button className="btn" onClick={()=>onPage(meta.page-1)} disabled={meta.page===1}>‹ Prev</button>
      <span className="text-sm text-gray-600 dark:text-slate-300">Page {meta.page} / {totalPages}</span>
      <button className="btn" onClick={()=>onPage(meta.page+1)} disabled={meta.page>=totalPages}>Next ›</button>
      <button className="btn" onClick={()=>onPage(totalPages)} disabled={meta.page>=totalPages}>Last »</button>
    </div>
  )
}

export default function JobsPage() {
  const [list, setList] = useState([])
  const [meta, setMeta] = useState({ page:1, pageSize:6, total:0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(localStorage.getItem("tf_jobs_search")||"")
  const [status, setStatus] = useState(localStorage.getItem("tf_jobs_status")||"")
  const [sort, setSort] = useState(localStorage.getItem("tf_jobs_sort")||"order")
  const [selected, setSelected] = useState(new Set())
  const [tagFilters, setTagFilters] = useState(JSON.parse(localStorage.getItem("tf_jobs_tags")||"[]"))
  const [error, setError] = useState("")
  const [openCreate, setOpenCreate] = useState(false)
  const [draft, setDraft] = useState({ title:"", slug:"", location:"Remote · India", tags:[] })
  const searchRef = useRef(null)
  const { push } = useToast()

  useEffect(()=>{
    const onKey = (e)=>{
      if (e.key === "/" && document.activeElement !== searchRef.current) { e.preventDefault(); searchRef.current?.focus() }
    }
    window.addEventListener("keydown", onKey); return ()=>window.removeEventListener("keydown", onKey)
  }, [])

  function persistView() {
    localStorage.setItem("tf_jobs_search", search)
    localStorage.setItem("tf_jobs_status", status)
    localStorage.setItem("tf_jobs_sort", sort)
    localStorage.setItem("tf_jobs_tags", JSON.stringify(tagFilters))
  }

  async function load(page = 1) {
    setLoading(true); setError(""); persistView()
    try {
      const url = `/jobs?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}&page=${page}&pageSize=${meta.pageSize}&sort=${sort}`
      const r = await fetch(url); const j = await r.json()
      let data = j.data
      if (tagFilters.length) data = data.filter(job => tagFilters.every(t => job.tags.includes(t)))
      setList(data); setMeta({ ...j.meta, total: tagFilters.length ? data.length : j.meta.total })
      setSelected(new Set())
    } catch (e) { setError("Failed to load jobs") } finally { setLoading(false) }
  }
  useEffect(() => { load(1) }, [search, status, sort, JSON.stringify(tagFilters)])

  async function createJobFromDraft() {
    const body = { ...draft, slug: draft.slug || draft.title }
    const r = await fetch("/jobs", { method:"POST", body: JSON.stringify(body) })
    if (!r.ok) { const j = await r.json(); push({ title:"Create failed", body: j.error||"Unknown", tone:"error" }); return }
    setOpenCreate(false); setDraft({ title:"", slug:"", location:"Remote · India", tags:[] }); push({ title:"Job created" }); await load(meta.page)
  }

  async function toggleArchive(job) {
    const patch = { status: job.status === "active" ? "archived" : "active" }
    const res = await fetch(`/jobs/${job.id}`, { method:"PATCH", body: JSON.stringify(patch) })
    if (!res.ok) push({ title:"Update failed", tone:"error" }); else { push({ title:"Updated" }); await load(meta.page) }
  }

  async function bulkArchive(archive=true) {
    for (const id of selected) {
      const job = list.find(j=>j.id===id); if (!job) continue
      await fetch(`/jobs/${id}`, { method:"PATCH", body: JSON.stringify({ status: archive ? "archived" : "active" }) })
    }
    push({ title: archive?"Archived":"Unarchived", body:`${selected.size} jobs`}); await load(meta.page)
  }

  async function reorder(job, dir) {
    const idx = list.findIndex(j=>j.id===job.id)
    const toIdx = idx + (dir === "up" ? -1 : 1)
    if (toIdx < 0 || toIdx >= list.length) return
    const copy = list.slice(); const [m]=copy.splice(idx,1); copy.splice(toIdx,0,m); setList(copy)
    const fromOrder = job.order; const toOrder = dir === "up" ? job.order - 1 : job.order + 1
    const r = await fetch(`/jobs/${job.id}/reorder`, { method:"PATCH", body: JSON.stringify({ fromOrder, toOrder }) })
    if (!r.ok) { push({ title:"Reorder failed", tone:"error" }); await load(meta.page) } else { await load(meta.page) }
  }

  function toggleTag(t) { setTagFilters(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]) }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" })
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "jobs.json"; a.click()
  }

  function importJSON(e) {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const arr = JSON.parse(reader.result)
        for (const j of arr) {
          await fetch("/jobs", { method:"POST", body: JSON.stringify({ title:j.title, slug:j.slug||j.title, location:j.location||"Remote · India", tags:j.tags||[] }) })
        }
        push({ title:"Imported jobs", body:String(arr.length) })
        await load(1)
      } catch { push({ title:"Import failed", tone:"error" }) }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      <div className="toolbar">
        <div className="flex items-center gap-2">
          <input ref={searchRef} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title or tag..." className="px-3 py-2 border rounded w-64" />
          <span className="text-xs text-slate-500 hidden md:inline">Press <kbd className="kbd">/</kbd> to focus</span>
        </div>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="px-3 py-2 border rounded">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)} className="px-3 py-2 border rounded">
          <option value="order">Order</option>
          <option value="title">Title</option>
        </select>
        <div className="hidden md:flex items-center gap-2 ml-2">
          {TAGS.map(t => (
            <button key={t} onClick={()=>toggleTag(t)} className={`tag ${tagFilters.includes(t) ? "!bg-indigo-600 !text-white" : ""}`}>{t}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="btn cursor-pointer">
            Import
            <input type="file" className="hidden" accept="application/json" onChange={importJSON} />
          </label>
          <button onClick={exportJSON} className="btn">Export</button>
          <button onClick={()=>setOpenCreate(true)} className="btn-primary">+ Create Job</button>
        </div>
      </div>

      {selected.size>0 && (
        <div className="card p-3 flex items-center gap-2">
          <div className="text-sm">{selected.size} selected</div>
          <button className="btn" onClick={()=>bulkArchive(true)}>Archive</button>
          <button className="btn" onClick={()=>bulkArchive(false)}>Unarchive</button>
          <button className="btn" onClick={()=>setSelected(new Set())}>Clear</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({length: meta.pageSize}).map((_,i)=>(
          <div key={i} className="h-40 card animate-pulse" />
        )) : list.map(job => (
          <div key={job.id} className="card p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={selected.has(job.id)} onChange={e=>{
                const next = new Set(selected); if (e.target.checked) next.add(job.id); else next.delete(job.id); setSelected(next)
              }} />
              <div className="flex-1">
                <Link to={`/jobs/${job.id}`} className="font-semibold text-slate-800 dark:text-slate-100 hover:underline">{job.title}</Link>
                <div className="text-sm text-gray-600 dark:text-slate-300">{job.location}</div>
              </div>
              <span className={`${job.status==="active" ? "pill-green" : "pill-gray"}`}>{job.status}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {job.tags.map(t => <span key={t} className="tag">{t}</span>)}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button className="btn" onClick={()=>toggleArchive(job)}>{job.status==="active" ? "Archive" : "Unarchive"}</button>
              <button className="btn" onClick={()=>reorder(job,"up")}>↑</button>
              <button className="btn" onClick={()=>reorder(job,"down")}>↓</button>
              <Link to={`/assessments/${job.id}`} className="ml-auto btn">Assessment</Link>
            </div>
          </div>
        ))}
      </div>

      <Pagination meta={meta} onPage={p=>load(p)} />

      <Modal open={openCreate} title="Create job" onClose={()=>setOpenCreate(false)} actions={(
        <>
          <button className="btn" onClick={()=>setOpenCreate(false)}>Cancel</button>
          <button className="btn-primary" onClick={createJobFromDraft}>Create</button>
        </>
      )}>
        <div className="grid grid-cols-1 gap-3">
          <input className="px-3 py-2 border rounded" placeholder="Title" value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value}))} />
          <input className="px-3 py-2 border rounded" placeholder="Slug (optional)" value={draft.slug} onChange={e=>setDraft(d=>({...d,slug:e.target.value}))} />
          <input className="px-3 py-2 border rounded" placeholder="Location" value={draft.location} onChange={e=>setDraft(d=>({...d,location:e.target.value}))} />
          <div className="flex flex-wrap gap-2">
            {TAGS.map(t => (
              <button type="button" key={t} onClick={()=>setDraft(d=>({...d, tags: d.tags.includes(t) ? d.tags.filter(x=>x!==t) : [...d.tags,t]}))}
                className={`tag ${draft.tags.includes(t) ? "!bg-indigo-600 !text-white" : ""}`}>{t}</button>
            ))}
          </div>
          <div className="text-xs opacity-70">Or start from template:</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {JOB_TEMPLATES.map((t, i)=> (
              <button key={i} className="btn" onClick={()=>setDraft({ ...t, slug:"" })}>{t.title}</button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
