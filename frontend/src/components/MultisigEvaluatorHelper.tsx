import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import JobMarketplaceABI from "../abi/JobMarketplaceABI";
import { MARKETPLACE_ADDRESS, MULTISIG_ADDRESS } from "../config";

interface Props {
  selectedJobId: number | null;
  defaultReason?: string;
}

function shortenAddr(addr: string) {
  if (!addr) return "Sin configurar";
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

const CopyButton: React.FC<{ value: string; title: string }> = ({ value, title }) => (
  <button
    className="btn btn-secondary btn-sm"
    disabled={!value}
    onClick={() => navigator.clipboard.writeText(value)}
    title={title}
    style={{ flexShrink: 0 }}
  >
    📋
  </button>
);

const AddressRow: React.FC<{ label: string; address: string }> = ({ label, address }) => (
  <div className="mb-3">
    <label>{label}</label>
    <div
      className="input input-mono"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "0.5rem",
        padding: "0.625rem 0.875rem",
      }}
    >
      <span className="address">{shortenAddr(address)}</span>
      <CopyButton value={address} title={`Copiar ${label}`} />
    </div>
  </div>
);

const MultisigEvaluatorHelper: React.FC<Props> = ({
  selectedJobId,
  defaultReason = "approved",
}) => {
  const [jobId, setJobId] = useState("");
  const [reason, setReason] = useState(defaultReason);

  useEffect(() => {
    if (selectedJobId !== null) setJobId(String(selectedJobId));
  }, [selectedJobId]);

  const { calldata, error } = useMemo(() => {
    if (!MARKETPLACE_ADDRESS) {
      return { calldata: "", error: "VITE_MARKETPLACE_ADDRESS no está configurada" };
    }

    if (!MULTISIG_ADDRESS) {
      return { calldata: "", error: "VITE_MULTISIG_ADDRESS no está configurada" };
    }

    const parsedJobId = Number(jobId);
    if (!jobId || parsedJobId < 0 || !Number.isInteger(parsedJobId)) {
      return { calldata: "", error: "jobId debe ser un entero mayor o igual a 0" };
    }

    if (!reason.trim()) {
      return { calldata: "", error: "reason es obligatorio" };
    }

    try {
      const reasonBytes32 = ethers.utils.formatBytes32String(reason.trim());
      const iface = new ethers.utils.Interface(JobMarketplaceABI as any);
      return {
        calldata: iface.encodeFunctionData("complete", [parsedJobId, reasonBytes32]),
        error: "",
      };
    } catch {
      return { calldata: "", error: "reason debe tener 31 bytes o menos" };
    }
  }, [jobId, reason]);

  return (
    <div className="card animate-in">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: "1.1rem" }}>🛡️</span>
        <h2>MultiSig evaluator</h2>
      </div>

      <p className="text-muted text-sm mb-4">
        Usa este helper para crear el calldata de <span className="font-mono">complete(jobId, reason)</span> y pegarlo en una propuesta del MultiSig.
      </p>

      <AddressRow label="MultiSig evaluador" address={MULTISIG_ADDRESS} />
      <AddressRow label="Contrato Marketplace" address={MARKETPLACE_ADDRESS} />

      <div className="divider" />

      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="input-helper-job-id">jobId</label>
          <input
            id="input-helper-job-id"
            className="input input-mono"
            placeholder="0"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="input-helper-reason">reason</label>
          <input
            id="input-helper-reason"
            className="input"
            placeholder="approved"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div
          className="mt-3"
          style={{
            padding: "0.625rem 0.875rem",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            borderRadius: "var(--radius-sm)",
            color: "#fbbf24",
            fontSize: "0.85rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <div className="divider" />

      <label>Calldata para propuesta MultiSig</label>
      <div
        className="input input-mono"
        style={{
          minHeight: "5.5rem",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "0.5rem",
          padding: "0.625rem 0.875rem",
        }}
      >
        <span style={{ wordBreak: "break-all", color: calldata ? "var(--color-accent-3)" : "var(--color-text-dim)" }}>
          {calldata || "Completa jobId y reason válidos para generar calldata"}
        </span>
        <CopyButton value={calldata} title="Copiar calldata" />
      </div>

      <div className="divider" />

      <div className="flex flex-col gap-2 text-sm text-muted">
        <span>En la UI MultiSig crea una propuesta con:</span>
        <span>
          <strong>to:</strong> <span className="font-mono">{shortenAddr(MARKETPLACE_ADDRESS)}</span>
        </span>
        <span>
          <strong>value:</strong> <span className="font-mono">0</span>
        </span>
        <span>
          <strong>data:</strong> el calldata generado arriba
        </span>
        <span>Luego aprobar hasta el threshold y ejecutar la propuesta.</span>
      </div>
    </div>
  );
};

export default MultisigEvaluatorHelper;
