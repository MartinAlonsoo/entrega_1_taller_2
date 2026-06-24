import React, { useEffect, useState } from "react";
import { formatEther, type Address } from "viem";
import { Proposal } from "../hooks/useMultisig";
import { decodeMarketplaceCall } from "../utils/marketplaceCalldata";

interface Props {
  proposal: Proposal;
  account: Address | null;
  isSigner: boolean;
  threshold: bigint;
  txPending: boolean;
  hasApproved: (id: bigint, account: Address) => Promise<boolean>;
  onApprove: (id: bigint) => Promise<boolean>;
  onExecute: (id: bigint) => Promise<boolean>;
  onCancel: (id: bigint) => Promise<boolean>;
}

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function getStatus(p: Proposal) {
  if (p.executed) return { label: "Ejecutada", cls: "badge-executed", dot: "dot-green" };
  if (p.cancelled) return { label: "Cancelada", cls: "badge-cancelled", dot: "dot-red" };
  return { label: "Pendiente", cls: "badge-pending", dot: "dot-yellow" };
}

const ProposalCard: React.FC<Props> = ({
  proposal,
  account,
  isSigner,
  threshold,
  txPending,
  hasApproved,
  onApprove,
  onExecute,
  onCancel,
}) => {
  const [alreadyApproved, setAlreadyApproved] = useState(false);
  const [loading, setLoading] = useState(false);

  const status = getStatus(proposal);
  const isPending = !proposal.executed && !proposal.cancelled;
  const reachedThreshold = proposal.approvalCount >= threshold;
  const isProposer = account?.toLowerCase() === proposal.proposer.toLowerCase();
  const progress =
    threshold === 0n
      ? 0
      : Math.min(Number((proposal.approvalCount * 100n) / threshold), 100);
  const marketplaceCall = decodeMarketplaceCall(proposal.to, proposal.data);

  useEffect(() => {
    if (account && isPending) {
      hasApproved(proposal.id, account).then(setAlreadyApproved);
    }
  }, [account, proposal.id, proposal.approvalCount, isPending, hasApproved]);

  const handleAction = async (action: () => Promise<boolean>) => {
    setLoading(true);
    await action();
    setLoading(false);
  };

  const disabled = !isSigner || txPending || loading;

  return (
    <div
      id={`proposal-${proposal.id.toString()}`}
      className="card animate-in"
      style={{
        borderColor: isPending
          ? "rgba(139, 92, 246, 0.2)"
          : proposal.executed
          ? "rgba(16, 185, 129, 0.2)"
          : "rgba(239, 68, 68, 0.15)",
        transition: "all 250ms ease",
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
            #{proposal.id.toString()}
          </span>
          <span className={`badge ${status.cls}`}>
            <span
              className="dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background:
                  proposal.executed
                    ? "var(--color-success)"
                    : proposal.cancelled
                    ? "var(--color-danger)"
                    : "var(--color-warning)",
                display: "inline-block",
              }}
            />
            {status.label}
          </span>
        </div>
        <span className="text-muted text-xs font-mono">
          Prop: {shortenAddr(proposal.proposer)}
        </span>
      </div>

      {marketplaceCall && (
        <div
          style={{
            background: "rgba(6, 182, 212, 0.08)",
            border: "1px solid rgba(6, 182, 212, 0.22)",
            borderRadius: "var(--radius-sm)",
            padding: "0.625rem 0.875rem",
            marginBottom: "0.875rem",
          }}
        >
          <div className="text-xs text-cyan mb-2">Acción Marketplace</div>
          <div className="text-sm">
            {marketplaceCall.functionName === "complete" ? "Completar" : "Rechazar"}{" "}
            trabajo <strong>#{marketplaceCall.jobId.toString()}</strong>
          </div>
          <div className="text-xs text-muted mt-1">
            Razón: <span className="font-mono">{marketplaceCall.reason}</span>
          </div>
        </div>
      )}

      <div
        style={{
          background: "var(--color-surface-2)",
          borderRadius: "var(--radius-sm)",
          padding: "0.625rem 0.875rem",
          marginBottom: "0.875rem",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-muted text-xs">Destino</span>
          <span className="text-xs font-mono" style={{ color: "var(--color-accent-3)" }}>
            {shortenAddr(proposal.to)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted text-xs">Valor</span>
          <span
            className="font-mono text-xs"
            style={{ color: "var(--color-accent-2)", fontWeight: 700 }}
          >
            {formatEther(proposal.value)} ETH
          </span>
        </div>
        {proposal.data && proposal.data !== "0x" && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-muted text-xs">Calldata</span>
            <span className="font-mono text-xs text-muted" style={{ maxWidth: "120px" }} title={proposal.data}>
              {proposal.data.slice(0, 10)}…
            </span>
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-muted text-xs">Aprobaciones</span>
          <span className="font-mono text-xs" style={{ fontWeight: 700, color: reachedThreshold ? "var(--color-success)" : "var(--color-text)" }}>
            {proposal.approvalCount.toString()} / {threshold.toString()}
            {reachedThreshold && " ✓"}
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
          <button
            id={`btn-approve-${proposal.id.toString()}`}
            className="btn btn-cyan btn-sm"
            disabled={disabled || alreadyApproved || !isSigner}
            onClick={() => handleAction(() => onApprove(proposal.id))}
            title={alreadyApproved ? "Ya aprobaste esta propuesta" : "Aprobar propuesta"}
            style={{ flex: 1, justifyContent: "center" }}
          >
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "👍"}
            {alreadyApproved ? "Ya aprobado" : "Aprobar"}
          </button>

          <button
            id={`btn-execute-${proposal.id.toString()}`}
            className="btn btn-success btn-sm"
            disabled={disabled || !reachedThreshold || !isSigner}
            onClick={() => handleAction(() => onExecute(proposal.id))}
            title={
              !reachedThreshold
                ? `Faltan ${(threshold - proposal.approvalCount).toString()} aprobaciones`
                : "Ejecutar propuesta"
            }
            style={{ flex: 1, justifyContent: "center" }}
          >
            {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "⚡"}
            Ejecutar
          </button>

          {isProposer && (
            <button
              id={`btn-cancel-${proposal.id.toString()}`}
              className="btn btn-danger btn-sm"
              disabled={disabled}
              onClick={() => handleAction(() => onCancel(proposal.id))}
              title="Cancelar propuesta"
              style={{ justifyContent: "center" }}
            >
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "✕"}
            </button>
          )}
        </div>
      )}

      {!isPending && (
        <div style={{ textAlign: "center" }}>
          <a
            href={`https://sepolia.etherscan.io/address/${proposal.to}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted text-xs"
            style={{ textDecoration: "none" }}
          >
            Ver destino en Etherscan ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default ProposalCard;
