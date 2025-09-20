# 🌟 TalentFlow – A Mini Hiring Platform

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-frontend-blueviolet?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-styling-38B2AC?logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)
![Status](https://img.shields.io/badge/Status-Active-success)

A polished **HR-first, front-end–only hiring tool** where recruiters can manage jobs, candidates, assessments, and notifications.  
The app simulates a realistic hiring workflow with server-like behavior using **MirageJS/MSW** and **local persistence (IndexedDB)** — no backend required.

🔗 **Live Demo**: https://starlit-buttercream-76eb43.netlify.app/

---

## ✨ Features

### 🏢 Jobs
- Create, edit, archive jobs.
- Reorder via drag-and-drop (with optimistic UI & rollback on error).
- Deep linking: `/jobs/:jobId`.
- Server-like pagination, filtering & sorting.

### 👥 Candidates
- 1000+ seeded candidate profiles with random job & stage assignment.
- Virtualized candidate list for performance.
- Search (name/email) + stage-based filtering.
- Profile view `/candidates/:id` with **timeline of status changes**.
- Kanban board for moving candidates across stages.
- Notes with `@mentions` (suggestions from local list).

### 📑 Assessments
- Per-job assessment builder:
  - Supports multiple question types: single-choice, multi-choice, short/long text, numeric ranges, file upload (stub).
- **Live Preview** as a fillable form.
- Local persistence of builder state & candidate responses.
- Runtime validation & conditional logic (e.g., show Q3 only if Q1 === "Yes").

### 🔔 Notifications
- Centralized feed of system actions and events.

---

## 🛠️ Tech Stack

- **React 19 + Vite**
- **Tailwind CSS** (custom themes + dark mode)
- **MirageJS / MSW** (mock REST API)
- **Dexie / localForage** (IndexedDB persistence)
- **React Query** (server-like state sync)
- **Lucide Icons** + **shadcn/ui** (UI components)
- **React Window / AutoSizer** (virtualized lists)
- **DnD-Kit** (drag & drop for jobs/candidates)

---

## 🗂️ Project Structure

```
src/
 ├── components/      # Reusable UI components
 ├── features/        # Core domains (jobs, candidates, assessments, dashboard)
 │   ├── jobs/
 │   ├── candidates/
 │   ├── assessments/
 │   └── dashboard/
 ├── lib/             # Utilities (db, storage, API helpers)
 ├── mocks/           # MirageJS / MSW mock server
 ├── ui/              # Theming, modals, providers
 ├── App.jsx          # Routes + global layout
 ├── main.jsx         # Entry point
 └── index.css        # Global styles
```

---

## ⚙️ Installation & Setup

```bash
# Clone repo
git clone https://github.com/<your-username>/TalentFlow.git
cd TalentFlow

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🌐 Deployment

This project is deployed on **Vercel**.  
Make sure to include the following in the root of your repo:

- `vercel.json` → for SPA routing fallback
- `_redirects` (in `public/`) → to fix refresh/404 issues on nested routes

---

## 📊 Data & API (Simulated)

- REST endpoints simulated with **MirageJS**:
  - `/jobs`, `/candidates`, `/assessments`
- Artificial latency (200–1200ms) & error rate (5–10%) for realism.
- Persistence: **IndexedDB** (all state is restored on refresh).

---

## 🚀 Future Improvements
- Role-based HR/Admin views.
- Real backend integration (Node/Express + Mongo/Postgres).
- Authentication & multi-user collaboration.
- Advanced analytics dashboard.

---

## 📌 Deliverables
- ✅ Deployed App Link (Vercel)  
- ✅ GitHub Repository  
- ✅ Documentation (this README)  
- ✅ Technical Report (PDF provided)

---

## 🧑‍💻 Author
Built by **Sawan Dalal** as part of a **React Technical Assignment**.  
