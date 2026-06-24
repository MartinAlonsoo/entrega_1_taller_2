import {
  BaseError,
  ContractFunctionRevertedError,
} from "viem";

const customErrorMessages: Record<string, string> = {
  ZeroAddress: "La dirección no puede ser cero.",
  InvalidBudget: "El presupuesto debe ser mayor a cero.",
  InvalidExpiration: "El vencimiento debe estar en el futuro.",
  InvalidJob: "El trabajo no existe.",
  InvalidStatus: "La acción no es válida para el estado actual.",
  Unauthorized: "La cuenta conectada no tiene permiso para esta acción.",
  ProviderAlreadySet: "El proveedor ya fue asignado.",
  JobNotExpired: "El trabajo todavía no venció.",
  TokenTransferFailed: "Falló la transferencia del token.",
};

export function contractErrorMessage(error: unknown, fallback: string) {
  if (error instanceof BaseError) {
    const reverted = error.walk(
      (cause) => cause instanceof ContractFunctionRevertedError
    );
    if (reverted instanceof ContractFunctionRevertedError) {
      const errorName = reverted.data?.errorName;
      if (errorName && customErrorMessages[errorName]) {
        return customErrorMessages[errorName];
      }
    }
    return error.shortMessage || fallback;
  }

  return error instanceof Error ? error.message : fallback;
}
