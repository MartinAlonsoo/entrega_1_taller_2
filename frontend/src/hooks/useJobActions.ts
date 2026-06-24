import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import {
  stringToHex,
  type Address,
  type Hex,
} from "viem";
import JobMarketplaceABI from "../abi/JobMarketplaceABI";
import {
  marketplaceAddress,
  paymentTokenAddress,
} from "../lib/contracts";
import { marketplaceKeys, tokenKeys } from "../lib/queryKeys";
import { contractErrorMessage } from "../lib/errors";

export interface JobActionInput {
  description: string;
  budget: bigint;
  evaluator: Address;
  provider: Address;
  expiresAt: bigint;
}

function bytes32(value: string, fieldName: string) {
  const trimmed = value.trim();
  if (new TextEncoder().encode(trimmed).length > 31) {
    throw new Error(`${fieldName} debe tener 31 bytes o menos`);
  }
  return stringToHex(trimmed, { size: 32 });
}

export function useJobActions() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const invalidateJobs = () =>
    queryClient.invalidateQueries({
      queryKey: marketplaceKeys.jobs(marketplaceAddress),
    });

  const invalidateToken = () =>
    address
      ? queryClient.invalidateQueries({
          queryKey: tokenKeys.account(
            paymentTokenAddress,
            address,
            marketplaceAddress
          ),
        })
      : Promise.resolve();

  const execute = async (
    request: Parameters<typeof writeContractAsync>[0],
    includeToken = false
  ): Promise<boolean> => {
    if (!publicClient) return false;

    setActionPending(true);
    setActionError(null);
    try {
      const hash = await writeContractAsync(request);
      await publicClient.waitForTransactionReceipt({ hash });
      await invalidateJobs();
      if (includeToken) await invalidateToken();
      return true;
    } catch (error) {
      setActionError(
        contractErrorMessage(error, "Transacción del Marketplace fallida")
      );
      return false;
    } finally {
      setActionPending(false);
    }
  };

  return {
    actionPending,
    actionError,
    createJob: (input: JobActionInput) =>
      execute({
        address: marketplaceAddress,
        abi: JobMarketplaceABI,
        functionName: "createJob",
        args: [
          input.description,
          input.budget,
          input.evaluator,
          input.provider,
          input.expiresAt,
        ],
      }),
    setProvider: (jobId: bigint, provider: Address) =>
      execute({
        address: marketplaceAddress,
        abi: JobMarketplaceABI,
        functionName: "setProvider",
        args: [jobId, provider],
      }),
    fund: (jobId: bigint) =>
      execute(
        {
          address: marketplaceAddress,
          abi: JobMarketplaceABI,
          functionName: "fund",
          args: [jobId],
        },
        true
      ),
    submit: (jobId: bigint, deliverableRef: Hex) =>
      execute({
        address: marketplaceAddress,
        abi: JobMarketplaceABI,
        functionName: "submit",
        args: [jobId, deliverableRef],
      }),
    complete: (jobId: bigint, reason: string) =>
      execute(
        {
          address: marketplaceAddress,
          abi: JobMarketplaceABI,
          functionName: "complete",
          args: [jobId, bytes32(reason, "reason")],
        },
        true
      ),
    reject: (jobId: bigint, reason: string, includeToken = true) =>
      execute(
        {
          address: marketplaceAddress,
          abi: JobMarketplaceABI,
          functionName: "reject",
          args: [jobId, bytes32(reason, "reason")],
        },
        includeToken
      ),
    claimRefund: (jobId: bigint) =>
      execute(
        {
          address: marketplaceAddress,
          abi: JobMarketplaceABI,
          functionName: "claimRefund",
          args: [jobId],
        },
        true
      ),
  };
}
