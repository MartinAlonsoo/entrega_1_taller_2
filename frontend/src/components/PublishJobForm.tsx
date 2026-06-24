import React, { useState } from "react";
import { isAddress, parseUnits, zeroAddress, type Address } from "viem";
import { JobActionInput } from "../hooks/useJobActions";

interface Props {
  pending: boolean;
  tokenDecimals: number;
  tokenSymbol: string;
  multisigAddress?: string;
  onCreateJob: (input: JobActionInput) => Promise<boolean>;
}

const PublishJobForm: React.FC<Props> = ({
  pending,
  tokenDecimals,
  tokenSymbol,
  multisigAddress,
  onCreateJob,
}) => {
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [evaluator, setEvaluator] = useState("");
  const [provider, setProvider] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!description.trim()) return "La descripción es obligatoria";
    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      return "El presupuesto debe ser un número mayor a 0";
    }
    if (!isAddress(evaluator)) {
      return "La dirección del evaluador no es válida";
    }
    if (provider && !isAddress(provider)) {
      return "La dirección del proveedor no es válida";
    }
    if (!expiresAt) return "La fecha de vencimiento es obligatoria";

    const expiration = Math.floor(new Date(expiresAt).getTime() / 1000);
    if (!expiration || expiration <= Math.floor(Date.now() / 1000)) {
      return "La fecha de vencimiento debe ser futura";
    }

    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const error = validate();
    if (error) {
      setLocalError(error);
      return;
    }

    setLocalError("");
    setSubmitting(true);

    const ok = await onCreateJob({
      description: description.trim(),
      budget: parseUnits(budget, tokenDecimals || 18),
      evaluator: evaluator as Address,
      provider: (provider || zeroAddress) as Address,
      expiresAt: BigInt(Math.floor(new Date(expiresAt).getTime() / 1000)),
    });

    setSubmitting(false);

    if (ok) {
      setDescription("");
      setBudget("");
      setEvaluator("");
      setProvider("");
      setExpiresAt("");
    }
  };

  return (
    <div className="card animate-in">
      <div className="flex items-center gap-2 mb-4">
        <span style={{ fontSize: "1.1rem" }}>📝</span>
        <h2>Publicar trabajo</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="input-job-description">Descripción *</label>
            <input
              id="input-job-description"
              className="input"
              placeholder="Ej: Crear landing page para campaña"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="input-job-budget">Presupuesto *</label>
            <div style={{ position: "relative" }}>
              <input
                id="input-job-budget"
                className="input"
                placeholder="100"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={{ paddingRight: "5rem" }}
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
                }}
              >
                {tokenSymbol || "TOKEN"}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="input-job-evaluator">Evaluador *</label>
              {multisigAddress && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEvaluator(multisigAddress)}
                  style={{ marginBottom: "0.375rem" }}
                >
                  Usar MultiSig
                </button>
              )}
            </div>
            <input
              id="input-job-evaluator"
              className="input input-mono"
              placeholder="0x..."
              value={evaluator}
              onChange={(e) => setEvaluator(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="input-job-provider">Proveedor opcional</label>
            <input
              id="input-job-provider"
              className="input input-mono"
              placeholder="0x... o vacío"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="input-job-expiration">Vencimiento *</label>
            <input
              id="input-job-expiration"
              type="datetime-local"
              className="input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
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
            type="submit"
            className="btn btn-primary"
            disabled={submitting || pending}
            style={{ marginTop: "0.25rem", justifyContent: "center" }}
          >
            {submitting ? (
              <>
                <span className="spinner" />
                Publicando…
              </>
            ) : (
              <>
                <span>🚀</span>
                Publicar trabajo
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublishJobForm;
