import React, { createContext, useContext, useEffect, useState } from "react"

const ThemeCtx = createContext({ theme: "light", toggle: () => {} })
export const useTheme = () => useContext(ThemeCtx)

export default function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("tf_theme") || "light")
  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") root.classList.add("dark"); else root.classList.remove("dark")
    localStorage.setItem("tf_theme", theme)
  }, [theme])
  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark")
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}
