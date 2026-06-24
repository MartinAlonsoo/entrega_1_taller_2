import type { PublicClient } from "viem";
import JobMarketplaceABI from "../abi/JobMarketplaceABI";
import { MARKETPLACE_DEPLOYMENT_BLOCK } from "../config";
import { marketplaceAddress } from "./contracts";

export async function getCreatedJobIds(
  publicClient: PublicClient
): Promise<bigint[]> {
  try {
    const logs = await publicClient.getContractEvents({
      address: marketplaceAddress,
      abi: JobMarketplaceABI,
      eventName: "JobCreated",
      fromBlock: MARKETPLACE_DEPLOYMENT_BLOCK,
      toBlock: "latest",
      strict: true,
    });

    const uniqueIds = new Set<string>();
    for (const log of logs) {
      const jobId = log.args.jobId;
      if (typeof jobId === "bigint") uniqueIds.add(jobId.toString());
    }

    return [...uniqueIds]
      .map((jobId) => BigInt(jobId))
      .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(
      "No se pudieron consultar los eventos JobCreated. " +
        "Verificá VITE_MARKETPLACE_DEPLOYMENT_BLOCK y el RPC de Sepolia." +
        detail
    );
  }
}
