import { useCallback, useEffect, useRef } from "react";
import { useWallet } from "./useWallet";
import { useErc20 } from "./useErc20";
import { useJobs } from "./useJobs";
import { useJobActions } from "./useJobActions";

export function useMarketplace() {
  const {
    wallet,
    connect,
    getSigner,
    provider,
    account,
    chainOk,
    isConnected,
  } = useWallet();

  const {
    jobs,
    selectedJob,
    selectedJobId,
    setSelectedJobId,
    roles,
    loadingJobs,
    jobsError,
    refreshJobs,
  } = useJobs(provider, account);

  const { token, refreshToken, approveMarketplace } = useErc20(
    provider,
    account,
    getSigner
  );

  const refresh = useCallback(async () => {
    await refreshJobs();
    await refreshToken();
  }, [refreshJobs, refreshToken]);

  const actions = useJobActions(getSigner, refresh);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (!isConnected || !chainOk) return;

    refresh();
    pollRef.current = setInterval(refresh, 6000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isConnected, chainOk, refresh]);

  return {
    account,
    provider,
    isConnected,
    chainOk,
    walletLoading: wallet.loading,
    connect,

    jobs,
    selectedJob,
    selectedJobId,
    setSelectedJobId,
    roles,

    token,
    approveMarketplace,

    loading: wallet.loading || loadingJobs || token.loading,
    pending: token.pending || actions.actionPending,
    error: wallet.error || jobsError || token.error || actions.actionError,

    refresh,

    ...actions,
  };
}
