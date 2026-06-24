import React from "react";
import { formatUnits, zeroAddress } from "viem";
import { Job, JobStatus } from "../hooks/useJobs";

interface Props {
  job: Job;
  selected: boolean;
  tokenDecimals: number;
  tokenSymbol: string;
  onSelect: (id: bigint) => void;
}

export function shortenAddr(addr: string) {
  if (!addr || addr === zeroAddress) return "Sin asignar";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatDate(timestamp: bigint) {
  return new Date(Number(timestamp) * 1000).toLocaleString();
}

export function getJobStatus(status: JobStatus) {
  const map = {
    [JobStatus.Open]: { label: "Abierto", cls: "badge-pending", color: "var(--color-warning)" },
    [JobStatus.Funded]: { label: "Fondeado", cls: "badge-pending", color: "var(--color-warning)" },
    [JobStatus.Submitted]: { label: "Entregado", cls: "badge-pending", color: "var(--color-accent-2)" },
    [JobStatus.Completed]: { label: "Completado", cls: "badge-executed", color: "var(--color-success)" },
    [JobStatus.Rejected]: { label: "Rechazado", cls: "badge-cancelled", color: "var(--color-danger)" },
    [JobStatus.Expired]: { label: "Expirado", cls: "badge-cancelled", color: "var(--color-danger)" },
  };

  return map[status] || map[JobStatus.Open];
}

export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  symbol: string
) {
  const formatted = formatUnits(amount, decimals || 18);
  const compact = Number(formatted).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
  return `${compact} ${symbol || "TOKEN"}`;
}

const JobCard: React.FC<Props> = ({
  job,
  selected,
  tokenDecimals,
  tokenSymbol,
  onSelect,
}) => {
  const status = getJobStatus(job.status);
  const expired = BigInt(Math.floor(Date.now() / 1000)) > job.expiresAt;

  return (
    <button
      id={`job-${job.id.toString()}`}
      className="card animate-in"
      onClick={() => onSelect(job.id)}
      style={{
        textAlign: "left",
        cursor: "pointer",
        borderColor: selected ? "rgba(6, 182, 212, 0.55)" : undefined,
        boxShadow: selected
          ? "var(--shadow-card), 0 0 26px rgba(6, 182, 212, 0.22)"
          : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              padding: "0.15rem 0.6rem",
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              color: "var(--color-accent)",
              fontWeight: 700,
            }}
          >
            #{job.id.toString()}
          </span>
          <span className={`badge ${status.cls}`}>
            <span className="dot" style={{ background: status.color }} />
            {status.label}
          </span>
        </div>
        {expired && (job.status === JobStatus.Funded || job.status === JobStatus.Submitted) && (
          <span className="badge badge-cancelled">Vencido</span>
        )}
      </div>

      <h3 className="mb-3" style={{ lineHeight: 1.35 }}>
        {job.description || "Trabajo sin descripción"}
      </h3>

      <div
        style={{
          background: "var(--color-surface-2)",
          borderRadius: "var(--radius-sm)",
          padding: "0.625rem 0.875rem",
          marginBottom: "0.875rem",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-muted text-xs">Presupuesto</span>
          <span className="font-mono text-xs" style={{ color: "var(--color-accent-2)", fontWeight: 700 }}>
            {formatTokenAmount(job.budget, tokenDecimals, tokenSymbol)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-muted text-xs">Proveedor</span>
          <span className="font-mono text-xs text-muted">{shortenAddr(job.provider)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted text-xs">Vence</span>
          <span className="font-mono text-xs text-muted">{formatDate(job.expiresAt)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted text-xs">Cliente: {shortenAddr(job.client)}</span>
        <span className="text-muted text-xs">Evaluador: {shortenAddr(job.evaluator)}</span>
      </div>
    </button>
  );
};

export default JobCard;
