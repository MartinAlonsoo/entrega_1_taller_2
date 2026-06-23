import React from "react";

interface Props {
  account: string | null;
  isSigner: boolean;
  roleLabel?: string;
  isConnected: boolean;
  chainOk: boolean;
  loading: boolean;
  txPending: boolean;
  onConnect: () => void;
}

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const WalletConnect: React.FC<Props> = ({
  account,
  isSigner,
  roleLabel,
  isConnected,
  chainOk,
  loading,
  txPending,
  onConnect,
}) => {
  return (
    <div className="flex items-center gap-3">
      {txPending && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="spinner" style={{ width: 14, height: 14 }} />
          <span>Tx pendiente…</span>
        </div>
      )}

      {!isConnected ? (
        <button
          id="btn-connect-wallet"
          className="btn btn-primary"
          onClick={onConnect}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Conectando…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 3H8L2 7h20z"/>
                <circle cx="17" cy="14" r="1.5" fill="currentColor"/>
              </svg>
              Conectar Wallet
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-3">
          {!chainOk && (
            <span className="badge badge-pending">⚠ Red incorrecta</span>
          )}
          {chainOk && (
            <span
              title={account ?? ""}
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-sm)",
                padding: "0.4rem 0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontSize: "0.85rem",
              }}
            >
              <span
                className="dot"
                style={{
                  background: isSigner ? "var(--color-success)" : "var(--color-warning)",
                  boxShadow: isSigner ? "0 0 6px var(--color-success)" : "none",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
              <span className="font-mono" style={{ color: "var(--color-accent-3)" }}>
                {shortenAddr(account!)}
              </span>
              {isSigner ? (
                <span className="badge badge-executed" style={{ padding: "0.1rem 0.5rem", fontSize: "0.7rem" }}>
                  {roleLabel || "Signer"}
                </span>
              ) : (
                <span className="badge badge-pending" style={{ padding: "0.1rem 0.5rem", fontSize: "0.7rem" }}>
                  {roleLabel || "No signer"}
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
