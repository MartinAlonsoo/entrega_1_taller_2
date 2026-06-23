import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import JobMarketplaceABI from "../abi/JobMarketplaceABI";
import { MARKETPLACE_ADDRESS } from "../config";

export enum JobStatus {
  Open = 0,
  Funded = 1,
  Submitted = 2,
  Completed = 3,
  Rejected = 4,
  Expired = 5,
}

export interface Job {
  id: number;
  client: string;
  evaluator: string;
  provider: string;
  description: string;
  budget: ethers.BigNumber;
  expiresAt: number;
  status: JobStatus;
  deliverableRef: string;
  resultReason: string;
}

export interface JobRoles {
  isClient: boolean;
  isEvaluator: boolean;
  isProvider: boolean;
}

function sameAddress(left?: string | null, right?: string | null) {
  if (!left || !right) return false;
  return left.toLowerCase() === right.toLowerCase();
}

function parseJob(id: number, raw: any): Job {
  return {
    id,
    client: raw.client,
    evaluator: raw.evaluator,
    provider: raw.provider,
    description: raw.description,
    budget: raw.budget,
    expiresAt: raw.expiresAt.toNumber(),
    status: raw.status as JobStatus,
    deliverableRef: raw.deliverableRef,
    resultReason: raw.resultReason,
  };
}

export function useJobs(
  provider: ethers.providers.Web3Provider | null,
  account: string | null
) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const getMarketplaceContract = useCallback(
    (signerOrProvider: ethers.Signer | ethers.providers.Provider) => {
      if (!MARKETPLACE_ADDRESS) {
        throw new Error("VITE_MARKETPLACE_ADDRESS no está configurada");
      }

      return new ethers.Contract(
        MARKETPLACE_ADDRESS,
        JobMarketplaceABI,
        signerOrProvider
      );
    },
    []
  );

  const refreshJobs = useCallback(async () => {
    if (!provider) return;

    setLoadingJobs(true);
    setJobsError(null);

    try {
      const contract = getMarketplaceContract(provider);
      const count = await contract.jobCount();
      const total = count.toNumber();
      const loadedJobs = await Promise.all(
        Array.from({ length: total }, async (_, id) => parseJob(id, await contract.getJob(id)))
      );

      setJobs(loadedJobs);
      setLoadingJobs(false);
    } catch (err: any) {
      setLoadingJobs(false);
      setJobsError(
        err?.data?.message ||
          err?.reason ||
          err?.message ||
          "Error al cargar trabajos"
      );
    }
  }, [provider, getMarketplaceContract]);

  const selectedJob = useMemo(
    () =>
      selectedJobId === null
        ? null
        : jobs.find((job) => job.id === selectedJobId) || null,
    [jobs, selectedJobId]
  );

  const roles = useMemo<JobRoles>(
    () => ({
      isClient: sameAddress(selectedJob?.client, account),
      isEvaluator: sameAddress(selectedJob?.evaluator, account),
      isProvider: sameAddress(selectedJob?.provider, account),
    }),
    [selectedJob, account]
  );

  return {
    jobs,
    selectedJob,
    selectedJobId,
    setSelectedJobId,
    roles,
    loadingJobs,
    jobsError,
    refreshJobs,
    getMarketplaceContract,
  };
}
