import React from "react"

export default function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-40">
      <div className="card w-[min(96vw,640px)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-lg font-semibold">{title}</div>
          <button className="ml-auto btn" onClick={onClose}>Close</button>
        </div>
        <div className="space-y-3">{children}</div>
        {actions && <div className="mt-4 flex items-center gap-2 justify-end">{actions}</div>}
      </div>
    </div>
  )
}
