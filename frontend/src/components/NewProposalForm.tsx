import React, { useState } from "react";
import { isAddress, isHex, type Address, type Hex } from "viem";

interface Props {
  isSigner: boolean;
  txPending: boolean;
  initialValues?: {
    to: Address;
    value: string;
    data: Hex;
  };
  sourceJobId?: bigint;
  duplicateWarning?: boolean;
  onPropose: (to: Address, value: string, data: Hex) => Promise<boolean>;
  onSuccess?: () => void;
}

const NewProposalForm: React.FC<Props> = ({
  isSigner,
  txPending,
  initialValues,
  sourceJobId,
  duplicateWarning = false,
  onPropose,
  onSuccess,
}) => {
  const [to, setTo] = useState<string>(initialValues?.to ?? "");
  const [value, setValue] = useState(initialValues?.value ?? "");
  const [data, setData] = useState<string>(initialValues?.data ?? "");
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!isAddress(to)) {
      setLocalError("Dirección destino inválida");
      return false;
    }
    if (value && (isNaN(Number(value)) || Number(value) < 0)) {
      setLocalError("El valor en ETH debe ser un número mayor o igual a 0");
      return false;
    }
    if (
      data &&
      data !== "0x" &&
      (!isHex(data) || data.length % 2 !== 0)
    ) {
      setLocalError("El calldata debe ser hexadecimal válido y de longitud par");
      return false;
    }
    setLocalError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const ok = await onPropose(
      to as Address,
      value || "0",
      (data || "0x") as Hex
    );
    setSubmitting(false);
    if (ok) {
      setTo("");
      setValue("");
      setData("");
      onSuccess?.();
    }
  };

  if (!isSigner) {
    return (
      <div className="card animate-in" style={{ opacity: 0.6 }}>
        <div className="flex items-center gap-2 mb-2">
          <span style={{ fontSize: "1.1rem" }}>✍️</span>
          <h2>Nueva Propuesta</h2>
        </div>
        <div
          style={{
            padding: "1.5rem",
            textAlign: "center",
            background: "rgba(245, 158, 11, 0.05)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: "var(--radius-md)",
            color: "var(--color-warning)",
          }}
        >
          ⚠️ Debes ser signer del contrato para proponer transacciones.
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-in">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: "1.1rem" }}>✍️</span>
        <h2>Nueva Propuesta</h2>
      </div>

      <form onSubmit={handleSubmit} id="form-new-proposal">
        <div className="flex flex-col gap-4">
          {sourceJobId !== undefined && (
            <div
              style={{
                padding: "0.75rem 0.875rem",
                background: "rgba(6, 182, 212, 0.08)",
                border: "1px solid rgba(6, 182, 212, 0.25)",
                borderRadius: "var(--radius-sm)",
                color: "#67e8f9",
                fontSize: "0.82rem",
                lineHeight: 1.55,
              }}
            >
              Esta propuesta llamará a{" "}
              <span className="font-mono">JobMarketplace.complete</span> para el
              trabajo #{sourceJobId.toString()}. Revisá destino, valor y calldata antes de
              firmar.
            </div>
          )}

          {duplicateWarning && (
            <div
              style={{
                padding: "0.625rem 0.875rem",
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
                borderRadius: "var(--radius-sm)",
                color: "#fbbf24",
                fontSize: "0.82rem",
              }}
            >
              Ya existe una propuesta pendiente con el mismo destino y calldata.
            </div>
          )}
          <div>
            <label htmlFor="input-to">Dirección Destino *</label>
            <input
              id="input-to"
              type="text"
              className="input input-mono"
              placeholder="0x..."
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="input-value">Valor en ETH</label>
            <div style={{ position: "relative" }}>
              <input
                id="input-value"
                type="text"
                className="input"
                placeholder="0.0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{ paddingRight: "3rem" }}
              />
              <span
                style={{
                  position: "absolute",
                  right: "0.875rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  pointerEvents: "none",
                }}
              >
                ETH
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="input-calldata">
              Calldata{" "}
              <span style={{ color: "var(--color-text-dim)", textTransform: "none", fontSize: "0.72rem" }}>
                (hex, opcional — para llamadas a contratos)
              </span>
            </label>
            <input
              id="input-calldata"
              type="text"
              className="input input-mono"
              placeholder="0x (vacío para transferencia ETH pura)"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          {localError && (
            <div
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

          <button
            id="btn-submit-proposal"
            type="submit"
            className="btn btn-primary"
            disabled={submitting || txPending}
            style={{ marginTop: "0.25rem", justifyContent: "center" }}
          >
            {submitting ? (
              <>
                <span className="spinner" />
                Enviando propuesta…
              </>
            ) : (
              <>
                <span>🚀</span>
                Enviar Propuesta
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewProposalForm;
