import React, { useEffect, useMemo, useState } from "react";
import {
  encodeFunctionData,
  stringToHex,
  type Address,
} from "viem";
import JobMarketplaceABI from "../abi/JobMarketplaceABI";
import { Job, JobStatus } from "../hooks/useJobs";
import { marketplaceAddress, multisigAddress } from "../lib/contracts";
import { NewMultisigProposalDraft } from "../types/multisig";

interface Props {
  selectedJobId: bigint | null;
  selectedJob: Job | null;
  defaultReason?: string;
  onCreateProposal: (draft: NewMultisigProposalDraft) => void;
}

function shortenAddr(address: Address) {
  return `${address.slice(0, 10)}…${address.slice(-6)}`;
}

const CopyButton: React.FC<{ value: string; title: string }> = ({
  value,
  title,
}) => (
  <button
    className="btn btn-secondary btn-sm"
    disabled={!value}
    onClick={() => navigator.clipboard.writeText(value)}
    title={title}
  >
    📋
  </button>
);

const AddressRow: React.FC<{ label: string; address: Address }> = ({
  label,
  address,
}) => (
  <div className="mb-3">
    <label>{label}</label>
    <div className="input input-mono flex items-center justify-between">
      <span className="address">{shortenAddr(address)}</span>
      <CopyButton value={address} title={`Copiar ${label}`} />
    </div>
  </div>
);

const MultisigEvaluatorHelper: React.FC<Props> = ({
  selectedJobId,
  selectedJob,
  defaultReason = "approved",
  onCreateProposal,
}) => {
  const [jobId, setJobId] = useState("");
  const [reason, setReason] = useState(defaultReason);

  useEffect(() => {
    if (selectedJobId !== null) setJobId(selectedJobId.toString());
  }, [selectedJobId]);

  const result = useMemo(() => {
    try {
      const parsedJobId = BigInt(jobId);
      const trimmedReason = reason.trim();
      if (!trimmedReason) throw new Error("reason es obligatorio");
      if (new TextEncoder().encode(trimmedReason).length > 31) {
        throw new Error("reason debe tener 31 bytes o menos");
      }

      return {
        calldata: encodeFunctionData({
          abi: JobMarketplaceABI,
          functionName: "complete",
          args: [parsedJobId, stringToHex(trimmedReason, { size: 32 })],
        }),
        error: "",
        parsedJobId,
      };
    } catch (error) {
      return {
        calldata: null,
        error:
          error instanceof Error
            ? error.message
            : "jobId debe ser un entero mayor o igual a 0",
        parsedJobId: 0n,
      };
    }
  }, [jobId, reason]);

  const evaluatorIsMultisig =
    selectedJob?.evaluator.toLowerCase() === multisigAddress.toLowerCase();
  const jobCanComplete = selectedJob?.status === JobStatus.Submitted;

  return (
    <div className="card animate-in">
      <div className="flex items-center gap-2 mb-4">
        <span>🛡️</span>
        <h2>MultiSig evaluator</h2>
      </div>

      <AddressRow label="MultiSig evaluador" address={multisigAddress} />
      <AddressRow label="Contrato Marketplace" address={marketplaceAddress} />

      <div className="divider" />
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="input-helper-job-id">jobId</label>
          <input
            id="input-helper-job-id"
            className="input input-mono"
            value={jobId}
            onChange={(event) => setJobId(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="input-helper-reason">reason</label>
          <input
            id="input-helper-reason"
            className="input"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
      </div>

      {(result.error || (selectedJob && (!evaluatorIsMultisig || !jobCanComplete))) && (
        <div className="mt-3 text-sm" style={{ color: "#fbbf24" }}>
          ⚠️{" "}
          {result.error ||
            (!evaluatorIsMultisig
              ? "El evaluador del trabajo no es este MultiSig."
              : "El trabajo debe estar Submitted.")}
        </div>
      )}

      <div className="divider" />
      <label>Calldata</label>
      <div className="input input-mono" style={{ wordBreak: "break-all" }}>
        {result.calldata || "Completá valores válidos"}
      </div>
      <button
        className="btn btn-primary w-full mt-3"
        disabled={!result.calldata}
        onClick={() =>
          result.calldata &&
          onCreateProposal({
            to: marketplaceAddress,
            value: "0",
            data: result.calldata,
            sourceJobId: result.parsedJobId,
            reason: reason.trim(),
          })
        }
      >
        Crear propuesta MultiSig
      </button>
    </div>
  );
};

export default MultisigEvaluatorHelper;
