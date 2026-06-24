import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface Props {
  isSigner: boolean;
  roleLabel?: string;
  txPending: boolean;
}

const WalletConnect: React.FC<Props> = ({
  isSigner,
  roleLabel,
  txPending,
}) => (
  <div className="flex items-center gap-3">
    {txPending && (
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="spinner" style={{ width: 14, height: 14 }} />
        <span>Tx pendiente…</span>
      </div>
    )}

    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const connected = mounted && account && chain;

        if (!connected) {
          return (
            <button className="btn btn-primary" onClick={openConnectModal}>
              Conectar Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button className="btn btn-danger" onClick={openChainModal}>
              Red incorrecta
            </button>
          );
        }

        return (
          <button
            className="btn btn-secondary"
            onClick={openAccountModal}
            title={account.address}
          >
            <span
              className="dot"
              style={{
                background: isSigner
                  ? "var(--color-success)"
                  : "var(--color-warning)",
              }}
            />
            <span className="font-mono">{account.displayName}</span>
            <span className={isSigner ? "badge badge-executed" : "badge badge-pending"}>
              {roleLabel || (isSigner ? "Signer" : "No signer")}
            </span>
          </button>
        );
      }}
    </ConnectButton.Custom>
  </div>
);

export default WalletConnect;
