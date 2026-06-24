import React from "react";
import { formatUnits } from "viem";
import { Erc20State } from "../hooks/useErc20";

interface Props {
  account: string | null;
  token: Erc20State;
  marketplaceAddress: string;
  paymentTokenAddress: string;
  multisigAddress?: string;
  onRefresh: () => Promise<void>;
}

function shortenAddr(addr: string) {
  if (!addr) return "Sin configurar";
  return `${addr.slice(0, 10)}…${addr.slice(-6)}`;
}

function formatAmount(amount: bigint, decimals: number, symbol: string) {
  const formatted = formatUnits(amount, decimals || 18);
  return `${Number(formatted).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${symbol || "TOKEN"}`;
}

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
      <button
        className="btn btn-secondary btn-sm"
        style={{ flexShrink: 0 }}
        disabled={!address}
        onClick={() => navigator.clipboard.writeText(address)}
        title="Copiar dirección"
      >
        📋
      </button>
    </div>
  </div>
);

const MarketplaceInfo: React.FC<Props> = ({
  account,
  token,
  marketplaceAddress,
  paymentTokenAddress,
  multisigAddress,
  onRefresh,
}) => {
  return (
    <div className="card animate-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "1.1rem" }}>📋</span>
          <h2>Marketplace</h2>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => onRefresh()} disabled={token.loading}>
          {token.loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : "↻"}
          Refrescar
        </button>
      </div>

      <AddressRow label="Contrato Marketplace" address={marketplaceAddress} />
      <AddressRow label="Token de pago" address={paymentTokenAddress} />
      {multisigAddress && (
        <AddressRow label="MultiSig evaluador" address={multisigAddress} />
      )}

      <div className="divider" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-muted text-sm">Token</span>
        <span className="badge badge-executed">
          {token.name || "Sin metadata"} {token.symbol ? `(${token.symbol})` : ""}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-muted text-sm">Decimales</span>
        <span className="font-mono text-sm">{token.decimals}</span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-muted text-sm">Balance</span>
        <span className="font-mono text-sm" style={{ color: "var(--color-accent-2)" }}>
          {formatAmount(token.balance, token.decimals, token.symbol)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-muted text-sm">Allowance</span>
        <span className="font-mono text-sm" style={{ color: "var(--color-accent-3)" }}>
          {formatAmount(token.allowance, token.decimals, token.symbol)}
        </span>
      </div>

      {account && (
        <>
          <div className="divider" />
          <span className="text-muted text-xs">Cuenta conectada</span>
          <div className="address mt-1">{account}</div>
        </>
      )}

      {marketplaceAddress && (
        <>
          <div className="divider" />
          <a
            href={`https://sepolia.etherscan.io/address/${marketplaceAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ width: "100%", justifyContent: "center", textDecoration: "none" }}
          >
            🔍 Ver Marketplace en Etherscan
          </a>
        </>
      )}
    </div>
  );
};

export default MarketplaceInfo;
