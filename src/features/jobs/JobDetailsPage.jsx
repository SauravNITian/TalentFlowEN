import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faTag, faBriefcase } from "@fortawesome/free-solid-svg-icons";

export default function JobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/jobs?page=1&pageSize=9999`);
        const j = await r.json();
        setJob(j.data.find((x) => String(x.id) === String(id)));
      } catch (error) {
        console.error("Failed to fetch job data:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function save() {
    try {
      const title = prompt("Edit title", job.title) || job.title;
      const slug = prompt("Edit slug", job.slug) || job.slug;
      const location = prompt("Edit location", job.location) || job.location;
      const tags = (
        prompt("Edit tags (comma-separated)", job.tags.join(", ")) || ""
      )
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, location, tags }),
      });

      if (res.ok) {
        const upd = await res.json();
        setJob(upd);
        alert("Saved successfully!");
      } else {
        alert("Save failed. Please try again.");
      }
    } catch (error) {
      console.error("Failed to save job details:", error);
      alert("An error occurred during save.");
    }
  }

  if (loading) return <p className="text-slate-600 dark:text-slate-300 animate-pulse">Loading job details...</p>;
  if (!job) return <p className="text-slate-600 dark:text-slate-300">Job not found.</p>;

  return (
    <div
      className="
        w-full max-w-4xl
        rounded-2xl overflow-hidden
        bg-white text-slate-900
        shadow-[0_10px_30px_rgba(2,6,23,0.08)]
        ring-1 ring-slate-200
        dark:bg-slate-900 dark:text-slate-100
        dark:shadow-[0_10px_30px_rgba(0,0,0,0.45)]
        dark:ring-slate-800
        transform transition-all hover:scale-[1.01] duration-300
      "
    >
      <div className="p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
              {job.title}
            </h1>
            <span
              className="
                mt-2 inline-block px-3 py-1 text-xs md:text-sm font-medium
                rounded-full
                bg-slate-100 text-slate-700
                dark:bg-slate-800 dark:text-slate-200
                ring-1 ring-slate-200 dark:ring-slate-700
              "
            >
              {job.slug}
            </span>
          </div>
          <button
            onClick={save}
            className="
              px-5 py-2.5 md:px-6 md:py-3 rounded-full font-semibold
              bg-blue-600 text-white hover:bg-blue-700
              shadow-lg hover:shadow-xl
              transition-colors duration-300 ease-in-out transform hover:scale-105
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              dark:focus:ring-offset-slate-900
            "
          >
            <FontAwesomeIcon icon={faBriefcase} className="mr-2" />
            Edit Job Details
          </button>
        </div>

        <hr className="my-6 border-slate-200 dark:border-slate-800" />

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Location */}
          <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-200">
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              className="text-lg text-blue-600 dark:text-blue-400"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Location
              </span>
              <span className="text-lg font-medium">{job.location}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-start space-x-3 text-slate-700 dark:text-slate-200 col-span-1 md:col-span-2 lg:col-span-1">
            <FontAwesomeIcon
              icon={faTag}
              className="text-lg mt-1 text-emerald-600 dark:text-emerald-400"
            />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tags
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {job.tags.length > 0 ? (
                  job.tags.map((t) => (
                    <span
                      key={t}
                      className="
                        px-3 py-1 rounded-full text-xs font-semibold
                        bg-emerald-100 text-emerald-800
                        dark:bg-emerald-900/40 dark:text-emerald-200
                        ring-1 ring-emerald-200 dark:ring-emerald-800
                      "
                    >
                      {t}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 text-sm">
                    No tags specified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
