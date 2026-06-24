import React, { useState } from "react";
import { isAddress, zeroAddress, type Address } from "viem";
import { Erc20State } from "../hooks/useErc20";
import { Job, JobRoles, JobStatus } from "../hooks/useJobs";
import { validateDeliverableContent } from "../lib/deliverables";
import { formatTokenAmount } from "./JobCard";

interface Props {
  job: Job | null;
  roles: JobRoles;
  pending: boolean;
  token: Erc20State;
  onApprove: (amount: bigint) => Promise<boolean>;
  onSetProvider: (jobId: bigint, provider: Address) => Promise<boolean>;
  onFund: (jobId: bigint) => Promise<boolean>;
  onSubmit: (jobId: bigint, ref: string) => Promise<boolean>;
  onComplete: (jobId: bigint, reason: string) => Promise<boolean>;
  onReject: (
    jobId: bigint,
    reason: string,
    includeToken?: boolean
  ) => Promise<boolean>;
  onClaimRefund: (jobId: bigint) => Promise<boolean>;
}

function isExpired(job: Job) {
  return BigInt(Math.floor(Date.now() / 1000)) > job.expiresAt;
}

function validateBytes32Text(value: string, label: string) {
  if (!value.trim()) return `${label} es obligatorio`;
  if (new TextEncoder().encode(value).length > 31) {
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
  onSetProvider,
  onFund,
  onSubmit,
  onComplete,
  onReject,
  onClaimRefund,
}) => {
  const [deliverableContent, setDeliverableContent] = useState("");
  const [clientRejectReason, setClientRejectReason] = useState("");
  const [evaluatorReason, setEvaluatorReason] = useState("");
  const [providerAddress, setProviderAddress] = useState("");
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
  const needsApproval = token.allowance < job.budget;
  const needsProvider = job.provider === zeroAddress;
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
    const error = validateDeliverableContent(deliverableContent);
    if (error) {
      setLocalError(error);
      return;
    }
    run(
      () => onSubmit(job.id, deliverableContent),
      () => setDeliverableContent("")
    );
  };

  const handleSetProvider = () => {
    if (!isAddress(providerAddress) || providerAddress === zeroAddress) {
      setLocalError("Ingresá una dirección de proveedor válida y distinta de cero");
      return;
    }
    run(
      () => onSetProvider(job.id, providerAddress),
      () => setProviderAddress("")
    );
  };

  const handleComplete = () => {
    const error = validateBytes32Text(evaluatorReason, "La razón");
    if (error) {
      setLocalError(error);
      return;
    }
    run(
      () => onComplete(job.id, evaluatorReason),
      () => setEvaluatorReason("")
    );
  };

  const handleEvaluatorReject = () => {
    const error = validateBytes32Text(evaluatorReason, "La razón");
    if (error) {
      setLocalError(error);
      return;
    }
    run(
      () => onReject(job.id, evaluatorReason, true),
      () => setEvaluatorReason("")
    );
  };

  const handleClientReject = () => {
    const error = validateBytes32Text(
      clientRejectReason,
      "El motivo del rechazo"
    );
    if (error) {
      setLocalError(error);
      return;
    }
    run(
      () => onReject(job.id, clientRejectReason, false),
      () => setClientRejectReason("")
    );
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

          {needsProvider ? (
            <>
              <div>
                <label htmlFor="input-provider-address">
                  Dirección del proveedor
                </label>
                <input
                  id="input-provider-address"
                  className="input input-mono"
                  placeholder="0x..."
                  value={providerAddress}
                  onChange={(event) => setProviderAddress(event.target.value)}
                />
              </div>
              <button
                className="btn btn-primary w-full"
                disabled={disabled}
                onClick={handleSetProvider}
              >
                Asignar proveedor
              </button>
            </>
          ) : needsApproval ? (
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

          <div className="danger-zone">
            <div>
              <label htmlFor="client-reject-reason">
                Motivo del rechazo
              </label>
              <input
                id="client-reject-reason"
                className="input"
                placeholder="cancelled"
                value={clientRejectReason}
                onChange={(event) =>
                  setClientRejectReason(event.target.value)
                }
              />
            </div>
            <p className="text-muted text-xs">
              Esta acción es irreversible. Como el trabajo sigue abierto, no
              mueve fondos.
            </p>
            <button
              className="btn btn-danger w-full"
              disabled={disabled}
              onClick={handleClientReject}
              style={{ justifyContent: "center" }}
            >
              {localLoading ? <span className="spinner" /> : "✕"}
              Rechazar trabajo
            </button>
          </div>
        </div>
      )}

      {job.status === JobStatus.Funded && roles.isProvider && !expired && (
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="deliverable-content">
              Contenido o URL de la entrega
            </label>
            <textarea
              id="deliverable-content"
              className="input"
              rows={6}
              placeholder="Descripción, instrucciones, resultado o URL..."
              value={deliverableContent}
              onChange={(event) => setDeliverableContent(event.target.value)}
            />
          </div>
          <p className="text-muted text-xs">
            El contenido se guarda en este navegador. En blockchain solo se
            registra su hash.
          </p>
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
              value={evaluatorReason}
              onChange={(e) => setEvaluatorReason(e.target.value)}
            />
          </div>

          {job.status === JobStatus.Submitted && (
            <button className="btn btn-success w-full" disabled={disabled} onClick={handleComplete} style={{ justifyContent: "center" }}>
              {localLoading ? <span className="spinner" /> : "✓"}
              Completar y pagar
            </button>
          )}

          <button className="btn btn-danger w-full" disabled={disabled} onClick={handleEvaluatorReject} style={{ justifyContent: "center" }}>
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
