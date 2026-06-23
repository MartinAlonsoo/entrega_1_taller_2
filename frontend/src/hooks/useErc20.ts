import { useCallback, useState } from "react";
import { ethers } from "ethers";
import ERC20ABI from "../abi/ERC20ABI";
import { MARKETPLACE_ADDRESS, PAYMENT_TOKEN_ADDRESS } from "../config";

export interface Erc20State {
  name: string;
  symbol: string;
  decimals: number;
  balance: ethers.BigNumber;
  allowance: ethers.BigNumber;
  loading: boolean;
  pending: boolean;
  error: string | null;
}

const initialTokenState: Erc20State = {
  name: "",
  symbol: "",
  decimals: 18,
  balance: ethers.constants.Zero,
  allowance: ethers.constants.Zero,
  loading: false,
  pending: false,
  error: null,
};

function getErrorMessage(err: any, fallback: string) {
  return err?.data?.message || err?.reason || err?.message || fallback;
}

export function useErc20(
  provider: ethers.providers.Web3Provider | null,
  account: string | null,
  getSigner: () => ethers.Signer
) {
  const [token, setToken] = useState<Erc20State>(initialTokenState);

  const getTokenContract = useCallback(
    (signerOrProvider: ethers.Signer | ethers.providers.Provider) => {
      if (!PAYMENT_TOKEN_ADDRESS) {
        throw new Error("VITE_PAYMENT_TOKEN_ADDRESS no está configurada");
      }

      return new ethers.Contract(PAYMENT_TOKEN_ADDRESS, ERC20ABI, signerOrProvider);
    },
    []
  );

  const refreshToken = useCallback(async () => {
    if (!provider || !account) return;
    if (!MARKETPLACE_ADDRESS) {
      setToken((s) => ({
        ...s,
        error: "VITE_MARKETPLACE_ADDRESS no está configurada",
      }));
      return;
    }

    setToken((s) => ({ ...s, loading: true, error: null }));

    try {
      const contract = getTokenContract(provider);
      const [name, symbol, decimals, balance, allowance] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
        contract.balanceOf(account),
        contract.allowance(account, MARKETPLACE_ADDRESS),
      ]);

      setToken((s) => ({
        ...s,
        name,
        symbol,
        decimals,
        balance,
        allowance,
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      setToken((s) => ({
        ...s,
        loading: false,
        error: getErrorMessage(err, "Error al leer token ERC-20"),
      }));
    }
  }, [provider, account, getTokenContract]);

  const approveMarketplace = useCallback(
    async (amount: ethers.BigNumberish): Promise<boolean> => {
      if (!MARKETPLACE_ADDRESS) {
        setToken((s) => ({
          ...s,
          error: "VITE_MARKETPLACE_ADDRESS no está configurada",
        }));
        return false;
      }

      setToken((s) => ({ ...s, pending: true, error: null }));

      try {
        const contract = getTokenContract(getSigner());
        const tx = await contract.approve(MARKETPLACE_ADDRESS, amount);
        await tx.wait();
        await refreshToken();

        setToken((s) => ({ ...s, pending: false, error: null }));
        return true;
      } catch (err: any) {
        setToken((s) => ({
          ...s,
          pending: false,
          error: getErrorMessage(err, "Error al aprobar token ERC-20"),
        }));
        return false;
      }
    },
    [getSigner, getTokenContract, refreshToken]
  );

  return { token, refreshToken, approveMarketplace };
}
