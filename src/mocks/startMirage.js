// src/mocks/startMirage.js
import { createServer, Model, Response } from "miragejs";

// Utility to create slugs
function slugify(s = "") {
  return s.toString().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function makeServer({ environment = "development" } = {}) {
  return createServer({
    environment,

    models: {
      job: Model,
      candidate: Model,
      assessment: Model,
    },

    seeds(server) {
      // Seed jobs
      for (let i = 1; i <= 5; i++) {
        server.create("job", {
          id: i,
          title: `Job ${i}`,
          slug: slugify(`Job ${i}`),
          status: i % 2 === 0 ? "active" : "archived",
          location: "Remote · India",
          order: i,
        });
      }

      // Seed candidates
      for (let i = 1; i <= 20; i++) {
        server.create("candidate", {
          id: i,
          name: `Candidate ${i}`,
          email: `candidate${i}@example.com`,
          jobId: 1 + (i % 5),
          stage: ["applied", "screen", "tech", "offer", "hired", "rejected"][i % 6],
        });
      }

      // Seed assessments
      for (let i = 1; i <= 3; i++) {
        server.create("assessment", {
          jobId: i,
          title: `Assessment for Job ${i}`,
          sections: [
            {
              id: "s1",
              title: "Basics",
              questions: [
                { id: "q1", type: "single", label: "Available full-time?", options: ["Yes", "No"], required: true },
                { id: "q2", type: "multi", label: "Technologies you know", options: ["React", "Node", "SQL"], required: true },
              ],
            },
          ],
        });
      }
    },

    routes() {
      this.namespace = "api"; // all routes start with /api

      // Jobs
      this.get("/jobs", (schema) => {
        return schema.jobs.all();
      });

      this.post("/jobs", (schema, request) => {
        const body = JSON.parse(request.requestBody);
        if (!body.title) return new Response(400, {}, { error: "Title required" });

        const id = schema.jobs.all().length + 1;
        const job = { id, ...body, slug: slugify(body.title), order: id };
        schema.jobs.create(job);
        return job;
      });

      // Candidates
      this.get("/candidates", (schema) => {
        return schema.candidates.all();
      });

      this.get("/candidates/:id", (schema, request) => {
        const id = request.params.id;
        const candidate = schema.candidates.find(id);
        if (!candidate) return new Response(404, {}, { error: "Not found" });
        return candidate;
      });

      // Assessments
      this.get("/assessments/:jobId", (schema, request) => {
        const jobId = request.params.jobId;
        return schema.assessments.findBy({ jobId: Number(jobId) }) || {};
      });

      this.put("/assessments/:jobId", (schema, request) => {
        const jobId = request.params.jobId;
        const body = JSON.parse(request.requestBody);
        const existing = schema.assessments.findBy({ jobId: Number(jobId) });
        if (existing) {
          existing.update(body);
          return existing;
        }
        return schema.assessments.create(body);
      });

      // Passthrough everything else
      this.passthrough();
    },
  });
}
