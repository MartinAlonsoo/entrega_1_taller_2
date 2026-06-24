import React, { useEffect, useMemo, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";
import type { Address, Hex } from "viem";
import { useMarketplace } from "./hooks/useMarketplace";
import { useMultisig } from "./hooks/useMultisig";
import WalletConnect from "./components/WalletConnect";
import JobBoard from "./components/JobBoard";
import JobDetail from "./components/JobDetail";
import JobActionsPanel from "./components/JobActionsPanel";
import PublishJobForm from "./components/PublishJobForm";
import MarketplaceInfo from "./components/MarketplaceInfo";
import MultisigEvaluatorHelper from "./components/MultisigEvaluatorHelper";
import MultisigDashboard from "./components/MultisigDashboard";
import {
  MARKETPLACE_ADDRESS,
  MULTISIG_ADDRESS,
  PAYMENT_TOKEN_ADDRESS,
} from "./config";
import {
  MultisigProposalDraft,
  NewMultisigProposalDraft,
} from "./types/multisig";
import "./index.css";

type AppView = "marketplace" | "multisig";

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

let toastId = 0;

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>("marketplace");
  const [proposalDraft, setProposalDraft] =
    useState<MultisigProposalDraft | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const { isConnected } = useAccount();
  const chainId = useChainId();
  const chainOk = chainId === sepolia.id;
  const marketplace = useMarketplace();
  const multisig = useMultisig();

  const addToast = (type: Toast["type"], message: string) => {
    const id = ++toastId;
    setToasts((previous) => [...previous, { id, type, message }]);
    setTimeout(
      () =>
        setToasts((previous) => previous.filter((toast) => toast.id !== id)),
      4500
    );
  };

  useEffect(() => {
    const error =
      activeView === "marketplace"
        ? marketplace.error
        : multisig.state.error;
    if (!error) return;

    addToast(
      "error",
      error.length > 100 ? `${error.slice(0, 97)}…` : error
    );
  }, [
    activeView,
    marketplace.error,
    multisig.state.error,
  ]);

  const handleCreateJob = async (
    ...args: Parameters<typeof marketplace.createJob>
  ) => {
    const ok = await marketplace.createJob(...args);
    if (ok) addToast("success", "Trabajo publicado exitosamente");
    return ok;
  };

  const handleApproveToken = async (
    ...args: Parameters<typeof marketplace.approveMarketplace>
  ) => {
    const ok = await marketplace.approveMarketplace(...args);
    if (ok) addToast("success", "Token aprobado para el Marketplace");
    return ok;
  };

  const handleFund = async (...args: Parameters<typeof marketplace.fund>) => {
    const ok = await marketplace.fund(...args);
    if (ok) addToast("success", "Trabajo fondeado correctamente");
    return ok;
  };

  const handleSubmit = async (
    ...args: Parameters<typeof marketplace.submit>
  ) => {
    const ok = await marketplace.submit(...args);
    if (ok) addToast("success", "Entrega registrada");
    return ok;
  };

  const handleComplete = async (
    ...args: Parameters<typeof marketplace.complete>
  ) => {
    const ok = await marketplace.complete(...args);
    if (ok) addToast("success", "Trabajo completado y pago liberado");
    return ok;
  };

  const handleReject = async (
    ...args: Parameters<typeof marketplace.reject>
  ) => {
    const ok = await marketplace.reject(...args);
    if (ok) addToast("info", "Trabajo rechazado");
    return ok;
  };

  const handleClaimRefund = async (
    ...args: Parameters<typeof marketplace.claimRefund>
  ) => {
    const ok = await marketplace.claimRefund(...args);
    if (ok) addToast("success", "Reembolso reclamado");
    return ok;
  };

  const openMultisigDraft = (draft: NewMultisigProposalDraft) => {
    setProposalDraft({ ...draft, id: Date.now() });
    setActiveView("multisig");
    addToast("info", "Propuesta MultiSig precargada para revisión");
  };

  const handlePropose = async (
    to: Address,
    value: string,
    data: Hex
  ) => {
    const ok = await multisig.propose(to, value, data);
    if (ok) addToast("success", "Propuesta MultiSig creada");
    return ok;
  };

  const handleApproveProposal = async (proposalId: bigint) => {
    const ok = await multisig.approve(proposalId);
    if (ok) addToast("success", `Propuesta #${proposalId} aprobada`);
    return ok;
  };

  const handleExecuteProposal = async (proposalId: bigint) => {
    const ok = await multisig.execute(proposalId);
    if (ok) {
      await marketplace.refresh();
      addToast(
        "success",
        "Propuesta ejecutada; estado del Marketplace actualizado"
      );
    }
    return ok;
  };

  const handleCancelProposal = async (proposalId: bigint) => {
    const ok = await multisig.cancel(proposalId);
    if (ok) addToast("info", `Propuesta #${proposalId} cancelada`);
    return ok;
  };

  const duplicateProposal = useMemo(() => {
    if (!proposalDraft) return false;
    return multisig.state.proposals.some(
      (proposal) =>
        !proposal.executed &&
        !proposal.cancelled &&
        proposal.to.toLowerCase() === proposalDraft.to.toLowerCase() &&
        proposal.data.toLowerCase() === proposalDraft.data.toLowerCase()
    );
  }, [multisig.state.proposals, proposalDraft]);

  const walletIsSigner =
    activeView === "multisig" ? multisig.state.isSigner : true;
  const walletRoleLabel =
    activeView === "multisig"
      ? multisig.state.isSigner
        ? "Signer"
        : "No signer"
      : "Marketplace";
  const txPending =
    activeView === "multisig"
      ? multisig.state.txPending
      : marketplace.pending;

  return (
    <div style={{ minHeight: "100vh" }}>
      <header className="app-header">
        <div className="app-brand">
          <div className="app-brand-icon">⚒️</div>
          <div>
            <h1 style={{ fontSize: "1.1rem", lineHeight: 1 }}>
              <span style={{ color: "var(--color-success)" }}>Job</span>
              <span style={{ color: "var(--color-accent-2)" }}>
                Marketplace
              </span>
            </h1>
            <p className="text-xs text-muted mt-1">Sepolia Testnet</p>
          </div>
        </div>

        <nav className="app-tabs" aria-label="Secciones principales">
          <button
            className={activeView === "marketplace" ? "active" : ""}
            onClick={() => setActiveView("marketplace")}
          >
            Marketplace
          </button>
          <button
            className={activeView === "multisig" ? "active" : ""}
            onClick={() => setActiveView("multisig")}
            disabled={!MULTISIG_ADDRESS}
            title={
              MULTISIG_ADDRESS
                ? "Administrar propuestas MultiSig"
                : "VITE_MULTISIG_ADDRESS no está configurada"
            }
          >
            Administración MultiSig
            {multisig.pendingProposalCount > 0 && (
              <span className="tab-count">
                {multisig.pendingProposalCount}
              </span>
            )}
          </button>
        </nav>

        <WalletConnect
          isSigner={walletIsSigner}
          roleLabel={walletRoleLabel}
          txPending={txPending}
        />
      </header>

      {isConnected && !chainOk && (
        <div className="network-warning">
          ⚠️ Cambia a Sepolia para interactuar con los contratos.
        </div>
      )}

      {!isConnected && (
        <main className="welcome-layout">
          <div
            className="card animate-in"
            style={{ textAlign: "center", padding: "3rem 2rem" }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧑‍💻</div>
            <h1 className="mb-3">Marketplace de trabajos con escrow</h1>
            <p className="text-muted mb-4">
              Conecta una única wallet para operar el Marketplace y, si es
              signer, administrar el evaluador MultiSig.
            </p>
            <p className="text-sm text-cyan">
              Usá el botón RainbowKit del encabezado para conectar.
            </p>
          </div>
        </main>
      )}

      {isConnected &&
        chainOk &&
        activeView === "marketplace" && (
          <main className="app-layout">
            <section className="flex flex-col gap-4">
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
            </section>

            <aside className="flex flex-col gap-4">
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
                deliverable={marketplace.selectedDeliverable}
              />

              <JobActionsPanel
                job={marketplace.selectedJob}
                roles={marketplace.roles}
                pending={marketplace.pending}
                token={marketplace.token}
                onApprove={handleApproveToken}
                onSetProvider={marketplace.setProvider}
                onFund={handleFund}
                onSubmit={handleSubmit}
                onComplete={handleComplete}
                onReject={handleReject}
                onClaimRefund={handleClaimRefund}
              />

              <MultisigEvaluatorHelper
                selectedJobId={marketplace.selectedJobId}
                selectedJob={marketplace.selectedJob}
                onCreateProposal={openMultisigDraft}
              />
            </aside>
          </main>
        )}

      {isConnected && chainOk && activeView === "multisig" && (
        <MultisigDashboard
          state={multisig.state}
          proposalDraft={proposalDraft}
          duplicateWarning={duplicateProposal}
          onProposalCreated={() => setProposalDraft(null)}
          onBackToMarketplace={() => setActiveView("marketplace")}
          onPropose={handlePropose}
          onApprove={handleApproveProposal}
          onExecute={handleExecuteProposal}
          onCancel={handleCancelProposal}
          hasApproved={multisig.hasApproved}
        />
      )}

      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
