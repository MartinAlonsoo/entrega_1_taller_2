import { useCallback, useState } from "react";
import { ethers } from "ethers";
import JobMarketplaceABI from "../abi/JobMarketplaceABI";
import { MARKETPLACE_ADDRESS } from "../config";

export interface JobActionInput {
  description: string;
  budget: ethers.BigNumberish;
  evaluator: string;
  provider: string;
  expiresAt: number;
}

function getErrorMessage(err: any, fallback: string) {
  return err?.data?.message || err?.reason || err?.message || fallback;
}

function toBytes32(value: string, fieldName: string) {
  try {
    return ethers.utils.formatBytes32String(value);
  } catch {
    throw new Error(`${fieldName} debe tener 31 bytes o menos`);
  }
}

export function useJobActions(
  getSigner: () => ethers.Signer,
  refreshJobs: () => Promise<void>
) {
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const getWriteContract = useCallback(() => {
    if (!MARKETPLACE_ADDRESS) {
      throw new Error("VITE_MARKETPLACE_ADDRESS no está configurada");
    }

    return new ethers.Contract(MARKETPLACE_ADDRESS, JobMarketplaceABI, getSigner());
  }, [getSigner]);

  const withMarketplaceTx = useCallback(
    async (fn: () => Promise<any>): Promise<boolean> => {
      setActionPending(true);
      setActionError(null);

      try {
        const tx = await fn();
        await tx.wait();
        await refreshJobs();
        setActionPending(false);
        return true;
      } catch (err: any) {
        setActionPending(false);
        setActionError(getErrorMessage(err, "Transacción del Marketplace fallida"));
        return false;
      }
    },
    [refreshJobs]
  );

  const createJob = useCallback(
    async (input: JobActionInput) => {
      return withMarketplaceTx(() =>
        getWriteContract().createJob(
          input.description,
          input.budget,
          input.evaluator,
          input.provider,
          input.expiresAt
        )
      );
    },
    [getWriteContract, withMarketplaceTx]
  );

  const setProvider = useCallback(
    async (jobId: number, provider: string) => {
      return withMarketplaceTx(() => getWriteContract().setProvider(jobId, provider));
    },
    [getWriteContract, withMarketplaceTx]
  );

  const fund = useCallback(
    async (jobId: number) => {
      return withMarketplaceTx(() => getWriteContract().fund(jobId));
    },
    [getWriteContract, withMarketplaceTx]
  );

  const submit = useCallback(
    async (jobId: number, deliverableRef: string) => {
      return withMarketplaceTx(() =>
        getWriteContract().submit(
          jobId,
          toBytes32(deliverableRef, "deliverableRef")
        )
      );
    },
    [getWriteContract, withMarketplaceTx]
  );

  const complete = useCallback(
    async (jobId: number, reason: string) => {
      return withMarketplaceTx(() =>
        getWriteContract().complete(jobId, toBytes32(reason, "reason"))
      );
    },
    [getWriteContract, withMarketplaceTx]
  );

  const reject = useCallback(
    async (jobId: number, reason: string) => {
      return withMarketplaceTx(() =>
        getWriteContract().reject(jobId, toBytes32(reason, "reason"))
      );
    },
    [getWriteContract, withMarketplaceTx]
  );

  const claimRefund = useCallback(
    async (jobId: number) => {
      return withMarketplaceTx(() => getWriteContract().claimRefund(jobId));
    },
    [getWriteContract, withMarketplaceTx]
  );

  return {
    actionPending,
    actionError,
    createJob,
    setProvider,
    fund,
    submit,
    complete,
    reject,
    claimRefund,
  };
}
