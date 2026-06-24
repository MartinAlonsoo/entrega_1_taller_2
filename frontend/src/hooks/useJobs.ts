import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { sepolia } from "wagmi/chains";
import type { Address, Hex } from "viem";
import JobMarketplaceABI from "../abi/JobMarketplaceABI";
import { marketplaceAddress } from "../lib/contracts";
import { marketplaceKeys } from "../lib/queryKeys";
import { contractErrorMessage } from "../lib/errors";
import { getCreatedJobIds } from "../lib/jobEvents";

export enum JobStatus {
  Open = 0,
  Funded = 1,
  Submitted = 2,
  Completed = 3,
  Rejected = 4,
  Expired = 5,
}

export interface Job {
  id: bigint;
  client: Address;
  evaluator: Address;
  provider: Address;
  description: string;
  budget: bigint;
  expiresAt: bigint;
  status: JobStatus;
  deliverableRef: Hex;
  resultReason: Hex;
}

export interface JobRoles {
  isClient: boolean;
  isEvaluator: boolean;
  isProvider: boolean;
}

function sameAddress(left?: Address, right?: Address) {
  return !!left && !!right && left.toLowerCase() === right.toLowerCase();
}

function parseJob(id: bigint, raw: any): Job {
  return {
    id,
    client: raw.client ?? raw[0],
    evaluator: raw.evaluator ?? raw[1],
    provider: raw.provider ?? raw[2],
    description: raw.description ?? raw[3],
    budget: raw.budget ?? raw[4],
    expiresAt: raw.expiresAt ?? raw[5],
    status: Number(raw.status ?? raw[6]) as JobStatus,
    deliverableRef: raw.deliverableRef ?? raw[7],
    resultReason: raw.resultReason ?? raw[8],
  };
}

export function useJobs() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const [selectedJobId, setSelectedJobId] = useState<bigint | null>(null);

  const query = useQuery({
    queryKey: marketplaceKeys.jobs(marketplaceAddress),
    enabled: isConnected && chainId === sepolia.id && !!publicClient,
    queryFn: async () => {
      if (!publicClient) return [];

      const jobIds = await getCreatedJobIds(publicClient);

      const jobs = await Promise.all(
        jobIds.map(async (id) => {
          const raw = await publicClient.readContract({
            address: marketplaceAddress,
            abi: JobMarketplaceABI,
            functionName: "getJob",
            args: [id],
          });
          return parseJob(id, raw);
        })
      );

      return jobs;
    },
  });

  const jobs = query.data ?? [];
  const selectedJob = useMemo(
    () =>
      selectedJobId === null
        ? null
        : jobs.find((job) => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId]
  );

  const roles = useMemo<JobRoles>(
    () => ({
      isClient: sameAddress(selectedJob?.client, address),
      isEvaluator: sameAddress(selectedJob?.evaluator, address),
      isProvider: sameAddress(selectedJob?.provider, address),
    }),
    [address, selectedJob]
  );

  return {
    jobs,
    selectedJob,
    selectedJobId,
    setSelectedJobId,
    roles,
    loadingJobs: query.isLoading || query.isFetching,
    jobsError: query.error
      ? contractErrorMessage(query.error, "Error al cargar trabajos")
      : null,
    refreshJobs: async () => {
      await query.refetch();
    },
  };
}
