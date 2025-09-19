import { createServer, Model, Response } from "miragejs"
import { jobsStore, candidatesStore, timelinesStore, assessmentsStore, responsesStore, getAll } from "../lib/db.js"

function slugify(s="") {
  return s.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")
}

const JobStages = ["applied","screen","tech","offer","hired","rejected"]

function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function seedIfNeeded(server) {
  server.timing = 400

  server.logging = false
  server.db.loadData({}) // ensure empty

  server.passthrough() // no actual network, but keep API shape
}

async function seedLocalDataIfNeeded() {
  // If jobs already exist in IndexedDB, skip seeding
  const allJobs = await getAll(jobsStore)
  if (allJobs.length > 0) return

  // Seed 25 jobs
  const titles = ["Senior Frontend Developer","Product Manager","QA Engineer","Data Analyst","Backend Engineer",
  "DevOps Engineer","UX Designer","Fullstack Engineer","Mobile Engineer","Security Analyst","ML Engineer","Data Engineer",
  "Support Engineer","Solutions Architect","Recruiter","Business Analyst","Design Manager","Finance Analyst","Cloud Engineer",
  "Platform Engineer","SRE","Web Analyst","Creative Technologist","Site Manager","Growth Engineer"]
  const tagsPool = ["remote","hybrid","onsite","contract","full-time","jr","sr","urgent","india","us"]

  const jobs = []
  for (let i=0;i<25;i++) {
    const title = titles[i % titles.length] + (i%5===0 ? " II" : "")
    const slug = slugify(title + "-" + (i+1))
    jobs.push({
      id: i+1,
      title,
      slug,
      status: Math.random() < 0.8 ? "active" : "archived",
      tags: Array.from(new Set(Array.from({length: 2 + (i%3)}, () => randomPick(tagsPool)))),
      order: i+1,
      location: randomPick(["Remote · India","Bengaluru","Hyderabad","Pune","Delhi NCR","Remote · US"])
    })
  }
  for (const j of jobs) await jobsStore.setItem(String(j.id), j)

  // Seed 1000 candidates attached to random jobs
  const first = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Reyansh","Krishna","Ishaan","Rohan","Ananya","Aadhya","Diya","Ira","Sara","Anika","Myra","Aarohi","Riya","Navya"]
  const last = ["Sharma","Verma","Gupta","Mehta","Iyer","Patel","Reddy","Nair","Kumar","Das","Singh","Kaur","Chopra","Basu","Dutta"]
  let id = 1
  for (let i=0;i<1000;i++) {
    const name = randomPick(first) + " " + randomPick(last)
    const email = name.toLowerCase().replace(/\s+/g,".") + id + "@example.com"
    const jobId = 1 + Math.floor(Math.random()*25)
    const stage = randomPick(JobStages)
    const c = { id, name, email, jobId, stage }
    await candidatesStore.setItem(String(id), c)
    await timelinesStore.setItem(String(id), [
      { ts: Date.now() - 86400000*3, type: "created", text: "Candidate created" },
      { ts: Date.now() - 86400000*2, type: "applied", text: `Applied to job #${jobId}` },
      { ts: Date.now() - 86400000*1, type: "stage", text: `Moved to ${stage.toUpperCase()}` },
    ])
    id++
  }

  // Seed 3 assessments with ~10 questions each
  for (let j=1;j<=3;j++) {
    const a = {
      jobId: j,
      title: "Assessment for Job " + j,
      sections: [
        {
          id: "s1",
          title: "Basics",
          questions: [
            { id:"q1", type:"single", label:"Are you available full-time?", required:true, options:["Yes","No"] },
            { id:"q2", type:"multi", label:"Technologies you know", options:["React","Node","SQL","Docker","AWS"], required:true },
            { id:"q3", type:"text",  label:"Briefly describe a project you are proud of", maxLength: 200 },
            { id:"q4", type:"long",  label:"What makes you a good fit?", maxLength: 600 },
          ]
        },
        {
          id: "s2",
          title: "Numbers & Files",
          questions: [
            { id:"q5", type:"number", label:"Years of experience", min:0, max:40, required:true },
            { id:"q6", type:"single", label:"Open to relocate?", options:["Yes","No"] },
            { id:"q7", type:"text", label:"Preferred location" },
            { id:"q8", type:"number", label:"Expected CTC (LPA)", min:1, max:200 },
            { id:"q9", type:"file", label:"Resume (upload stub)" }
          ]
        }
      ],
      // Conditional: show q7 only if q6 === "Yes"
      conditions: [
        { if: { questionId: "q6", equals: "Yes" }, show: ["q7"] }
      ]
    }
    await assessmentsStore.setItem(String(j), a)
  }
}

