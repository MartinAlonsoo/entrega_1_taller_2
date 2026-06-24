import React from "react";
import { zeroHash } from "viem";
import { Job, JobRoles } from "../hooks/useJobs";
import type { StoredDeliverable } from "../lib/deliverables";
import { formatDate, formatTokenAmount, getJobStatus, shortenAddr } from "./JobCard";
import DeliverableDetail from "./DeliverableDetail";

interface Props {
  job: Job | null;
  roles: JobRoles;
  tokenDecimals: number;
  tokenSymbol: string;
  deliverable: StoredDeliverable | null;
}

const RoleBadge: React.FC<{ active: boolean; label: string }> = ({ active, label }) => (
  <span className={`badge ${active ? "badge-executed" : "badge-pending"}`} style={{ opacity: active ? 1 : 0.45 }}>
    {label}
  </span>
);

const JobDetail: React.FC<Props> = ({
  job,
  roles,
  tokenDecimals,
  tokenSymbol,
  deliverable,
}) => {
  if (!job) {
    return (
      <div className="card animate-in" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🔎</div>
        <h2 className="mb-2">Detalle del trabajo</h2>
        <p>Selecciona un trabajo para ver roles, referencias y estado completo.</p>
      </div>
    );
  }

  const status = getJobStatus(job.status);
  const rows = [
    ["Cliente", shortenAddr(job.client), job.client],
    ["Evaluador", shortenAddr(job.evaluator), job.evaluator],
    ["Proveedor", shortenAddr(job.provider), job.provider],
    ["Vencimiento", formatDate(job.expiresAt), ""],
    ["Resultado", job.resultReason === zeroHash ? "Sin resultado" : job.resultReason, job.resultReason],
  ];

  return (
    <div className="card animate-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "1.1rem" }}>🧾</span>
          <h2>Trabajo #{job.id.toString()}</h2>
        </div>
        <span className={`badge ${status.cls}`}>
          <span className="dot" style={{ background: status.color }} />
          {status.label}
        </span>
      </div>

      <p className="mb-4">{job.description}</p>

      <div
        style={{
          background: "var(--color-surface-2)",
          borderRadius: "var(--radius-sm)",
          padding: "0.75rem 0.875rem",
          marginBottom: "1rem",
        }}
      >
        <span className="text-muted text-xs">Presupuesto</span>
        <div className="font-mono" style={{ color: "var(--color-accent-2)", fontWeight: 700 }}>
          {formatTokenAmount(job.budget, tokenDecimals, tokenSymbol)}
        </div>
      </div>

      <div className="flex gap-2 mb-4" style={{ flexWrap: "wrap" }}>
        <RoleBadge active={roles.isClient} label="Cliente" />
        <RoleBadge active={roles.isEvaluator} label="Evaluador" />
        <RoleBadge active={roles.isProvider} label="Proveedor" />
      </div>

      <div className="flex flex-col gap-2">
        {rows.map(([label, value, title]) => (
          <div key={label} className="flex items-center justify-between" style={{ gap: "1rem" }}>
            <span className="text-muted text-xs">{label}</span>
            <span className="font-mono text-xs" style={{ color: "var(--color-accent-3)", wordBreak: "break-all" }} title={title}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <DeliverableDetail
        deliverableRef={job.deliverableRef}
        deliverable={deliverable}
      />
    </div>
  );
};

export default JobDetail;
