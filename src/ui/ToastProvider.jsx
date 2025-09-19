import React, { createContext, useContext, useEffect, useRef, useState } from "react"

const ToastCtx = createContext({ push: () => {} })
export const useToast = () => useContext(ToastCtx)

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(1)
  function push({ title, body, tone="info", timeout=3000 }) {
    const id = idRef.current++
    setToasts(t => [...t, { id, title, body, tone }])
    if (timeout) setTimeout(() => dismiss(id), timeout)
  }
  function dismiss(id) { setToasts(t => t.filter(x => x.id !== id)) }
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`card p-3 min-w-[260px] ${t.tone==="error"?"border-rose-300":"border-slate-300"}`}>
            <div className="font-semibold text-sm">{t.title}</div>
            {t.body && <div className="text-xs opacity-80 mt-0.5">{t.body}</div>}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
