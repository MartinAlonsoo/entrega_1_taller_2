import { sepolia } from "wagmi/chains";
import {
  isAddress,
  keccak256,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { marketplaceAddress } from "./contracts";

export const MAX_DELIVERABLE_BYTES = 50_000;
export const DELIVERABLE_STORAGE_EVENT = "job-marketplace:deliverable-change";

export interface StoredDeliverable {
  version: 1;
  chainId: typeof sepolia.id;
  marketplace: Address;
  jobId: string;
  provider: Address;
  content: string;
  createdAt: string;
  ref: Hex;
  status: "pending" | "confirmed";
}

interface CreateDeliverableInput {
  jobId: bigint;
  provider: Address;
  content: string;
}

function storageKey(ref: Hex) {
  return [
    "job-marketplace",
    sepolia.id,
    marketplaceAddress.toLowerCase(),
    "deliverable",
    ref.toLowerCase(),
  ].join(":");
}

function getStorage() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("localStorage no está disponible en este navegador.");
  }
  return window.localStorage;
}

function isBytes32(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value);
}

function hashPayload(record: Omit<StoredDeliverable, "ref" | "status">) {
  return keccak256(toHex(JSON.stringify(record)));
}

function payloadOf(record: StoredDeliverable) {
  return {
    version: record.version,
    chainId: record.chainId,
    marketplace: record.marketplace,
    jobId: record.jobId,
    provider: record.provider,
    content: record.content,
    createdAt: record.createdAt,
  } as const;
}

function notifyChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DELIVERABLE_STORAGE_EVENT));
  }
}

export function validateDeliverableContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return "El contenido de la entrega es obligatorio.";

  if (new TextEncoder().encode(trimmed).length > MAX_DELIVERABLE_BYTES) {
    return `La entrega debe ocupar ${MAX_DELIVERABLE_BYTES.toLocaleString("es-UY")} bytes o menos.`;
  }

  return "";
}

export function createDeliverable(
  input: CreateDeliverableInput
): StoredDeliverable {
  const validationError = validateDeliverableContent(input.content);
  if (validationError) throw new Error(validationError);
  if (!isAddress(input.provider)) {
    throw new Error("La dirección del proveedor no es válida.");
  }

  const payload = {
    version: 1,
    chainId: sepolia.id,
    marketplace: marketplaceAddress,
    jobId: input.jobId.toString(),
    provider: input.provider,
    content: input.content.trim(),
    createdAt: new Date().toISOString(),
  } as const;

  return {
    ...payload,
    ref: hashPayload(payload),
    status: "pending",
  };
}

export function saveDeliverable(record: StoredDeliverable) {
  if (!isBytes32(record.ref)) {
    throw new Error("La referencia de la entrega no es un bytes32 válido.");
  }
  if (
    record.chainId !== sepolia.id ||
    record.marketplace.toLowerCase() !== marketplaceAddress.toLowerCase()
  ) {
    throw new Error("La entrega pertenece a otra red o Marketplace.");
  }
  if (hashPayload(payloadOf(record)).toLowerCase() !== record.ref.toLowerCase()) {
    throw new Error("El contenido no coincide con la referencia de la entrega.");
  }

  getStorage().setItem(storageKey(record.ref), JSON.stringify(record));
  notifyChange();
}

export function getDeliverable(ref: Hex): StoredDeliverable | null {
  if (!isBytes32(ref)) return null;

  try {
    const raw = getStorage().getItem(storageKey(ref));
    if (!raw) return null;

    const record = JSON.parse(raw) as StoredDeliverable;
    if (
      record.version !== 1 ||
      record.chainId !== sepolia.id ||
      !isAddress(record.marketplace) ||
      record.marketplace.toLowerCase() !== marketplaceAddress.toLowerCase() ||
      !isAddress(record.provider) ||
      !isBytes32(record.ref) ||
      record.ref.toLowerCase() !== ref.toLowerCase() ||
      (record.status !== "pending" && record.status !== "confirmed") ||
      typeof record.jobId !== "string" ||
      typeof record.content !== "string" ||
      typeof record.createdAt !== "string" ||
      hashPayload(payloadOf(record)).toLowerCase() !== ref.toLowerCase()
    ) {
      return null;
    }

    return record;
  } catch {
    return null;
  }
}

export function confirmDeliverable(ref: Hex) {
  const record = getDeliverable(ref);
  if (!record || record.status === "confirmed") return;
  saveDeliverable({ ...record, status: "confirmed" });
}

export function removeDeliverable(ref: Hex) {
  getStorage().removeItem(storageKey(ref));
  notifyChange();
}
