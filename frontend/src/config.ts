// Entrega 2: MultiSig. VITE_CONTRACT_ADDRESS se mantiene como alias legacy.
export const MULTISIG_ADDRESS =
  import.meta.env.VITE_MULTISIG_ADDRESS?.trim() ||
  import.meta.env.VITE_CONTRACT_ADDRESS?.trim() ||
  "";

export const CONTRACT_ADDRESS = MULTISIG_ADDRESS;

// Entrega 3: Marketplace y token ERC-20 de pago.
export const MARKETPLACE_ADDRESS =
  import.meta.env.VITE_MARKETPLACE_ADDRESS?.trim() || "";

export const PAYMENT_TOKEN_ADDRESS =
  import.meta.env.VITE_PAYMENT_TOKEN_ADDRESS?.trim() || "";

const marketplaceDeploymentBlockValue =
  import.meta.env.VITE_MARKETPLACE_DEPLOYMENT_BLOCK?.trim() || "";

if (!/^\d+$/.test(marketplaceDeploymentBlockValue)) {
  throw new Error(
    "VITE_MARKETPLACE_DEPLOYMENT_BLOCK debe ser un bloque numérico"
  );
}

export const MARKETPLACE_DEPLOYMENT_BLOCK = BigInt(
  marketplaceDeploymentBlockValue
);

export const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 en hex

export const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC_URL?.trim() || "https://gateway.tenderly.co/public/sepolia";
