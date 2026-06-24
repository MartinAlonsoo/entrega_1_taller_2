import React from "react";
import { MultisigState } from "../hooks/useMultisig";
import { MultisigProposalDraft } from "../types/multisig";
import ContractInfo from "./ContractInfo";
import NewProposalForm from "./NewProposalForm";
import ProposalList from "./ProposalList";
import type { Address, Hex } from "viem";

interface Props {
  state: MultisigState;
  proposalDraft: MultisigProposalDraft | null;
  duplicateWarning: boolean;
  onProposalCreated: () => void;
  onBackToMarketplace: () => void;
  onPropose: (to: Address, value: string, data: Hex) => Promise<boolean>;
  onApprove: (id: bigint) => Promise<boolean>;
  onExecute: (id: bigint) => Promise<boolean>;
  onCancel: (id: bigint) => Promise<boolean>;
  hasApproved: (id: bigint, account: Address) => Promise<boolean>;
}

const MultisigDashboard: React.FC<Props> = ({
  state,
  proposalDraft,
  duplicateWarning,
  onProposalCreated,
  onBackToMarketplace,
  onPropose,
  onApprove,
  onExecute,
  onCancel,
  hasApproved,
}) => (
  <main className="app-layout">
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between" style={{ gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem" }}>Administración MultiSig</h1>
          <p className="text-muted text-sm">
            Crear, aprobar y ejecutar propuestas del evaluador compuesto.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onBackToMarketplace}>
          Volver al Marketplace
        </button>
      </div>

      <NewProposalForm
        key={proposalDraft?.id ?? "empty"}
        isSigner={state.isSigner}
        txPending={state.txPending}
        initialValues={proposalDraft ?? undefined}
        sourceJobId={proposalDraft?.sourceJobId}
        duplicateWarning={duplicateWarning}
        onPropose={onPropose}
        onSuccess={onProposalCreated}
      />

      <ProposalList
        proposals={state.proposals}
        account={state.account}
        isSigner={state.isSigner}
        threshold={state.threshold}
        txPending={state.txPending}
        hasApproved={hasApproved}
        onApprove={onApprove}
        onExecute={onExecute}
        onCancel={onCancel}
      />
    </section>

    <aside className="flex flex-col gap-4">
      <ContractInfo
        signers={state.signers}
        threshold={state.threshold}
        contractAddress={state.contractAddress}
      />
    </aside>
  </main>
);

export default MultisigDashboard;
