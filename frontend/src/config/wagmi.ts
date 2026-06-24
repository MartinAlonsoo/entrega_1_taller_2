import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { SEPOLIA_RPC } from "../config";

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim();

if (!projectId) {
  throw new Error("VITE_WALLETCONNECT_PROJECT_ID no está configurada");
}

export const wagmiConfig = getDefaultConfig({
  appName: "Job Marketplace",
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(SEPOLIA_RPC),
  },
});
