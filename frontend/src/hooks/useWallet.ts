import { useCallback, useEffect, useRef, useState } from "react";
import { ethers } from "ethers";
import { SEPOLIA_CHAIN_ID } from "../config";

export interface WalletState {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  isConnected: boolean;
  chainOk: boolean;
  loading: boolean;
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWallet() {
  const providerRef = useRef<ethers.providers.Web3Provider | null>(null);

  const [wallet, setWallet] = useState<WalletState>({
    account: null,
    provider: null,
    isConnected: false,
    chainOk: false,
    loading: false,
    error: null,
  });

  const setError = useCallback((message: string) => {
    setWallet((s) => ({ ...s, error: message, loading: false }));
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask no encontrado. Por favor instala la extensión.");
      return;
    }

    setWallet((s) => ({ ...s, loading: true, error: null }));

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      providerRef.current = provider;

      await provider.send("eth_requestAccounts", []);

      const signer = provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();
      const chainOk = network.chainId === 11155111;

      setWallet((s) => ({
        ...s,
        account,
        provider,
        isConnected: true,
        chainOk,
        loading: false,
        error: null,
      }));

      if (!chainOk) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
          setWallet((s) => ({ ...s, chainOk: true }));
        } catch {
          setError("Por favor cambia a la red Sepolia en MetaMask.");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Error al conectar wallet");
    }
  }, [setError]);

  const getSigner = useCallback(() => {
    if (!providerRef.current) throw new Error("No hay proveedor conectado");
    return providerRef.current.getSigner();
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        providerRef.current = null;
        setWallet((s) => ({
          ...s,
          account: null,
          provider: null,
          isConnected: false,
          chainOk: false,
        }));
        return;
      }

      setWallet((s) => ({ ...s, account: accounts[0], isConnected: true }));
    };

    const handleChainChanged = () => window.location.reload();

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return {
    wallet,
    connect,
    getSigner,
    provider: wallet.provider,
    account: wallet.account,
    chainOk: wallet.chainOk,
    isConnected: wallet.isConnected,
  };
}
