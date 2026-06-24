import React, { useState } from "react";
import { Proposal } from "../hooks/useMultisig";
import type { Address } from "viem";
import ProposalCard from "./ProposalCard";

interface Props {
  proposals: Proposal[];
  account: Address | null;
  isSigner: boolean;
  threshold: bigint;
  txPending: boolean;
  hasApproved: (id: bigint, account: Address) => Promise<boolean>;
  onApprove: (id: bigint) => Promise<boolean>;
  onExecute: (id: bigint) => Promise<boolean>;
  onCancel: (id: bigint) => Promise<boolean>;
}

type Filter = "all" | "pending" | "executed" | "cancelled";

const ProposalList: React.FC<Props> = (props) => {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = props.proposals.filter((p) => {
    if (filter === "pending") return !p.executed && !p.cancelled;
    if (filter === "executed") return p.executed;
    if (filter === "cancelled") return p.cancelled;
    return true;
  });

  const sorted = [...filtered].reverse();

  const counts = {
    all: props.proposals.length,
    pending: props.proposals.filter((p) => !p.executed && !p.cancelled).length,
    executed: props.proposals.filter((p) => p.executed).length,
    cancelled: props.proposals.filter((p) => p.cancelled).length,
  };

  const filters: { key: Filter; label: string; cls: string }[] = [
    { key: "all", label: "Todas", cls: "" },
    { key: "pending", label: "Pendientes", cls: "badge-pending" },
    { key: "executed", label: "Ejecutadas", cls: "badge-executed" },
    { key: "cancelled", label: "Canceladas", cls: "badge-cancelled" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "1.2rem" }}>📜</span>
          <h2>Propuestas</h2>
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
            {props.proposals.length}
          </span>
        </div>

        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
          {filters.map(({ key, label, cls }) => (
            <button
              key={key}
              id={`filter-${key}`}
              className={`btn btn-sm ${filter === key ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setFilter(key)}
              style={{ gap: "0.35rem" }}
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
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            color: "var(--color-text-muted)",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
          <p>
            {props.proposals.length === 0
              ? "No hay propuestas todavía. ¡Sé el primero en crear una!"
              : "No hay propuestas con este filtro."}
          </p>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1rem",
        }}
      >
        {sorted.map((p) => (
          <ProposalCard
            key={p.id.toString()}
            proposal={p}
            account={props.account}
            isSigner={props.isSigner}
            threshold={props.threshold}
            txPending={props.txPending}
            hasApproved={props.hasApproved}
            onApprove={props.onApprove}
            onExecute={props.onExecute}
            onCancel={props.onCancel}
          />
        ))}
      </div>
    </div>
  );
};

export default ProposalList;
