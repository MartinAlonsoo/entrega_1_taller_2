import { useEffect, useMemo, useState } from "react";
import { zeroHash, type Address, type Hex } from "viem";
import {
  DELIVERABLE_STORAGE_EVENT,
  confirmDeliverable,
  createDeliverable,
  getDeliverable,
  removeDeliverable,
  saveDeliverable,
} from "../lib/deliverables";

export function useDeliverables(selectedRef?: Hex) {
  const [revision, setRevision] = useState(0);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setRevision((current) => current + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener(DELIVERABLE_STORAGE_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(DELIVERABLE_STORAGE_EVENT, refresh);
    };
  }, []);

  const selectedDeliverable = useMemo(
    () =>
      selectedRef && selectedRef !== zeroHash
        ? getDeliverable(selectedRef)
        : null,
    [revision, selectedRef]
  );

  useEffect(() => {
    if (
      !selectedRef ||
      selectedRef === zeroHash ||
      selectedDeliverable?.status !== "pending"
    ) {
      return;
    }

    try {
      confirmDeliverable(selectedRef);
      setStorageError(null);
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "No se pudo confirmar la entrega local."
      );
    }
  }, [selectedDeliverable, selectedRef]);

  const prepareDeliverable = (
    jobId: bigint,
    provider: Address,
    content: string
  ) => {
    try {
      const record = createDeliverable({ jobId, provider, content });
      saveDeliverable(record);
      setStorageError(null);
      return record;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar la entrega localmente.";
      setStorageError(message);
      throw new Error(message);
    }
  };

  const markConfirmed = (ref: Hex) => {
    try {
      confirmDeliverable(ref);
      setStorageError(null);
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "No se pudo confirmar la entrega local."
      );
    }
  };

  const discardDeliverable = (ref: Hex) => {
    try {
      removeDeliverable(ref);
      setStorageError(null);
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la entrega pendiente."
      );
    }
  };

  return {
    selectedDeliverable,
    storageError,
    prepareDeliverable,
    confirmDeliverable: markConfirmed,
    discardDeliverable,
  };
}
