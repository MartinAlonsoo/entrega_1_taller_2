import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWriteContract,
} from "wagmi";
import { sepolia } from "wagmi/chains";
import { parseEther, type Address, type Hex } from "viem";
import MultiSigABI from "../abi/MultiSigABI";
import {
  marketplaceAddress,
  multisigAddress,
  paymentTokenAddress,
} from "../lib/contracts";
import { marketplaceKeys, multisigKeys, tokenKeys } from "../lib/queryKeys";
import { contractErrorMessage } from "../lib/errors";

export interface Proposal {
  id: bigint;
  to: Address;
  value: bigint;
  data: Hex;
  proposer: Address;
  approvalCount: bigint;
  executed: boolean;
  cancelled: boolean;
}

export interface MultisigState {
  account: Address | null;
  isSigner: boolean;
  signers: readonly Address[];
  threshold: bigint;
  proposals: Proposal[];
  loading: boolean;
  txPending: boolean;
  error: string | null;
  contractAddress: Address;
  isConnected: boolean;
  chainOk: boolean;
}

function parseProposal(raw: any): Proposal {
  return {
    id: raw.id ?? raw[0],
    to: raw.to ?? raw[1],
    value: raw.value ?? raw[2],
    data: raw.data ?? raw[3],
    proposer: raw.proposer ?? raw[4],
    approvalCount: raw.approvalCount ?? raw[5],
    executed: raw.executed ?? raw[6],
    cancelled: raw.cancelled ?? raw[7],
  };
}

export function useMultisig() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const [txPending, setTxPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const queryKey = multisigKeys.state(multisigAddress, address);
  const query = useQuery({
    queryKey,
    enabled: isConnected && chainId === sepolia.id && !!address && !!publicClient,
    queryFn: async () => {
      if (!publicClient || !address) {
        return {
          signers: [] as readonly Address[],
          threshold: 0n,
          proposals: [] as Proposal[],
          isSigner: false,
        };
      }

      const [signers, threshold, proposals, isSigner] = await Promise.all([
        publicClient.readContract({
          address: multisigAddress,
          abi: MultiSigABI,
          functionName: "getSigners",
        }),
        publicClient.readContract({
          address: multisigAddress,
          abi: MultiSigABI,
          functionName: "threshold",
        }),
        publicClient.readContract({
          address: multisigAddress,
          abi: MultiSigABI,
          functionName: "getAllProposals",
        }),
        publicClient.readContract({
          address: multisigAddress,
          abi: MultiSigABI,
          functionName: "isSigner",
          args: [address],
        }),
      ]);

      return {
        signers,
        threshold,
        proposals: proposals.map(parseProposal),
        isSigner,
      };
    },
  });

  const invalidateMultisig = () =>
    queryClient.invalidateQueries({ queryKey });

  const execute = async (
    request: Parameters<typeof writeContractAsync>[0],
    refreshMarketplace = false
  ) => {
    if (!publicClient) return false;
    setTxPending(true);
    setActionError(null);
    try {
      const hash = await writeContractAsync(request);
      await publicClient.waitForTransactionReceipt({ hash });
      await invalidateMultisig();
      if (refreshMarketplace) {
        await queryClient.invalidateQueries({
          queryKey: marketplaceKeys.jobs(marketplaceAddress),
        });
        if (address) {
          await queryClient.invalidateQueries({
            queryKey: tokenKeys.account(
              paymentTokenAddress,
              address,
              marketplaceAddress
            ),
          });
        }
      }
      return true;
    } catch (error) {
      setActionError(contractErrorMessage(error, "Transacción MultiSig fallida"));
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const data = query.data;
  const proposals = data?.proposals ?? [];
  const state: MultisigState = {
    account: address ?? null,
    isSigner: data?.isSigner ?? false,
    signers: data?.signers ?? [],
    threshold: data?.threshold ?? 0n,
    proposals,
    loading: query.isLoading || query.isFetching,
    txPending,
    error:
      actionError ||
      (query.error
        ? contractErrorMessage(query.error, "Error al cargar MultiSig")
        : null),
    contractAddress: multisigAddress,
    isConnected,
    chainOk: chainId === sepolia.id,
  };

  return {
    state,
    pendingProposalCount: proposals.filter(
      (proposal) => !proposal.executed && !proposal.cancelled
    ).length,
    refresh: async () => {
      await query.refetch();
    },
    propose: (to: Address, valueEth: string, dataHex: Hex) =>
      execute({
        address: multisigAddress,
        abi: MultiSigABI,
        functionName: "propose",
        args: [to, parseEther(valueEth || "0"), dataHex || "0x"],
      }),
    approve: (proposalId: bigint) =>
      execute({
        address: multisigAddress,
        abi: MultiSigABI,
        functionName: "approve",
        args: [proposalId],
      }),
    execute: (proposalId: bigint) =>
      execute(
        {
          address: multisigAddress,
          abi: MultiSigABI,
          functionName: "execute",
          args: [proposalId],
        },
        true
      ),
    cancel: (proposalId: bigint) =>
      execute({
        address: multisigAddress,
        abi: MultiSigABI,
        functionName: "cancel",
        args: [proposalId],
      }),
    hasApproved: async (proposalId: bigint, account: Address) => {
      if (!publicClient) return false;
      return publicClient.readContract({
        address: multisigAddress,
        abi: MultiSigABI,
        functionName: "hasApproved",
        args: [proposalId, account],
      });
    },
  };
}
