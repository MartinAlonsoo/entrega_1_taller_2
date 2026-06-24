import type { Address, Hex } from "viem";

export interface MultisigProposalDraft {
  id: number;
  to: Address;
  value: string;
  data: Hex;
  sourceJobId: bigint;
  reason: string;
}

export type NewMultisigProposalDraft = Omit<MultisigProposalDraft, "id">;
