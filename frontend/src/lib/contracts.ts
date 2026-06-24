import { isAddress, type Address } from "viem";
import {
  MARKETPLACE_ADDRESS,
  MULTISIG_ADDRESS,
  PAYMENT_TOKEN_ADDRESS,
} from "../config";

function configuredAddress(value: string, envName: string): Address {
  if (!isAddress(value)) {
    throw new Error(`${envName} no está configurada con una dirección válida`);
  }
  return value;
}

export const marketplaceAddress = configuredAddress(
  MARKETPLACE_ADDRESS,
  "VITE_MARKETPLACE_ADDRESS"
);

export const paymentTokenAddress = configuredAddress(
  PAYMENT_TOKEN_ADDRESS,
  "VITE_PAYMENT_TOKEN_ADDRESS"
);

export const multisigAddress = configuredAddress(
  MULTISIG_ADDRESS,
  "VITE_MULTISIG_ADDRESS"
);
