import React, { useEffect, useState } from "react";
import { useMarketplace } from "./hooks/useMarketplace";
import WalletConnect from "./components/WalletConnect";
import JobBoard from "./components/JobBoard";
import JobDetail from "./components/JobDetail";
import JobActionsPanel from "./components/JobActionsPanel";
import PublishJobForm from "./components/PublishJobForm";
import MarketplaceInfo from "./components/MarketplaceInfo";
import MultisigEvaluatorHelper from "./components/MultisigEvaluatorHelper";
import { MARKETPLACE_ADDRESS, MULTISIG_ADDRESS, PAYMENT_TOKEN_ADDRESS } from "./config";
import "./index.css";

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

let toastId = 0;

const App: React.FC = () => {
  const marketplace = useMarketplace();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: Toast["type"], message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  };

  useEffect(() => {
    if (marketplace.error) {
      const short =
        marketplace.error.length > 100
          ? marketplace.error.slice(0, 97) + "…"
          : marketplace.error;
      addToast("error", short);
    }
  }, [marketplace.error]);

  const handleCreateJob = async (...args: Parameters<typeof marketplace.createJob>) => {
    const ok = await marketplace.createJob(...args);
    if (ok) addToast("success", "Trabajo publicado exitosamente");
    return ok;
  };

  const handleApprove = async (...args: Parameters<typeof marketplace.approveMarketplace>) => {
    const ok = await marketplace.approveMarketplace(...args);
    if (ok) addToast("success", "Token aprobado para el Marketplace");
    return ok;
  };

  const handleFund = async (...args: Parameters<typeof marketplace.fund>) => {
    const ok = await marketplace.fund(...args);
    if (ok) addToast("success", "Trabajo fondeado correctamente");
    return ok;
  };

  const handleSubmit = async (...args: Parameters<typeof marketplace.submit>) => {
    const ok = await marketplace.submit(...args);
    if (ok) addToast("success", "Entrega registrada");
    return ok;
  };

  const handleComplete = async (...args: Parameters<typeof marketplace.complete>) => {
    const ok = await marketplace.complete(...args);
    if (ok) addToast("success", "Trabajo completado y pago liberado");
    return ok;
  };

  const handleReject = async (...args: Parameters<typeof marketplace.reject>) => {
    const ok = await marketplace.reject(...args);
    if (ok) addToast("info", "Trabajo rechazado");
    return ok;
  };

  const handleClaimRefund = async (...args: Parameters<typeof marketplace.claimRefund>) => {
    const ok = await marketplace.claimRefund(...args);
    if (ok) addToast("success", "Reembolso reclamado");
    return ok;
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(8, 11, 20, 0.9)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid var(--color-border-light)",
          padding: "0 1.5rem",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
              boxShadow: "0 0 20px rgba(16, 185, 129, 0.35)",
              flexShrink: 0,
            }}
          >
            ⚒️
          </div>
          <div>
            <h1 style={{ fontSize: "1.1rem", lineHeight: 1 }}>
              <span style={{ color: "var(--color-success)" }}>Job</span>
              <span style={{ color: "var(--color-accent-2)" }}>Marketplace</span>
            </h1>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
              Sepolia Testnet
            </p>
          </div>
        </div>

        <WalletConnect
          account={marketplace.account}
          isSigner={true}
          roleLabel="Marketplace"
          isConnected={marketplace.isConnected}
          chainOk={marketplace.chainOk}
          loading={marketplace.walletLoading}
          txPending={marketplace.pending}
          onConnect={marketplace.connect}
        />
      </header>

      {marketplace.isConnected && !marketplace.chainOk && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            borderBottom: "1px solid rgba(245, 158, 11, 0.2)",
            padding: "0.75rem 1.5rem",
            textAlign: "center",
            color: "#fbbf24",
            fontSize: "0.875rem",
          }}
        >
          ⚠️ Cambia a Sepolia para interactuar con el Marketplace.
        </div>
      )}

      {!marketplace.isConnected && (
        <main
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "4rem 1.5rem",
          }}
        >
          <div className="card animate-in" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧑‍💻</div>
            <h1 className="mb-3">Marketplace de trabajos con escrow</h1>
            <p className="text-muted mb-4">
              Conecta tu wallet para publicar trabajos, fondear con ERC-20,
              entregar resultados y resolver pagos mediante evaluadores.
            </p>
            <button className="btn btn-primary" onClick={marketplace.connect} style={{ margin: "0 auto" }}>
              Conectar Wallet
            </button>
          </div>
        </main>
      )}

      {marketplace.isConnected && marketplace.chainOk && (
        <main
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "2rem 1.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gridTemplateRows: "auto 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <PublishJobForm
              pending={marketplace.pending}
              tokenDecimals={marketplace.token.decimals}
              tokenSymbol={marketplace.token.symbol}
              multisigAddress={MULTISIG_ADDRESS}
              onCreateJob={handleCreateJob}
            />

            <JobBoard
              jobs={marketplace.jobs}
              selectedJobId={marketplace.selectedJobId}
              tokenDecimals={marketplace.token.decimals}
              tokenSymbol={marketplace.token.symbol}
              onSelectJob={marketplace.setSelectedJobId}
            />
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <MarketplaceInfo
              account={marketplace.account}
              token={marketplace.token}
              marketplaceAddress={MARKETPLACE_ADDRESS}
              paymentTokenAddress={PAYMENT_TOKEN_ADDRESS}
              multisigAddress={MULTISIG_ADDRESS}
              onRefresh={marketplace.refresh}
            />

            <JobDetail
              job={marketplace.selectedJob}
              roles={marketplace.roles}
              tokenDecimals={marketplace.token.decimals}
              tokenSymbol={marketplace.token.symbol}
            />

            <JobActionsPanel
              job={marketplace.selectedJob}
              roles={marketplace.roles}
              pending={marketplace.pending}
              token={marketplace.token}
              onApprove={handleApprove}
              onFund={handleFund}
              onSubmit={handleSubmit}
              onComplete={handleComplete}
              onReject={handleReject}
              onClaimRefund={handleClaimRefund}
            />

            <MultisigEvaluatorHelper selectedJobId={marketplace.selectedJobId} />
          </aside>
        </main>
      )}

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          main {
            grid-template-columns: 1fr !important;
          }
          aside {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
