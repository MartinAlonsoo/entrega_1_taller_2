import { useAccount, useChainId } from "wagmi";
import { sepolia } from "wagmi/chains";
import { useErc20 } from "./useErc20";
import { useJobs } from "./useJobs";
import { useJobActions } from "./useJobActions";
import { useDeliverables } from "./useDeliverables";

export function useMarketplace() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const jobs = useJobs();
  const erc20 = useErc20();
  const actions = useJobActions();
  const deliverables = useDeliverables(jobs.selectedJob?.deliverableRef);

  const submit = async (jobId: bigint, content: string) => {
    if (!address) return false;

    try {
      const record = deliverables.prepareDeliverable(
        jobId,
        address,
        content
      );
      const ok = await actions.submit(jobId, record.ref);

      if (ok) {
        deliverables.confirmDeliverable(record.ref);
      } else {
        deliverables.discardDeliverable(record.ref);
      }

      return ok;
    } catch {
      return false;
    }
  };

  const refresh = async () => {
    await Promise.all([jobs.refreshJobs(), erc20.refreshToken()]);
  };

  return {
    account: address ?? null,
    isConnected,
    chainOk: chainId === sepolia.id,
    jobs: jobs.jobs,
    selectedJob: jobs.selectedJob,
    selectedJobId: jobs.selectedJobId,
    setSelectedJobId: jobs.setSelectedJobId,
    roles: jobs.roles,
    selectedDeliverable: deliverables.selectedDeliverable,
    token: erc20.token,
    approveMarketplace: erc20.approveMarketplace,
    loading: jobs.loadingJobs || erc20.token.loading,
    pending: erc20.token.pending || actions.actionPending,
    error:
      jobs.jobsError ||
      erc20.token.error ||
      actions.actionError ||
      deliverables.storageError,
    refresh,
    ...actions,
    submit,
  };
}
