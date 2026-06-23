import React, { useState } from "react";
import { ethers } from "ethers";
import { Erc20State } from "../hooks/useErc20";
import { Job, JobRoles, JobStatus } from "../hooks/useJobs";
import { formatTokenAmount } from "./JobCard";

interface Props {
  job: Job | null;
  roles: JobRoles;
  pending: boolean;
  token: Erc20State;
  onApprove: (amount: ethers.BigNumberish) => Promise<boolean>;
  onFund: (jobId: number) => Promise<boolean>;
  onSubmit: (jobId: number, ref: string) => Promise<boolean>;
  onComplete: (jobId: number, reason: string) => Promise<boolean>;
  onReject: (jobId: number, reason: string) => Promise<boolean>;
  onClaimRefund: (jobId: number) => Promise<boolean>;
}

function isExpired(job: Job) {
  return Date.now() / 1000 > job.expiresAt;
}

function validateBytes32Text(value: string, label: string) {
  if (!value.trim()) return `${label} es obligatorio`;
  if (ethers.utils.toUtf8Bytes(value).length > 31) {
    return `${label} debe tener 31 bytes o menos`;
  }
  return "";
}

const JobActionsPanel: React.FC<Props> = ({
  job,
  roles,
  pending,
  token,
  onApprove,
  onFund,
  onSubmit,
  onComplete,
  onReject,
  onClaimRefund,
}) => {
  const [deliverableRef, setDeliverableRef] = useState("");
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  if (!job) {
    return (
      <div className="card animate-in" style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🛠️</div>
        <h2 className="mb-2">Acciones</h2>
        <p>Selecciona un trabajo para ver las acciones disponibles.</p>
      </div>
    );
  }

  const expired = isExpired(job);
  const needsApproval = token.allowance.lt(job.budget);
  const disabled = pending || localLoading;

  const run = async (action: () => Promise<boolean>, clear?: () => void) => {
    setLocalLoading(true);
    setLocalError("");
    const ok = await action();
    setLocalLoading(false);
    if (ok && clear) clear();
    return ok;
  };

  const handleSubmit = () => {
    const error = validateBytes32Text(deliverableRef, "La referencia de entrega");
    if (error) {
      setLocalError(error);
      return;
    }
    run(() => onSubmit(job.id, deliverableRef), () => setDeliverableRef(""));
  };

  const handleComplete = () => {
    const error = validateBytes32Text(reason, "La razón");
    if (error) {
      setLocalError(error);
      return;
    }
    run(() => onComplete(job.id, reason), () => setReason(""));
  };

  const handleReject = () => {
    const error = validateBytes32Text(reason, "La razón");
    if (error) {
      setLocalError(error);
      return;
    }
    run(() => onReject(job.id, reason), () => setReason(""));
  };

  return (
    <div className="card animate-in">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: "1.1rem" }}>⚡</span>
        <h2>Acciones</h2>
      </div>

      {localError && (
        <div
          className="mb-3"
          style={{
            padding: "0.625rem 0.875rem",
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius-sm)",
            color: "#fca5a5",
            fontSize: "0.85rem",
          }}
        >
          ⚠️ {localError}
        </div>
      )}

      {expired && (job.status === JobStatus.Funded || job.status === JobStatus.Submitted) && (
        <button
          className="btn btn-danger w-full mb-3"
          disabled={disabled}
          onClick={() => run(() => onClaimRefund(job.id))}
          style={{ justifyContent: "center" }}
        >
          {localLoading ? <span className="spinner" /> : "↩"}
          Reclamar reembolso
        </button>
      )}

      {job.status === JobStatus.Open && roles.isClient && (
        <div className="flex flex-col gap-3">
          <div className="text-muted text-sm">
            Presupuesto requerido: {formatTokenAmount(job.budget, token.decimals, token.symbol)}
          </div>

          {needsApproval ? (
            <button
              className="btn btn-cyan w-full"
              disabled={disabled}
              onClick={() => run(() => onApprove(job.budget))}
              style={{ justifyContent: "center" }}
            >
              {localLoading ? <span className="spinner" /> : "✓"}
              Aprobar token
            </button>
          ) : (
            <button
              className="btn btn-success w-full"
              disabled={disabled}
              onClick={() => run(() => onFund(job.id))}
              style={{ justifyContent: "center" }}
            >
              {localLoading ? <span className="spinner" /> : "💰"}
              Fondear escrow
            </button>
          )}
        </div>
      )}

      {job.status === JobStatus.Funded && roles.isProvider && !expired && (
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="input-deliverable-ref">Referencia de entrega</label>
            <input
              id="input-deliverable-ref"
              className="input"
              placeholder="delivery-v1"
              value={deliverableRef}
              onChange={(e) => setDeliverableRef(e.target.value)}
            />
          </div>
          <button className="btn btn-primary w-full" disabled={disabled} onClick={handleSubmit} style={{ justifyContent: "center" }}>
            {localLoading ? <span className="spinner" /> : "📦"}
            Registrar entrega
          </button>
        </div>
      )}

      {(job.status === JobStatus.Funded || job.status === JobStatus.Submitted) && roles.isEvaluator && !expired && (
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="input-result-reason">Razón / resultado</label>
            <input
              id="input-result-reason"
              className="input"
              placeholder="approved"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {job.status === JobStatus.Submitted && (
            <button className="btn btn-success w-full" disabled={disabled} onClick={handleComplete} style={{ justifyContent: "center" }}>
              {localLoading ? <span className="spinner" /> : "✓"}
              Completar y pagar
            </button>
          )}

          <button className="btn btn-danger w-full" disabled={disabled} onClick={handleReject} style={{ justifyContent: "center" }}>
            {localLoading ? <span className="spinner" /> : "✕"}
            Rechazar
          </button>
        </div>
      )}

      {job.status === JobStatus.Open && !roles.isClient && (
        <p className="text-muted text-sm">Solo el cliente puede fondear este trabajo.</p>
      )}

      {job.status === JobStatus.Funded && !roles.isProvider && !roles.isEvaluator && !expired && (
        <p className="text-muted text-sm">Esperando acción del proveedor o evaluador.</p>
      )}

      {job.status === JobStatus.Submitted && !roles.isEvaluator && !expired && (
        <p className="text-muted text-sm">La entrega está esperando evaluación.</p>
      )}

      {(job.status === JobStatus.Completed || job.status === JobStatus.Rejected || job.status === JobStatus.Expired) && (
        <p className="text-muted text-sm">Este trabajo ya está en estado final.</p>
      )}
    </div>
  );
};

export default JobActionsPanel;
