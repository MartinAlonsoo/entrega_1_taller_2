import React from "react";
import type { Address } from "viem";
interface Props {
  signers: readonly Address[];
  threshold: bigint;
  contractAddress: Address;
}

function shortenAddr(addr: string) {
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

const ContractInfo: React.FC<Props> = ({ signers, threshold, contractAddress }) => {
  return (
    <div className="card animate-in">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: "1.1rem" }}>📋</span>
        <h2>Información del Contrato</h2>
      </div>

      <div className="mb-4">
        <label>Dirección del Contrato (Sepolia)</label>
        <div
          className="input input-mono"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.5rem",
            padding: "0.625rem 0.875rem",
            cursor: "default",
          }}
        >
          <span style={{ color: "var(--color-accent-3)", fontSize: "0.78rem", wordBreak: "break-all" }}>
            {contractAddress}
          </span>
          <button
            id="btn-copy-address"
            className="btn btn-secondary btn-sm"
            style={{ flexShrink: 0 }}
            onClick={() => navigator.clipboard.writeText(contractAddress)}
            title="Copiar dirección"
          >
            📋
          </button>
        </div>
      </div>

      <div className="divider" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-muted text-sm">Threshold</span>
        <span style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))",
          border: "1px solid rgba(139,92,246,0.35)",
          borderRadius: "var(--radius-sm)",
          padding: "0.2rem 0.75rem",
          fontFamily: "var(--font-mono)",
          fontWeight: 700,
          color: "var(--color-accent-3)",
          fontSize: "0.9rem",
        }}>
          {threshold.toString()} de {signers.length}
        </span>
      </div>

      <div>
        <label>Signers ({signers.length})</label>
        <div className="flex flex-col gap-2 mt-2">
          {signers.length === 0 && (
            <span className="text-muted text-sm">Conecta tu wallet para ver los signers</span>
          )}
          {signers.map((addr, i) => (
            <div
              key={addr}
              id={`signer-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "var(--radius-sm)",
                padding: "0.5rem 0.875rem",
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-2))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  flexShrink: 0,
                  color: "#fff",
                }}
              >
                {i + 1}
              </span>
              <span
                className="font-mono"
                style={{
                  color: "var(--color-accent-3)",
                  fontSize: "0.8rem",
                  wordBreak: "break-all",
                }}
                title={addr}
              >
                {shortenAddr(addr)}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginLeft: "auto", padding: "0.15rem 0.5rem", fontSize: "0.7rem" }}
                onClick={() => navigator.clipboard.writeText(addr)}
                title="Copiar dirección completa"
              >
                📋
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sepolia link */}
      {contractAddress.length > 0 && (
        <>
          <div className="divider" />
          <a
            href={`https://sepolia.etherscan.io/address/${contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
          >
            🔍 Ver en Sepolia Etherscan
          </a>
        </>
      )}
    </div>
  );
};

export default ContractInfo;
