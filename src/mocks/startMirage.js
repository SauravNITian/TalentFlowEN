// src/mocks/startMirage.js
import { createServer, Model, Response } from "miragejs";

/* ----------------------------- utils ----------------------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const delay = async (min = 150, max = 600) => sleep(min + Math.random() * (max - min));

function slugify(s = "") {
  return s.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

const STAGES = ["applied", "screen", "tech", "offer", "hired", "rejected"];

/* ----------------------------- server ---------------------------- */
export function makeServer({ environment = "development" } = {}) {
  return createServer({
    environment,

    models: {
      job: Model,
      candidate: Model,
      assessment: Model,
      timeline: Model, // { id: candidateId, items: [] }
    },

    seeds(server) {
      // ---- Jobs
      const locations = ["Remote · India", "Bengaluru", "Hyderabad", "Pune", "Delhi NCR", "Remote · US"];
      for (let i = 1; i <= 25; i++) {
        const title = `Job ${i}`;
        server.create("job", {
          id: i,
          title,
          slug: slugify(title),
          status: i % 5 === 0 ? "archived" : "active",
          location: locations[i % locations.length],
          order: i,
          tags: ["react", "node", "full-time", "hybrid", "remote"].slice(0, 1 + (i % 3)),
        });
      }

      // ---- Candidates + timelines
      let cid = 1;
      for (let i = 0; i < 600; i++) {
        const jobId = 1 + (i % 25);
        const stage = STAGES[i % STAGES.length];
        const c = server.create("candidate", {
          id: cid,
          name: `Candidate ${cid}`,
          email: `candidate${cid}@example.com`,
          jobId,
          stage,
        });
        server.create("timeline", {
          id: String(c.id),
          items: [
            { ts: Date.now() - 3 * 864e5, type: "created", text: "Candidate created" },
            { ts: Date.now() - 2 * 864e5, type: "applied", text: `Applied to job #${jobId}` },
            { ts: Date.now() - 1 * 864e5, type: "stage", text: `Moved to ${stage.toUpperCase()}` },
          ],
        });
        cid++;
      }

      // ---- Assessments
      for (let j = 1; j <= 3; j++) {
        server.create("assessment", {
          jobId: j,
          title: `Assessment for Job ${j}`,
          sections: [
            {
              id: "s1",
              title: "Basics",
              questions: [
                { id: "q1", type: "single", label: "Available full-time?", options: ["Yes", "No"], required: true },
                { id: "q2", type: "multi", label: "Technologies you know", options: ["React", "Node", "SQL", "Docker"], required: true },
                { id: "q3", type: "text", label: "A project you're proud of", maxLength: 200 },
              ],
            },
            {
              id: "s2",
              title: "Numbers & Files",
              questions: [
                { id: "q4", type: "number", label: "Years of experience", min: 0, max: 40, required: true },
                { id: "q5", type: "file", label: "Resume (upload stub)" },
              ],
            },
          ],
          conditions: [
            // example: show q3 if q1 === "Yes"
            { if: { questionId: "q1", equals: "Yes" }, show: ["q3"] },
          ],
        });
      }
    },

    routes() {
      // All API under /api/*
      this.namespace = "api";

      /* ---------------------------- JOBS ---------------------------- */
      // GET /api/jobs?search=&status=&sort=order|title&page=1&pageSize=10
      this.get("/jobs", async (schema, request) => {
        await delay();
        const url = new URL(request.url, window.location.origin);
        const search = (url.searchParams.get("search") || "").toLowerCase();
        const status = url.searchParams.get("status") || "";
        const sort = url.searchParams.get("sort") || "order";
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const pageSize = parseInt(url.searchParams.get("pageSize") || "10", 10);

        let list = schema.jobs.all().models.map((m) => m.attrs);
        if (search) list = list.filter((j) => j.title.toLowerCase().includes(search) || j.tags?.join(" ").toLowerCase().includes(search));
        if (status) list = list.filter((j) => j.status === status);

        if (sort === "order") list.sort((a, b) => a.order - b.order);
        else if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));

        const total = list.length;
        const start = (page - 1) * pageSize;
        const data = list.slice(start, start + pageSize);
        return { data, meta: { page, pageSize, total } };
      });

      this.post("/jobs", async (schema, request) => {
        await delay();
        const body = JSON.parse(request.requestBody || "{}");
        if (!body.title) return new Response(400, {}, { error: "Title required" });

        const all = schema.jobs.all().models.map((m) => m.attrs);
        const id = all.length ? Math.max(...all.map((j) => j.id)) + 1 : 1;
        const job = {
          id,
          title: body.title,
          slug: slugify(body.slug || body.title),
          status: body.status || "active",
          tags: body.tags || [],
          order: id,
          location: body.location || "Remote · India",
        };
        schema.jobs.create(job);
        return job;
      });

      this.patch("/jobs/:id", async (schema, request) => {
        await delay();
        const id = request.params.id;
        const body = JSON.parse(request.requestBody || "{}");
        const rec = schema.jobs.find(id);
        if (!rec) return new Response(404, {}, { error: "Not found" });
        const patch = { ...rec.attrs, ...body };
        if (body.slug) patch.slug = slugify(body.slug);
        rec.update(patch);
        return rec.attrs;
      });

      // Reorder via fromOrder->toOrder (optimistic UI testing)
      this.patch("/jobs/:id/reorder", async (schema, request) => {
        await delay();
        const { fromOrder, toOrder } = JSON.parse(request.requestBody || "{}");
        let list = schema.jobs.all().models.map((m) => m.attrs).sort((a, b) => a.order - b.order);
        const idx = list.findIndex((j) => j.order === fromOrder);
        if (idx === -1) return new Response(400, {}, { error: "fromOrder not found" });
        const [moved] = list.splice(idx, 1);
        list.splice(toOrder - 1, 0, moved);
        list.forEach((j, i) => (j.order = i + 1));
        list.forEach((j) => schema.jobs.find(j.id).update(j));
        return { ok: true };
      });

      /* ------------------------- CANDIDATES ------------------------- */
      // GET /api/candidates?search=&stage=&page=1&pageSize=50
      this.get("/candidates", async (schema, request) => {
        await delay();
        const url = new URL(request.url, window.location.origin);
        const search = (url.searchParams.get("search") || "").toLowerCase();
        const stage = url.searchParams.get("stage") || "";
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const pageSize = parseInt(url.searchParams.get("pageSize") || "50", 10);

        let list = schema.candidates.all().models.map((m) => m.attrs);
        if (search) list = list.filter((c) => c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search));
        if (stage) list = list.filter((c) => c.stage === stage);

        const total = list.length;
        const start = (page - 1) * pageSize;
        const data = list.slice(start, start + pageSize);
        return { data, meta: { page, pageSize, total } };
      });

      this.get("/candidates/:id", async (schema, request) => {
        await delay();
        const id = request.params.id;
        const rec = schema.candidates.find(id);
        if (!rec) return new Response(404, {}, { error: "Not found" });
        return rec.attrs;
      });

      this.patch("/candidates/:id", async (schema, request) => {
        await delay();
        const id = request.params.id;
        const body = JSON.parse(request.requestBody || "{}");
        const rec = schema.candidates.find(id);
        if (!rec) return new Response(404, {}, { error: "Not found" });

        const updated = { ...rec.attrs, ...body };
        rec.update(updated);

        // append timeline when stage changes
        if (body.stage) {
          const t = schema.timelines.find(String(id));
          const items = t?.attrs?.items || [];
          items.push({ ts: Date.now(), type: "stage", text: `Moved to ${body.stage.toUpperCase()}` });
          if (t) t.update({ items });
          else schema.create("timeline", { id: String(id), items });
        }

        return rec.attrs;
      });

      this.get("/candidates/:id/timeline", async (schema, request) => {
        await delay();
        const id = String(request.params.id);
        const t = schema.timelines.find(id);
        const items = t?.attrs?.items || [];
        items.sort((a, b) => a.ts - b.ts);
        return { data: items };
      });

      /* ------------------------- ASSESSMENTS ------------------------ */
      this.get("/assessments/:jobId", async (schema, request) => {
        await delay();
        const jobId = Number(request.params.jobId);
        const a = schema.assessments.findBy({ jobId });
        return a ? a.attrs : { jobId, title: "New Assessment", sections: [], conditions: [] };
      });

      this.put("/assessments/:jobId", async (schema, request) => {
        await delay();
        const jobId = Number(request.params.jobId);
        const body = JSON.parse(request.requestBody || "{}");
        const a = schema.assessments.findBy({ jobId });
        if (a) {
          a.update(body);
          return a.attrs;
        }
        return schema.create("assessment", body).attrs;
      });

      this.post("/assessments/:jobId/submit", async (schema, request) => {
        await delay();
        // Normally you'd persist responses; here we just ACK.
        return { ok: true };
      });

      /* ------------------------- passthrough ------------------------ */
      this.passthrough(); // let static assets/other requests through
    },
  });
}