export function makeServer({ environment = "development" } = {}) {
  const server = createServer({
    environment,
    models: {
      job: Model,
      candidate: Model
    },

    routes() {
      this.namespace = "/"

      // Seed from IndexedDB on first run (async)
      this.get("/__seed", async () => {
        await seedLocalDataIfNeeded()
        return { ok: true }
      })

      // ---------- JOBS ----------
      this.get("/jobs", async (schema, request) => {
        await new Promise(r => setTimeout(r, 200 + Math.random()*800))
        const url = new URL(request.url, window.location.origin)
        const search = url.searchParams.get("search") || ""
        const status = url.searchParams.get("status") || ""
        const page = parseInt(url.searchParams.get("page") || "1", 10)
        const pageSize = parseInt(url.searchParams.get("pageSize") || "6", 10)
        const sort = url.searchParams.get("sort") || "order"

        let jobs = await (await import("../lib/db.js")).getAll((await import("../lib/db.js")).jobsStore)
        if (search) {
          const s = search.toLowerCase()
          jobs = jobs.filter(j => j.title.toLowerCase().includes(s) || j.tags.join(" ").toLowerCase().includes(s))
        }
        if (status) {
          jobs = jobs.filter(j => j.status === status)
        }
        if (sort === "order") {
          jobs.sort((a,b)=>a.order-b.order)
        } else if (sort === "title") {
          jobs.sort((a,b)=>a.title.localeCompare(b.title))
        }

        const total = jobs.length
        const start = (page-1)*pageSize
        const data = jobs.slice(start, start+pageSize)
        return { data, meta: { page, pageSize, total } }
      })

      this.post("/jobs", async (schema, request) => {
        await maybeFail()
        const body = JSON.parse(request.requestBody || "{}")
        if (!body.title) return new Response(400, {}, { error: "Title required" })
        const all = await getAll(jobsStore)
        const slug = (body.slug && body.slug.trim()) || body.title
        const slugged = slugify(slug)
        if (all.some(j => j.slug === slugged)) {
          return new Response(400, {}, { error: "Slug must be unique" })
        }
        const id = 1 + Math.max(0, ...all.map(j=>j.id))
        const job = {
          id,
          title: body.title,
          slug: slugged,
          status: "active",
          tags: body.tags || [],
          order: id,
          location: body.location || "Remote · India"
        }
        await jobsStore.setItem(String(id), job)
        return job
      })

      this.patch("/jobs/:id", async (schema, request) => {
        await maybeFail()
        const id = request.params.id
        const existing = await jobsStore.getItem(id)
        if (!existing) return new Response(404, {}, { error: "Not found" })
        const patch = JSON.parse(request.requestBody || "{}")
        const updated = { ...existing, ...patch }
        if (patch.slug) updated.slug = slugify(patch.slug)
        await jobsStore.setItem(id, updated)
        return updated
      })

      // Reorder via fromOrder -> toOrder
      this.patch("/jobs/:id/reorder", async (schema, request) => {
        await maybeFail(0.15) // increase failure to visualize rollback
        const { fromOrder, toOrder } = JSON.parse(request.requestBody || "{}")
        const all = (await getAll(jobsStore)).sort((a,b)=>a.order-b.order)
        const idx = all.findIndex(j => j.order === fromOrder)
        const [moved] = all.splice(idx, 1)
        all.splice(toOrder-1, 0, moved)
        all.forEach((j, i) => j.order = i+1)
        for (const j of all) await jobsStore.setItem(String(j.id), j)
        return { ok: true }
      })

      // ---------- CANDIDATES ----------
      this.get("/candidates", async (schema, request) => {
        await new Promise(r => setTimeout(r, 200 + Math.random()*800))
        const url = new URL(request.url, window.location.origin)
        const search = url.searchParams.get("search") || ""
        const stage = url.searchParams.get("stage") || "" // server-like
        const page = parseInt(url.searchParams.get("page") || "1", 10)
        const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10)

        let list = await getAll(candidatesStore)
        if (search) {
          const s = search.toLowerCase()
          list = list.filter(c => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s))
        }
        if (stage) list = list.filter(c => c.stage === stage)

        const total = list.length
        const start = (page-1)*pageSize
        const data = list.slice(start, start+pageSize)
        return { data, meta: { page, pageSize, total } }
      })

      this.patch("/candidates/:id", async (schema, request) => {
        await maybeFail()
        const id = request.params.id
        const existing = await candidatesStore.getItem(id)
        if (!existing) return new Response(404, {}, { error: "Not found" })
        const patch = JSON.parse(request.requestBody || "{}")
        const updated = { ...existing, ...patch }
        await candidatesStore.setItem(id, updated)

        const timeline = (await timelinesStore.getItem(id)) || []
        if (patch.stage) {
          timeline.push({ ts: Date.now(), type: "stage", text: `Moved to ${patch.stage.toUpperCase()}` })
          await timelinesStore.setItem(id, timeline)
        }
        return updated
      })

      this.get("/candidates/:id/timeline", async (schema, request) => {
        const id = request.params.id
        const timeline = (await timelinesStore.getItem(id)) || []
        timeline.sort((a,b)=>a.ts-b.ts)
        return { data: timeline }
      })

      // ---------- ASSESSMENTS ----------
      this.get("/assessments/:jobId", async (schema, request) => {
        const jobId = request.params.jobId
        const a = await assessmentsStore.getItem(jobId)
        return a || { jobId: Number(jobId), title: "New Assessment", sections: [], conditions: [] }
      })

      this.put("/assessments/:jobId", async (schema, request) => {
        await maybeFail()
        const jobId = request.params.jobId
        const body = JSON.parse(request.requestBody || "{}")
        await assessmentsStore.setItem(jobId, body)
        return body
      })

      this.post("/assessments/:jobId/submit", async (schema, request) => {
        const jobId = request.params.jobId
        const body = JSON.parse(request.requestBody || "{}") // { candidateId, answers }
        const key = `${jobId}:${body.candidateId}`
        await responsesStore.setItem(key, body)
        return { ok: true }
      })
    }
  })

  // occasionally fail write endpoints
  async function maybeFail(rate = 0.1) {
    await new Promise(r => setTimeout(r, 200 + Math.random()*800))
    if (Math.random() < rate) throw new Response(500, {}, { error: "Random failure to test rollback" })
  }

  // trigger async seeding once after server starts
  fetch("/__seed").catch(()=>{})

  return server
}
