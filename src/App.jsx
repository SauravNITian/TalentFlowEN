import React, { useState, useEffect } from "react"
import { Link, Routes, Route, Navigate, useLocation } from "react-router-dom"
import JobsPage from "./features/jobs/JobsPage.jsx"
import JobDetailsPage from "./features/jobs/JobDetailsPage.jsx"
import CandidatesPage from "./features/candidates/CandidatesPage.jsx"
import CandidateProfilePage from "./features/candidates/CandidateProfilePage.jsx"
import AssessmentsPage from "./features/assessments/AssessmentsPage.jsx"
import AssessmentBuilderPage from "./features/assessments/AssessmentBuilderPage.jsx"
import Dashboard from "./features/dashboard/Dashboard.jsx"
import Board from "./features/candidates/Board.jsx"
import ThemeProvider, { useTheme } from "./ui/ThemeProvider.jsx"
import ToastProvider from "./ui/ToastProvider.jsx"

function NavLink({ to, children, onClick }) {
  const loc = useLocation()
  const active = loc.pathname.startsWith(to)
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        active ? "bg-white/10 text-white" : "text-white/90 hover:bg-white/10"
      }`}
    >
      {children}
    </Link>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <button
      className="btn-ghost"
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  )
}

export default function App() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const loc = useLocation()

  // Close mobile menu on route change (or on mount)
  useEffect(() => {
    setMobileOpen(false)
  }, [loc.pathname])

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900">
          {/* Header */}
          <header className="brand-grad text-white sticky top-0 z-30">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
              {/* Left: Brand */}
              <Link to="/" className="text-xl font-semibold tracking-tight">
                TalentFlow
              </Link>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-2">
                <NavLink to="/dashboard">Dashboard</NavLink>
                <NavLink to="/jobs">Jobs</NavLink>
                <NavLink to="/candidates">Candidates</NavLink>
                <NavLink to="/board">Board</NavLink>
                <NavLink to="/assessments">Assessments</NavLink>
              </nav>

              {/* Right actions */}
              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <div className="hidden sm:block text-xs text-white/80">
                  Front-End Only • Local Persistence
                </div>

                {/* Mobile hamburger */}
                <button
                  className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
                  aria-label="Open main menu"
                  aria-controls="mobile-menu"
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen((o) => !o)}
                >
                  {/* Icon */}
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {mobileOpen ? (
                      <path d="M18 6L6 18M6 6l12 12" />
                    ) : (
                      <>
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile panel */}
            <div
              id="mobile-menu"
              className={`md:hidden transition-[max-height,opacity] duration-200 ease-out overflow-hidden ${
                mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-4 pb-3 pt-0 space-y-1">
                <NavLink to="/dashboard" onClick={() => setMobileOpen(false)}>
                  Dashboard
                </NavLink>
                <NavLink to="/jobs" onClick={() => setMobileOpen(false)}>
                  Jobs
                </NavLink>
                <NavLink to="/candidates" onClick={() => setMobileOpen(false)}>
                  Candidates
                </NavLink>
                <NavLink to="/board" onClick={() => setMobileOpen(false)}>
                  Board
                </NavLink>
                <NavLink to="/assessments" onClick={() => setMobileOpen(false)}>
                  Assessments
                </NavLink>
                {/* Theme toggle duplicate for mobile reachability */}
                <div className="pt-1">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          {/* Main */}
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/:id" element={<JobDetailsPage />} />
                <Route path="/candidates" element={<CandidatesPage />} />
                <Route path="/candidates/:id" element={<CandidateProfilePage />} />
                <Route path="/board" element={<Board />} />
                <Route path="/assessments" element={<AssessmentsPage />} />
                <Route path="/assessments/:jobId" element={<AssessmentBuilderPage />} />
              </Routes>
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t bg-white/80 dark:bg-slate-800/80 backdrop-blur">
            <div className="mx-auto max-w-6xl px-4 py-3 text-sm text-gray-500 dark:text-slate-300">
              © 2025 TalentFlow (demo) — Mirage + IndexedDB
            </div>
          </footer>
        </div>
      </ToastProvider>
    </ThemeProvider>
  )
}
