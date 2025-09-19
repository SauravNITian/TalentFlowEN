import React, { useEffect, useState } from "react"

const STAGES = ["applied","screen","tech","offer","hired","rejected"]
const COLORS = {
  applied: "bg-sky-50 dark:bg-sky-900/30",
  screen: "bg-amber-50 dark:bg-amber-900/30",
  tech: "bg-indigo-50 dark:bg-indigo-900/30",
  offer: "bg-emerald-50 dark:bg-emerald-900/30",
  hired: "bg-green-50 dark:bg-green-900/30",
  rejected: "bg-rose-50 dark:bg-rose-900/30",
}

export default function Board() {
  const [cols, setCols] = useState(() => Object.fromEntries(STAGES.map(s => [s, []])))

  useEffect(() => {
    fetch(`/candidates?search=&page=1&pageSize=2000`)
      .then(r => r.json())
      .then(j => {
        const by = Object.fromEntries(STAGES.map(s => [s, []]))
        for (const c of j.data) by[c.stage]?.push(c)
        setCols(by)
      })
  }, [])

  function onDragStart(e, item) {
    e.dataTransfer.setData("text/plain", JSON.stringify(item))
  }
  async function onDrop(e, stage) {
    e.preventDefault()
    try {
      const item = JSON.parse(e.dataTransfer.getData("text/plain"))
      await fetch(`/candidates/${item.id}`, { method: "PATCH", body: JSON.stringify({ stage }) })
      setCols(prev => {
        const copy = structuredClone(prev)
        for (const s of STAGES) copy[s] = copy[s].filter(c => c.id !== item.id)
        copy[stage].unshift({ ...item, stage })
        return copy
      })
    } catch {}
  }
  function allow(e) { e.preventDefault() }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 items-stretch ">
        {STAGES.map(s => (
          <div
            key={s}
            onDragOver={allow}
            onDrop={e => onDrop(e, s)}
            className={`card p-3 border dark:border-slate-700 ${COLORS[s]} min-w-0 h-full`}
          >
            <div className="font-semibold mb-2 capitalize text-slate-900 dark:text-slate-100">
              {s}{" "}
              <span className="text-xs opacity-60">
                ({cols[s]?.length || 0})
              </span>
            </div>

            <ul className="space-y-2 min-h-[200px]">
              {cols[s]?.map(c => (
                <li
                  key={c.id}
                  draggable
                  onDragStart={e => onDragStart(e, c)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab active:cursor-grabbing min-w-0"
                >
                  <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {c.name}
                  </div>
                  <div className="text-xs opacity-70 text-slate-700 dark:text-slate-300 break-words">
                    {c.email}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
