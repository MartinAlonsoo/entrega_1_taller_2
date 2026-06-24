import {
  decodeFunctionData,
  hexToString,
  type Address,
  type Hex,
} from "viem";
import JobMarketplaceABI from "../abi/JobMarketplaceABI";
import { marketplaceAddress } from "../lib/contracts";

export interface DecodedMarketplaceCall {
  functionName: "complete" | "reject";
  jobId: bigint;
  reason: string;
}

export function decodeMarketplaceCall(
  to: Address,
  data: Hex
): DecodedMarketplaceCall | null {
  if (
    to.toLowerCase() !== marketplaceAddress.toLowerCase() ||
    !data ||
    data === "0x"
  ) {
    return null;
  }

  try {
    const decoded = decodeFunctionData({
      abi: JobMarketplaceABI,
      data,
    });
    if (decoded.functionName !== "complete" && decoded.functionName !== "reject") {
      return null;
    }

    const [jobId, reasonHex] = decoded.args;
    let reason: string = reasonHex;
    try {
      reason = hexToString(reasonHex, { size: 32 }).replace(/\0+$/, "");
    } catch {
      // Mantener hexadecimal si el bytes32 no es texto UTF-8.
    }

    return {
      functionName: decoded.functionName,
      jobId,
      reason,
    };
  } catch {
    return null;
  }
}
