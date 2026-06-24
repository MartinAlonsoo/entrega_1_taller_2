import type { Address } from "viem";

export const marketplaceKeys = {
  jobs: (marketplace: Address) =>
    ["marketplace", marketplace, "jobs"] as const,
};

export const tokenKeys = {
  account: (token: Address, account: Address, marketplace: Address) =>
    ["token", token, account, marketplace] as const,
};

export const multisigKeys = {
  state: (multisig: Address, account?: Address) =>
    ["multisig", multisig, account] as const,
};
