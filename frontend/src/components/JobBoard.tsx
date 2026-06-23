import React, { useState } from "react";
import { Job, JobStatus } from "../hooks/useJobs";
import JobCard from "./JobCard";

type JobFilter =
  | "all"
  | "open"
  | "funded"
  | "submitted"
  | "completed"
  | "rejected"
  | "expired";

interface Props {
  jobs: Job[];
  selectedJobId: number | null;
  tokenDecimals: number;
  tokenSymbol: string;
  onSelectJob: (id: number) => void;
}

const filterToStatus: Record<Exclude<JobFilter, "all">, JobStatus> = {
  open: JobStatus.Open,
  funded: JobStatus.Funded,
  submitted: JobStatus.Submitted,
  completed: JobStatus.Completed,
  rejected: JobStatus.Rejected,
  expired: JobStatus.Expired,
};

const filters: { key: JobFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "open", label: "Abiertos" },
  { key: "funded", label: "Fondeados" },
  { key: "submitted", label: "Entregados" },
  { key: "completed", label: "Completados" },
  { key: "rejected", label: "Rechazados" },
  { key: "expired", label: "Expirados" },
];

const JobBoard: React.FC<Props> = ({
  jobs,
  selectedJobId,
  tokenDecimals,
  tokenSymbol,
  onSelectJob,
}) => {
  const [filter, setFilter] = useState<JobFilter>("all");

  const filtered = jobs.filter((job) => {
    if (filter === "all") return true;
    return job.status === filterToStatus[filter];
  });

  const sorted = [...filtered].reverse();
  const counts = filters.reduce<Record<JobFilter, number>>((acc, item) => {
    if (item.key === "all") {
      acc[item.key] = jobs.length;
      return acc;
    }

    const statusKey = item.key as Exclude<JobFilter, "all">;
    acc[item.key] = jobs.filter(
      (job) => job.status === filterToStatus[statusKey]
    ).length;
    return acc;
  }, {} as Record<JobFilter, number>);

  return (
    <div>
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "1.2rem" }}>🧭</span>
          <h2>Trabajos publicados</h2>
          <span
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "9999px",
              padding: "0.1rem 0.6rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              color: "var(--color-accent)",
            }}
          >
            {jobs.length}
          </span>
        </div>

        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
          {filters.map(({ key, label }) => (
            <button
              key={key}
              className={`btn btn-sm ${filter === key ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(key)}
            >
              {label}
              {counts[key] > 0 && (
                <span
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "9999px",
                    padding: "0 0.4rem",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}
                >
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--color-text-muted)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
          <p>{jobs.length === 0 ? "No hay trabajos publicados todavía." : "No hay trabajos con este filtro."}</p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1rem",
        }}
      >
        {sorted.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            selected={selectedJobId === job.id}
            tokenDecimals={tokenDecimals}
            tokenSymbol={tokenSymbol}
            onSelect={onSelectJob}
          />
        ))}
      </div>
    </div>
  );
};

export default JobBoard;
