import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import type { Address } from "viem";
import ERC20ABI from "../abi/ERC20ABI";
import { marketplaceAddress, paymentTokenAddress } from "../lib/contracts";
import { tokenKeys } from "../lib/queryKeys";
import { contractErrorMessage } from "../lib/errors";

export interface Erc20State {
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  allowance: bigint;
  loading: boolean;
  pending: boolean;
  error: string | null;
}

export function useErc20() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const account = address ?? ("0x0000000000000000000000000000000000000000" as Address);
  const queryKey = tokenKeys.account(
    paymentTokenAddress,
    account,
    marketplaceAddress
  );

  const query = useQuery({
    queryKey,
    enabled: isConnected && chainId === sepolia.id && !!address && !!publicClient,
    queryFn: async () => {
      if (!publicClient || !address) {
        return {
          name: "",
          symbol: "",
          decimals: 18,
          balance: 0n,
          allowance: 0n,
        };
      }

      const [name, symbol, decimals, balance, allowance] = await Promise.all([
        publicClient.readContract({
          address: paymentTokenAddress,
          abi: ERC20ABI,
          functionName: "name",
        }),
        publicClient.readContract({
          address: paymentTokenAddress,
          abi: ERC20ABI,
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: paymentTokenAddress,
          abi: ERC20ABI,
          functionName: "decimals",
        }),
        publicClient.readContract({
          address: paymentTokenAddress,
          abi: ERC20ABI,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: paymentTokenAddress,
          abi: ERC20ABI,
          functionName: "allowance",
          args: [address, marketplaceAddress],
        }),
      ]);

      return { name, symbol, decimals, balance, allowance };
    },
  });

  const approveMarketplace = async (amount: bigint): Promise<boolean> => {
    if (!publicClient) return false;
    setPending(true);
    setActionError(null);
    try {
      const hash = await writeContractAsync({
        address: paymentTokenAddress,
        abi: ERC20ABI,
        functionName: "approve",
        args: [marketplaceAddress, amount],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await queryClient.invalidateQueries({ queryKey });
      return true;
    } catch (error) {
      setActionError(
        contractErrorMessage(error, "Error al aprobar token ERC-20")
      );
      return false;
    } finally {
      setPending(false);
    }
  };

  const data = query.data;
  const token: Erc20State = {
    name: data?.name ?? "",
    symbol: data?.symbol ?? "",
    decimals: data?.decimals ?? 18,
    balance: data?.balance ?? 0n,
    allowance: data?.allowance ?? 0n,
    loading: query.isLoading || query.isFetching,
    pending,
    error:
      actionError ||
      (query.error
        ? contractErrorMessage(query.error, "Error al leer token ERC-20")
        : null),
  };

  return {
    token,
    refreshToken: async () => {
      await query.refetch();
    },
    approveMarketplace,
  };
}
